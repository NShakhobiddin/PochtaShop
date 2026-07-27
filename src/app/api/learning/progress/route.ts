import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { handleApiError, fail, ok } from '@/lib/api/response';
import { learningProgressSchema } from '@/lib/validation/schemas';
import { checkRateLimit, RATE_LIMITS } from '@/lib/validation/rate-limit';
import { nowIso, unique } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { telegram } = await requireUser();
    return ok(await getDataSource().getProgress(telegram.id));
  } catch (error) {
    return handleApiError(error, 'learning/progress:get');
  }
}

export async function POST(request: Request) {
  try {
    const { telegram } = await requireUser();
    checkRateLimit(`learning:${telegram.id}`, RATE_LIMITS.write);

    const body = learningProgressSchema.parse(await request.json());
    const data = getDataSource();

    const course = await data.getCourse(body.courseId);
    if (!course) return fail('Dars topilmadi.', 404, 'not_found');
    if (!course.steps.some((step) => step.id === body.stepId)) {
      return fail('Dars bosqichi topilmadi.', 404, 'not_found');
    }

    const existing = (await data.getProgress(telegram.id)).find(
      (item) => item.courseId === body.courseId,
    );

    const completedStepIds = unique([...(existing?.completedStepIds ?? []), body.stepId]);
    const finished = body.completed || completedStepIds.length >= course.steps.length;

    const progress = {
      courseId: body.courseId,
      completedStepIds,
      lastStepId: body.stepId,
      completedAt: finished ? (existing?.completedAt ?? nowIso()) : undefined,
      score: body.score ?? existing?.score,
    };

    await data.saveProgress(telegram.id, progress);
    return ok(progress);
  } catch (error) {
    return handleApiError(error, 'learning/progress:post');
  }
}
