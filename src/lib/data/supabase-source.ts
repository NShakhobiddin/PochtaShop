import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
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
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { MemoryDataSource } from './memory-source';
import type { CourierFilter, DataSource, ProductFilter, StoreFilter } from './types';

type Row = Record<string, unknown>;

function str(row: Row, key: string, fallback = ''): string {
  const value = row[key];
  return typeof value === 'string' ? value : fallback;
}

function num(row: Row, key: string, fallback = 0): number {
  const value = row[key];
  return typeof value === 'number' ? value : fallback;
}

function bool(row: Row, key: string, fallback = false): boolean {
  const value = row[key];
  return typeof value === 'boolean' ? value : fallback;
}

function json<T>(row: Row, key: string, fallback: T): T {
  const value = row[key];
  return value === null || value === undefined ? fallback : (value as T);
}

/**
 * Supabase-backed data source.
 *
 * Reference data (stores, couriers, products, courses, customs rules) lives in
 * the tables created by `supabase/migrations` and populated by `npm run seed`.
 * If a reference table has not been seeded yet the source falls back to the
 * bundled demo data so the Mini App still renders — user-generated data is
 * never faked this way.
 */
export class SupabaseDataSource implements DataSource {
  readonly kind = 'supabase' as const;

  private readonly fallback = new MemoryDataSource();

  private get db(): SupabaseClient {
    return getSupabaseAdmin();
  }

  private async rows(table: string, build?: (query: ReturnType<SupabaseClient['from']>) => unknown) {
    const query = this.db.from(table).select('*');
    const finalQuery = (build ? (build(query as never) as typeof query) : query) as typeof query;
    const { data, error } = await finalQuery;
    if (error) throw new Error(`Supabase read failed for ${table}: ${error.message}`);
    return (data ?? []) as Row[];
  }

  /* ---------------------------------------------------------------- users */

