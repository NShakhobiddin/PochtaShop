'use client';

import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import type { CommercialIntentResult, CommercialRiskLevel } from '@/types';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { Switch, SectionHeader } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { evaluateCommercialIntent } from './risk';
import { toUsd } from '@/lib/currency';
import type { CurrencyCode, ProductCategoryId } from '@/constants';

const LEVEL_CONFIG: Record<CommercialRiskLevel, { label: string; tone: 'success' | 'warning' | 'danger' }> = {
  low: { label: 'Past ehtimol', tone: 'success' },
  medium: { label: "O'rta ehtimol", tone: 'warning' },
  high: { label: 'Yuqori ehtimol', tone: 'danger' },
};

/**
 * Warns when a shipment starts to look like a commercial consignment.
 * Scored locally so the user sees each factor that contributed.
 */
export function CommercialIntentCard({
  category,
  declaredValue,
  currency,
}: {
  category: ProductCategoryId;
  declaredValue: number;
  currency: CurrencyCode;
}) {
  const [identicalItemCount, setIdenticalItemCount] = React.useState(1);
  const [totalQuantity, setTotalQuantity] = React.useState(1);
  const [recentSimilarOrders, setRecentSimilarOrders] = React.useState(0);
  const [distinctVariants, setDistinctVariants] = React.useState(1);
  const [bulkPackaging, setBulkPackaging] = React.useState(false);

  const result: CommercialIntentResult = React.useMemo(
    () =>
      evaluateCommercialIntent({
        identicalItemCount: Math.max(0, identicalItemCount),
        totalQuantity: Math.max(1, totalQuantity),
        recentSimilarOrders: Math.max(0, recentSimilarOrders),
        category,
        declaredValueUsd: toUsd(Math.max(0, declaredValue), currency) * Math.max(1, totalQuantity),
        distinctVariants: Math.max(0, distinctVariants),
        bulkPackaging,
      }),
    [
      identicalItemCount,
      totalQuantity,
      recentSimilarOrders,
      distinctVariants,
      bulkPackaging,
      category,
      declaredValue,
      currency,
    ],
  );

  const config = LEVEL_CONFIG[result.level];

  return (
    <Card className="p-4">
      <SectionHeader title="Tijorat maqsadi xavfi" className="mb-1" />
      <p className="mb-3 text-[13px] text-content-secondary">
        Bir xil tovarni ko&apos;p miqdorda buyurtma qilish jo&apos;natmani tijorat partiyasiga
        o&apos;xshatib qo&apos;yishi mumkin.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Bir xil mahsulot soni" htmlFor="ci-identical">
          <Input
            id="ci-identical"
            type="number"
            inputMode="numeric"
            min={0}
            value={identicalItemCount}
            onChange={(event) => setIdenticalItemCount(Number(event.target.value))}
          />
        </Field>
        <Field label="Umumiy miqdor" htmlFor="ci-total">
          <Input
            id="ci-total"
            type="number"
            inputMode="numeric"
            min={1}
            value={totalQuantity}
            onChange={(event) => setTotalQuantity(Number(event.target.value))}
          />
        </Field>
        <Field label="Takroriy buyurtmalar" htmlFor="ci-recent">
          <Input
            id="ci-recent"
            type="number"
            inputMode="numeric"
            min={0}
            value={recentSimilarOrders}
            onChange={(event) => setRecentSimilarOrders(Number(event.target.value))}
          />
        </Field>
        <Field label="O'lcham/rang turlari" htmlFor="ci-variants">
          <Input
            id="ci-variants"
            type="number"
            inputMode="numeric"
            min={0}
            value={distinctVariants}
            onChange={(event) => setDistinctVariants(Number(event.target.value))}
          />
        </Field>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-content">Ulgurji qadoqlash</span>
        <Switch checked={bulkPackaging} onCheckedChange={setBulkPackaging} label="Ulgurji qadoqlash" />
      </div>

      <div className="mt-4 rounded-sm bg-surface-muted p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-content">Natija</p>
          <Badge tone={config.tone}>{config.label}</Badge>
        </div>
        <ul className="space-y-1.5">
          {result.factors.map((factor) => (
            <li key={factor.label} className="flex items-start gap-2 text-[13px] leading-snug">
              {factor.triggered ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              ) : (
                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-content-secondary" aria-hidden="true" />
              )}
              <span className={factor.triggered ? 'text-content' : 'text-content-secondary'}>
                {factor.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-2 text-xs leading-snug text-content-secondary">{result.note}</p>
    </Card>
  );
}
