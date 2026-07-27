import { CUSTOMS, CUSTOMS_DISCLAIMER, type CurrencyCode } from '@/constants';
import { toUsd, toUzs, formatUzs } from '@/lib/currency';

export interface DutyExplanationInput {
  itemName: string;
  declaredValue: number;
  currency: CurrencyCode;
  quantity: number;
  weightKg: number;
  /** The amount the customs authority actually charged, in UZS. */
  chargedAmountUzs: number;
  documentName?: string;
}

export interface DutyExplanationResult {
  expectedUzs: number;
  chargedUzs: number;
  differenceUzs: number;
  likelyCauses: string[];
  calculationSteps: string[];
  whatToVerify: string[];
  consultationRecommended: boolean;
  disclaimer: string;
  legalSource: string;
}

/**
 * Reconstructs what the duty *should* have been for the declared figures and
 * explains the gap. Used when a user is surprised by a charge.
 */
export function explainDuty(input: DutyExplanationInput): DutyExplanationResult {
  const goodsValueUsd = toUsd(input.declaredValue, input.currency) * input.quantity;
  const taxableUsd = Math.max(0, goodsValueUsd - CUSTOMS.DUTY_FREE_LIMIT_USD);
  const taxableUzs = toUzs(taxableUsd, 'USD');
  const duty = taxableUzs * CUSTOMS.DUTY_RATE;
  const vat = (taxableUzs + duty) * CUSTOMS.VAT_RATE;
  const fee = taxableUsd > 0 ? CUSTOMS.CLEARANCE_FEE_UZS : 0;
  const expected = Math.round(duty + vat + fee);
  const difference = Math.round(input.chargedAmountUzs - expected);

  const calculationSteps = [
    `Tovar qiymati: ${goodsValueUsd.toFixed(2)} USD (${input.quantity} dona).`,
    `Bojsiz limit: ${CUSTOMS.DUTY_FREE_LIMIT_USD} USD.`,
    taxableUsd > 0
      ? `Soliqqa tortiladigan qism: ${taxableUsd.toFixed(2)} USD.`
      : 'Qiymat limitdan oshmagan — hisob bo‘yicha boj kutilmaydi.',
    `Hisoblangan boj: ${formatUzs(duty)}.`,
    `Hisoblangan QQS: ${formatUzs(vat)}.`,
    `Rasmiylashtirish yig'imi: ${formatUzs(fee)}.`,
    `Kutilgan jami: ${formatUzs(expected)}. Sizdan olingan: ${formatUzs(input.chargedAmountUzs)}.`,
  ];

  const likelyCauses: string[] = [];

  if (difference > expected * 0.15 || (expected === 0 && input.chargedAmountUzs > 0)) {
    likelyCauses.push(
      "Bojxona tovar qiymatini deklaratsiyadagidan yuqori baholagan bo'lishi mumkin (bozor narxi bo'yicha korrektirovka).",
    );
    likelyCauses.push(
      "Shu oy davomida boshqa jo'natmalaringiz ham bo'lgan bo'lsa, ular bojsiz me'yorni to'ldirgan bo'lishi mumkin.",
    );
    likelyCauses.push(
      "Yetkazish narxi ham soliq bazasiga qo'shilgan bo'lishi mumkin.",
    );
  }

  if (input.quantity >= 5) {
    likelyCauses.push(
      `Miqdor (${input.quantity} dona) tijorat partiyasi sifatida baholangan bo'lishi mumkin.`,
    );
  }

  if (difference < -expected * 0.15) {
    likelyCauses.push(
      "Olingan summa hisobdan past — ehtimol imtiyoz qo'llangan yoki qiymat pastroq baholangan.",
    );
  }

  if (likelyCauses.length === 0) {
    likelyCauses.push("Olingan summa hisob-kitobga yaqin — hisoblash standart tartibda bajarilgan.");
  }

  const whatToVerify = [
    "Deklaratsiyada ko'rsatilgan tovar qiymatini to'lov cheki bilan solishtiring.",
    "Jo'natmadagi tovarlar soni va turini tekshiring.",
    "Shu oydagi boshqa xalqaro jo'natmalaringiz ro'yxatini eslang.",
    "Bojxona hujjatida qaysi to'lov turi (boj, QQS, yig'im) ko'rsatilganini aniqlang.",
  ];

  if (input.documentName) {
    whatToVerify.push(`Yuklangan hujjat (${input.documentName}) dagi summa taqsimotini tekshiring.`);
  }

  return {
    expectedUzs: expected,
    chargedUzs: Math.round(input.chargedAmountUzs),
    differenceUzs: difference,
    likelyCauses,
    calculationSteps,
    whatToVerify,
    // A material gap is worth a specialist's eyes.
    consultationRecommended: Math.abs(difference) > Math.max(50_000, expected * 0.2),
    disclaimer: CUSTOMS_DISCLAIMER,
    legalSource: CUSTOMS.LEGAL_SOURCE,
  };
}
