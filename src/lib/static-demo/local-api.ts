'use client';

import { MemoryDataSource } from '@/lib/data/memory-source';
import { buildRecommendations } from '@/features/recommendations/engine';
import { calculateCustoms } from '@/features/customs-calculator/calculate';
import { evaluateCommercialIntent, evaluateCustomsRisk } from '@/features/customs-risk/risk';
import { translateTopic } from '@/features/seller-assistant/phrasebook';
import { analyseSellerReply } from '@/features/seller-assistant/reply-analysis';
import { CONSULTATION_TYPES } from '@/features/consultation/types';
import { formatUzs } from '@/lib/currency';
import { isStale, nowIso, truncate, unique } from '@/lib/utils';
import { loadPersistedState, persistState } from './browser-store';
import type {
  AIResult,
  AppUser,
  CommercialIntentInput,
  CustomsCalculationInput,
  CustomsRiskInput,
  LearningProgress,
  ProductSearchCriteria,
  SellerLanguage,
} from '@/types';

/** The identity every visitor of the static demo gets. */
const DEMO_TELEGRAM_ID = 100_000_001;

let source: MemoryDataSource | null = null;

function db(): MemoryDataSource {
  if (!source) {
    loadPersistedState();
    source = new MemoryDataSource();
  }
  return source;
}

async function me(): Promise<AppUser> {
  return db().upsertUserFromTelegram({
    id: DEMO_TELEGRAM_ID,
    firstName: 'Demo',
    lastName: 'Foydalanuvchi',
    username: 'demo_user',
  });
}

export class LocalApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'LocalApiError';
  }
}

interface Request {
  path: string;
  method: string;
  body: unknown;
}

/**
 * Serves the same contracts as the /api routes, entirely in the browser.
 *
 * The rule engines and the data source are the exact modules the server uses,
 * so the numbers on GitHub Pages match a real deployment. Validation is not
 * repeated here: there is no trust boundary to defend inside the visitor's own
 * browser, and every input already comes from the app's own forms.
 */
export async function handleLocalRequest({ path, method, body }: Request): Promise<unknown> {
  const [pathname, query] = path.split('?');
  const params = new URLSearchParams(query ?? '');
  const data = db();
  const user = await me();
  const payload = (body ?? {}) as Record<string, unknown>;

  const result = await route(pathname ?? '', method, params, payload, data, user);
  persistState();
  return result;
}