  async upsertUserFromTelegram(telegram: TelegramUser): Promise<AppUser> {
    const { data, error } = await this.db
      .from('users')
      .upsert(
        {
          telegram_id: telegram.id,
          first_name: telegram.firstName,
          last_name: telegram.lastName ?? null,
          username: telegram.username ?? null,
          photo_url: telegram.photoUrl ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_id' },
      )
      .select('*')
      .single();

    if (error || !data) throw new Error(`Failed to upsert user: ${error?.message ?? 'no row'}`);
    return this.mapUser(data as Row);
  }

  private mapUser(row: Row): AppUser {
    const role = str(row, 'role', 'user');
    const tier = str(row, 'tier', 'free');
    return {
      id: str(row, 'id'),
      telegramId: num(row, 'telegram_id'),
      firstName: str(row, 'first_name'),
      lastName: str(row, 'last_name') || undefined,
      username: str(row, 'username') || undefined,
      photoUrl: str(row, 'photo_url') || undefined,
      role: role === 'admin' || role === 'courier' ? role : 'user',
      tier: tier === 'premium' ? 'premium' : 'free',
      onboardingCompleted: bool(row, 'onboarding_completed'),
      createdAt: str(row, 'created_at'),
    };
  }

  async getUserByTelegramId(telegramId: number): Promise<AppUser | null> {
    const { data } = await this.db
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();
    return data ? this.mapUser(data as Row) : null;
  }

  async setOnboardingCompleted(telegramId: number): Promise<void> {
    await this.db
      .from('users')
      .update({ onboarding_completed: true })
      .eq('telegram_id', telegramId);
  }

  async setTier(telegramId: number, tier: SubscriptionTier): Promise<void> {
    await this.db.from('users').update({ tier }).eq('telegram_id', telegramId);
  }

  async listUsers(): Promise<AppUser[]> {
    const rows = await this.rows('users');
    return rows.map((row) => this.mapUser(row));
  }

  /* -------------------------------------------------------------- catalog */

  async listStores(filter: StoreFilter = {}): Promise<Store[]> {
    const rows = await this.rows('stores');
    if (rows.length === 0) return this.fallback.listStores(filter);
    const stores = rows.map((row) => json<Store>(row, 'payload', {} as Store));
    return stores.filter((store) => {
      if (filter.country && store.country !== filter.country) return false;
      if (filter.category && !store.categories.includes(filter.category)) return false;
      if (filter.search) {
        const needle = filter.search.toLowerCase();
        if (!`${store.name} ${store.description}`.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }

  async getStore(id: string): Promise<Store | null> {
    const stores = await this.listStores();
    return stores.find((store) => store.id === id || store.slug === id) ?? null;
  }

  async listCouriers(filter: CourierFilter = {}): Promise<Courier[]> {
    const rows = await this.rows('couriers');
    if (rows.length === 0) return this.fallback.listCouriers(filter);
    const couriers = rows.map((row) => json<Courier>(row, 'payload', {} as Courier));
    return couriers.filter((courier) => {
      if (filter.country && !courier.routes.some((route) => route.from === filter.country)) {
        return false;
      }
      if (filter.acceptsElectronics && !courier.acceptsElectronics) return false;
      if (filter.acceptsFragile && !courier.acceptsFragile) return false;
      if (filter.acceptsOversized && !courier.acceptsOversized) return false;
      return true;
    });
  }

  async getCourier(id: string): Promise<Courier | null> {
    const couriers = await this.listCouriers();
    return couriers.find((courier) => courier.id === id || courier.slug === id) ?? null;
  }

  async listProducts(filter: ProductFilter = {}): Promise<Product[]> {
    const rows = await this.rows('products');
    if (rows.length === 0) return this.fallback.listProducts(filter);
    const products = rows.map((row) => json<Product>(row, 'payload', {} as Product));
    return products.filter((product) => {
      if (filter.category && product.category !== filter.category) return false;
      if (filter.search) {
        const needle = filter.search.toLowerCase();
        const haystack = `${product.title} ${product.description} ${product.keywords.join(' ')}`;
        if (!haystack.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }

  async getProduct(id: string): Promise<Product | null> {
    const products = await this.listProducts();
    return products.find((product) => product.id === id || product.slug === id) ?? null;
  }

  async listOffers(productId: string): Promise<ProductOffer[]> {
    const rows = await this.rows('product_offers');
    if (rows.length === 0) return this.fallback.listOffers(productId);
    return rows
      .map((row) => json<ProductOffer>(row, 'payload', {} as ProductOffer))
      .filter((offer) => offer.productId === productId);
  }

  async getSeller(id: string): Promise<SellerProfile | null> {
    const rows = await this.rows('seller_profiles');
    if (rows.length === 0) return this.fallback.getSeller(id);
    return (
      rows
        .map((row) => json<SellerProfile>(row, 'payload', {} as SellerProfile))
        .find((seller) => seller.id === id) ?? null
    );
  }

  async listPromotions(): Promise<Promotion[]> {
    const rows = await this.rows('promotions');
    if (rows.length === 0) return this.fallback.listPromotions();
    return rows.map((row) => json<Promotion>(row, 'payload', {} as Promotion));
  }

  async listRestrictedGoods(): Promise<RestrictedGood[]> {
    const rows = await this.rows('restricted_goods');
    if (rows.length === 0) return this.fallback.listRestrictedGoods();
    return rows.map((row) => json<RestrictedGood>(row, 'payload', {} as RestrictedGood));
  }

  /* ------------------------------------------------------------- learning */

  async listLearningPlatforms(): Promise<LearningPlatform[]> {
    const rows = await this.rows('learning_platforms');
    if (rows.length === 0) return this.fallback.listLearningPlatforms();
    return rows.map((row) => json<LearningPlatform>(row, 'payload', {} as LearningPlatform));
  }

  async listCourses(): Promise<LearningCourse[]> {
    const rows = await this.rows('learning_courses');
    if (rows.length === 0) return this.fallback.listCourses();
    return rows.map((row) => json<LearningCourse>(row, 'payload', {} as LearningCourse));
  }

  async getCourse(id: string): Promise<LearningCourse | null> {
    const courses = await this.listCourses();
    return courses.find((course) => course.id === id) ?? null;
  }

  async getProgress(telegramId: number): Promise<LearningProgress[]> {
    const { data } = await this.db
      .from('learning_progress')
      .select('*')
      .eq('telegram_id', telegramId);
    return ((data ?? []) as Row[]).map((row) => ({
      courseId: str(row, 'course_id'),
      completedStepIds: json<string[]>(row, 'completed_step_ids', []),
      lastStepId: str(row, 'last_step_id') || undefined,
      completedAt: str(row, 'completed_at') || undefined,
      score: typeof row.score === 'number' ? row.score : undefined,
    }));
  }

  async saveProgress(telegramId: number, progress: LearningProgress): Promise<void> {
    await this.db.from('learning_progress').upsert(
      {
        telegram_id: telegramId,
        course_id: progress.courseId,
        completed_step_ids: progress.completedStepIds,
        last_step_id: progress.lastStepId ?? null,
        completed_at: progress.completedAt ?? null,
        score: progress.score ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id,course_id' },
    );
  }

  /* --------------------------------------------------------- user content */

  async listSavedItems(telegramId: number): Promise<SavedItem[]> {
    const { data } = await this.db
      .from('saved_items')
      .select('*')
      .eq('telegram_id', telegramId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    return ((data ?? []) as Row[]).map((row) => ({
      id: str(row, 'id'),
      telegramId: num(row, 'telegram_id'),
      kind: str(row, 'kind') as SavedItem['kind'],
      refId: str(row, 'ref_id'),
      title: str(row, 'title'),
      subtitle: str(row, 'subtitle') || undefined,
      createdAt: str(row, 'created_at'),
    }));
  }

  async addSavedItem(item: Omit<SavedItem, 'id' | 'createdAt'>): Promise<SavedItem> {
    const { data, error } = await this.db
      .from('saved_items')
      .upsert(
        {
          telegram_id: item.telegramId,
          kind: item.kind,
          ref_id: item.refId,
          title: item.title,
          subtitle: item.subtitle ?? null,
          deleted_at: null,
        },
        { onConflict: 'telegram_id,kind,ref_id' },
      )
      .select('*')
      .single();
    if (error || !data) throw new Error(`Failed to save item: ${error?.message ?? 'no row'}`);
    const row = data as Row;
    return {
      id: str(row, 'id'),
      telegramId: num(row, 'telegram_id'),
      kind: str(row, 'kind') as SavedItem['kind'],
      refId: str(row, 'ref_id'),
      title: str(row, 'title'),
      subtitle: str(row, 'subtitle') || undefined,
      createdAt: str(row, 'created_at'),
    };
  }

  async removeSavedItem(telegramId: number, id: string): Promise<void> {
    await this.db
      .from('saved_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('telegram_id', telegramId);
  }

  async listHistory(telegramId: number): Promise<HistoryEntry[]> {
    const { data } = await this.db
      .from('user_search_history')
      .select('*')
      .eq('telegram_id', telegramId)
      .order('created_at', { ascending: false })
      .limit(100);
    return ((data ?? []) as Row[]).map((row) => ({
      id: str(row, 'id'),
      telegramId: num(row, 'telegram_id'),
      kind: str(row, 'kind') as HistoryEntry['kind'],
      title: str(row, 'title'),
      subtitle: str(row, 'subtitle') || undefined,
      createdAt: str(row, 'created_at'),
    }));
  }

  async addHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>): Promise<HistoryEntry> {
    const { data, error } = await this.db
      .from('user_search_history')
      .insert({
        telegram_id: entry.telegramId,
        kind: entry.kind,
        title: entry.title,
        subtitle: entry.subtitle ?? null,
      })
      .select('*')
      .single();
    if (error || !data) throw new Error(`Failed to write history: ${error?.message ?? 'no row'}`);
    const row = data as Row;
    return {
      id: str(row, 'id'),
      telegramId: num(row, 'telegram_id'),
      kind: str(row, 'kind') as HistoryEntry['kind'],
      title: str(row, 'title'),
      subtitle: str(row, 'subtitle') || undefined,
      createdAt: str(row, 'created_at'),
    };
  }

  async clearHistory(telegramId: number): Promise<void> {
    await this.db.from('user_search_history').delete().eq('telegram_id', telegramId);
  }

  /* -------------------------------------------------------------- services */

  private mapConsultation(row: Row): Consultation {
    return {
      id: str(row, 'id'),
      userId: str(row, 'user_id'),
      telegramId: num(row, 'telegram_id'),
      type: str(row, 'type') as Consultation['type'],
      description: str(row, 'description'),
      productUrl: str(row, 'product_url') || undefined,
      attachmentName: str(row, 'attachment_name') || undefined,
      contactMethod: str(row, 'contact_method') === 'phone' ? 'phone' : 'telegram',
      contactValue: str(row, 'contact_value'),
      preferredTime: str(row, 'preferred_time'),
      priceUzs: num(row, 'price_uzs'),
      status: str(row, 'status') as Consultation['status'],
      createdAt: str(row, 'created_at'),
      updatedAt: str(row, 'updated_at'),
    };
  }

  async createConsultation(
    input: Omit<Consultation, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
  ): Promise<Consultation> {
    const { data, error } = await this.db
      .from('consultations')
      .insert({
        user_id: input.userId,
        telegram_id: input.telegramId,
        type: input.type,
        description: input.description,
        product_url: input.productUrl ?? null,
        attachment_name: input.attachmentName ?? null,
        contact_method: input.contactMethod,
        contact_value: input.contactValue,
        preferred_time: input.preferredTime,
        price_uzs: input.priceUzs,
        status: 'new',
      })
      .select('*')
      .single();
    if (error || !data) {
      throw new Error(`Failed to create consultation: ${error?.message ?? 'no row'}`);
    }
    return this.mapConsultation(data as Row);
  }

  async listConsultations(telegramId?: number): Promise<Consultation[]> {
    let query = this.db.from('consultations').select('*').order('created_at', { ascending: false });
    if (telegramId !== undefined) query = query.eq('telegram_id', telegramId);
    const { data } = await query;
    return ((data ?? []) as Row[]).map((row) => this.mapConsultation(row));
  }

  async updateConsultationStatus(
    id: string,
    status: Consultation['status'],
    actor: string,
  ): Promise<void> {
    const { data: previous } = await this.db
      .from('consultations')
      .select('status')
      .eq('id', id)
      .maybeSingle();
    await this.db
      .from('consultations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    await this.appendAuditLog({
      actor,
      action: 'consultation.status_changed',
      entity: 'consultations',
      entityId: id,
      previousValue: previous ? str(previous as Row, 'status') : undefined,
      newValue: status,
    });
  }

  async createAssistedOrder(
    input: Omit<AssistedOrderRequest, 'id' | 'status' | 'createdAt'>,
  ): Promise<AssistedOrderRequest> {
    const { data, error } = await this.db
      .from('assisted_orders')
      .insert({
        user_id: input.userId,
        telegram_id: input.telegramId,
        product_url: input.productUrl,
        variant: input.variant,
        quantity: input.quantity,
        max_budget_uzs: input.maxBudgetUzs,
        note: input.note ?? null,
        user_confirmed: input.userConfirmed,
        status: 'new',
      })
      .select('*')
      .single();
    if (error || !data) {
      throw new Error(`Failed to create assisted order: ${error?.message ?? 'no row'}`);
    }
    const row = data as Row;
    return {
      id: str(row, 'id'),
      userId: str(row, 'user_id'),
      telegramId: num(row, 'telegram_id'),
      productUrl: str(row, 'product_url'),
      variant: str(row, 'variant'),
      quantity: num(row, 'quantity'),
      maxBudgetUzs: num(row, 'max_budget_uzs'),
      note: str(row, 'note') || undefined,
      status: str(row, 'status') as Consultation['status'],
      userConfirmed: bool(row, 'user_confirmed'),
      createdAt: str(row, 'created_at'),
    };
  }

  async listAssistedOrders(telegramId?: number): Promise<AssistedOrderRequest[]> {
    let query = this.db.from('assisted_orders').select('*').order('created_at', { ascending: false });
    if (telegramId !== undefined) query = query.eq('telegram_id', telegramId);
    const { data } = await query;
    return ((data ?? []) as Row[]).map((row) => ({
      id: str(row, 'id'),
      userId: str(row, 'user_id'),
      telegramId: num(row, 'telegram_id'),
      productUrl: str(row, 'product_url'),
      variant: str(row, 'variant'),
      quantity: num(row, 'quantity'),
      maxBudgetUzs: num(row, 'max_budget_uzs'),
      note: str(row, 'note') || undefined,
      status: str(row, 'status') as Consultation['status'],
      userConfirmed: bool(row, 'user_confirmed'),
      createdAt: str(row, 'created_at'),
    }));
  }

  /* --------------------------------------------------------------- reviews */

  private mapReview(row: Row): Review {
    return {
      id: str(row, 'id'),
      subject: str(row, 'subject') === 'store' ? 'store' : 'courier',
      subjectId: str(row, 'subject_id'),
      authorTelegramId: num(row, 'author_telegram_id'),
      authorName: str(row, 'author_name'),
      rating: num(row, 'rating'),
      body: str(row, 'body'),
      verifiedPurchase: bool(row, 'verified_purchase'),
      status: str(row, 'status') as Review['status'],
      officialReply: str(row, 'official_reply') || undefined,
      createdAt: str(row, 'created_at'),
    };
  }

  async listReviews(subjectId?: string): Promise<Review[]> {
    let query = this.db.from('reviews').select('*').order('created_at', { ascending: false });
    if (subjectId) query = query.eq('subject_id', subjectId);
    const { data } = await query;
    return ((data ?? []) as Row[]).map((row) => this.mapReview(row));
  }

  async createReview(input: Omit<Review, 'id' | 'status' | 'createdAt'>): Promise<Review> {
    const { data, error } = await this.db
      .from('reviews')
      .insert({
        subject: input.subject,
        subject_id: input.subjectId,
        author_telegram_id: input.authorTelegramId,
        author_name: input.authorName,
        rating: input.rating,
        body: input.body,
        verified_purchase: input.verifiedPurchase,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error || !data) throw new Error(`Failed to create review: ${error?.message ?? 'no row'}`);
    return this.mapReview(data as Row);
  }

  async moderateReview(id: string, status: Review['status'], actor: string): Promise<void> {
    await this.db.from('reviews').update({ status }).eq('id', id);
    await this.appendAuditLog({
      actor,
      action: 'review.moderated',
      entity: 'reviews',
      entityId: id,
      newValue: status,
    });
  }

  async replyToReview(id: string, reply: string, actor: string): Promise<void> {
    await this.db.from('reviews').update({ official_reply: reply }).eq('id', id);
    await this.appendAuditLog({
      actor,
      action: 'review.replied',
      entity: 'reviews',
      entityId: id,
      newValue: reply,
    });
  }

  /* ------------------------------------------------------ courier + admin */

  private mapChangeRequest(row: Row): CourierChangeRequest {
    return {
      id: str(row, 'id'),
      courierId: str(row, 'courier_id'),
      submittedBy: str(row, 'submitted_by'),
      field: str(row, 'field'),
      previousValue: str(row, 'previous_value'),
      newValue: str(row, 'new_value'),
      status: str(row, 'status') as CourierChangeRequest['status'],
      createdAt: str(row, 'created_at'),
    };
  }

  async createCourierChangeRequest(
    input: Omit<CourierChangeRequest, 'id' | 'status' | 'createdAt'>,
  ): Promise<CourierChangeRequest> {
    const { data, error } = await this.db
      .from('courier_change_requests')
      .insert({
        courier_id: input.courierId,
        submitted_by: input.submittedBy,
        field: input.field,
        previous_value: input.previousValue,
        new_value: input.newValue,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error || !data) {
      throw new Error(`Failed to create change request: ${error?.message ?? 'no row'}`);
    }
    return this.mapChangeRequest(data as Row);
  }

  async listCourierChangeRequests(courierId?: string): Promise<CourierChangeRequest[]> {
    let query = this.db
      .from('courier_change_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (courierId) query = query.eq('courier_id', courierId);
    const { data } = await query;
    return ((data ?? []) as Row[]).map((row) => this.mapChangeRequest(row));
  }

  async decideCourierChangeRequest(
    id: string,
    decision: 'approved' | 'rejected',
    actor: string,
  ): Promise<void> {
    await this.db.from('courier_change_requests').update({ status: decision }).eq('id', id);
    await this.appendAuditLog({
      actor,
      action: `courier_change.${decision}`,
      entity: 'courier_change_requests',
      entityId: id,
      newValue: decision,
    });
  }

  async listAuditLog(): Promise<AuditLogEntry[]> {
    const { data } = await this.db
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    return ((data ?? []) as Row[]).map((row) => ({
      id: str(row, 'id'),
      actor: str(row, 'actor'),
      action: str(row, 'action'),
      entity: str(row, 'entity'),
      entityId: str(row, 'entity_id'),
      previousValue: str(row, 'previous_value') || undefined,
      newValue: str(row, 'new_value') || undefined,
      createdAt: str(row, 'created_at'),
    }));
  }

  async appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
    await this.db.from('audit_logs').insert({
      actor: entry.actor,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId,
      previous_value: entry.previousValue ?? null,
      new_value: entry.newValue ?? null,
    });
  }

  async ping(): Promise<boolean> {
    const { error } = await this.db.from('users').select('id').limit(1);
    return !error;
  }
}
