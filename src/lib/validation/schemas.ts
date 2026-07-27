import { z } from 'zod';
import { CURRENCY, FILE_UPLOAD, PRODUCT_CATEGORIES } from '@/constants';

export const categorySchema = z.enum(
  PRODUCT_CATEGORIES.map((category) => category.id) as [string, ...string[]],
);

export const countrySchema = z.enum(['CN', 'US', 'TR', 'UZ']);
export const currencySchema = z.enum(Object.keys(CURRENCY) as [string, ...string[]]);
export const purposeSchema = z.enum(['personal', 'gift', 'resale', 'business']);

/** Strips control characters and trims — applied to every free-text field. */
export const safeText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    // Strip C0/C1 control characters so nothing can smuggle formatting into
    // stored text or an AI prompt.
    .transform((value) => value.replace(/[\u0000-\u001F\u007F-\u009F]/g, ''));

export const httpUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, "Havola http yoki https bilan boshlanishi kerak");

export const searchCriteriaSchema = z.object({
  query: safeText(200),
  linkProvided: httpUrlSchema.optional(),
  imageProvided: z.boolean().optional(),
  maxBudgetUzs: z.number().int().nonnegative().max(1_000_000_000).optional(),
  requireAuthentic: z.boolean().optional(),
  condition: z.enum(['new', 'used']).optional(),
  color: safeText(40).optional(),
  size: safeText(40).optional(),
  model: safeText(60).optional(),
  maxDeliveryDays: z.number().int().positive().max(120).optional(),
  priority: z.enum(['price', 'speed', 'quality']).optional(),
  countries: z.array(countrySchema).max(4).optional(),
  quantity: z.number().int().positive().max(1000).optional(),
  category: categorySchema.optional(),
});

export const customsCalculationSchema = z.object({
  category: categorySchema,
  itemName: safeText(160),
  quantity: z.number().int().positive().max(1000),
  declaredValue: z.number().nonnegative().max(1_000_000_000),
  currency: currencySchema,
  weightKg: z.number().nonnegative().max(1000),
  shippingCostUzs: z.number().nonnegative().max(1_000_000_000),
  fromCountry: countrySchema,
  courierId: z.string().max(80).optional(),
  previousMonthlyValueUsd: z.number().nonnegative().max(1_000_000).default(0),
  purpose: purposeSchema,
});

export const customsRiskSchema = z.object({
  itemName: safeText(160),
  category: categorySchema,
  declaredValue: z.number().nonnegative().max(1_000_000_000),
  currency: currencySchema,
  quantity: z.number().int().positive().max(1000),
  weightKg: z.number().nonnegative().max(1000),
  fromCountry: countrySchema,
  purpose: purposeSchema,
  hasBrandLogo: z.boolean().optional(),
  isBattery: z.boolean().optional(),
  isLiquid: z.boolean().optional(),
});

export const volumetricSchema = z.object({
  lengthCm: z.number().positive().max(500),
  widthCm: z.number().positive().max(500),
  heightCm: z.number().positive().max(500),
  actualWeightKg: z.number().positive().max(1000),
  divisor: z.number().int().positive().max(10_000),
});

export const consultationSchema = z.object({
  type: z.enum([
    'product_selection',
    'seller_check',
    'order_process',
    'courier_choice',
    'customs_issue',
    'seller_negotiation',
    'assisted_order',
  ]),
  description: safeText(2000).refine((value) => value.length >= 10, {
    message: "Kamida 10 ta belgi yozing",
  }),
  productUrl: httpUrlSchema.optional().or(z.literal('')),
  attachmentName: safeText(200).optional(),
  contactMethod: z.enum(['telegram', 'phone']),
  contactValue: safeText(80).refine((value) => value.length >= 4, {
    message: "Aloqa ma'lumotini kiriting",
  }),
  preferredTime: safeText(120).default(''),
  priceUzs: z.number().int().nonnegative().max(100_000_000),
  consent: z.literal(true),
});

export const assistedOrderSchema = z.object({
  productUrl: httpUrlSchema,
  variant: safeText(160).default(''),
  quantity: z.number().int().positive().max(100),
  maxBudgetUzs: z.number().int().positive().max(1_000_000_000),
  note: safeText(1000).optional(),
  userConfirmed: z.literal(true),
});

export const savedItemSchema = z.object({
  kind: z.enum(['product', 'store', 'courier', 'analysis', 'comparison', 'lesson']),
  refId: safeText(120),
  title: safeText(200),
  subtitle: safeText(200).optional(),
});

export const reviewSchema = z.object({
  subject: z.enum(['store', 'courier']),
  subjectId: safeText(120),
  rating: z.number().int().min(1).max(5),
  body: safeText(1500).refine((value) => value.length >= 20, {
    message: "Sharh kamida 20 ta belgidan iborat bo'lsin",
  }),
  verificationMethod: z.enum(['none', 'receipt', 'tracking', 'screenshot']).default('none'),
  verificationReference: safeText(120).optional(),
});

export const sellerMessageSchema = z.object({
  topicId: safeText(60),
  userText: safeText(1500),
  language: z.enum(['zh', 'en', 'tr']),
});

export const sellerReplySchema = z.object({
  sellerText: safeText(3000),
  language: z.enum(['zh', 'en', 'tr']),
});

export const learningProgressSchema = z.object({
  courseId: safeText(80),
  stepId: safeText(80),
  score: z.number().int().min(0).max(100).optional(),
  completed: z.boolean().default(false),
});

export const commercialIntentSchema = z.object({
  identicalItemCount: z.number().int().nonnegative().max(1000),
  totalQuantity: z.number().int().positive().max(10_000),
  recentSimilarOrders: z.number().int().nonnegative().max(1000),
  category: categorySchema,
  declaredValueUsd: z.number().nonnegative().max(1_000_000),
  distinctVariants: z.number().int().nonnegative().max(500),
  bulkPackaging: z.boolean(),
});

export const dutyExplanationSchema = z.object({
  itemName: safeText(160),
  declaredValue: z.number().nonnegative(),
  currency: currencySchema,
  quantity: z.number().int().positive().max(1000),
  weightKg: z.number().nonnegative().max(1000),
  chargedAmountUzs: z.number().nonnegative().max(1_000_000_000),
  documentName: safeText(200).optional(),
});

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

/** File type and size gate applied before anything touches the AI provider. */
export function validateUploadedFile(
  file: { name: string; type: string; size: number },
  kind: 'image' | 'document' = 'image',
): FileValidationResult {
  const allowed: readonly string[] =
    kind === 'image' ? FILE_UPLOAD.IMAGE_MIME_TYPES : FILE_UPLOAD.DOCUMENT_MIME_TYPES;
  const maxBytes = kind === 'image' ? FILE_UPLOAD.MAX_IMAGE_BYTES : FILE_UPLOAD.MAX_DOCUMENT_BYTES;

  if (!allowed.includes(file.type)) {
    return {
      ok: false,
      error:
        kind === 'image'
          ? "Faqat JPG, PNG yoki WEBP rasm yuklash mumkin."
          : 'Faqat PDF hujjat yuklash mumkin.',
    };
  }

  if (file.size > maxBytes) {
    return {
      ok: false,
      error: `Fayl hajmi ${Math.round(maxBytes / (1024 * 1024))} MB dan oshmasligi kerak.`,
    };
  }

  if (file.size === 0) return { ok: false, error: "Fayl bo'sh." };

  return { ok: true };
}