async function route(
  pathname: string,
  method: string,
  params: URLSearchParams,
  payload: Record<string, unknown>,
  data: MemoryDataSource,
  user: AppUser,
): Promise<unknown> {
  switch (`${method} ${pathname}`) {
    case 'GET /api/me':
      // The demo visitor is an admin so the panel is explorable.
      return { ...user, role: 'admin' as const };

    /* ------------------------------------------------------------- search */

    case 'POST /api/search': {
      const criteria = payload as unknown as ProductSearchCriteria;
      const [products, stores, couriers, restrictedGoods] = await Promise.all([
        data.listProducts(),
        data.listStores(),
        data.listCouriers(),
        data.listRestrictedGoods(),
      ]);
      const offers = (
        await Promise.all(products.map((product) => data.listOffers(product.id)))
      ).flat();
      const sellers = (
        await Promise.all(unique(offers.map((offer) => offer.sellerId)).map((id) => data.getSeller(id)))
      ).filter((seller): seller is NonNullable<typeof seller> => seller !== null);

      const analysis: AIResult = buildRecommendations(criteria, {
        products,
        offers,
        stores,
        sellers,
        couriers,
        restrictedGoods,
      });

      await data.recordAiRequest({
        telegramId: user.telegramId,
        feature: 'analyzeProduct',
        provider: 'mock',
        inputSummary: truncate(String(criteria.query ?? ''), 80),
        confidence: analysis.confidence,
      });
      await data.addHistory({
        telegramId: user.telegramId,
        kind: 'ai_analysis',
        title: truncate(String(criteria.query ?? ''), 60),
        subtitle: `${analysis.recommendedOptions.length} ta tavsiya`,
      });

      return analysis;
    }

    /* -------------------------------------------------------------- saved */

    case 'GET /api/saved':
      return data.listSavedItems(user.telegramId);

    case 'POST /api/saved':
      return data.addSavedItem({
        telegramId: user.telegramId,
        kind: payload.kind as never,
        refId: String(payload.refId),
        title: String(payload.title),
        subtitle: payload.subtitle ? String(payload.subtitle) : undefined,
      });

    case 'DELETE /api/saved': {
      const id = params.get('id');
      if (!id) throw new LocalApiError("Element identifikatori ko'rsatilmagan.", 400, 'missing_id');
      await data.removeSavedItem(user.telegramId, id);
      return { removed: id };
    }

    /* ------------------------------------------------------------ history */

    case 'GET /api/history':
      return data.listHistory(user.telegramId);

    case 'DELETE /api/history':
      await data.clearHistory(user.telegramId);
      return { cleared: true };

    /* ----------------------------------------------------------- learning */

    case 'GET /api/learning/progress':
      return data.getProgress(user.telegramId);

    case 'POST /api/learning/progress': {
      const courseId = String(payload.courseId);
      const stepId = String(payload.stepId);
      const course = await data.getCourse(courseId);
      if (!course) throw new LocalApiError('Dars topilmadi.', 404, 'not_found');
      if (!course.steps.some((step) => step.id === stepId)) {
        throw new LocalApiError('Dars bosqichi topilmadi.', 404, 'not_found');
      }

      const existing = (await data.getProgress(user.telegramId)).find(
        (item) => item.courseId === courseId,
      );
      const completedStepIds = unique([...(existing?.completedStepIds ?? []), stepId]);
      const finished = payload.completed === true || completedStepIds.length >= course.steps.length;

      const progress: LearningProgress = {
        courseId,
        completedStepIds,
        lastStepId: stepId,
        completedAt: finished ? (existing?.completedAt ?? nowIso()) : undefined,
        score: typeof payload.score === 'number' ? payload.score : existing?.score,
      };
      await data.saveProgress(user.telegramId, progress);
      return progress;
    }

    case 'GET /api/learning/continue': {
      const [courses, progressList] = await Promise.all([
        data.listCourses(),
        data.getProgress(user.telegramId),
      ]);
      const inProgress = progressList
        .filter((progress) => !progress.completedAt)
        .sort((a, b) => b.completedStepIds.length - a.completedStepIds.length)[0];
      if (!inProgress) return null;

      const course = courses.find((item) => item.id === inProgress.courseId);
      if (!course) return null;

      const nextStep =
        course.steps.find((step) => !inProgress.completedStepIds.includes(step.id)) ??
        course.steps[0];

      return {
        course,
        progress: inProgress,
        nextStepTitle: nextStep ? `Dars ${nextStep.order}: ${nextStep.title}` : 'Yakuniy test',
        percent: Math.round((inProgress.completedStepIds.length / course.steps.length) * 100),
      };
    }

    /* ------------------------------------------------------------ customs */

    case 'POST /api/customs/calculate': {
      const input = payload as unknown as CustomsCalculationInput;
      const calculation = calculateCustoms(input);
      await data.addHistory({
        telegramId: user.telegramId,
        kind: 'customs_calculation',
        title: input.itemName,
        subtitle: `Jami: ${formatUzs(calculation.grandTotalUzs)}`,
      });
      return calculation;
    }

    case 'POST /api/customs/risk': {
      const input = payload as unknown as CustomsRiskInput;
      const risk = evaluateCustomsRisk(input, await data.listRestrictedGoods());
      await data.addHistory({
        telegramId: user.telegramId,
        kind: 'customs_risk',
        title: input.itemName,
        subtitle: risk.title,
      });
      return risk;
    }

    case 'PUT /api/customs/risk':
      return evaluateCommercialIntent(payload as unknown as CommercialIntentInput);

    /* ----------------------------------------------------------------- ai */

    case 'POST /api/ai/seller-message':
      return translateTopic(
        String(payload.topicId),
        String(payload.userText ?? ''),
        payload.language as SellerLanguage,
      );

    case 'PUT /api/ai/seller-message':
      return analyseSellerReply(String(payload.sellerText ?? ''));

    case 'POST /api/ai/screenshot':
      throw new LocalApiError(
        "Screenshot tahlili server talab qiladi va GitHub Pages demoda mavjud emas.",
        501,
        'not_available_static',
      );

    /* ----------------------------------------------------------- services */

    case 'GET /api/consultations':
      return data.listConsultations(user.telegramId);

    case 'POST /api/consultations': {
      const type = payload.type as never;
      const definition = CONSULTATION_TYPES.find((item) => item.value === type);
      const consultation = await data.createConsultation({
        userId: user.id,
        telegramId: user.telegramId,
        type,
        description: String(payload.description ?? ''),
        productUrl: payload.productUrl ? String(payload.productUrl) : undefined,
        attachmentName: payload.attachmentName ? String(payload.attachmentName) : undefined,
        contactMethod: payload.contactMethod === 'phone' ? 'phone' : 'telegram',
        contactValue: String(payload.contactValue ?? ''),
        preferredTime: String(payload.preferredTime ?? ''),
        // The price comes from the catalogue, exactly as on the server.
        priceUzs: definition?.priceUzs ?? 0,
      });
      await data.addHistory({
        telegramId: user.telegramId,
        kind: 'consultation',
        title: definition?.label ?? 'Konsultatsiya',
        subtitle: "So'rov yuborildi",
      });
      return consultation;
    }

    case 'GET /api/assisted-orders':
      return data.listAssistedOrders(user.telegramId);

    case 'POST /api/assisted-orders':
      return data.createAssistedOrder({
        userId: user.id,
        telegramId: user.telegramId,
        productUrl: String(payload.productUrl),
        variant: String(payload.variant ?? ''),
        quantity: Number(payload.quantity ?? 1),
        maxBudgetUzs: Number(payload.maxBudgetUzs ?? 0),
        note: payload.note ? String(payload.note) : undefined,
        userConfirmed: payload.userConfirmed === true,
      });

    case 'POST /api/subscriptions/request':
      await data.appendAuditLog({
        actor: `user:${user.telegramId}`,
        action: 'premium.requested',
        entity: 'subscriptions',
        entityId: user.id,
        previousValue: user.tier,
        newValue: 'premium_requested',
      });
      return { intent: { id: 'static-demo', provider: 'mock', amountUzs: 49_000, status: 'pending' } };

    /* ------------------------------------------------------------ reviews */

    case 'GET /api/reviews': {
      const subjectId = params.get('subjectId') ?? undefined;
      const reviews = await data.listReviews(subjectId);
      return reviews.filter((review) => review.status === 'published');
    }

    case 'POST /api/reviews': {
      const subjectId = String(payload.subjectId);
      const existing = await data.listReviews(subjectId);
      if (existing.some((review) => review.authorTelegramId === user.telegramId)) {
        throw new LocalApiError("Siz bu obyekt uchun sharh qoldirgansiz.", 409, 'duplicate_review');
      }
      return data.createReview({
        subject: payload.subject === 'store' ? 'store' : 'courier',
        subjectId,
        authorTelegramId: user.telegramId,
        authorName: user.firstName,
        rating: Number(payload.rating ?? 5),
        body: String(payload.body ?? ''),
        verifiedPurchase: false,
      });
    }

    /* ------------------------------------------------- courier and admin */

    case 'GET /api/courier-panel': {
      const [couriers, requests, reviews] = await Promise.all([
        data.listCouriers(),
        data.listCourierChangeRequests(params.get('courierId') ?? undefined),
        data.listReviews(params.get('courierId') ?? undefined),
      ]);
      return { couriers, requests, reviews };
    }

    case 'POST /api/courier-panel': {
      const created = await data.createCourierChangeRequest({
        courierId: String(payload.courierId),
        submittedBy: `courier:${user.telegramId}`,
        field: String(payload.field),
        previousValue: String(payload.previousValue ?? ''),
        newValue: String(payload.newValue ?? ''),
      });
      await data.appendAuditLog({
        actor: `courier:${user.telegramId}`,
        action: 'courier_change.submitted',
        entity: 'courier_change_requests',
        entityId: created.id,
        previousValue: String(payload.previousValue ?? ''),
        newValue: String(payload.newValue ?? ''),
      });
      return created;
    }

    case 'GET /api/admin':
      return adminSection(params.get('section') ?? 'dashboard', data);

    case 'POST /api/admin':
      return adminAction(payload, data, `admin:${user.telegramId}`);

    default:
      throw new LocalApiError(`Bu amal demoda mavjud emas: ${method} ${pathname}`, 404, 'not_found');
  }
}

