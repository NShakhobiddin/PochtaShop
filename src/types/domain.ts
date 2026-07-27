import type { CountryCode, CurrencyCode, ProductCategoryId } from '@/constants';

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode?: string;
  photoUrl?: string;
  isPremium?: boolean;
}

export type UserRole = 'user' | 'courier' | 'admin';
export type SubscriptionTier = 'free' | 'premium';

export interface AppUser {
  id: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  role: UserRole;
  tier: SubscriptionTier;
  onboardingCompleted: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ stores */

export type PriceLevel = 'low' | 'medium' | 'high';

export interface Store {
  id: string;
  slug: string;
  name: string;
  logoEmoji: string;
  country: CountryCode;
  categories: ProductCategoryId[];
  priceLevel: PriceLevel;
  /** 0–100 confidence that goods on the platform are authentic. */
  authenticityScore: number;
  buyerProtection: boolean;
  returnsSupported: boolean;
  shipsDirectToUzbekistan: boolean;
  shipsToForwarder: boolean;
  rating: number;
  reviewCount: number;
  url: string;
  description: string;
  isDemo: boolean;
  learningPlatformId?: string;
  updatedAt: string;
}

/* ---------------------------------------------------------------- products */

export interface SellerProfile {
  id: string;
  name: string;
  storeId: string;
  rating: number;
  salesCount: number;
  reviewCount: number;
  yearsActive: number;
  officialStore: boolean;
  responseRate: number;
}

export interface ProductVariant {
  id: string;
  type: 'color' | 'size' | 'model' | 'plug' | 'volume';
  label: string;
  value: string;
  available: boolean;
}

export interface ProductOffer {
  id: string;
  productId: string;
  storeId: string;
  sellerId: string;
  price: Money;
  oldPrice?: Money;
  shippingFrom: CountryCode;
  estimatedDeliveryDays: [number, number];
  inStock: boolean;
  affiliateUrl?: string;
  isSponsored: boolean;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  category: ProductCategoryId;
  brand?: string;
  imageEmoji: string;
  description: string;
  weightKg: number;
  dimensionsCm: { length: number; width: number; height: number };
  variants: ProductVariant[];
  authenticityLikelihood: number;
  returnPolicy: string;
  keywords: string[];
  isDemo: boolean;
}

export interface ProductWithOffers extends Product {
  offers: ProductOffer[];
}

/* ---------------------------------------------------------------- couriers */

export type CourierServiceType = 'economy' | 'standard' | 'express';

export interface CourierTariff {
  id: string;
  courierId: string;
  fromCountry: CountryCode;
  toCountry: CountryCode;
  serviceType: CourierServiceType;
  /** Price per kilogram in UZS. */
  pricePerKgUzs: number;
  minChargeUzs: number;
  minWeightKg: number;
  deliveryDays: [number, number];
  /** Divisor of the L×W×H/divisor volumetric weight formula. */
  volumetricDivisor: number;
  effectiveFrom: string;
  updatedAt: string;
}

export interface Courier {
  id: string;
  slug: string;
  name: string;
  logoEmoji: string;
  routes: Array<{ from: CountryCode; to: CountryCode }>;
  rating: number;
  reviewCount: number;
  insuranceAvailable: boolean;
  trackingAvailable: boolean;
  customsSupport: boolean;
  acceptsElectronics: boolean;
  acceptsFragile: boolean;
  acceptsOversized: boolean;
  supportChannel: string;
  warehouseAddressHint: string;
  isSponsored: boolean;
  isVerified: boolean;
  isDemo: boolean;
  tariffs: CourierTariff[];
  updatedAt: string;
}

export interface VolumetricWeightInput {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  divisor: number;
}

export interface VolumetricWeightResult {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  usedVolumetric: boolean;
}

export interface ShippingQuote {
  courierId: string;
  courierName: string;
  serviceType: CourierServiceType;
  chargeableWeightKg: number;
  costUzs: number;
  deliveryDays: [number, number];
  tariffUpdatedAt: string;
  isStale: boolean;
}

/* ----------------------------------------------------------------- customs */

export type RiskLevel = 'green' | 'yellow' | 'red';
export type CommercialRiskLevel = 'low' | 'medium' | 'high';
export type UsagePurpose = 'personal' | 'gift' | 'resale' | 'business';

export interface CustomsCalculationInput {
  category: ProductCategoryId;
  itemName: string;
  quantity: number;
  declaredValue: number;
  currency: CurrencyCode;
  weightKg: number;
  shippingCostUzs: number;
  fromCountry: CountryCode;
  courierId?: string;
  previousMonthlyValueUsd: number;
  purpose: UsagePurpose;
}

export interface CustomsCalculationResult {
  goodsValueUsd: number;
  dutyFreeLimitUsd: number;
  taxableBaseUsd: number;
  dutyUzs: number;
  vatUzs: number;
  clearanceFeeUzs: number;
  totalCustomsUzs: number;
  shippingCostUzs: number;
  goodsCostUzs: number;
  grandTotalUzs: number;
  riskLevel: RiskLevel;
  explanation: string[];
  legalSource: string;
  updatedAt: string;
  disclaimer: string;
}

export interface CustomsRiskInput {
  itemName: string;
  category: ProductCategoryId;
  declaredValue: number;
  currency: CurrencyCode;
  quantity: number;
  weightKg: number;
  fromCountry: CountryCode;
  purpose: UsagePurpose;
  hasBrandLogo?: boolean;
  isBattery?: boolean;
  isLiquid?: boolean;
}

export interface CustomsRiskResult {
  level: RiskLevel;
  score: number;
  title: string;
  reasons: string[];
  checkList: string[];
  possibleDocuments: string[];
  nextSteps: string[];
  legalSource: string;
  updatedAt: string;
  needsConsultation: boolean;
}

export interface CommercialIntentInput {
  identicalItemCount: number;
  totalQuantity: number;
  recentSimilarOrders: number;
  category: ProductCategoryId;
  declaredValueUsd: number;
  distinctVariants: number;
  bulkPackaging: boolean;
}

export interface CommercialIntentResult {
  level: CommercialRiskLevel;
  score: number;
  factors: Array<{ label: string; weight: number; triggered: boolean }>;
  note: string;
}

export interface RestrictedGood {
  id: string;
  name: string;
  keywords: string[];
  status: 'prohibited' | 'restricted';
  reason: string;
  requiredDocuments: string[];
  legalSource: string;
  updatedAt: string;
}

/* -------------------------------------------------------------- compliance */

export type CompatibilityVerdict = 'fits' | 'check' | 'may_not_fit';

export interface CompatibilityCheckItem {
  id: string;
  label: string;
  verdict: CompatibilityVerdict;
  reason: string;
}

export interface CompatibilityResult {
  verdict: CompatibilityVerdict;
  items: CompatibilityCheckItem[];
}

/* ---------------------------------------------------------------- learning */

export interface LearningPlatform {
  id: string;
  name: string;
  logoEmoji: string;
  country: CountryCode;
  description: string;
}

export type LearningStepKind = 'reading' | 'simulator' | 'quiz';

export interface SimulatorOption {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}

export interface LearningStep {
  id: string;
  courseId: string;
  order: number;
  title: string;
  kind: LearningStepKind;
  body: string;
  hint?: string;
  /** Simulator/quiz steps only. */
  question?: string;
  options?: SimulatorOption[];
}

export interface LearningCourse {
  id: string;
  platformId: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  isPremium: boolean;
  steps: LearningStep[];
}

export interface LearningProgress {
  courseId: string;
  completedStepIds: string[];
  lastStepId?: string;
  completedAt?: string;
  score?: number;
}

/* ----------------------------------------------------- consultations, etc. */

export type ConsultationType =
  | 'product_selection'
  | 'seller_check'
  | 'order_process'
  | 'courier_choice'
  | 'customs_issue'
  | 'seller_negotiation'
  | 'assisted_order';

export type ConsultationStatus =
  | 'new'
  | 'reviewing'
  | 'need_info'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Consultation {
  id: string;
  userId: string;
  telegramId: number;
  type: ConsultationType;
  description: string;
  productUrl?: string;
  attachmentName?: string;
  contactMethod: 'telegram' | 'phone';
  contactValue: string;
  preferredTime: string;
  priceUzs: number;
  status: ConsultationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AssistedOrderRequest {
  id: string;
  userId: string;
  telegramId: number;
  productUrl: string;
  variant: string;
  quantity: number;
  maxBudgetUzs: number;
  note?: string;
  status: ConsultationStatus;
  userConfirmed: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ social */

export type ReviewSubject = 'store' | 'courier';

export interface Review {
  id: string;
  subject: ReviewSubject;
  subjectId: string;
  authorTelegramId: number;
  authorName: string;
  rating: number;
  body: string;
  verifiedPurchase: boolean;
  status: 'pending' | 'published' | 'rejected';
  officialReply?: string;
  createdAt: string;
}

export type SavedItemKind = 'product' | 'store' | 'courier' | 'analysis' | 'comparison' | 'lesson';

export interface SavedItem {
  id: string;
  telegramId: number;
  kind: SavedItemKind;
  refId: string;
  title: string;
  subtitle?: string;
  createdAt: string;
}

export type HistoryKind =
  | 'search'
  | 'ai_analysis'
  | 'customs_risk'
  | 'customs_calculation'
  | 'consultation';

export interface HistoryEntry {
  id: string;
  telegramId: number;
  kind: HistoryKind;
  title: string;
  subtitle?: string;
  createdAt: string;
}

/* ---------------------------------------------------------------- adverts */

export type PlacementLabel =
  | 'ad'
  | 'partnership'
  | 'ai_recommendation'
  | 'verified_courier'
  | 'users_choice';

export interface Promotion {
  id: string;
  title: string;
  body: string;
  targetType: 'store' | 'courier' | 'product';
  targetId: string;
  label: PlacementLabel;
  activeUntil: string;
}

/* ------------------------------------------------------------------- admin */

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  createdAt: string;
}

export interface CourierChangeRequest {
  id: string;
  courierId: string;
  submittedBy: string;
  field: string;
  previousValue: string;
  newValue: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}
