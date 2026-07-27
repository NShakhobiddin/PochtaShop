'use client';

import * as React from 'react';
import type { Review } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  adminAction,
  useAdminSection,
} from '@/features/admin/admin-ui';
import { formatDate } from '@/lib/utils';

const STATUS_LABEL: Record<Review['status'], string> = {
  pending: 'Moderatsiyada',
  published: "E'lon qilingan",
  rejected: 'Rad etilgan',
};

const STATUS_TONE: Record<Review['status'], 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  published: 'success',
  rejected: 'danger',
};

export default function AdminReviewsPage() {
  const { data, status, reload } = useAdminSection<Review[]>('reviews');
  const [replies, setReplies] = React.useState<Record<string, string>>({});
  const [busyId, setBusyId] = React.useState<string | null>(null);

  async function moderate(id: string, next: Review['status']) {
    setBusyId(id);
    try {
      await adminAction({ action: 'review.moderate', id, status: next });
      reload();
    } finally {
      setBusyId(null);
    }
  }

  async function reply(id: string) {
    const text = replies[id]?.trim();
    if (!text) return;
    setBusyId(id);
    try {
      await adminAction({ action: 'review.reply', id, reply: text });
      setReplies((current) => ({ ...current, [id]: '' }));
      reload();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <AdminPageTitle
        title="Sharhlar"
        subtitle="Sharhlar moderatsiyadan so'ng e'lon qilinadi. Salbiy tasdiqlangan sharhni reklamachi o'chira olmaydi."
      />

      <AdminSectionState status={status} onRetry={reload} />

      {status === 'ready' ? (
        <AdminTable<Review>
          rows={data ?? []}
          getKey={(row) => row.id}
          emptyLabel="Sharhlar yo'q"
          columns={[
            { header: 'Obyekt', render: (row) => `${row.subject}: ${row.subjectId}` },
            { header: 'Muallif', render: (row) => row.authorName },
            { header: 'Baho', render: (row) => `${row.rating} / 5` },
            {
              header: 'Matn',
              render: (row) => (
                <div>
                  <p className="line-clamp-3">{row.body}</p>
                  {row.verifiedPurchase ? (
                    <Badge tone="success" className="mt-1">
                      Tasdiqlangan xarid
                    </Badge>
                  ) : null}
                  {row.officialReply ? (
                    <p className="mt-2 rounded-sm bg-surface-muted p-2 text-xs">
                      Rasmiy javob: {row.officialReply}
                    </p>
                  ) : null}
                </div>
              ),
            },
            { header: 'Sana', render: (row) => formatDate(row.createdAt) },
            {
              header: 'Amallar',
              width: '260px',
              render: (row) => (
                <div className="space-y-2">
                  <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busyId === row.id || row.status === 'published'}
                      onClick={() => void moderate(row.id, 'published')}
                    >
                      E&apos;lon qilish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === row.id || row.status === 'rejected'}
                      onClick={() => void moderate(row.id, 'rejected')}
                    >
                      Rad etish
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      aria-label={`${row.id} uchun rasmiy javob`}
                      value={replies[row.id] ?? ''}
                      onChange={(event) =>
                        setReplies((current) => ({ ...current, [row.id]: event.target.value }))
                      }
                      placeholder="Rasmiy javob"
                      className="h-10 text-sm"
                      maxLength={1000}
                    />
                    <Button
                      size="sm"
                      disabled={busyId === row.id || !replies[row.id]?.trim()}
                      onClick={() => void reply(row.id)}
                    >
                      Javob
                    </Button>
                  </div>
                </div>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}
