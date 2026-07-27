import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';
import { handleApiError, ok } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { telegram } = await requireUser();
    const data = getDataSource();
    const [courses, progressList] = await Promise.all([
      data.listCourses(),
      data.getProgress(telegram.id),
    ]);

    const inProgress = progressList
      .filter((progress) => !progress.completedAt)
      .sort((a, b) => b.completedStepIds.length - a.completedStepIds.length)[0];

    if (!inProgress) return ok(null);

    const course = courses.find((item) => item.id === inProgress.courseId);
    if (!course) return ok(null);

    const nextStep =
      course.steps.find((step) => !inProgress.completedStepIds.includes(step.id)) ?? course.steps[0];

    return ok({
      course,
      progress: inProgress,
      nextStepTitle: nextStep
        ? `Dars ${nextStep.order}: ${nextStep.title}`
        : 'Yakuniy test',
      percent: Math.round((inProgress.completedStepIds.length / course.steps.length) * 100),
    });
  } catch (error) {
    return handleApiError(error, 'learning/continue');
  }
}
