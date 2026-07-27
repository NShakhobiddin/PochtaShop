'use client';

import type { LearningCourse, LearningStep } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';

interface StepRow extends LearningStep {
  courseTitle: string;
}

export default function AdminCourseStepsPage() {
  const { data, status, reload } = useAdminSection<LearningCourse[]>('courses');

  const rows: StepRow[] = (data ?? []).flatMap((course) =>
    course.steps.map((step) => ({ ...step, courseTitle: course.title })),
  );

  return (
    <>
      <AdminPageTitle title="Dars bosqichlari" subtitle="Nazariya, simulyator va test bosqichlari" />
      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<StepRow>
          rows={rows}
          getKey={(row) => row.id}
          emptyLabel="Bosqichlar yo'q"
          columns={[
            { header: 'Kurs', render: (row) => row.courseTitle },
            { header: '#', render: (row) => row.order },
            { header: 'Sarlavha', render: (row) => row.title },
            { header: 'Turi', render: (row) => <Badge tone="neutral">{row.kind}</Badge> },
            { header: 'Variantlar', render: (row) => row.options?.length ?? '—' },
          ]}
        />
      ) : null}
    </>
  );
}
