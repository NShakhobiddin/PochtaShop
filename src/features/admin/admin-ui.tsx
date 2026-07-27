'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { ListSkeleton, ErrorState, EmptyState } from '@/components/ui/states';
import { useAsyncData, type AsyncStatus } from '@/hooks/use-async-data';
import { apiFetch } from '@/lib/api/client';

export function AdminPageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold text-content">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-content-secondary">{subtitle}</p> : null}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-content-secondary">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-content-secondary">{hint}</p> : null}
    </Card>
  );
}

/** Shared table shell so every admin section renders consistently. */
export function AdminTable<T>({
  columns,
  rows,
  getKey,
  emptyLabel,
}: {
  columns: Array<{ header: string; render: (row: T) => React.ReactNode; width?: string }>;
  rows: T[];
  getKey: (row: T) => string;
  emptyLabel: string;
}) {
  if (rows.length === 0) return <EmptyState title={emptyLabel} />;

  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className="p-3 text-left font-semibold text-content"
                style={column.width ? { width: column.width } : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getKey(row)} className="border-b border-border last:border-0">
              {columns.map((column) => (
                <td key={column.header} className="p-3 align-top text-content-secondary">
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function useAdminSection<T>(section: string) {
  const fetcher = React.useCallback(
    () => apiFetch<T>(`/api/admin?section=${encodeURIComponent(section)}`),
    [section],
  );
  return useAsyncData<T>(fetcher);
}

export function AdminSectionState({
  status,
  onRetry,
}: {
  status: AsyncStatus;
  onRetry: () => void;
}) {
  if (status === 'loading') return <ListSkeleton count={3} />;
  if (status === 'error' || status === 'offline') {
    return (
      <ErrorState
        title="Ma'lumot yuklanmadi"
        description="Qayta urinib ko'ring."
        onAction={onRetry}
      />
    );
  }
  return null;
}

export async function adminAction(body: Record<string, unknown>): Promise<void> {
  await apiFetch('/api/admin', { json: body });
}
