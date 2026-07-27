import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { handleApiError, ok } from '@/lib/api/response';
import { assistedOrderSchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { track } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { telegram } = await requireUser();
    return ok(await getDataSource().listAssistedOrders(telegram.id));
  } catch (error) {
    return handleApiError(error, 'assisted-orders:get');
  }
}

export async function POST(request: Request) {
  try {
    const { telegram, user } = await requireUser();
    checkRateLimit(`assisted-order:${telegram.id}`, RATE_LIMITS.write);

    // userConfirmed is a literal true in the schema: nothing is ordered
    // without the user explicitly confirming product, price and terms.
    const body = assistedOrderSchema.parse(await request.json());

    const order = await getDataSource().createAssistedOrder({
      userId: user.id,
      telegramId: telegram.id,
      productUrl: body.productUrl,
      variant: body.variant,
      quantity: body.quantity,
      maxBudgetUzs: body.maxBudgetUzs,
      note: body.note,
      userConfirmed: body.userConfirmed,
    });

    track('assisted_order_requested', { quantity: body.quantity });

    return ok(order, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'assisted-orders:post');
  }
}
