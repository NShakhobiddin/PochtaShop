import type {
  AiLogEntry,
  AppUser,
  AssistedOrderRequest,
  AuditLogEntry,
  Consultation,
  Courier,
  CourierChangeRequest,
  HistoryEntry,
  LearningCourse,
  LearningPlatform,
  LearningProgress,
  Product,
  ProductOffer,
  Promotion,
  RestrictedGood,
  Review,
  SavedItem,
  SellerProfile,
  Store,
  SubscriptionTier,
  TelegramUser,
} from '@/types';
import type { CountryCode, ProductCategoryId } from '@/constants';

export interface StoreFilter {
  country?: CountryCode;
  category?: ProductCategoryId;
  search?: string;
}

export interface CourierFilter {
  country?: CountryCode;
  sort?: 'cheapest' | 'fastest' | 'reliable';
  acceptsElectronics?: boolean;
  acceptsFragile?: boolean;
  acceptsOversized?: boolean;
}

export interface ProductFilter {
  search?: string;
  category?: ProductCategoryId;
  countries?: CountryCode[];
}

/**
 * Single seam between the application and its storage. The in-memory source
 * powers demo mode and tests; the Supabase source powers real deployments.
 */
export interface DataSource {
  readonly kind: 'memory' | 'supabase';

  /* users */
  upsertUserFromTelegram(user: TelegramUser): Promise<AppUser>;
  getUserByTelegramId(telegramId: number): Promise<AppUser | null>;
  setOnboardingCompleted(telegramId: number): Promise<void>;
  setTier(telegramId: number, tier: SubscriptionTier): Promise<void>;
  listUsers(): Promise<AppUser[]>;

  /* catalog */
  listStores(filter?: StoreFilter): Promise<Store[]>;
  getStore(id: string): Promise<Store | null>;
  listCouriers(filter?: CourierFilter): Promise<Courier[]>;
  getCourier(id: string): Promise<Courier | null>;
  listProducts(filter?: ProductFilter): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  listOffers(productId: string): Promise<ProductOffer[]>;
  getSeller(id: string): Promise<SellerProfile | null>;
  listPromotions(): Promise<Promotion[]>;

  /* customs reference data */
  listRestrictedGoods(): Promise<RestrictedGood[]>;

  /* learning */
  listLearningPlatforms(): Promise<LearningPlatform[]>;
  listCourses(): Promise<LearningCourse[]>;
  getCourse(id: string): Promise<LearningCourse | null>;
  getProgress(telegramId: number): Promise<LearningProgress[]>;
  saveProgress(telegramId: number, progress: LearningProgress): Promise<void>;

  /* user content */
  listSavedItems(telegramId: number): Promise<SavedItem[]>;
  addSavedItem(item: Omit<SavedItem, 'id' | 'createdAt'>): Promise<SavedItem>;
  removeSavedItem(telegramId: number, id: string): Promise<void>;
  listHistory(telegramId: number): Promise<HistoryEntry[]>;
  addHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): Promise<HistoryEntry>;
  clearHistory(telegramId: number): Promise<void>;

  /* services */
  createConsultation(
    input: Omit<Consultation, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Promise<Consultation>;
  listConsultations(telegramId?: number): Promise<Consultation[]>;
  updateConsultationStatus(id: string, status: Consultation['status'], actor: string): Promise<void>;
  createAssistedOrder(
    input: Omit<AssistedOrderRequest, 'id' | 'status' | 'createdAt'>,
  ): Promise<AssistedOrderRequest>;
  listAssistedOrders(telegramId?: number): Promise<AssistedOrderRequest[]>;

  /* reviews */
  listReviews(subjectId?: string): Promise<Review[]>;
  createReview(input: Omit<Review, 'id' | 'status' | 'createdAt'>): Promise<Review>;
  moderateReview(id: string, status: Review['status'], actor: string): Promise<void>;
  replyToReview(id: string, reply: string, actor: string): Promise<void>;

  /* courier cabinet + admin */
  createCourierChangeRequest(
    input: Omit<CourierChangeRequest, 'id' | 'status' | 'createdAt'>,
  ): Promise<CourierChangeRequest>;
  listCourierChangeRequests(courierId?: string): Promise<CourierChangeRequest[]>;
  decideCourierChangeRequest(
    id: string,
    decision: 'approved' | 'rejected',
    actor: string,
  ): Promise<void>;
  listAuditLog(): Promise<AuditLogEntry[]>;

  /* ai observability */
  recordAiRequest(entry: Omit<AiLogEntry, 'id' | 'createdAt'>): Promise<void>;
  listAiRequests(): Promise<AiLogEntry[]>;
  appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void>;

  /* health */
  ping(): Promise<boolean>;
}
