'use client';

import type { AssistedOrderRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';
import {
  CONSULTATION_STATUS_LABEL,
  CONSULTATION_STATUS_TONE,
} from '@/features/consultation/types';
import { formatUzs } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

export default function AdminOrdersPage() {
  const { data, status, reload } = useAdminSection<AssistedOrderRequest[]>('orders');

  return (
    <>
      <AdminPageTitle
        title="Buyurtma so'rovlari"
        subtitle="Buyurtma faqat foydalanuvchi tasdig'idan keyin rasmiylashtiriladi"
      />
      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<AssistedOrderRequest>
          rows={data ?? []}
          getKey={(row) => row.id}
          emptyLabel="So'rovlar yo'q"
          columns={[
            { header: 'Havola', render: (row) => <span className="break-all">{row.productUrl}</span> },
            { header: 'Variant', render: (row) => row.variant || '—' },
            { header: 'Miqdor', render: (row) => row.quantity },
            { header: 'Budjet', render: (row) => formatUzs(row.maxBudgetUzs) },
            {
              header: 'Tasdiq',
              render: (row) => (
                <Badge tone={row.userConfirmed ? 'success' : 'warning'}>
                  {row.userConfirmed ? 'Tasdiqlangan' : 'Tasdiqlanmagan'}
                </Badge>
              ),
            },
            {
              header: 'Holat',
              render: (row) => (
                <Badge tone={CONSULTATION_STATUS_TONE[row.status]}>
                  {CONSULTATION_STATUS_LABEL[row.status]}
                </Badge>
              ),
            },
            { header: 'Sana', render: (row) => formatDate(row.createdAt) },
          ]}
        />
      ) : null}
    </>
  );
}
