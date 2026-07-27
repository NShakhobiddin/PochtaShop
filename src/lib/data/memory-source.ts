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
import { nowIso, uid } from '@/lib/utils';
import { SEED_STORES } from './seed/stores';
import { SEED_COURIERS } from './seed/couriers';
import { SEED_OFFERS, SEED_PRODUCTS, SEED_SELLERS } from './seed/products';
import { SEED_LEARNING_COURSES, SEED_LEARNING_PLATFORMS } from './seed/learning';
import { SEED_PROMOTIONS, SEED_RESTRICTED_GOODS } from './seed/customs';
import type { CourierFilter, DataSource, ProductFilter, StoreFilter } from './types';

interface MemoryState {
  users: Map<number, AppUser>;
  saved: SavedItem[];
  history: HistoryEntry[];
  progress: Map<number, LearningProgress[]>;
  consultations: Consultation[];
  assistedOrders: AssistedOrderRequest[];
  reviews: Review[];
  changeRequests: CourierChangeRequest[];
  auditLog: AuditLogEntry[];
  aiLog: AiLogEntry[];
}

/**
 * Kept on globalThis so Next.js dev-mode module reloads do not wipe demo state
 * between requests.
 */
const globalState = globalThis as typeof globalThis & { __pochtashopState?: MemoryState };

function state(): MemoryState {
  if (!globalState.__pochtashopState) {
    globalState.__pochtashopState = {
      users: new Map(),
      saved: [],
      history: [],
      progress: new Map(),
      consultations: [],
      assistedOrders: [],
      reviews: seedReviews(),
      changeRequests: [],
      auditLog: [],
      aiLog: [],
    };
  }
  return globalState.__pochtashopState;
}

function seedReviews(): Review[] {
  return [
    {
      id: 'review_demo_1',
      subject: 'courier',
      subjectId: 'courier_fast_cargo',
      authorTelegramId: 100_000_002,
      authorName: 'Aziz',
      rating: 5,
      body: "Yuk 19 kunda yetib keldi, hammasi joyida. Ombor kodi bilan muammo bo'lmadi.",
      verifiedPurchase: true,
      status: 'published',
      createdAt: '2026-05-02T10:00:00.000Z',
    },
    {
      id: 'review_demo_2',
      subject: 'courier',
      subjectId: 'courier_fast_cargo',
      authorTelegramId: 100_000_003,
      authorName: 'Nodira',
      rating: 3,
      body: "Narxi arzon, lekin qo'llab-quvvatlash sekin javob beradi.",
      verifiedPurchase: false,
      status: 'published',
      officialReply: "Izohingiz uchun rahmat, qo'llab-quvvatlash jamoasini kengaytirmoqdamiz.",
      createdAt: '2026-05-11T09:20:00.000Z',
    },
    {
      id: 'review_demo_3',
      subject: 'store',
      subjectId: 'store_taobao',
      authorTelegramId: 100_000_004,
      authorName: 'Jasur',
      rating: 4,
      body: "Sotuvchini yaxshi tekshirsangiz, muammo bo'lmaydi. Original emasligini oldindan yozgan edi.",
      verifiedPurchase: true,
      status: 'published',
      createdAt: '2026-04-18T15:40:00.000Z',
    },
    {
      id: 'review_demo_4',
      subject: 'courier',
      subjectId: 'courier_orient_express',
      authorTelegramId: 100_000_005,
      authorName: 'Kamola',
      rating: 2,
      body: "Yetkazish tez, lekin qadoq shikastlangan holda keldi.",
      verifiedPurchase: true,
      status: 'pending',
      createdAt: '2026-06-01T08:10:00.000Z',
    },
  ];
}

function matchesSearch(haystack: string[], needle: string): boolean {
  const query = needle.trim().toLowerCase();
  if (!query) return true;
  const words = query.split(/\s+/);
  return words.some((word) => haystack.some((value) => value.toLowerCase().includes(word)));
}

