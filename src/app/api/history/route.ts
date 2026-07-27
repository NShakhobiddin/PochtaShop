import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { handleApiError, ok } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { telegram } = await requireUser();
    return ok(await getDataSource().listHistory(telegram.id));
  } catch (error) {
    return handleApiError(error, 'history:get');
  }
}

export async function DELETE() {
  try {
    const { telegram } = await requireUser();
    await getDataSource().clearHistory(telegram.id);
    return ok({ cleared: true });
  } catch (error) {
    return handleApiError(error, 'history:delete');
  }
}
