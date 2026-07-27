'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import type { Courier } from '@/types';
import { Sheet } from '@/components/ui/sheet';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import type { CountryCode } from '@/constants';

function bestTariff(courier: Courier, country?: CountryCode) {
  const tariffs = country
    ? courier.tariffs.filter((tariff) => tariff.fromCountry === country)
    : courier.tariffs;
  return [...tariffs].sort((a, b) => a.pricePerKgUzs - b.pricePerKgUzs)[0];
}

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-success">
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
      Bor
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-content-secondary">
      <X className="h-3.5 w-3.5" aria-hidden="true" />
      Yo&apos;q
    </span>
  );
}

/** Side-by-side comparison across the criteria users actually decide on. */
export function CourierComparison({
  open,
  couriers,
  country,
  onClose,
}: {
  open: boolean;
  couriers: Courier[];
  country?: CountryCode;
  onClose: () => void;
}) {
  const rows: Array<{ label: string; render: (courier: Courier) => React.ReactNode }> = [
    {
      label: 'Narx (1 kg)',
      render: (courier) => {
        const tariff = bestTariff(courier, country);
        return tariff ? formatUzs(tariff.pricePerKgUzs) : '—';
      },
    },
    {
      label: 'Minimal tarif',
      render: (courier) => {
        const tariff = bestTariff(courier, country);
        return tariff ? formatUzs(tariff.minChargeUzs) : '—';
      },
    },
    {
      label: 'Muddat',
      render: (courier) => {
        const tariff = bestTariff(courier, country);
        return tariff ? formatDeliveryDays(tariff.deliveryDays) : '—';
      },
    },
    {
      label: "Hajmiy og'irlik",
      render: (courier) => {
        const tariff = bestTariff(courier, country);
        return tariff ? `L×W×H / ${tariff.volumetricDivisor}` : '—';
      },
    },
    { label: "Sug'urta", render: (courier) => <YesNo value={courier.insuranceAvailable} /> },
    { label: 'Kuzatuv', render: (courier) => <YesNo value={courier.trackingAvailable} /> },
    { label: 'Reyting', render: (courier) => `⭐ ${courier.rating.toFixed(1)}` },
    {
      label: 'Mijozlarga xizmat',
      render: (courier) => `${courier.reviewCount.toLocaleString('uz-UZ')} sharh`,
    },
    { label: 'Bojxona yordami', render: (courier) => <YesNo value={courier.customsSupport} /> },
  ];

  return (
    <Sheet open={open} onClose={onClose} title="Kuryerlarni taqqoslash">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[13px]">
          <caption className="sr-only">Tanlangan kuryerlarni taqqoslash</caption>
          <thead>
            <tr>
              <th scope="col" className="w-28 pb-2 text-left font-medium text-content-secondary">
                Mezon
              </th>
              {couriers.map((courier) => (
                <th key={courier.id} scope="col" className="pb-2 text-left font-bold text-content">
                  {courier.logoEmoji} {courier.name}
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
                {couriers.map((courier) => (
                  <td key={courier.id} className="py-2 pr-2 align-top text-content">
                    {row.render(courier)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-content-secondary">
        Tariflar demo ma&apos;lumot. Buyurtmadan oldin kuryerning amaldagi narxini tekshiring.
      </p>
    </Sheet>
  );
}
