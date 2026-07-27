import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { handleApiError, ok } from '@/lib/api/response';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { getPaymentProvider, PREMIUM_PRICE_UZS } from '@/features/subscriptions/plans';

export const dynamic = 'force-dynamic';

/**
 * Records a Premium request. No money changes hands in this version: the
 * payment provider returns a pending intent and an admin activates the tier.
 */
export async function POST() {
  try {
    const { telegram, user } = await requireUser();
    checkRateLimit(`premium:${telegram.id}`, RATE_LIMITS.write);

    const intent = await getPaymentProvider().createIntent({
      telegramId: telegram.id,
      amountUzs: PREMIUM_PRICE_UZS,
    });

    await getDataSource().appendAuditLog({
      actor: `user:${telegram.id}`,
      action: 'premium.requested',
      entity: 'subscriptions',
      entityId: user.id,
      previousValue: user.tier,
      newValue: 'premium_requested',
    });

    return ok({ intent });
  } catch (error) {
    return handleApiError(error, 'subscriptions/request');
  }
}
