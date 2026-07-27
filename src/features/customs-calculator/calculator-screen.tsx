'use client';

import * as React from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import type { Courier, CustomsCalculationResult, UsagePurpose } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { KeyValueRow, SectionHeader, Stepper } from '@/components/ui/misc';
import { RiskBadge } from '@/components/customs/risk-badge';
import { calculateCustoms } from './calculate';
import { calculateVolumetricWeight } from '@/features/courier-comparison/volumetric';
import { quoteCourier, cheapestQuote } from '@/features/courier-comparison/quote';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import {
  CURRENCY,
  COUNTRIES,
  PRODUCT_CATEGORIES,
  type CountryCode,
  type CurrencyCode,
  type ProductCategoryId,
} from '@/constants';
import { apiFetch } from '@/lib/api/client';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/telegram/webapp';

const PURPOSES: Array<{ value: UsagePurpose; label: string }> = [
  { value: 'personal', label: 'Shaxsiy foydalanish' },
  { value: 'gift', label: 'Sovg‘a' },
  { value: 'resale', label: 'Qayta sotish' },
  { value: 'business', label: 'Biznes ehtiyoji' },
];

const STEPS = ['Tovar', 'Yetkazish', 'Natija'];

export function CalculatorScreen({ couriers }: { couriers: Courier[] }) {
  const [step, setStep] = React.useState(0);

  const [category, setCategory] = React.useState<ProductCategoryId>('electronics');
  const [itemName, setItemName] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [declaredValue, setDeclaredValue] = React.useState(100);
  const [currency, setCurrency] = React.useState<CurrencyCode>('USD');
  const [purpose, setPurpose] = React.useState<UsagePurpose>('personal');
  const [previousMonthlyValueUsd, setPreviousMonthlyValueUsd] = React.useState(0);

  const [fromCountry, setFromCountry] = React.useState<CountryCode>('CN');
  const [weight, setWeight] = React.useState(1);
  const [length, setLength] = React.useState(30);
  const [width, setWidth] = React.useState(20);
  const [height, setHeight] = React.useState(15);
  const [courierId, setCourierId] = React.useState<string>('');

  const [saved, setSaved] = React.useState(false);

  const selectedCourier = couriers.find((courier) => courier.id === courierId);
  const divisor = selectedCourier?.tariffs[0]?.volumetricDivisor ?? 6000;

  const volumetric = calculateVolumetricWeight({
    lengthCm: Math.max(1, length),
    widthCm: Math.max(1, width),
    heightCm: Math.max(1, height),
    actualWeightKg: Math.max(0.01, weight) * quantity,
    divisor,
  });

  // Cheap to recompute; deriving it inline keeps the courier list and the
  // selected courier from drifting apart.
  const quoteCandidates = selectedCourier ? [selectedCourier] : couriers;
  const quote = cheapestQuote(
    quoteCandidates.flatMap((courier) =>
      quoteCourier(courier, {
        fromCountry,
        actualWeightKg: Math.max(0.01, weight) * quantity,
        dimensionsCm: { length, width, height },
      }),
    ),
  );

  const result: CustomsCalculationResult = calculateCustoms({
    category,
    itemName,
    quantity,
    declaredValue: Math.max(0, declaredValue),
    currency,
    weightKg: volumetric.chargeableWeightKg,
    shippingCostUzs: quote?.costUzs ?? 0,
    fromCountry,
    courierId: courierId || undefined,
    previousMonthlyValueUsd,
    purpose,
  });

  async function saveResult() {
    haptic('success');
    track('customs_calculated', { surface: 'calculator', purpose });
    try {
      await apiFetch('/api/customs/calculate', {
        json: {
          category,
          itemName: itemName || 'Nomsiz tovar',
          quantity,
          declaredValue: Math.max(0, declaredValue),
          currency,
          weightKg: volumetric.chargeableWeightKg,
          shippingCostUzs: quote?.costUzs ?? 0,
          fromCountry,
          courierId: courierId || undefined,
          previousMonthlyValueUsd,
          purpose,
        },
      });
      setSaved(true);
    } catch {
      // The estimate is already visible; saving to history is best-effort.
      setSaved(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Xarajatni hisoblash" />

      <Stepper steps={STEPS} current={step} />

      {step === 0 ? (
        <Card className="space-y-3 p-4">
          <SectionHeader title="Tovar ma'lumotlari" className="mb-0" />

          <Field label="Tovar kategoriyasi" htmlFor="calc-category">
            <Select
              id="calc-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as ProductCategoryId)}
            >
              {PRODUCT_CATEGORIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tovar nomi" htmlFor="calc-name">
            <Input
              id="calc-name"
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              placeholder="Masalan: simsiz quloqchin"
              maxLength={160}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Miqdor" htmlFor="calc-qty">
              <Input
                id="calc-qty"
                type="number"
                inputMode="numeric"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
              />
            </Field>
            <Field label="Bir dona qiymati" htmlFor="calc-declared">
              <div className="flex gap-2">
                <Input
                  id="calc-declared"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={declaredValue}
                  onChange={(event) => setDeclaredValue(Number(event.target.value))}
                />
                <Select
                  aria-label="Valyuta"
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
                  className="w-24"
                >
                  {Object.keys(CURRENCY).map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </Select>
              </div>
            </Field>
          </div>

          <Field label="Foydalanish maqsadi" htmlFor="calc-purpose">
            <Select
              id="calc-purpose"
              value={purpose}
              onChange={(event) => setPurpose(event.target.value as UsagePurpose)}
            >
              {PURPOSES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Shu oyda oldingi jo'natmalar (USD)"
            htmlFor="calc-previous"
            hint="Oylik bojsiz me'yor barcha jo'natmalarga birga qo'llanadi."
          >
            <Input
              id="calc-previous"
              type="number"
              inputMode="decimal"
              min={0}
              value={previousMonthlyValueUsd}
              onChange={(event) => setPreviousMonthlyValueUsd(Number(event.target.value))}
            />
          </Field>

          <Button block onClick={() => setStep(1)}>
            Keyingi bosqich
          </Button>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card className="space-y-3 p-4">
          <SectionHeader title="Yetkazish" className="mb-0" />

          <Field label="Yuboruvchi davlat" htmlFor="calc-from">
            <Select
              id="calc-from"
              value={fromCountry}
              onChange={(event) => setFromCountry(event.target.value as CountryCode)}
            >
              {(['CN', 'US', 'TR'] as CountryCode[]).map((code) => (
                <option key={code} value={code}>
                  {COUNTRIES[code]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Kuryer" htmlFor="calc-courier" hint="Tanlanmasa, eng arzoni olinadi.">
            <Select
              id="calc-courier"
              value={courierId}
              onChange={(event) => setCourierId(event.target.value)}
            >
              <option value="">Eng arzon variant</option>
              {couriers
                .filter((courier) => courier.routes.some((route) => route.from === fromCountry))
                .map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.name}
                  </option>
                ))}
            </Select>
          </Field>

          <Field label="Bir dona og'irligi (kg)" htmlFor="calc-weight-input">
            <Input
              id="calc-weight-input"
              type="number"
              inputMode="decimal"
              min={0.01}
              step={0.1}
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
            />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            <Field label="Uzunlik" htmlFor="calc-l">
              <Input
                id="calc-l"
                type="number"
                min={1}
                value={length}
                onChange={(event) => setLength(Number(event.target.value))}
              />
            </Field>
            <Field label="Kenglik" htmlFor="calc-w">
              <Input
                id="calc-w"
                type="number"
                min={1}
                value={width}
                onChange={(event) => setWidth(Number(event.target.value))}
              />
            </Field>
            <Field label="Balandlik" htmlFor="calc-h">
              <Input
                id="calc-h"
                type="number"
                min={1}
                value={height}
                onChange={(event) => setHeight(Number(event.target.value))}
              />
            </Field>
          </div>

          <div className="rounded-sm bg-surface-muted p-3">
            <KeyValueRow label="Haqiqiy og'irlik" value={`${volumetric.actualWeightKg} kg`} />
            <KeyValueRow label="Hajmiy og'irlik" value={`${volumetric.volumetricWeightKg} kg`} />
            <KeyValueRow
              label="Hisoblanadigan og'irlik"
              value={`${volumetric.chargeableWeightKg} kg`}
              strong
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(0)}>
              Orqaga
            </Button>
            <Button block onClick={() => setStep(2)}>
              Hisoblash
            </Button>
          </div>
        </Card>
      ) : null}

      {step === 2 ? (
        <>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-[17px] font-bold text-content">Taxminiy hisob</h2>
              <RiskBadge level={result.riskLevel} />
            </div>

            <KeyValueRow label="Tovar qiymati" value={formatUzs(result.goodsCostUzs)} />
            <KeyValueRow
              label="Yetkazish"
              value={
                quote
                  ? `${formatUzs(quote.costUzs)} · ${formatDeliveryDays(quote.deliveryDays)}`
                  : '—'
              }
            />
            <KeyValueRow label="Bojxona boji" value={formatUzs(result.dutyUzs)} />
            <KeyValueRow label="QQS" value={formatUzs(result.vatUzs)} />
            <KeyValueRow label="Rasmiylashtirish yig'imi" value={formatUzs(result.clearanceFeeUzs)} />
            <div className="mt-2 border-t border-border pt-2">
              <KeyValueRow label="Jami taxminiy xarajat" value={formatUzs(result.grandTotalUzs)} strong />
            </div>
          </Card>

          <Card className="p-4">
            <SectionHeader title="Hisoblash izohi" className="mb-2" />
            <ul className="space-y-1.5">
              {result.explanation.map((line) => (
                <li key={line} className="text-[13px] leading-snug text-content-secondary">
                  • {line}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-snug text-content-secondary">
              Huquqiy manba: {result.legalSource}
            </p>
            <p className="text-xs text-content-secondary">
              Ma&apos;lumot yangilangan: {result.updatedAt}
            </p>
          </Card>

          <Card className="flex gap-2 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-content-secondary" aria-hidden="true" />
            <p className="text-xs leading-snug text-content-secondary">{result.disclaimer}</p>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(1)}>
              Orqaga
            </Button>
            <Button block onClick={() => void saveResult()} disabled={saved}>
              {saved ? 'Tarixga saqlandi' : 'Natijani saqlash'}
            </Button>
          </div>

          <Link
            href={`/customs/risk?item=${encodeURIComponent(itemName)}&category=${category}`}
            className="flex h-12 items-center justify-center rounded-sm bg-primary-light text-sm font-semibold text-primary"
          >
            Bojxona xavfini tekshirish
          </Link>
        </>
      ) : null}
    </div>
  );
}
