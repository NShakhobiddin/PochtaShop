'use client';

import * as React from 'react';
import type { AppUser } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  adminAction,
  useAdminSection,
} from '@/features/admin/admin-ui';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const { data, status, reload } = useAdminSection<AppUser[]>('users');
  const [busyId, setBusyId] = React.useState<number | null>(null);

  async function toggleTier(user: AppUser) {
    setBusyId(user.telegramId);
    try {
      await adminAction({
        action: 'user.tier',
        telegramId: user.telegramId,
        tier: user.tier === 'premium' ? 'free' : 'premium',
      });
      reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AdminPageTitle
        title="Foydalanuvchilar"
        subtitle="Premium tarifni shu yerdan faollashtirish mumkin"
      />

      <AdminSectionState status={status} onRetry={reload} />

      {status === 'ready' ? (
        <AdminTable<AppUser>
          rows={data ?? []}
          getKey={(row) => row.id}
          emptyLabel="Foydalanuvchilar yo'q"
          columns={[
            {
              header: 'Foydalanuvchi',
              render: (row) => (
                <div>
                  <p className="font-medium text-content">
                    {[row.firstName, row.lastName].filter(Boolean).join(' ')}
                  </p>
                  {row.username ? <p className="text-xs">@{row.username}</p> : null}
                </div>
              ),
            },
            { header: 'Telegram ID', render: (row) => row.telegramId },
            {
              header: 'Rol',
              render: (row) => (
                <Badge tone={row.role === 'admin' ? 'primary' : 'neutral'}>{row.role}</Badge>
              ),
            },
            {
              header: 'Tarif',
              render: (row) => (
                <Badge tone={row.tier === 'premium' ? 'success' : 'neutral'}>{row.tier}</Badge>
              ),
            },
            { header: "Ro'yxatdan o'tgan", render: (row) => formatDate(row.createdAt) },
            {
              header: 'Amal',
              render: (row) => (
                <Button
                  size="sm"
                  variant={row.tier === 'premium' ? 'outline' : 'secondary'}
                  disabled={busyId === row.telegramId}
                  onClick={() => void toggleTier(row)}
                >
                  {row.tier === 'premium' ? "Premium'ni olib tashlash" : 'Premium berish'}
                </Button>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}
