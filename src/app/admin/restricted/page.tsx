'use client';

import type { RestrictedGood } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';
import { formatDate } from '@/lib/utils';

export default function AdminGoodsPage() {
  const { data, status, reload } = useAdminSection<RestrictedGood[]>('restricted');
  const rows = (data ?? []).filter((row) => row.status === 'restricted');

  return (
    <>
      <AdminPageTitle title="Cheklangan tovarlar" subtitle="Ruxsat yoki hujjat talab qiladigan toifalar" />
      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<RestrictedGood>
          rows={rows}
          getKey={(row) => row.id}
          emptyLabel="Yozuvlar yo'q"
          columns={[
            { header: 'Tovar', render: (row) => row.name },
            {
              header: 'Holat',
              render: (row) => (
                <Badge tone={row.status === 'prohibited' ? 'danger' : 'warning'}>
                  {row.status === 'prohibited' ? 'Taqiqlangan' : 'Cheklangan'}
                </Badge>
              ),
            },
            { header: 'Kalit so\'zlar', render: (row) => row.keywords.join(', ') },
            { header: 'Sabab', render: (row) => row.reason },
            {
              header: 'Hujjatlar',
              render: (row) => (row.requiredDocuments.length ? row.requiredDocuments.join(', ') : '—'),
            },
            { header: 'Yangilangan', render: (row) => formatDate(row.updatedAt) },
          ]}
        />
      ) : null}
    </>
  );
}
