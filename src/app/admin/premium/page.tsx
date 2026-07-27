'use client';

import type { AppUser } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';
import { PREMIUM_PRICE_UZS } from '@/features/subscriptions/plans';
import { formatUzs } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

export default function AdminPremiumPage() {
  const { data, status, reload } = useAdminSection<AppUser[]>('users');
  const premium = (data ?? []).filter((user) => user.tier === 'premium');

  return (
    <>
      <AdminPageTitle
        title="Premium"
        subtitle="Tarifni 'Foydalanuvchilar' bo'limidan faollashtiring"
      />

      <Card className="mb-5 p-4">
        <p className="text-sm text-content-secondary">Amaldagi narx</p>
        <p className="text-2xl font-extrabold text-primary">{formatUzs(PREMIUM_PRICE_UZS)} / oy</p>
        <p className="mt-2 text-sm text-content-secondary">
          To&apos;lov provayderi ulanmagan — tarif admin tomonidan qo&apos;lda faollashtiriladi.
        </p>
      </Card>

      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<AppUser>
          rows={premium}
          getKey={(row) => row.id}
          emptyLabel="Premium foydalanuvchilar yo'q"
          columns={[
            {
              header: 'Foydalanuvchi',
              render: (row) => [row.firstName, row.lastName].filter(Boolean).join(' '),
            },
            { header: 'Telegram ID', render: (row) => row.telegramId },
            { header: 'Tarif', render: () => <Badge tone="success">Premium</Badge> },
            { header: "Ro'yxatdan o'tgan", render: (row) => formatDate(row.createdAt) },
          ]}
        />
      ) : null}
    </>
  );
}
