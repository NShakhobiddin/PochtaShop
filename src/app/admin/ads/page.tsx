'use client';

import type { Promotion } from '@/types';
import { Card } from '@/components/ui/card';
import { PlacementLabelBadge } from '@/components/ads/placement-label';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';

const RULES = [
  'Reklama reytingni o\'zgartirmaydi.',
  'Homiy kuryer "eng ishonchli" sifatida avtomatik ko\'rsatilmaydi.',
  'Salbiy tasdiqlangan sharhni reklamachi o\'chira olmaydi.',
  'Affiliate havola mavjud bo\'lsa, foydalanuvchiga ko\'rsatiladi.',
];

export default function AdminAdsPage() {
  const { data, status, reload } = useAdminSection<Promotion[]>('promotions');
  const rows = (data ?? []).filter((row) => row.label === 'ad' || row.label === 'partnership');

  return (
    <>
      <AdminPageTitle title="Reklama" subtitle="Pullik joylashtirishlar va neytrallik qoidalari" />

      <Card className="mb-5 p-4">
        <h2 className="text-base font-semibold text-content">Neytrallik qoidalari</h2>
        <ul className="mt-2 space-y-1 text-sm text-content-secondary">
          {RULES.map((rule) => (
            <li key={rule}>• {rule}</li>
          ))}
        </ul>
      </Card>

      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<Promotion>
          rows={rows}
          getKey={(row) => row.id}
          emptyLabel="Reklama joylashtirishlari yo'q"
          columns={[
            { header: 'Sarlavha', render: (row) => row.title },
            { header: 'Obyekt', render: (row) => `${row.targetType}: ${row.targetId}` },
            { header: 'Belgi', render: (row) => <PlacementLabelBadge label={row.label} /> },
            { header: 'Amal qiladi', render: (row) => row.activeUntil },
          ]}
        />
      ) : null}
    </>
  );
}
