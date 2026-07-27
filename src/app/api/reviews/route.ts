import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { fail, handleApiError, ok } from '@/lib/api/response';
import { reviewSchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';

export const dynamic = 'force-dynamic';

/** One review per user per subject; near-duplicate text is rejected. */
const DUPLICATE_SIMILARITY_THRESHOLD = 0.9;

function similarity(a: string, b: string): number {
  const left = new Set(a.toLowerCase().split(/\s+/));
  const right = new Set(b.toLowerCase().split(/\s+/));
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const word of left) if (right.has(word)) shared += 1;
  return shared / Math.max(left.size, right.size);
}

export async function GET(request: Request) {
  try {
    const subjectId = new URL(request.url).searchParams.get('subjectId') ?? undefined;
    const reviews = await getDataSource().listReviews(subjectId);
    return ok(reviews.filter((review) => review.status === 'published'));
  } catch (error) {
    return handleApiError(error, 'reviews:get');
  }
}

export async function POST(request: Request) {
  try {
    const { telegram } = await requireUser();
    checkRateLimit(`review:${telegram.id}`, RATE_LIMITS.write);

    const body = reviewSchema.parse(await request.json());
    const data = getDataSource();
    const existing = await data.listReviews(body.subjectId);

    if (existing.some((review) => review.authorTelegramId === telegram.id)) {
      return fail("Siz bu obyekt uchun sharh qoldirgansiz.", 409, 'duplicate_review');
    }

    if (
      existing.some(
        (review) => similarity(review.body, body.body) >= DUPLICATE_SIMILARITY_THRESHOLD,
      )
    ) {
      return fail("Bu sharh mavjud sharhga juda o'xshash.", 409, 'duplicate_text');
    }

    const review = await data.createReview({
      subject: body.subject,
      subjectId: body.subjectId,
      authorTelegramId: telegram.id,
      // Only the first name is published; no other personal data is stored.
      authorName: telegram.firstName,
      rating: body.rating,
      body: body.body,
      // Verification is claimed here and confirmed by a moderator.
      verifiedPurchase: false,
    });

    return ok(review, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'reviews:post');
  }
}