async function adminSection(section: string, data: MemoryDataSource): Promise<unknown> {
  if (section === 'dashboard') {
    const [users, consultations, couriers, reviews, auditLog, orders] = await Promise.all([
      data.listUsers(),
      data.listConsultations(),
      data.listCouriers(),
      data.listReviews(),
      data.listAuditLog(),
      data.listAssistedOrders(),
    ]);
    return {
      users: users.length,
      premiumUsers: users.filter((item) => item.tier === 'premium').length,
      consultations: consultations.length,
      openConsultations: consultations.filter(
        (item) => item.status === 'new' || item.status === 'reviewing',
      ).length,
      assistedOrders: orders.length,
      activeCouriers: couriers.length,
      staleTariffs: couriers.filter((courier) =>
        courier.tariffs.some((tariff) => isStale(tariff.updatedAt)),
      ).length,
      pendingReviews: reviews.filter((review) => review.status === 'pending').length,
      auditEntries: auditLog.length,
    };
  }

  if (section === 'users') return data.listUsers();
  if (section === 'stores') return data.listStores();
  if (section === 'couriers') return data.listCouriers();
  if (section === 'consultations') return data.listConsultations();
  if (section === 'orders') return data.listAssistedOrders();
  if (section === 'reviews') return data.listReviews();
  if (section === 'restricted') return data.listRestrictedGoods();
  if (section === 'courses') return data.listCourses();
  if (section === 'promotions') return data.listPromotions();
  if (section === 'audit') return data.listAuditLog();
  if (section === 'ai-logs') return data.listAiRequests();
  if (section === 'change-requests') return data.listCourierChangeRequests();

  throw new LocalApiError("Noma'lum bo'lim.", 404, 'unknown_section');
}

async function adminAction(
  payload: Record<string, unknown>,
  data: MemoryDataSource,
  actor: string,
): Promise<unknown> {
  switch (payload.action) {
    case 'consultation.status':
      await data.updateConsultationStatus(String(payload.id), payload.status as never, actor);
      break;
    case 'review.moderate':
      await data.moderateReview(String(payload.id), payload.status as never, actor);
      break;
    case 'review.reply':
      await data.replyToReview(String(payload.id), String(payload.reply), actor);
      break;
    case 'user.tier': {
      const telegramId = Number(payload.telegramId);
      const target = await data.getUserByTelegramId(telegramId);
      await data.setTier(telegramId, payload.tier as never);
      await data.appendAuditLog({
        actor,
        action: 'user.tier_changed',
        entity: 'users',
        entityId: String(telegramId),
        previousValue: target?.tier,
        newValue: String(payload.tier),
      });
      break;
    }
    case 'courier-change.decide':
      await data.decideCourierChangeRequest(
        String(payload.id),
        payload.decision as 'approved' | 'rejected',
        actor,
      );
      break;
    default:
      throw new LocalApiError("Noma'lum amal.", 400, 'unknown_action');
  }
  return { done: true };
}
