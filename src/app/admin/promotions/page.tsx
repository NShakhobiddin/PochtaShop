'use client';

import type { Promotion } from '@/types';
import { PlacementLabelBadge } from '@/components/ads/placement-label';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';

export default function AdminPromotionsPage() {
  const { data, status, reload } = useAdminSection<Promotion[]>('promotions');

  return (
    <>
      <AdminPageTitle
        title="Aksiyalar"
        subtitle="Aksiya belgisi organik tavsiyalardan ajratib ko'rsatiladi va reytingga ta'sir qilmaydi"
      />
      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<Promotion>
          rows={data ?? []}
          getKey={(row) => row.id}
          emptyLabel="Aksiyalar yo'q"
          columns={[
            { header: 'Sarlavha', render: (row) => row.title },
            { header: 'Matn', render: (row) => row.body },
            { header: 'Obyekt', render: (row) => `${row.targetType}: ${row.targetId}` },
            { header: 'Belgi', render: (row) => <PlacementLabelBadge label={row.label} /> },
            { header: 'Amal qiladi', render: (row) => row.activeUntil },
          ]}
        />
      ) : null}
    </>
  );
}
