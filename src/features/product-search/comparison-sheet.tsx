'use client';

import * as React from 'react';
import type { AIRecommendationOption } from '@/types';
import { Sheet } from '@/components/ui/sheet';
import { RiskBadge } from '@/components/customs/risk-badge';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import { COUNTRIES } from '@/constants';

const TYPE_LABEL: Record<AIRecommendationOption['type'], string> = {
  cheapest: 'Eng arzon',
  fastest: 'Eng tez',
  safest: 'Eng ishonchli',
};

/** Side-by-side comparison of up to three recommendations. */
export function ComparisonSheet({
  open,
  options,
  onClose,
}: {
  open: boolean;
  options: AIRecommendationOption[];
  onClose: () => void;
}) {
  const rows: Array<{ label: string; render: (option: AIRecommendationOption) => React.ReactNode }> = [
    { label: "Do'kon", render: (option) => `${option.store.logoEmoji} ${option.store.name}` },
    { label: 'Davlat', render: (option) => COUNTRIES[option.store.country] },
    { label: 'Sotuvchi', render: (option) => option.seller.name },
    { label: 'Reyting', render: (option) => `⭐ ${option.seller.rating.toFixed(1)}` },
    { label: 'Kuryer', render: (option) => option.courier.name },
    { label: 'Muddat', render: (option) => formatDeliveryDays(option.courier.deliveryDays) },
    { label: 'Mahsulot', render: (option) => formatUzs(option.estimatedCost.productUzs) },
    { label: 'Yetkazish', render: (option) => formatUzs(option.estimatedCost.shippingUzs) },
    { label: 'Bojxona', render: (option) => formatUzs(option.estimatedCost.customsUzs) },
    { label: 'Bojxona xavfi', render: (option) => <RiskBadge level={option.customsRisk.level} /> },
    {
      label: 'Jami',
      render: (option) => (
        <span className="font-bold text-primary">{formatUzs(option.estimatedCost.totalUzs)}</span>
      ),
    },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Taqqoslash">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[13px]">
          <caption className="sr-only">Tanlangan variantlarni taqqoslash</caption>
          <thead>
            <tr>
              <th scope="col" className="w-24 pb-2 text-left font-medium text-content-secondary">
                Mezon
              </th>
              {options.map((option) => (
                <th key={option.type} scope="col" className="pb-2 text-left font-bold text-content">
                  {TYPE_LABEL[option.type]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <th scope="row" className="py-2 pr-2 text-left font-medium text-content-secondary">
                  {row.label}
                </th>
                {options.map((option) => (
                  <td key={option.type} className="py-2 pr-2 align-top text-content">
                    {row.render(option)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-content-secondary">
        Hisob-kitob taxminiy. Yakuniy tanlov sizniki.
      </p>
    </Sheet>
  );
}
