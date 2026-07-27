import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { handleApiError, ok } from '@/lib/api/response';
import { commercialIntentSchema, customsRiskSchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { evaluateCommercialIntent, evaluateCustomsRisk } from '@/features/customs-risk/risk';
import type { CommercialIntentInput, CustomsRiskInput } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { telegram } = await requireUser();
    checkRateLimit(`customs-risk:${telegram.id}`, RATE_LIMITS.write);

    const input = customsRiskSchema.parse(await request.json()) as CustomsRiskInput;
    const data = getDataSource();
    const restrictedGoods = await data.listRestrictedGoods();
    const result = evaluateCustomsRisk(input, restrictedGoods);

    await data.addHistory({
      telegramId: telegram.id,
      kind: 'customs_risk',
      title: input.itemName,
      subtitle: result.title,
    });

    return ok(result);
  } catch (error) {
    return handleApiError(error, 'customs/risk');
  }
}

/** Commercial-intent scoring is a separate, lighter check. */
export async function PUT(request: Request) {
  try {
    const { telegram } = await requireUser();
    checkRateLimit(`commercial-intent:${telegram.id}`, RATE_LIMITS.write);

    const input = commercialIntentSchema.parse(await request.json()) as CommercialIntentInput;
    return ok(evaluateCommercialIntent(input));
  } catch (error) {
    return handleApiError(error, 'customs/commercial-intent');
  }
}
