import { CUSTOMS } from '@/constants';
import type {
  CommercialIntentInput,
  CommercialIntentResult,
  CustomsRiskInput,
  CustomsRiskResult,
  RestrictedGood,
  RiskLevel,
} from '@/types';
import { toUsd } from '@/lib/currency';

export const RISK_LABELS: Record<RiskLevel, string> = {
  green: 'Yashil — xavf past',
  yellow: 'Sariq — qo‘shimcha tekshiruv ehtimoli',
  red: 'Qizil — jiddiy xavf',
};

interface Factor {
  points: number;
  reason: string;
  check?: string;
  documents?: string[];
}

/**
 * Rule-based customs risk score. Deterministic and explainable on purpose:
 * a user must always be able to see which fact produced which warning.
 */
export function evaluateCustomsRisk(
  input: CustomsRiskInput,
  restrictedGoods: RestrictedGood[],
): CustomsRiskResult {
  const factors: Factor[] = [];
  const valueUsd = toUsd(input.declaredValue, input.currency) * input.quantity;

  const matched = matchRestricted(input.itemName, restrictedGoods);
  for (const good of matched) {
    factors.push({
      points: good.status === 'prohibited' ? 100 : 35,
      reason:
        good.status === 'prohibited'
          ? `"${good.name}" toifasi taqiqlangan tovarlar ro'yxatiga tushishi mumkin. ${good.reason}`
          : `"${good.name}" toifasi cheklangan tovarlar ro'yxatida. ${good.reason}`,
      check: `Tovar "${good.name}" toifasiga kirmasligini tasdiqlang.`,
      documents: good.requiredDocuments,
    });
  }

  if (input.purpose === 'resale' || input.purpose === 'business') {
    factors.push({
      points: 40,
      reason:
        "Foydalanish maqsadi tijorat sifatida ko'rsatilgan. Bunday jo'natmalar boshqa tartibda rasmiylashtiriladi.",
      check: 'Tijorat jo‘natmasi uchun talab qilinadigan hujjatlarni oldindan aniqlang.',
      documents: ['Shartnoma yoki invoys', 'Tovarning kelib chiqishi haqidagi hujjat'],
    });
  }

  if (valueUsd > CUSTOMS.MONTHLY_ALLOWANCE_USD) {
    factors.push({
      points: 30,
      reason: `Tovar qiymati (${valueUsd.toFixed(0)} USD) oylik bojsiz me'yordan (${CUSTOMS.MONTHLY_ALLOWANCE_USD} USD) sezilarli oshadi.`,
      check: "Oy davomida boshqa jo'natmalaringiz bo'lganini tekshiring.",
    });
  } else if (valueUsd > CUSTOMS.DUTY_FREE_LIMIT_USD) {
    factors.push({
      points: 18,
      reason: `Tovar qiymati bojsiz limitdan (${CUSTOMS.DUTY_FREE_LIMIT_USD} USD) oshadi — boj chiqishi mumkin.`,
      check: "To'lov chekini saqlang, deklaratsiyada qiymatni to'g'ri ko'rsating.",
    });
  }

  if (input.quantity >= 10) {
    factors.push({
      points: 25,
      reason: `Bir xil tovardan ${input.quantity} dona buyurtma qilingan — tijorat partiyasi sifatida baholanishi mumkin.`,
      check: "Miqdorni kamaytiring yoki jo'natmalarni ajrating.",
    });
  } else if (input.quantity >= 5) {
    factors.push({
      points: 12,
      reason: `Miqdor (${input.quantity} dona) shaxsiy foydalanish uchun ko'p ko'rinishi mumkin.`,
      check: 'Shaxsiy foydalanish maqsadini tushuntirishga tayyor bo‘ling.',
    });
  }

  if (input.isBattery || /batareya|battery|powerbank|power bank/i.test(input.itemName)) {
    factors.push({
      points: 15,
      reason: "Litiy batareya yoki power bank aviatashuvda cheklanadi.",
      check: 'Kuryeringiz batareyali yuk qabul qilishini oldindan so‘rang.',
      documents: ['MSDS xavfsizlik varaqasi (kuryer so‘rasa)'],
    });
  }

  if (input.isLiquid || input.category === 'cosmetics') {
    factors.push({
      points: 12,
      reason: "Suyuqlik va kosmetika mahsulotlariga tashish cheklovlari qo'llanadi.",
      check: 'Hajm chegarasi va tarkib bo‘yicha kuryer shartlarini tekshiring.',
    });
  }

  if (input.hasBrandLogo) {
    factors.push({
      points: 20,
      reason:
        "Brend logotipi bor tovar original emasligi aniqlansa, kontrafakt sifatida ushlanishi mumkin.",
      check: 'Sotuvchidan originallikni tasdiqlovchi ma’lumot so‘rang.',
    });
  }

  if (input.weightKg > 30) {
    factors.push({
      points: 10,
      reason: `Og'irlik ${input.weightKg} kg — katta jo'natmalar batafsilroq tekshiriladi.`,
      check: 'Yukni bo‘lib jo‘natish variantini ko‘rib chiqing.',
    });
  }

  const score = Math.min(100, factors.reduce((sum, factor) => sum + factor.points, 0));
  const level: RiskLevel = score >= 60 ? 'red' : score >= 25 ? 'yellow' : 'green';

  const reasons = factors.map((factor) => factor.reason);
  const checkList = factors.map((factor) => factor.check).filter((item): item is string => Boolean(item));
  const documents = Array.from(new Set(factors.flatMap((factor) => factor.documents ?? [])));

  return {
    level,
    score,
    title: RISK_LABELS[level],
    reasons: reasons.length > 0 ? reasons : ["Aniqlangan jiddiy xavf omili topilmadi."],
    checkList:
      checkList.length > 0
        ? checkList
        : ["Tovar nomi va qiymati deklaratsiyada to'g'ri ko'rsatilganini tekshiring."],
    possibleDocuments: documents,
    nextSteps: buildNextSteps(level),
    legalSource: CUSTOMS.LEGAL_SOURCE,
    updatedAt: CUSTOMS.UPDATED_AT,
    needsConsultation: level !== 'green',
  };
}

