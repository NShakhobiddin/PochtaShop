import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { handleApiError, ok } from '@/lib/api/response';
import { customsCalculationSchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { calculateCustoms } from '@/features/customs-calculator/calculate';
import { formatUzs } from '@/lib/currency';
import type { CustomsCalculationInput } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { telegram } = await requireUser();
    checkRateLimit(`customs-calc:${telegram.id}`, RATE_LIMITS.write);

    const input = customsCalculationSchema.parse(await request.json()) as CustomsCalculationInput;
    const result = calculateCustoms(input);

    await getDataSource().addHistory({
      telegramId: telegram.id,
      kind: 'customs_calculation',
      title: input.itemName,
      subtitle: `Jami: ${formatUzs(result.grandTotalUzs)}`,
    });

    return ok(result);
  } catch (error) {
    return handleApiError(error, 'customs/calculate');
  }
}
