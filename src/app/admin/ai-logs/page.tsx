'use client';

import type { AiLogEntry } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';
import { formatDate } from '@/lib/utils';

export default function AdminAiLogsPage() {
  const { data, status, reload } = useAdminSection<AiLogEntry[]>('ai-logs');
  const errors = (data ?? []).filter((row) => row.error);

  return (
    <>
      <AdminPageTitle
        title="AI loglari"
        subtitle="So'rov mazmuni saqlanmaydi — faqat qisqa, shaxssiz tavsif yoziladi"
      />

      <Card className="mb-5 p-4">
        <p className="text-sm text-content-secondary">Xatolar soni</p>
        <p className="text-2xl font-extrabold text-danger">{errors.length}</p>
      </Card>

      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<AiLogEntry>
          rows={data ?? []}
          getKey={(row) => row.id}
          emptyLabel="AI so'rovlari hali yozilmagan"
          columns={[
            { header: 'Sana', render: (row) => formatDate(row.createdAt) },
            { header: 'Funksiya', render: (row) => row.feature },
            { header: 'Provayder', render: (row) => row.provider },
            { header: 'Kirish', render: (row) => row.inputSummary },
            {
              header: 'Ishonchlilik',
              render: (row) =>
                row.confidence ? <Badge tone="neutral">{row.confidence}</Badge> : '—',
            },
            {
              header: 'Xato',
              render: (row) => (row.error ? <Badge tone="danger">{row.error}</Badge> : '—'),
            },
          ]}
        />
      ) : null}
    </>
  );
}
