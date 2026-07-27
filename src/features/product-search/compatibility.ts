import type { ProductCategoryId } from '@/constants';
import type {
  CompatibilityCheckItem,
  CompatibilityResult,
  CompatibilityVerdict,
} from '@/types';

export interface CompatibilityQuestion {
  id: string;
  label: string;
  hint?: string;
  options: Array<{ value: string; label: string; verdict: CompatibilityVerdict; reason: string }>;
}

/**
 * Category-specific checks that catch the mistakes users actually make:
 * wrong size system, wrong plug, expired cosmetics, and so on.
 */
const QUESTIONS: Partial<Record<ProductCategoryId, CompatibilityQuestion[]>> = {
  clothing: [
    {
      id: 'size_system',
      label: "O'lchov tizimi",
      hint: "Xitoy o'lchamlari Yevropanikidan kichikroq bo'ladi.",
      options: [
        {
          value: 'cm_chart',
          label: "Sotuvchining sm jadvalini solishtirdim",
          verdict: 'fits',
          reason: "Santimetrdagi jadval eng ishonchli usul.",
        },
        {
          value: 'converted',
          label: "O'lcham jadvalidan taxminan hisobladim",
          verdict: 'check',
          reason: "Konvertatsiya taxminiy — ko'krak va bel o'lchamini qayta tekshiring.",
        },
        {
          value: 'usual',
          label: "Odatdagi o'lchamimni tanladim",
          verdict: 'may_not_fit',
          reason: "Xitoy va Turkiya o'lchamlari farq qiladi, kiyim kichik kelishi mumkin.",
        },
      ],
    },
    {
      id: 'material',
      label: 'Material tarkibi',
      options: [
        {
          value: 'known',
          label: 'Tarkib tavsifda ko‘rsatilgan',
          verdict: 'fits',
          reason: 'Tarkib ma’lum — allergiya va issiqlikni baholash mumkin.',
        },
        {
          value: 'unknown',
          label: 'Tarkib ko‘rsatilmagan',
          verdict: 'check',
          reason: "Sotuvchidan material tarkibini so'rang.",
        },
      ],
    },
    {
      id: 'real_photos',
      label: 'Real xaridor rasmlari',
      options: [
        {
          value: 'yes',
          label: 'Xaridorlar rasmini ko‘rdim',
          verdict: 'fits',
          reason: 'Real rasm rang va sifatni tasdiqlaydi.',
        },
        {
          value: 'no',
          label: 'Faqat katalog rasmi bor',
          verdict: 'check',
          reason: "Katalog rasmi bezatilgan bo'lishi mumkin.",
        },
      ],
    },
  ],
  shoes: [
    {
      id: 'size_system',
      label: "O'lcham tizimi",
      options: [
        {
          value: 'insole',
          label: "Ichki taglik uzunligini (sm) solishtirdim",
          verdict: 'fits',
          reason: 'Taglik uzunligi eng aniq mezon.',
        },
        {
          value: 'eu',
          label: "Faqat EU o'lchamiga qaradim",
          verdict: 'check',
          reason: "Brendlar orasida EU o'lcham farq qiladi.",
        },
        {
          value: 'us',
          label: "US yoki CN o'lchamini tanladim",
          verdict: 'may_not_fit',
          reason: "US/CN o'lchamlari EU dan sezilarli farq qiladi.",
        },
      ],
    },
  ],
  electronics: [
    {
      id: 'voltage',
      label: 'Kuchlanish',
      hint: "O'zbekistonda 220V / 50Hz.",
      options: [
        {
          value: '220',
          label: '220V qo‘llab-quvvatlanadi',
          verdict: 'fits',
          reason: 'Qurilma mahalliy tarmoqqa mos.',
        },
        {
          value: 'universal',
          label: '100–240V universal blok',
          verdict: 'fits',
          reason: 'Universal blok har qanday tarmoqda ishlaydi.',
        },
        {
          value: '110',
          label: 'Faqat 110V',
          verdict: 'may_not_fit',
          reason: "220V tarmoqqa ulash qurilmani ishdan chiqaradi. Transformator kerak.",
        },
      ],
    },
    {
      id: 'plug',
      label: 'Vilka turi',
      options: [
        {
          value: 'eu',
          label: 'EU (Type C/F)',
          verdict: 'fits',
          reason: "O'zbekistondagi rozetkalarga mos.",
        },
        {
          value: 'other',
          label: 'US, UK yoki CN vilka',
          verdict: 'check',
          reason: 'Adapter kerak bo‘ladi.',
        },
      ],
    },
    {
      id: 'region',
      label: 'Region va til',
      options: [
        {
          value: 'global',
          label: 'Global versiya, ingliz tili bor',
          verdict: 'fits',
          reason: 'Interfeys tushunarli bo‘ladi.',
        },
        {
          value: 'cn',
          label: 'Xitoy versiyasi',
          verdict: 'may_not_fit',
          reason:
            "Interfeys xitoy tilida bo'lishi va ba'zi xizmatlar ishlamasligi mumkin.",
        },
      ],
    },
    {
      id: 'warranty',
      label: 'Kafolat',
      options: [
        {
          value: 'international',
          label: 'Xalqaro kafolat',
          verdict: 'fits',
          reason: "Kafolat O'zbekistonda ham amal qilishi mumkin.",
        },
        {
          value: 'local_only',
          label: 'Faqat sotuvchi kafolati',
          verdict: 'check',
          reason: "Nosozlikda tovarni qaytarib yuborish kerak bo'ladi.",
        },
      ],
    },
    {
      id: 'battery',
      label: 'Batareya',
      options: [
        {
          value: 'none',
          label: 'Batareya yo‘q',
          verdict: 'fits',
          reason: 'Tashish cheklovi qo‘llanmaydi.',
        },
        {
          value: 'builtin',
          label: 'O‘rnatilgan batareya',
          verdict: 'check',
          reason: "Ba'zi kuryerlar batareyali yukni qabul qilmaydi.",
        },
        {
          value: 'separate',
          label: 'Alohida batareya / power bank',
          verdict: 'may_not_fit',
          reason: 'Aviatashuvda cheklangan, kuryer rad etishi mumkin.',
        },
      ],
    },
  ],
  cosmetics: [
    {
      id: 'volume',
      label: 'Hajm',
      options: [
        {
          value: 'small',
          label: '100 ml gacha',
          verdict: 'fits',
          reason: 'Kichik hajm odatda muammosiz o‘tadi.',
        },
        {
          value: 'large',
          label: '100 ml dan katta',
          verdict: 'check',
          reason: 'Suyuqlik hajmi bo‘yicha kuryer cheklovi bo‘lishi mumkin.',
        },
      ],
    },
    {
      id: 'expiry',
      label: 'Yaroqlilik muddati',
      options: [
        {
          value: 'long',
          label: '12 oydan ko‘p',
          verdict: 'fits',
          reason: 'Yetkazish muddati muammo tug‘dirmaydi.',
        },
        {
          value: 'short',
          label: '6 oydan kam',
          verdict: 'may_not_fit',
          reason: "Yetkazish 3-4 haftagacha davom etadi — muddat qisqarib qoladi.",
        },
      ],
    },
    {
      id: 'ingredients',
      label: 'Tarkib',
      options: [
        {
          value: 'listed',
          label: 'Tarkib to‘liq ko‘rsatilgan',
          verdict: 'fits',
          reason: 'Allergiya xavfini oldindan baholash mumkin.',
        },
        {
          value: 'unknown',
          label: 'Tarkib noaniq',
          verdict: 'check',
          reason: "Sotuvchidan tarkib ro'yxatini so'rang.",
        },
      ],
    },
  ],
};

