import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { fail, handleApiError, ok } from '@/lib/api/response';
import { savedItemSchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { FREE_TIER_LIMITS } from '@/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { telegram } = await requireUser();
    return ok(await getDataSource().listSavedItems(telegram.id));
  } catch (error) {
    return handleApiError(error, 'saved:get');
  }
}

export async function POST(request: Request) {
  try {
    const { telegram, user } = await requireUser();
    checkRateLimit(`saved:${telegram.id}`, RATE_LIMITS.write);

    const body = savedItemSchema.parse(await request.json());
    const data = getDataSource();

    if (user.tier === 'free') {
      const items = await data.listSavedItems(telegram.id);
      if (items.length >= FREE_TIER_LIMITS.SAVED_ITEMS) {
        return fail(
          `Bepul tarifda ${FREE_TIER_LIMITS.SAVED_ITEMS} tagacha element saqlash mumkin.`,
          403,
          'tier_limit',
        );
      }
    }

    const saved = await data.addSavedItem({ telegramId: telegram.id, ...body });
    return ok(saved, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'saved:post');
  }
}

export async function DELETE(request: Request) {
  try {
    const { telegram } = await requireUser();
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return fail("Element identifikatori ko'rsatilmagan.", 400, 'missing_id');

    await getDataSource().removeSavedItem(telegram.id, id);
    return ok({ removed: id });
  } catch (error) {
    return handleApiError(error, 'saved:delete');
  }
}
