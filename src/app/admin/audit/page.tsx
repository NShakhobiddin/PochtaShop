'use client';

import type { AuditLogEntry } from '@/types';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';
import { formatDate } from '@/lib/utils';

export default function AdminAuditPage() {
  const { data, status, reload } = useAdminSection<AuditLogEntry[]>('audit');

  return (
    <>
      <AdminPageTitle
        title="Audit log"
        subtitle="Har bir o'zgarish: kim, qachon, qaysi qiymatdan qaysi qiymatga"
      />

      <AdminSectionState status={status} onRetry={reload} />

      {status === 'ready' ? (
        <AdminTable<AuditLogEntry>
          rows={data ?? []}
          getKey={(row) => row.id}
          emptyLabel="Audit yozuvlari yo'q"
          columns={[
            { header: 'Sana', render: (row) => formatDate(row.createdAt) },
            { header: 'Kim', render: (row) => row.actor },
            { header: 'Amal', render: (row) => row.action },
            { header: 'Obyekt', render: (row) => `${row.entity} / ${row.entityId}` },
            {
              header: "O'zgarish",
              render: (row) => (
                <span>
                  <span className="line-through">{row.previousValue ?? '—'}</span>{' '}
                  <span className="font-semibold text-content">{row.newValue ?? '—'}</span>
                </span>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}
