'use client';

import * as React from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import type { SavedItem, SavedItemKind } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/misc';
import { EmptyState, ErrorState, ListSkeleton, OfflineState } from '@/components/ui/states';
import { apiFetch } from '@/lib/api/client';
import { useAsyncData } from '@/hooks/use-async-data';
import { formatDate } from '@/lib/utils';
import { haptic } from '@/lib/telegram/webapp';

const KIND_LABEL: Record<SavedItemKind, string> = {
  product: 'Mahsulot',
  store: "Do'kon",
  courier: 'Kuryer',
  analysis: 'AI tahlili',
  comparison: 'Taqqoslash',
  lesson: 'Dars',
};

const KIND_HREF: Record<SavedItemKind, (refId: string) => string> = {
  product: (id) => `/product/${id}`,
  store: (id) => `/stores/${id}`,
  courier: (id) => `/couriers/${id}`,
  analysis: () => '/profile/history',
  comparison: () => '/profile/history',
  lesson: (id) => `/learn/${id}`,
};

const fetchSaved = () => apiFetch<SavedItem[]>('/api/saved');

export function SavedScreen() {
  const { data, status, reload, setData } = useAsyncData<SavedItem[]>(fetchSaved);
  const [filter, setFilter] = React.useState<SavedItemKind | 'all'>('all');
  const items = data ?? [];

  async function remove(id: string) {
    haptic('light');
    setData(items.filter((item) => item.id !== id));
    try {
      await apiFetch(`/api/saved?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch {
      reload();
    }
  }

  const kinds = Array.from(new Set(items.map((item) => item.kind)));
  const visible = filter === 'all' ? items : items.filter((item) => item.kind === filter);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Saqlanganlar" showBack={false} />

      {status === 'loading' ? <ListSkeleton count={3} /> : null}
      {status === 'offline' ? <OfflineState onRetry={reload} /> : null}
      {status === 'error' ? (
        <ErrorState
          title="Saqlanganlarni yuklab bo'lmadi"
          description="Qayta urinib ko'ring."
          onAction={reload}
        />
      ) : null}

      {status === 'ready' ? (
        <>
          {items.length === 0 ? (
            <EmptyState
              title="Hozircha saqlangan mahsulotlar yo'q"
              description="Mahsulot, do'kon yoki kuryer sahifasida saqlash tugmasini bosing."
            />
          ) : (
            <>
              <div className="scroll-x flex gap-2">
                <Chip selected={filter === 'all'} onClick={() => setFilter('all')}>
                  Barchasi
                </Chip>
                {kinds.map((kind) => (
                  <Chip key={kind} selected={filter === kind} onClick={() => setFilter(kind)}>
                    {KIND_LABEL[kind]}
                  </Chip>
                ))}
              </div>

              <div className="space-y-3">
                {visible.map((item) => (
                  <Card key={item.id} className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {KIND_LABEL[item.kind]}
                      </p>
                      <Link
                        href={KIND_HREF[item.kind](item.refId)}
                        className="block truncate text-[15px] font-semibold text-content"
                      >
                        {item.title}
                      </Link>
                      {item.subtitle ? (
                        <p className="truncate text-[13px] text-content-secondary">
                          {item.subtitle}
                        </p>
                      ) : null}
                      <p className="mt-0.5 text-[11px] text-content-secondary">
                        {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void remove(item.id)}
                      aria-label={`${item.title} ni o'chirish`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-border text-content-secondary"
                    >
                      <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