function buildNextSteps(level: RiskLevel): string[] {
  if (level === 'green') {
    return [
      "Buyurtmani davom ettirishingiz mumkin.",
      "To'lov chekini va buyurtma screenshotini saqlang.",
    ];
  }
  if (level === 'yellow') {
    return [
      "Tekshiruv ro'yxatidagi bandlarni ko'rib chiqing.",
      "Bojxona kalkulyatorida taxminiy to'lovni hisoblang.",
      "Kuryeringiz bilan tovar turini oldindan muhokama qiling.",
    ];
  }
  return [
    "Buyurtma berishdan oldin mutaxassis bilan maslahatlashing.",
    "Tovar taqiqlangan yoki cheklangan ro'yxatga kirmasligini aniqlang.",
    "Kerakli hujjatlarni oldindan tayyorlang.",
  ];
}

function matchRestricted(itemName: string, goods: RestrictedGood[]): RestrictedGood[] {
  const needle = itemName.toLowerCase();
  return goods.filter((good) =>
    good.keywords.some((keyword) => needle.includes(keyword.toLowerCase())),
  );
}

/* ------------------------------------------------------ commercial intent */

const COMMERCIAL_FACTORS: Array<{
  label: string;
  weight: number;
  test: (input: CommercialIntentInput) => boolean;
}> = [
  {
    label: "Bir xil mahsulotdan 5 tadan ko'p",
    weight: 25,
    test: (input) => input.identicalItemCount >= 5,
  },
  {
    label: "Umumiy miqdor 20 donadan oshadi",
    weight: 20,
    test: (input) => input.totalQuantity >= 20,
  },
  {
    label: "So'nggi davrda o'xshash buyurtmalar takrorlangan",
    weight: 20,
    test: (input) => input.recentSimilarOrders >= 3,
  },
  {
    label: "Qiymati 500 USD dan yuqori",
    weight: 15,
    test: (input) => input.declaredValueUsd >= 500,
  },
  {
    label: "Ko'p o'lcham yoki rang kombinatsiyasi",
    weight: 10,
    test: (input) => input.distinctVariants >= 4,
  },
  {
    label: 'Ulgurji qadoqlash',
    weight: 10,
    test: (input) => input.bulkPackaging,
  },
];

/**
 * Scores how likely a shipment looks like a commercial consignment rather than
 * personal use. Intentionally not a legal conclusion — only an early warning.
 */
export function evaluateCommercialIntent(input: CommercialIntentInput): CommercialIntentResult {
  const factors = COMMERCIAL_FACTORS.map((factor) => ({
    label: factor.label,
    weight: factor.weight,
    triggered: factor.test(input),
  }));

  const score = factors
    .filter((factor) => factor.triggered)
    .reduce((sum, factor) => sum + factor.weight, 0);

  const level = score >= 50 ? 'high' : score >= 25 ? 'medium' : 'low';

  return {
    level,
    score,
    factors,
    note:
      "Bu baholash faqat ogohlantirish uchun. Tovarning tijorat maqsadida ekanligi haqidagi yakuniy xulosani bojxona organi chiqaradi.",
  };
}
