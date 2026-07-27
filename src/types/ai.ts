import type { CountryCode, CurrencyCode, ProductCategoryId } from '@/constants';
import type { CompatibilityResult, RiskLevel, UsagePurpose } from './domain';

export type AIConfidence = 'high' | 'medium' | 'low';
export type RecommendationType = 'cheapest' | 'fastest' | 'safest';

export interface AIEstimatedCost {
  productUzs: number;
  shippingUzs: number;
  customsUzs: number;
  totalUzs: number;
}

export interface AICustomsRiskSummary {
  level: RiskLevel;
  note: string;
}

export interface AIRecommendationOption {
  type: RecommendationType;
  product: {
    id: string;
    title: string;
    imageEmoji: string;
    variantNote?: string;
  };
  store: {
    id: string;
    name: string;
    logoEmoji: string;
    country: CountryCode;
    url: string;
  };
  seller: {
    id: string;
    name: string;
    rating: number;
    salesCount: number;
    officialStore: boolean;
  };
  courier: {
    id: string;
    name: string;
    logoEmoji: string;
    deliveryDays: [number, number];
  };
  estimatedCost: AIEstimatedCost;
  customsRisk: AICustomsRiskSummary;
  reasons: string[];
  warnings: string[];
  /** Set when the placement is paid; the UI must label it. */
  sponsored: boolean;
  affiliateUrl?: string;
}

/** Canonical structured envelope every AI feature returns. */
export interface AIResult {
  summary: string;
  confidence: AIConfidence;
  confidenceReason: string;
  recommendedOptions: AIRecommendationOption[];
  missingInformation: string[];
  nextActions: string[];
}

export interface ProductSearchCriteria {
  query: string;
  imageProvided?: boolean;
  linkProvided?: string;
  maxBudgetUzs?: number;
  requireAuthentic?: boolean;
  condition?: 'new' | 'used';
  color?: string;
  size?: string;
  model?: string;
  maxDeliveryDays?: number;
  priority?: 'price' | 'speed' | 'quality';
  countries?: CountryCode[];
  quantity?: number;
  category?: ProductCategoryId;
}

export interface AnalyzeProductInput {
  criteria: ProductSearchCriteria;
  telegramId: number;
}

export interface AnalyzeScreenshotInput {
  fileName: string;
  mimeType: string;
  /** Base64 payload, never persisted after analysis. */
  data: string;
}

export interface ScreenshotAnalysis {
  platform: string;
  stage: string;
  stageExplanation: string;
  translatedElements: Array<{ original: string; translated: string }>;
  nextStep: string;
  warnings: string[];
  confidence: AIConfidence;
}

export type SellerLanguage = 'zh' | 'en' | 'tr';

export interface GenerateSellerMessageInput {
  topicId: string;
  userText: string;
  language: SellerLanguage;
}

export interface SellerMessageDraft {
  language: SellerLanguage;
  translated: string;
  backTranslation: string;
  tip: string;
}

export interface TranslateSellerMessageInput {
  sellerText: string;
  language: SellerLanguage;
}

export interface SellerReplyAnalysis {
  translated: string;
  explanation: string;
  warnings: string[];
}

export interface EvaluateCustomsRiskInput {
  itemName: string;
  category: ProductCategoryId;
  declaredValue: number;
  currency: CurrencyCode;
  quantity: number;
  weightKg: number;
  fromCountry: CountryCode;
  purpose: UsagePurpose;
}

export interface SummarizeReviewsInput {
  productId: string;
  reviews: string[];
}

export interface ReviewSummary {
  positives: string[];
  negatives: string[];
  fakeReviewSuspicion: 'low' | 'medium' | 'high';
  verdict: string;
}

export interface CompatibilityInput {
  category: ProductCategoryId;
  answers: Record<string, string>;
}

export interface AIProvider {
  readonly name: string;
  analyzeProduct(input: AnalyzeProductInput): Promise<AIResult>;
  analyzeScreenshot(input: AnalyzeScreenshotInput): Promise<ScreenshotAnalysis>;
  translateSellerMessage(input: TranslateSellerMessageInput): Promise<SellerReplyAnalysis>;
  generateSellerMessage(input: GenerateSellerMessageInput): Promise<SellerMessageDraft>;
  evaluateCustomsRisk(input: EvaluateCustomsRiskInput): Promise<AIResult>;
  summarizeReviews(input: SummarizeReviewsInput): Promise<ReviewSummary>;
  generateRecommendations(input: AnalyzeProductInput): Promise<AIResult>;
  checkCompatibility(input: CompatibilityInput): Promise<CompatibilityResult>;
}
