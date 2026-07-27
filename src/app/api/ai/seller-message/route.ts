import { requireUser } from '@/features/telegram-auth/server';
import { getAIProvider } from '@/lib/ai';
import { handleApiError, ok } from '@/lib/api/response';
import { sellerMessageSchema, sellerReplySchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';

export const dynamic = 'force-dynamic';

/** Drafts a message for the seller (uz -> zh/en/tr). */
export async function POST(request: Request) {
  try {
    const { telegram } = await requireUser();
    checkRateLimit(`seller-msg:${telegram.id}`, RATE_LIMITS.ai);

    const body = sellerMessageSchema.parse(await request.json());
    return ok(await getAIProvider().generateSellerMessage(body));
  } catch (error) {
    return handleApiError(error, 'ai/seller-message');
  }
}

/** Translates and explains the seller's reply (zh/en/tr -> uz). */
export async function PUT(request: Request) {
  try {
    const { telegram } = await requireUser();
    checkRateLimit(`seller-reply:${telegram.id}`, RATE_LIMITS.ai);

    const body = sellerReplySchema.parse(await request.json());
    return ok(await getAIProvider().translateSellerMessage(body));
  } catch (error) {
    return handleApiError(error, 'ai/seller-reply');
  }
}
