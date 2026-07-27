'use client';

import * as React from 'react';
import type { Courier, CourierChangeRequest } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  adminAction,
  useAdminSection,
} from '@/features/admin/admin-ui';
import { formatUzs } from '@/lib/currency';
import { formatDate, isStale } from '@/lib/utils';
import { COUNTRIES } from '@/constants';

export default function AdminCouriersPage() {
  const couriers = useAdminSection<Courier[]>('couriers');
  const requests = useAdminSection<CourierChangeRequest[]>('change-requests');
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function decide(id: string, decision: 'approved' | 'rejected') {
    setBusyId(id);
    try {
      await adminAction({ action: 'courier-change.decide', id, decision });
      requests.reload();
      couriers.reload();
    } finally {
      setBusyId(null);
    }
  }

  const pending = (requests.data ?? []).filter((request) => request.status === 'pending');

  return (
    <>
      <AdminPageTitle
        title="Kuryerlar"
        subtitle="Kuryer kabinetidan kelgan o'zgarishlar admin tasdig'idan keyin e'lon qilinadi"
      />

      <Card className="mb-5 p-4">
        <h2 className="text-base font-semibold text-content">
          Tasdiq kutayotgan o&apos;zgarishlar ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="mt-2 text-sm text-content-secondary">
            Tasdiq kutayotgan o&apos;zgarishlar yo&apos;q.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pending.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-border p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-content">
                    {request.courierId} · {request.field}
                  </p>
                  <p className="text-content-secondary">
                    <span className="line-through">{request.previousValue || '—'}</span> →{' '}
                    <span className="font-semibold text-content">{request.newValue}</span>
                  </p>
                  <p className="text-xs text-content-secondary">
                    {request.submittedBy} · {formatDate(request.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === request.id}
                    onClick={() => void decide(request.id, 'approved')}
                  >
                    Tasdiqlash
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === request.id}
                    onClick={() => void decide(request.id, 'rejected')}
                  >
                    Rad etish
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <AdminSectionState status={couriers.status} onRetry={couriers.reload} />

      {couriers.status === 'ready' ? (
        <AdminTable<Courier>
          rows={couriers.data ?? []}
          getKey={(row) => row.id}
          emptyLabel="Kuryerlar yo'q"
          columns={[
            {
              header: 'Kuryer',
              render: (row) => (
                <div>
                  <p className="font-medium text-content">
                    {row.logoEmoji} {row.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {row.isVerified ? <Badge tone="success">Tasdiqlangan</Badge> : null}
                    {row.isSponsored ? <Badge tone="warning">Reklama</Badge> : null}
                    {row.isDemo ? <Badge tone="outline">Demo</Badge> : null}
                  </div>
                </div>
              ),
            },
            {
              header: "Yo'nalishlar",
              render: (row) =>
                row.routes
                  .map((route) => `${COUNTRIES[route.from]}→${COUNTRIES[route.to]}`)
                  .join(', '),
            },
            {
              header: 'Tariflar',
              render: (row) => (
                <ul className="space-y-1">
                  {row.tariffs.map((tariff) => (
                    <li key={tariff.id}>
                      {COUNTRIES[tariff.fromCountry]} · {tariff.serviceType} ·{' '}
                      {formatUzs(tariff.pricePerKgUzs)}/kg
                      {isStale(tariff.updatedAt) ? (
                        <Badge tone="warning" className="ml-1">
                          Eskirgan
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ),
            },
            { header: 'Reyting', render: (row) => `⭐ ${row.rating.toFixed(1)}` },
            { header: 'Yangilangan', render: (row) => formatDate(row.updatedAt) },
          ]}
        />
      ) : null}
    </>
  );
}
