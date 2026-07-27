'use client';

import * as React from 'react';
import { Calculator, Search, ShieldAlert, Sparkles, Headset } from 'lucide-react';
import type { HistoryEntry, HistoryKind } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListSkeleton, OfflineState } from '@/components/ui/states';
import { apiFetch } from '@/lib/api/client';
import { useAsyncData } from '@/hooks/use-async-data';
import { formatDate } from '@/lib/utils';
import { haptic } from '@/lib/telegram/webapp';

const KIND_CONFIG: Record<HistoryKind, { label: string; icon: React.ElementType }> = {
  search: { label: 'Qidiruv', icon: Search },
  ai_analysis: { label: 'AI tahlili', icon: Sparkles },
  customs_risk: { label: 'Bojxona xavfi', icon: ShieldAlert },
  customs_calculation: { label: 'Kalkulyator', icon: Calculator },
  consultation: { label: 'Konsultatsiya', icon: Headset },
};

const fetchHistory = () => apiFetch<HistoryEntry[]>('/api/history');

export function HistoryScreen() {
  const { data, status, reload, setData } = useAsyncData<HistoryEntry[]>(fetchHistory);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const entries = data ?? [];

  async function clearAll() {
    haptic('warning');
    try {
      await apiFetch('/api/history', { method: 'DELETE' });
      setData([]);
      setConfirmClear(false);
    } catch {
      reload();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Tarix" />

      {status === 'loading' ? <ListSkeleton count={4} /> : null}
      {status === 'offline' ? <OfflineState onRetry={reload} /> : null}
      {status === 'error' ? (
        <ErrorState
          title="Tarixni yuklab bo'lmadi"
          description="Qayta urinib ko'ring."
          onAction={reload}
        />
      ) : null}

      {status === 'ready' ? (
        entries.length === 0 ? (
          <EmptyState
            title="Tarix bo'sh"
            description="Qidiruv, AI tahlili va hisob-kitoblaringiz shu yerda saqlanadi."
          />
        ) : (
          <>
            <div className="space-y-2">
              {entries.map((entry) => {
                const config = KIND_CONFIG[entry.kind];
                const Icon = config.icon;
                return (
                  <Card key={entry.id} className="flex items-center gap-3 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary-light text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
                        {config.label}
                      </p>
                      <p className="truncate text-[15px] font-medium text-content">{entry.title}</p>
                      {entry.subtitle ? (
                        <p className="truncate text-[13px] text-content-secondary">
                          {entry.subtitle}
                        </p>
                      ) : null}
                    </div>
                    <span className="shrink-0 text-[11px] text-content-secondary">
                      {formatDate(entry.createdAt)}
                    </span>
                  </Card>
                );
              })}
            </div>

            {confirmClear ? (
              <Card className="p-4">
                <p className="text-sm font-semibold text-content">Tarixni butunlay o&apos;chirasizmi?</p>
                <p className="mt-1 text-[13px] text-content-secondary">
                  Bu amalni bekor qilib bo&apos;lmaydi.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button variant="danger" block onClick={() => void clearAll()}>
                    Ha, o&apos;chirish
                  </Button>
                  <Button variant="outline" onClick={() => setConfirmClear(false)}>
                    Bekor qilish
                  </Button>
                </div>
              </Card>
            ) : (
              <Button variant="outline" block onClick={() => setConfirmClear(true)}>
                Tarixni o&apos;chirish
              </Button>
            )}
          </>
        )
      ) : null}
    </div>
  );
}
