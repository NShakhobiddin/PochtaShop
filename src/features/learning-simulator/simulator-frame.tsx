import * as React from 'react';
import { Search, ShoppingCart, Star, User } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Neutral training interface.
 *
 * Deliberately generic: it teaches the *shape* of a marketplace checkout flow
 * without reproducing any real platform's branding or layout.
 */
export function SimulatorFrame({
  platformName,
  stepTitle,
}: {
  platformName: string;
  stepTitle: string;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 bg-surface-muted px-4 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
          O&apos;quv simulyatori{platformName ? ` · ${platformName} uslubi` : ''}
        </span>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-content-secondary">
          DEMO
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 rounded-sm border border-border px-3 py-2">
          <Search className="h-4 w-4 text-content-secondary" aria-hidden="true" />
          <span className="text-[13px] text-content-secondary">Qidiruv maydoni</span>
        </div>

        <div className="flex gap-3">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-sm bg-surface-muted text-3xl"
            aria-hidden="true"
          >
            📦
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-4/5 rounded-full bg-surface-muted" />
            <div className="h-3 w-3/5 rounded-full bg-surface-muted" />
            <p className="flex items-center gap-1 text-[13px] text-content-secondary">
              <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
              4.6 · 1 200+ sotuv
            </p>
            <p className="flex items-center gap-1 text-[13px] text-content-secondary">
              <User className="h-3.5 w-3.5" aria-hidden="true" />
              Sotuvchi profili
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {['Variant 1', 'Variant 2', 'Variant 3'].map((variant) => (
            <span
              key={variant}
              className="rounded-full border border-border px-3 py-1 text-[11px] text-content-secondary"
            >
              {variant}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 rounded-sm bg-primary-light px-3 py-2.5">
          <span className="text-[13px] font-semibold text-primary">{stepTitle}</span>
          <ShoppingCart className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}
