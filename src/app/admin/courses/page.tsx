'use client';

import type { LearningCourse } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';

export default function AdminCoursesPage() {
  const { data, status, reload } = useAdminSection<LearningCourse[]>('courses');

  return (
    <>
      <AdminPageTitle title="O'quv kurslari" subtitle="Platformalar bo'yicha interaktiv kurslar" />
      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<LearningCourse>
          rows={data ?? []}
          getKey={(row) => row.id}
          emptyLabel="Kurslar yo'q"
          columns={[
            { header: 'Kurs', render: (row) => row.title },
            { header: 'Platforma', render: (row) => row.platformId },
            { header: 'Bosqichlar', render: (row) => row.steps.length },
            { header: 'Davomiylik', render: (row) => `${row.estimatedMinutes} daqiqa` },
            {
              header: 'Tarif',
              render: (row) => (
                <Badge tone={row.isPremium ? 'primary' : 'neutral'}>
                  {row.isPremium ? 'Premium' : 'Bepul'}
                </Badge>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}