export class MemoryDataSource implements DataSource {
  readonly kind = 'memory' as const;

  async upsertUserFromTelegram(telegram: TelegramUser): Promise<AppUser> {
    const existing = state().users.get(telegram.id);
    if (existing) {
      const updated: AppUser = {
        ...existing,
        firstName: telegram.firstName,
        lastName: telegram.lastName,
        username: telegram.username,
        photoUrl: telegram.photoUrl,
      };
      state().users.set(telegram.id, updated);
      return updated;
    }

    const created: AppUser = {
      id: uid('user'),
      telegramId: telegram.id,
      firstName: telegram.firstName,
      lastName: telegram.lastName,
      username: telegram.username,
      photoUrl: telegram.photoUrl,
      // The first demo user is an admin so the panel is reachable out of the box.
      role: state().users.size === 0 ? 'admin' : 'user',
      tier: 'free',
      onboardingCompleted: false,
      createdAt: nowIso(),
    };
    state().users.set(telegram.id, created);
    return created;
  }

  async getUserByTelegramId(telegramId: number): Promise<AppUser | null> {
    return state().users.get(telegramId) ?? null;
  }

  async setOnboardingCompleted(telegramId: number): Promise<void> {
    const user = state().users.get(telegramId);
    if (user) state().users.set(telegramId, { ...user, onboardingCompleted: true });
  }

  async setTier(telegramId: number, tier: SubscriptionTier): Promise<void> {
    const user = state().users.get(telegramId);
    if (user) state().users.set(telegramId, { ...user, tier });
  }

  async listUsers(): Promise<AppUser[]> {
    return Array.from(state().users.values());
  }

  async listStores(filter: StoreFilter = {}): Promise<Store[]> {
    return SEED_STORES.filter((store) => {
      if (filter.country && store.country !== filter.country) return false;
      if (filter.category && !store.categories.includes(filter.category)) return false;
      if (filter.search && !matchesSearch([store.name, store.description], filter.search)) {
        return false;
      }
      return true;
    });
  }

  async getStore(id: string): Promise<Store | null> {
    return SEED_STORES.find((store) => store.id === id || store.slug === id) ?? null;
  }

  async listCouriers(filter: CourierFilter = {}): Promise<Courier[]> {
    let couriers = SEED_COURIERS.filter((courier) => {
      if (filter.country && !courier.routes.some((route) => route.from === filter.country)) {
        return false;
      }
      if (filter.acceptsElectronics && !courier.acceptsElectronics) return false;
      if (filter.acceptsFragile && !courier.acceptsFragile) return false;
      if (filter.acceptsOversized && !courier.acceptsOversized) return false;
      return true;
    });

    if (filter.sort === 'cheapest') {
      couriers = [...couriers].sort(
        (a, b) => minPricePerKg(a, filter.country) - minPricePerKg(b, filter.country),
      );
    } else if (filter.sort === 'fastest') {
      couriers = [...couriers].sort(
        (a, b) => minDeliveryDays(a, filter.country) - minDeliveryDays(b, filter.country),
      );
    } else if (filter.sort === 'reliable') {
      couriers = [...couriers].sort((a, b) => b.rating - a.rating);
    }

    return couriers;
  }

  async getCourier(id: string): Promise<Courier | null> {
    return SEED_COURIERS.find((courier) => courier.id === id || courier.slug === id) ?? null;
  }

  async listProducts(filter: ProductFilter = {}): Promise<Product[]> {
    return SEED_PRODUCTS.filter((product) => {
      if (filter.category && product.category !== filter.category) return false;
      if (
        filter.search &&
        !matchesSearch([product.title, product.description, ...product.keywords], filter.search)
      ) {
        return false;
      }
      if (filter.countries?.length) {
        const offers = SEED_OFFERS.filter((offer) => offer.productId === product.id);
        if (!offers.some((offer) => filter.countries?.includes(offer.shippingFrom))) return false;
      }
      return true;
    });
  }

