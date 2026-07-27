'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/input';
import { KeyValueRow, SectionHeader } from '@/components/ui/misc';
import { calculateVolumetricWeight } from './volumetric';
import { formatUzs } from '@/lib/currency';

/**
 * Explains why a courier may bill more than the parcel weighs: the chargeable
 * weight is whichever of actual and volumetric weight is larger.
 */
export function VolumetricCalculator({
  defaultDivisor,
  pricePerKgUzs,
  minChargeUzs,
}: {
  defaultDivisor: number;
  pricePerKgUzs?: number;
  minChargeUzs?: number;
}) {
  const [length, setLength] = React.useState(30);
  const [width, setWidth] = React.useState(25);
  const [height, setHeight] = React.useState(15);
  const [weight, setWeight] = React.useState(1.5);
  const [divisor, setDivisor] = React.useState(defaultDivisor);

  const result = calculateVolumetricWeight({
    lengthCm: Math.max(1, length),
    widthCm: Math.max(1, width),
    heightCm: Math.max(1, height),
    actualWeightKg: Math.max(0.01, weight),
    divisor: Math.max(1, divisor),
  });

  const cost =
    pricePerKgUzs !== undefined
      ? Math.max(result.chargeableWeightKg * pricePerKgUzs, minChargeUzs ?? 0)
      : null;

  return (
    <Card className="p-4">
      <SectionHeader title="Hajmiy og'irlik kalkulyatori" className="mb-1" />
      <p className="mb-3 text-[13px] text-content-secondary">
        Kuryer haqiqiy va hajmiy og&apos;irlikdan kattasini hisoblaydi.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Uzunlik (sm)" htmlFor="vol-length">
          <Input
            id="vol-length"
            type="number"
            inputMode="decimal"
            min={1}
            value={length}
            onChange={(event) => setLength(Number(event.target.value))}
          />
        </Field>
        <Field label="Kenglik (sm)" htmlFor="vol-width">
          <Input
            id="vol-width"
            type="number"
            inputMode="decimal"
            min={1}
            value={width}
            onChange={(event) => setWidth(Number(event.target.value))}
          />
        </Field>
        <Field label="Balandlik (sm)" htmlFor="vol-height">
          <Input
            id="vol-height"
            type="number"
            inputMode="decimal"
            min={1}
            value={height}
            onChange={(event) => setHeight(Number(event.target.value))}
          />
        </Field>
        <Field label="Haqiqiy og'irlik (kg)" htmlFor="vol-weight">
          <Input
            id="vol-weight"
            type="number"
            inputMode="decimal"
            min={0.01}
            step={0.1}
            value={weight}
            onChange={(event) => setWeight(Number(event.target.value))}
          />
        </Field>
      </div>

      <Field
        label="Kuryer formulasi (bo'luvchi)"
        htmlFor="vol-divisor"
        hint="Odatda 5000 yoki 6000."
        className="mt-3"
      >
        <Input
          id="vol-divisor"
          type="number"
          inputMode="numeric"
          min={1}
          value={divisor}
          onChange={(event) => setDivisor(Number(event.target.value))}
        />
      </Field>

      <div className="mt-4 rounded-sm bg-surface-muted p-3">
        <KeyValueRow label="Haqiqiy og'irlik" value={`${result.actualWeightKg} kg`} />
        <KeyValueRow label="Hajmiy og'irlik" value={`${result.volumetricWeightKg} kg`} />
        <KeyValueRow
          label="Hisoblanadigan og'irlik"
          value={`${result.chargeableWeightKg} kg`}
          strong
        />
        {cost !== null ? <KeyValueRow label="Taxminiy yetkazish" value={formatUzs(cost)} /> : null}
      </div>

      <p className="mt-2 text-xs leading-snug text-content-secondary">
        {result.usedVolumetric
          ? "Bu yukda hajmiy og'irlik kattaroq — kuryer shu og'irlikdan hisoblaydi."
          : "Bu yukda haqiqiy og'irlik kattaroq — kuryer shu og'irlikdan hisoblaydi."}
      </p>
    </Card>
  );
}
