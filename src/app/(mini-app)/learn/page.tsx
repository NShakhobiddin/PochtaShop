import Link from 'next/link';
import { Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/misc';
import { CourseProgressBadge } from '@/features/learning-simulator/course-progress-badge';
import { getDataSource } from '@/lib/data';
import { COUNTRIES } from '@/constants';

export const dynamic = 'force-dynamic';

export default async function LearnPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>;
}) {
  const params = await searchParams;
  const data = getDataSource();
  const [platforms, courses] = await Promise.all([data.listLearningPlatforms(), data.listCourses()]);

  const filtered = params.platform
    ? courses.filter((course) => course.platformId === params.platform)
    : courses;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Buyurtma qilishni o'rganish" />

      <Card className="p-4">
        <p className="text-[13px] leading-snug text-content-secondary">
          Darslar neytral simulyatorda o&apos;tkaziladi — bu haqiqiy platformaning nusxasi emas,
          balki o&apos;quv maqsadidagi soddalashtirilgan interfeys.
        </p>
      </Card>

      <SectionHeader title="Platformalar" />
      <div className="grid grid-cols-2 gap-3">
        {platforms.map((platform) => {
          const course = courses.find((item) => item.platformId === platform.id);
          return (
            <Link key={platform.id} href={course ? `/learn/${course.id}` : '/learn'}>
              <Card className="h-full p-4">
                <span className="text-3xl" aria-hidden="true">
                  {platform.logoEmoji}
                </span>
                <p className="mt-2 text-[15px] font-bold text-content">{platform.name}</p>
                <p className="text-xs text-content-secondary">{COUNTRIES[platform.country]}</p>
                <p className="mt-1 text-[13px] leading-snug text-content-secondary">
                  {platform.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>

      <SectionHeader title="Kurslar" />
      <div className="space-y-3">
        {filtered.map((course) => (
          <Link key={course.id} href={`/learn/${course.id}`}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-content">{course.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-content-secondary">
                    {course.summary}
                  </p>
                </div>
                {course.isPremium ? <Badge tone="primary">Premium</Badge> : null}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-content-secondary">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {course.estimatedMinutes} daqiqa
                </span>
                <span>{course.steps.length} ta bosqich</span>
              </div>
              <div className="mt-3">
                <CourseProgressBadge courseId={course.id} totalSteps={course.steps.length} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