  async getProduct(id: string): Promise<Product | null> {
    return SEED_PRODUCTS.find((product) => product.id === id || product.slug === id) ?? null;
  }

  async listOffers(productId: string): Promise<ProductOffer[]> {
    return SEED_OFFERS.filter((offer) => offer.productId === productId);
  }

  async getSeller(id: string): Promise<SellerProfile | null> {
    return SEED_SELLERS.find((seller) => seller.id === id) ?? null;
  }

  async listPromotions(): Promise<Promotion[]> {
    return SEED_PROMOTIONS;
  }

  async listRestrictedGoods(): Promise<RestrictedGood[]> {
    return SEED_RESTRICTED_GOODS;
  }

  async listLearningPlatforms(): Promise<LearningPlatform[]> {
    return SEED_LEARNING_PLATFORMS;
  }

  async listCourses(): Promise<LearningCourse[]> {
    return SEED_LEARNING_COURSES;
  }

  async getCourse(id: string): Promise<LearningCourse | null> {
    return SEED_LEARNING_COURSES.find((course) => course.id === id) ?? null;
  }

  async getProgress(telegramId: number): Promise<LearningProgress[]> {
    return state().progress.get(telegramId) ?? [];
  }

  async saveProgress(telegramId: number, progress: LearningProgress): Promise<void> {
    const list = state().progress.get(telegramId) ?? [];
    const next = list.filter((item) => item.courseId !== progress.courseId);
    next.push(progress);
    state().progress.set(telegramId, next);
  }