const GENERIC_QUESTIONS: CompatibilityQuestion[] = [
  {
    id: 'description',
    label: 'Mahsulot tavsifi',
    options: [
      {
        value: 'clear',
        label: 'Tavsif to‘liq va tushunarli',
        verdict: 'fits',
        reason: 'Mahsulot xususiyatlari aniq.',
      },
      {
        value: 'unclear',
        label: 'Tavsif noaniq yoki tarjima qilinmagan',
        verdict: 'check',
        reason: "Sotuvchidan aniqlashtiruvchi savol so'rang.",
      },
    ],
  },
];

export function getCompatibilityQuestions(category: ProductCategoryId): CompatibilityQuestion[] {
  return QUESTIONS[category] ?? GENERIC_QUESTIONS;
}

const SEVERITY: Record<CompatibilityVerdict, number> = {
  fits: 0,
  check: 1,
  may_not_fit: 2,
};

export const COMPATIBILITY_LABELS: Record<CompatibilityVerdict, string> = {
  fits: 'Mos',
  check: 'Tekshirish kerak',
  may_not_fit: 'Mos kelmasligi mumkin',
};

/** The overall verdict is the worst individual verdict — never an average. */
export function checkCompatibility(
  category: ProductCategoryId,
  answers: Record<string, string>,
): CompatibilityResult {
  const questions = getCompatibilityQuestions(category);
  const items: CompatibilityCheckItem[] = [];

  for (const question of questions) {
    const answer = answers[question.id];
    const option = question.options.find((item) => item.value === answer);
    if (!option) {
      items.push({
        id: question.id,
        label: question.label,
        verdict: 'check',
        reason: 'Bu band hali tekshirilmadi.',
      });
      continue;
    }
    items.push({
      id: question.id,
      label: question.label,
      verdict: option.verdict,
      reason: option.reason,
    });
  }

  const verdict = items.reduce<CompatibilityVerdict>(
    (worst, item) => (SEVERITY[item.verdict] > SEVERITY[worst] ? item.verdict : worst),
    'fits',
  );

  return { verdict, items };
}
