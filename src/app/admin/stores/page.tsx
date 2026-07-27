'use client';

import type { Store } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';
import { CATEGORY_LABELS, COUNTRIES } from '@/constants';
import { formatDate } from '@/lib/utils';

export default function AdminStoresPage() {
  const { data, status, reload } = useAdminSection<Store[]>('stores');

  return (
    <>
      <AdminPageTitle title="Internet-do'konlar" subtitle="Katalogdagi platformalar" />
      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<Store>
          rows={data ?? []}
          getKey={(row) => row.id}
          emptyLabel="Do'konlar yo'q"
          columns={[
            {
              header: "Do'kon",
              render: (row) => (
                <div>
                  <p className="font-medium text-content">
                    {row.logoEmoji} {row.name}
                  </p>
                  {row.isDemo ? <Badge tone="outline">Demo</Badge> : null}
                </div>
              ),
            },
            { header: 'Davlat', render: (row) => COUNTRIES[row.country] },
            {
              header: 'Kategoriyalar',
              render: (row) => row.categories.map((c) => CATEGORY_LABELS[c]).join(', '),
            },
            { header: 'Narx darajasi', render: (row) => row.priceLevel },
            { header: 'Originallik', render: (row) => `${row.authenticityScore}%` },
            { header: 'Reyting', render: (row) => `⭐ ${row.rating.toFixed(1)}` },
            { header: 'Yangilangan', render: (row) => formatDate(row.updatedAt) },
          ]}
        />
      ) : null}
    </>
  );
}
