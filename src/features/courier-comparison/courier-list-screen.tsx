'use client';

import * as React from 'react';
import { ArrowUpDown, Scale } from 'lucide-react';
import type { Courier } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { CourierCard } from '@/components/courier/courier-card';
import { Chip } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/states';
import { CourierComparison } from './courier-comparison';
import { CustomsCalculatorCard } from '@/features/customs-calculator/customs-calculator-card';
import { COUNTRIES, type CountryCode } from '@/constants';
import { reliabilityScore } from './quote';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/telegram/webapp';

type SortKey = 'cheapest' | 'fastest' | 'reliable';

const SORTS: Array<{ value: SortKey; label: string }> = [
  { value: 'cheapest', label: 'Eng arzon' },
  { value: 'fastest', label: 'Eng tez' },
  { value: 'reliable', label: 'Eng ishonchli' },
];

const CARGO_FILTERS = [
  { key: 'acceptsElectronics', label: 'Elektronika uchun' },
  { key: 'acceptsFragile', label: 'Sinuvchan uchun' },
  { key: 'acceptsOversized', label: 'Katta hajm uchun' },
] as const;

type CargoFilterKey = (typeof CARGO_FILTERS)[number]['key'];

function minPrice(courier: Courier, country?: CountryCode): number {
  const tariffs = country
    ? courier.tariffs.filter((tariff) => tariff.fromCountry === country)
    : courier.tariffs;
  if (tariffs.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...tariffs.map((tariff) => tariff.pricePerKgUzs));
}

function minDays(courier: Courier, country?: CountryCode): number {
  const tariffs = country
    ? courier.tariffs.filter((tariff) => tariff.fromCountry === country)
    : courier.tariffs;
  if (tariffs.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...tariffs.map((tariff) => tariff.deliveryDays[1]));
}

export function CourierListScreen({ couriers }: { couriers: Courier[] }) {
  const [country, setCountry] = React.useState<CountryCode | undefined>();
  const [sort, setSort] = React.useState<SortKey>('cheapest');
  const [cargo, setCargo] = React.useState<CargoFilterKey[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = React.useState(false);

  const visible = React.useMemo(() => {
    const filtered = couriers.filter((courier) => {
      if (country && !courier.routes.some((route) => route.from === country)) return false;
      return cargo.every((key) => courier[key]);
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'cheapest') return minPrice(a, country) - minPrice(b, country);
      if (sort === 'fastest') return minDays(a, country) - minDays(b, country);
      return reliabilityScore(b) - reliabilityScore(a);
    });
  }, [couriers, country, cargo, sort]);

  const highlightId = visible[0]?.id;

  function toggleSelected(id: string) {
    haptic('selection');
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  const selectedCouriers = couriers.filter((courier) => selected.includes(courier.id));

  return (
    <div className="flex flex-col gap-4 pb-20">
      <PageHeader
        title="Kuryerlar"
        action={
          <span
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-content-secondary"
          >
            <ArrowUpDown className="h-5 w-5" />
          </span>
        }
      />

      <div className="scroll-x flex gap-2">
        <Chip selected={!country} onClick={() => setCountry(undefined)}>
          Barcha davlatlar
        </Chip>
        {(['CN', 'US', 'TR'] as CountryCode[]).map((code) => (
          <Chip key={code} selected={country === code} onClick={() => setCountry(code)}>
            {COUNTRIES[code]}
          </Chip>
        ))}
      </div>

      <div className="scroll-x flex gap-2">
        {SORTS.map((option) => (
          <Chip
            key={option.value}
            selected={sort === option.value}
            onClick={() => setSort(option.value)}
          >
            {option.label}
          </Chip>
        ))}
      </div>

      <div className="scroll-x flex gap-2">
        {CARGO_FILTERS.map((filter) => (
          <Chip
            key={filter.key}
            selected={cargo.includes(filter.key)}
            onClick={() =>
              setCargo((current) =>
                current.includes(filter.key)
                  ? current.filter((item) => item !== filter.key)
                  : [...current, filter.key],
              )
            }
          >
            {filter.label}
          </Chip>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Kuryer topilmadi"
          description="Filtrlarni kamaytiring yoki boshqa davlatni tanlang."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((courier) => (
            <div key={courier.id} className="space-y-2">
              <CourierCard
                courier={courier}
                country={country}
                highlight={courier.id === highlightId ? sort : undefined}
              />
              <button
                type="button"
                onClick={() => toggleSelected(courier.id)}
                aria-pressed={selected.includes(courier.id)}
                className={
                  selected.includes(courier.id)
                    ? 'h-11 w-full rounded-sm border border-primary bg-primary-light text-sm font-semibold text-primary'
                    : 'h-11 w-full rounded-sm border border-border bg-surface text-sm font-semibold text-content-secondary'
                }
              >
                {selected.includes(courier.id) ? 'Taqqoslashda' : 'Taqqoslashga qo‘shish'}
              </button>
            </div>
          ))}
        </div>
      )}

      <CustomsCalculatorCard />

      {selected.length >= 2 ? (
        <div className="fixed inset-x-0 bottom-[84px] z-30 mx-auto max-w-lg px-4">
          <Button
            block
            size="lg"
            onClick={() => {
              track('courier_compared', { count: selected.length });
              setComparisonOpen(true);
            }}
          >
            <Scale className="h-5 w-5" aria-hidden="true" />
            Kuryerni tanlash ({selected.length})
          </Button>
        </div>
      ) : null}

      <CourierComparison
        open={comparisonOpen}
        couriers={selectedCouriers}
        country={country}
        onClose={() => setComparisonOpen(false)}
      />
    </div>
  );
}
