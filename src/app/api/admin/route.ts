import { requireRole } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { fail, handleApiError, ok } from '@/lib/api/response';
import { z } from 'zod';
import { isStale } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/** Aggregated dashboard payload, plus the moderation and CRUD queues. */
export async function GET(request: Request) {
  try {
    await requireRole('admin');
    const section = new URL(request.url).searchParams.get('section') ?? 'dashboard';
    const data = getDataSource();

    if (section === 'dashboard') {
      const [users, consultations, couriers, reviews, auditLog, orders] = await Promise.all([
        data.listUsers(),
        data.listConsultations(),
        data.listCouriers(),
        data.listReviews(),
        data.listAuditLog(),
        data.listAssistedOrders(),
      ]);

      const staleTariffs = couriers.filter((courier) =>
        courier.tariffs.some((tariff) => isStale(tariff.updatedAt)),
      );

      return ok({
        users: users.length,
        premiumUsers: users.filter((user) => user.tier === 'premium').length,
        consultations: consultations.length,
        openConsultations: consultations.filter(
          (item) => item.status === 'new' || item.status === 'reviewing',
        ).length,
        assistedOrders: orders.length,
        activeCouriers: couriers.length,
        staleTariffs: staleTariffs.length,
        pendingReviews: reviews.filter((review) => review.status === 'pending').length,
        auditEntries: auditLog.length,
      });
    }

    if (section === 'users') return ok(await data.listUsers());
    if (section === 'stores') return ok(await data.listStores());
    if (section === 'couriers') return ok(await data.listCouriers());
    if (section === 'consultations') return ok(await data.listConsultations());
    if (section === 'orders') return ok(await data.listAssistedOrders());
    if (section === 'reviews') return ok(await data.listReviews());
    if (section === 'restricted') return ok(await data.listRestrictedGoods());
    if (section === 'courses') return ok(await data.listCourses());
    if (section === 'promotions') return ok(await data.listPromotions());
    if (section === 'audit') return ok(await data.listAuditLog());
    if (section === 'ai-logs') return ok(await data.listAiRequests());
    if (section === 'change-requests') return ok(await data.listCourierChangeRequests());

    return fail("Noma'lum bo'lim.", 404, 'unknown_section');
  } catch (error) {
    return handleApiError(error, 'admin:get');
  }
}

const actionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('consultation.status'),
    id: z.string().max(80),
    status: z.enum([
      'new',
      'reviewing',
      'need_info',
      'accepted',
      'in_progress',
      'completed',
      'cancelled',
    ]),
  }),
  z.object({
    action: z.literal('review.moderate'),
    id: z.string().max(80),
    status: z.enum(['pending', 'published', 'rejected']),
  }),
  z.object({
    action: z.literal('review.reply'),
    id: z.string().max(80),
    reply: z.string().trim().min(1).max(1000),
  }),
  z.object({
    action: z.literal('user.tier'),
    telegramId: z.number().int().positive(),
    tier: z.enum(['free', 'premium']),
  }),
  z.object({
    action: z.literal('courier-change.decide'),
    id: z.string().max(80),
    decision: z.enum(['approved', 'rejected']),
  }),
]);

export async function POST(request: Request) {
  try {
    const { telegram } = await requireRole('admin');
    const actor = `admin:${telegram.id}`;
    const body = actionSchema.parse(await request.json());
    const data = getDataSource();

    switch (body.action) {
      case 'consultation.status':
        await data.updateConsultationStatus(body.id, body.status, actor);
        break;
      case 'review.moderate':
        await data.moderateReview(body.id, body.status, actor);
        break;
      case 'review.reply':
        await data.replyToReview(body.id, body.reply, actor);
        break;
      case 'user.tier': {
        const user = await data.getUserByTelegramId(body.telegramId);
        await data.setTier(body.telegramId, body.tier);
        await data.appendAuditLog({
          actor,
          action: 'user.tier_changed',
          entity: 'users',
          entityId: String(body.telegramId),
          previousValue: user?.tier,
          newValue: body.tier,
        });
        break;
      }
      case 'courier-change.decide':
        await data.decideCourierChangeRequest(body.id, body.decision, actor);
        break;
    }

    return ok({ done: true });
  } catch (error) {
    return handleApiError(error, 'admin:post');
  }
}
