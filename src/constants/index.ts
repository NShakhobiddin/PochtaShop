export const APP_NAME = 'PochtaShop';

export const CURRENCY = {
  UZS: 'UZS',
  USD: 'USD',
  CNY: 'CNY',
  TRY: 'TRY',
  EUR: 'EUR',
} as const;

export type CurrencyCode = (typeof CURRENCY)[keyof typeof CURRENCY];

/**
 * Demo reference rates (1 unit of currency in UZS). In production these are
 * refreshed by the admin panel / a rates provider; they are never authoritative.
 */
export const DEMO_RATES_TO_UZS: Record<CurrencyCode, number> = {
  UZS: 1,
  USD: 12_650,
  CNY: 1_750,
  TRY: 370,
  EUR: 13_700,
};

export const COUNTRIES = {
  CN: "Xitoy",
  US: 'AQSH',
  TR: 'Turkiya',
  UZ: "O'zbekiston",
} as const;

export type CountryCode = keyof typeof COUNTRIES;

export const PRODUCT_CATEGORIES = [
  { id: 'electronics', label: 'Elektronika' },
  { id: 'clothing', label: 'Kiyim' },
  { id: 'shoes', label: 'Oyoq kiyim' },
  { id: 'cosmetics', label: 'Kosmetika' },
  { id: 'kids', label: 'Bolalar mahsulotlari' },
  { id: 'home', label: "Uy-ro'zg'or" },
  { id: 'auto', label: 'Avtomobil aksessuarlari' },
  { id: 'sport', label: 'Sport' },
  { id: 'books', label: 'Kitob' },
  { id: 'other', label: 'Boshqa' },
] as const;

export type ProductCategoryId = (typeof PRODUCT_CATEGORIES)[number]['id'];

export const CATEGORY_LABELS: Record<ProductCategoryId, string> = PRODUCT_CATEGORIES.reduce(
  (acc, category) => ({ ...acc, [category.id]: category.label }),
  {} as Record<ProductCategoryId, string>,
);

/** Customs parameters for personal international courier shipments (demo values). */
export const CUSTOMS = {
  /** Duty-free threshold per shipment, in USD. */
  DUTY_FREE_LIMIT_USD: 100,
  /** Duty rate applied to the amount above the threshold. */
  DUTY_RATE: 0.15,
  /** VAT rate. */
  VAT_RATE: 0.12,
  /** Fixed clearance fee, in UZS. */
  CLEARANCE_FEE_UZS: 20_000,
  /** Monthly duty-free allowance across shipments, in USD. */
  MONTHLY_ALLOWANCE_USD: 300,
  LEGAL_SOURCE:
    "O'zbekiston Respublikasi Bojxona kodeksi va jismoniy shaxslar tomonidan olib kiriladigan tovarlar bo'yicha amaldagi qoidalar (demo ma'lumot).",
  UPDATED_AT: '2026-01-15',
} as const;

export const CUSTOMS_DISCLAIMER =
  "Hisob-kitob taxminiy. Yakuniy qaror bojxona organi tomonidan tovar, hujjatlar va amaldagi qonunchilik asosida qabul qilinadi.";

export const AI_DISCLAIMER =
  "AI tavsiyasi ma'lumot uchun. Yakuniy qaror sizniki.";

export const FILE_UPLOAD = {
  IMAGE_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  DOCUMENT_MIME_TYPES: ['application/pdf'],
  MAX_IMAGE_BYTES: 10 * 1024 * 1024,
  MAX_DOCUMENT_BYTES: 15 * 1024 * 1024,
} as const;

export const FREE_TIER_LIMITS = {
  AI_ANALYSES_PER_DAY: 3,
  SCREENSHOT_ANALYSES_PER_DAY: 0,
  SAVED_ITEMS: 20,
} as const;

export const CONSULTATION_PRICES_UZS = [50_000, 100_000, 150_000] as const;

export const BOTTOM_NAV_HEIGHT_PX = 72;
