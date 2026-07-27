'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Star, TriangleAlert, Check } from 'lucide-react';
import type { AIRecommendationOption, RecommendationType } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RiskBadge } from '@/components/customs/risk-badge';
import { PlacementLabelBadge } from '@/components/ads/placement-label';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import { COUNTRIES } from '@/constants';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<RecommendationType, { label: string; tone: 'success' | 'primary' }> = {
  cheapest: { label: 'Eng arzon', tone: 'success' },
  fastest: { label: 'Eng tez', tone: 'primary' },
  safest: { label: 'Eng ishonchli', tone: 'primary' },
};

export interface RecommendationCardProps {
  option: AIRecommendationOption;
  selected?: boolean;
  onToggleSelect?: (option: AIRecommendationOption) => void;
  compact?: boolean;
}

export function RecommendationCard({
  option,
  selected,
  onToggleSelect,
  compact,
}: RecommendationCardProps) {
  const config = TYPE_CONFIG[option.type];

  return (
    <Card className={cn('overflow-hidden', selected && 'ring-2 ring-primary')}>
      <div className="flex items-start gap-3 p-4">
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-sm bg-surface-muted text-3xl"
          aria-hidden="true"
        >
          {option.product.imageEmoji}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={config.tone}>{config.label}</Badge>
            {option.sponsored ? <PlacementLabelBadge label="ad" /> : null}
            {option.seller.officialStore ? <Badge tone="outline">Rasmiy do&apos;kon</Badge> : null}
          </div>

          <p className="truncate text-[15px] font-bold text-content">{option.product.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-content-secondary">
            <span aria-hidden="true">{option.store.logoEmoji}</span>
            {option.store.name} · {COUNTRIES[option.store.country]}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-content-secondary">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
            {option.seller.rating.toFixed(1)} ({option.seller.salesCount.toLocaleString('uz-UZ')}{' '}
            sotuv) · {option.seller.name}
          </p>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px]">
          <div className="flex justify-between gap-2">
            <dt className="text-content-secondary">Mahsulot</dt>
            <dd className="font-medium text-content">{formatUzs(option.estimatedCost.productUzs)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-content-secondary">Yetkazish</dt>
            <dd className="font-medium text-content">
              {formatUzs(option.estimatedCost.shippingUzs)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-content-secondary">Bojxona</dt>
            <dd className="font-medium text-content">{formatUzs(option.estimatedCost.customsUzs)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-content-secondary">Muddat</dt>
            <dd className="font-medium text-content">
              {formatDeliveryDays(option.courier.deliveryDays)}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-content-secondary">Jami taxminiy</p>
            <p className="text-xl font-extrabold text-primary">
              {formatUzs(option.estimatedCost.totalUzs)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <RiskBadge level={option.customsRisk.level} />
            <span className="text-[12px] text-content-secondary">
              {option.courier.logoEmoji} {option.courier.name}
            </span>
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="space-y-2 border-t border-border px-4 py-3">
          {option.reasons.slice(0, 3).map((reason) => (
            <p key={reason} className="flex gap-2 text-[13px] leading-snug text-content-secondary">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
              {reason}
            </p>
          ))}
          {option.warnings.slice(0, 3).map((warning) => (
            <p key={warning} className="flex gap-2 text-[13px] leading-snug text-warning">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {warning}
            </p>
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-t border-border p-3">
        {onToggleSelect ? (
          <button
            type="button"
            onClick={() => onToggleSelect(option)}
            aria-pressed={selected}
            className={cn(
              'h-11 flex-1 rounded-sm border text-sm font-semibold transition-colors',
              selected
                ? 'border-primary bg-primary-light text-primary'
                : 'border-border bg-surface text-content-secondary',
            )}
          >
            {selected ? 'Taqqoslashda' : 'Taqqoslashga qo‘shish'}
          </button>
        ) : null}
        <Link
          href={`/product/${option.product.id}`}
          className="flex h-11 flex-1 items-center justify-center gap-1 rounded-sm bg-primary-light text-sm font-semibold text-primary"
        >
          Batafsil
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