  async listSavedItems(telegramId: number): Promise<SavedItem[]> {
    return state()
      .saved.filter((item) => item.telegramId === telegramId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addSavedItem(item: Omit<SavedItem, 'id' | 'createdAt'>): Promise<SavedItem> {
    const existing = state().saved.find(
      (saved) =>
        saved.telegramId === item.telegramId &&
        saved.kind === item.kind &&
        saved.refId === item.refId,
    );
    if (existing) return existing;

    const created: SavedItem = { ...item, id: uid('saved'), createdAt: nowIso() };
    state().saved.push(created);
    return created;
  }

  async removeSavedItem(telegramId: number, id: string): Promise<void> {
    const store = state();
    store.saved = store.saved.filter(
      (item) => !(item.id === id && item.telegramId === telegramId),
    );
  }

  async listHistory(telegramId: number): Promise<HistoryEntry[]> {
    return state()
      .history.filter((entry) => entry.telegramId === telegramId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async addHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): Promise<HistoryEntry> {
    const created: HistoryEntry = { ...entry, id: uid('hist'), createdAt: nowIso() };
    state().history.push(created);
    return created;
  }

  async clearHistory(telegramId: number): Promise<void> {
    const store = state();
    store.history = store.history.filter((entry) => entry.telegramId !== telegramId);
  }

  async createConsultation(
    input: Omit<Consultation, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Promise<Consultation> {
    const created: Consultation = {
      ...input,
      id: uid('cons'),
      status: 'new',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state().consultations.push(created);
    return created;
  }

  async listConsultations(telegramId?: number): Promise<Consultation[]> {
    const all = state().consultations;
    const filtered =
      telegramId === undefined ? all : all.filter((item) => item.telegramId === telegramId);
    return [...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateConsultationStatus(
    id: string,
    status: Consultation['status'],
    actor: string,
  ): Promise<void> {
    const consultation = state().consultations.find((item) => item.id === id);
    if (!consultation) return;
    const previous = consultation.status;
    consultation.status = status;
    consultation.updatedAt = nowIso();
    await this.appendAuditLog({
      actor,
      action: 'consultation.status_changed',
      entity: 'consultations',
      entityId: id,
      previousValue: previous,
      newValue: status,
    });
  }

  async createAssistedOrder(
    input: Omit<AssistedOrderRequest, 'id' | 'status' | 'createdAt'>,
  ): Promise<AssistedOrderRequest> {
    const created: AssistedOrderRequest = {
      ...input,
      id: uid('order'),
      status: 'new',
      createdAt: nowIso(),
    };
    state().assistedOrders.push(created);
    return created;
  }

  async listAssistedOrders(telegramId?: number): Promise<AssistedOrderRequest[]> {
    const all = state().assistedOrders;
    return telegramId === undefined ? all : all.filter((item) => item.telegramId === telegramId);
  }

  async listReviews(subjectId?: string): Promise<Review[]> {
    const all = state().reviews;
    return subjectId ? all.filter((review) => review.subjectId === subjectId) : all;
  }

  async createReview(input: Omit<Review, 'id' | 'status' | 'createdAt'>): Promise<Review> {
    const created: Review = {
      ...input,
      id: uid('review'),
      // Everything is moderated before publication.
      status: 'pending',
      createdAt: nowIso(),
    };
    state().reviews.push(created);
    return created;
  }

  async moderateReview(id: string, status: Review['status'], actor: string): Promise<void> {
    const review = state().reviews.find((item) => item.id === id);
    if (!review) return;
    const previous = review.status;
    review.status = status;
    await this.appendAuditLog({
      actor,
      action: 'review.moderated',
      entity: 'reviews',
      entityId: id,
      previousValue: previous,
      newValue: status,
    });
  }

  async replyToReview(id: string, reply: string, actor: string): Promise<void> {
    const review = state().reviews.find((item) => item.id === id);
    if (!review) return;
    review.officialReply = reply;
    await this.appendAuditLog({
      actor,
      action: 'review.replied',
      entity: 'reviews',
      entityId: id,
      newValue: reply,
    });
  }

  async createCourierChangeRequest(
    input: Omit<CourierChangeRequest, 'id' | 'status' | 'createdAt'>,
  ): Promise<CourierChangeRequest> {
    const created: CourierChangeRequest = {
      ...input,
      id: uid('creq'),
      status: 'pending',
      createdAt: nowIso(),
    };
    state().changeRequests.push(created);
    return created;
  }

  async listCourierChangeRequests(courierId?: string): Promise<CourierChangeRequest[]> {
    const all = state().changeRequests;
    return courierId ? all.filter((item) => item.courierId === courierId) : all;
  }

  async decideCourierChangeRequest(
    id: string,
    decision: 'approved' | 'rejected',
    actor: string,
  ): Promise<void> {
    const request = state().changeRequests.find((item) => item.id === id);
    if (!request) return;
    request.status = decision;
    await this.appendAuditLog({
      actor,
      action: `courier_change.${decision}`,
      entity: 'courier_change_requests',
      entityId: id,
      previousValue: request.previousValue,
      newValue: request.newValue,
    });
  }

  async listAuditLog(): Promise<AuditLogEntry[]> {
    return [...state().auditLog].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
    state().auditLog.push({ ...entry, id: uid('audit'), createdAt: nowIso() });
  }

  async recordAiRequest(entry: Omit<AiLogEntry, 'id' | 'createdAt'>): Promise<void> {
    const log = state().aiLog;
    log.push({ ...entry, id: uid('ai'), createdAt: nowIso() });
    // Bounded in demo mode; Supabase keeps the full history.
    if (log.length > 200) log.splice(0, log.length - 200);
  }

  async listAiRequests(): Promise<AiLogEntry[]> {
    return [...state().aiLog].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async ping(): Promise<boolean> {
    return true;
  }
}

function minPricePerKg(courier: Courier, country?: string): number {
  const tariffs = courier.tariffs.filter((tariff) => !country || tariff.fromCountry === country);
  if (tariffs.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...tariffs.map((tariff) => tariff.pricePerKgUzs));
}

function minDeliveryDays(courier: Courier, country?: string): number {
  const tariffs = courier.tariffs.filter((tariff) => !country || tariff.fromCountry === country);
  if (tariffs.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...tariffs.map((tariff) => tariff.deliveryDays[1]));
}
