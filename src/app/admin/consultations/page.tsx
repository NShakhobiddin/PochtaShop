'use client';

import * as React from 'react';
import type { Consultation, ConsultationStatus } from '@/types';
import { Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  adminAction,
  useAdminSection,
} from '@/features/admin/admin-ui';
import {
  CONSULTATION_STATUS_LABEL,
  CONSULTATION_STATUS_TONE,
  CONSULTATION_TYPES,
} from '@/features/consultation/types';
import { formatUzs } from '@/lib/currency';
import { formatDate } from '@/lib/utils';

const STATUSES = Object.keys(CONSULTATION_STATUS_LABEL) as ConsultationStatus[];

export default function AdminConsultationsPage() {
  const { data, status, reload } = useAdminSection<Consultation[]>('consultations');
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function changeStatus(id: string, next: ConsultationStatus) {
    setBusyId(id);
    try {
      await adminAction({ action: 'consultation.status', id, status: next });
      reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AdminPageTitle
        title="Konsultatsiyalar"
        subtitle="Foydalanuvchilardan kelgan so'rovlar va ularning holati"
      />

      <AdminSectionState status={status} onRetry={reload} />

      {status === 'ready' ? (
        <AdminTable<Consultation>
          rows={data ?? []}
          getKey={(row) => row.id}
          emptyLabel="Hozircha konsultatsiya so'rovlari yo'q"
          columns={[
            {
              header: 'Xizmat',
              render: (row) =>
                CONSULTATION_TYPES.find((item) => item.value === row.type)?.label ?? row.type,
            },
            {
              header: 'Tavsif',
              render: (row) => <span className="line-clamp-3">{row.description}</span>,
            },
            {
              header: 'Aloqa',
              render: (row) => `${row.contactMethod}: ${row.contactValue}`,
            },
            { header: 'Narx', render: (row) => formatUzs(row.priceUzs) },
            { header: 'Sana', render: (row) => formatDate(row.createdAt) },
            {
              header: 'Holat',
              width: '200px',
              render: (row) => (
                <div className="space-y-2">
                  <Badge tone={CONSULTATION_STATUS_TONE[row.status]}>
                    {CONSULTATION_STATUS_LABEL[row.status]}
                  </Badge>
                  <Select
                    aria-label={`${row.id} holatini o'zgartirish`}
                    value={row.status}
                    disabled={busyId === row.id}
                    onChange={(event) =>
                      void changeStatus(row.id, event.target.value as ConsultationStatus)
                    }
                    className="h-10 text-sm"
                  >
                    {STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {CONSULTATION_STATUS_LABEL[value]}
                      </option>
                    ))}
                  </Select>
                </div>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}
