import { notFound } from 'next/navigation';
import { CourseScreen } from '@/features/learning-simulator/course-screen';
import { getDataSource } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const data = getDataSource();
  const course = await data.getCourse(courseId);
  if (!course) notFound();

  const platform = (await data.listLearningPlatforms()).find(
    (item) => item.id === course.platformId,
  );

  return <CourseScreen course={course} platformName={platform?.name ?? ''} />;
}
