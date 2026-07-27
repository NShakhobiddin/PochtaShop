import { requireUser } from '@/features/telegram-auth/server';
import { handleApiError, ok } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { user } = await requireUser();
    return ok(user);
  } catch (error) {
    return handleApiError(error, 'me');
  }
}
