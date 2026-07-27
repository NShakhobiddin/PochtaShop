'use client';

import * as React from 'react';
import type { CustomsCalculationResult } from '@/types';
import { Card } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/input';
import { KeyValueRow, SectionHeader } from '@/components/ui/misc';
import { Icon3D } from '@/components/ui/icon-3d';
import { RiskBadge } from '@/components/customs/risk-badge';
import { calculateCustoms } from './calculate';
import { formatUzs } from '@/lib/currency';
import { CURRENCY, COUNTRIES, type CurrencyCode, type CountryCode } from '@/constants';
import { track } from '@/lib/analytics';

/**
 * Compact customs estimate used next to the courier list. The full form with
 * category, quantity and purpose lives at /calculator.
 */
export function CustomsCalculatorCard() {
  const [value, setValue] = React.useState(1_000_000);
  const [currency, setCurrency] = React.useState<CurrencyCode>('UZS');
  const [weight, setWeight] = React.useState(2);
  const [country, setCountry] = React.useState<CountryCode>('CN');
  // Derived during render from the same engine the server uses — no effect and
  // no duplicated state.
  const result: CustomsCalculationResult = React.useMemo(
    () =>
      calculateCustoms({
        category: 'other',
        itemName: '',
        quantity: 1,
        declaredValue: Math.max(0, value),
        currency,
        weightKg: Math.max(0, weight),
        shippingCostUzs: 0,
        fromCountry: country,
        previousMonthlyValueUsd: 0,
        purpose: 'personal',
      }),
    [value, currency, weight, country],
  );

  React.useEffect(() => {
    track('customs_calculated', { surface: 'courier_list' });
  }, [result]);

  return (
    <Card className="p-4">
      <SectionHeader title="Bojxona kalkulyatori" className="mb-3" />

      <div className="grid grid-cols-3 gap-2">
        <Field label="Tovar narxi" htmlFor="calc-value" className="col-span-2">
          <div className="flex gap-2">
            <Input
              id="calc-value"
              type="number"
              inputMode="numeric"
              min={0}
              value={value}
              onChange={(event) => setValue(Number(event.target.value))}
            />
            <Select
              aria-label="Valyuta"
              value={currency}
              onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              className="w-28"
            >
              {Object.keys(CURRENCY).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </div>
        </Field>
        <Field label="Og'irligi (kg)" htmlFor="calc-weight">
          <Input
            id="calc-weight"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.1}
            value={weight}
            onChange={(event) => setWeight(Number(event.target.value))}
          />
        </Field>
      </div>

      <Field label="Yuboruvchi davlat" htmlFor="calc-country" className="mt-3">
        <Select
          id="calc-country"
          value={country}
          onChange={(event) => setCountry(event.target.value as CountryCode)}
        >
          {(['CN', 'US', 'TR'] as CountryCode[]).map((code) => (
            <option key={code} value={code}>
              {COUNTRIES[code]}
            </option>
          ))}
        </Select>
      </Field>

      <div className="mt-4 rounded-sm bg-surface-muted p-3">
          <div className="mb-2 flex items-center gap-3">
            <Icon3D name="calculator" size="sm" />
            <div className="flex-1">
              <p className="text-sm font-bold text-content">Taxminiy hisob</p>
            </div>
            <RiskBadge level={result.riskLevel} />
          </div>
          <KeyValueRow label="Bojxona boji (15%)" value={formatUzs(result.dutyUzs)} />
          <KeyValueRow label="QQS (12%)" value={formatUzs(result.vatUzs)} />
          <KeyValueRow label="Yig'im" value={formatUzs(result.clearanceFeeUzs)} />
          <div className="mt-1 border-t border-border pt-1">
            <KeyValueRow label="Jami" value={formatUzs(result.totalCustomsUzs)} strong />
          </div>
      </div>

      <p className="mt-2 text-xs leading-snug text-content-secondary">ⓘ {result.disclaimer}</p>
    </Card>
  );
}
