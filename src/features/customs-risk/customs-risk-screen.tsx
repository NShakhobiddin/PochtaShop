'use client';

import * as React from 'react';
import Link from 'next/link';
import { FileText, ListChecks, TriangleAlert } from 'lucide-react';
import type { CustomsRiskResult, UsagePurpose } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { Chip, SectionHeader } from '@/components/ui/misc';
import { RiskBadge } from '@/components/customs/risk-badge';
import { CommercialIntentCard } from './commercial-intent-card';
import { ErrorState, ListSkeleton } from '@/components/ui/states';
import { apiFetch } from '@/lib/api/client';
import {
  CURRENCY,
  COUNTRIES,
  PRODUCT_CATEGORIES,
  type CountryCode,
  type CurrencyCode,
  type ProductCategoryId,
} from '@/constants';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/telegram/webapp';

const PURPOSES: Array<{ value: UsagePurpose; label: string }> = [
  { value: 'personal', label: 'Shaxsiy foydalanish' },
  { value: 'gift', label: 'Sovg‘a' },
  { value: 'resale', label: 'Qayta sotish' },
  { value: 'business', label: 'Biznes ehtiyoji' },
];

type Status = 'idle' | 'loading' | 'ready' | 'error';

export function CustomsRiskScreen({
  initialItem,
  initialCategory,
}: {
  initialItem: string;
  initialCategory: ProductCategoryId;
}) {
  const [itemName, setItemName] = React.useState(initialItem);
  const [category, setCategory] = React.useState<ProductCategoryId>(initialCategory);
  const [declaredValue, setDeclaredValue] = React.useState(100);
  const [currency, setCurrency] = React.useState<CurrencyCode>('USD');
  const [quantity, setQuantity] = React.useState(1);
  const [weight, setWeight] = React.useState(1);
  const [fromCountry, setFromCountry] = React.useState<CountryCode>('CN');
  const [purpose, setPurpose] = React.useState<UsagePurpose>('personal');
  const [flags, setFlags] = React.useState<string[]>([]);

  const [status, setStatus] = React.useState<Status>('idle');
  const [result, setResult] = React.useState<CustomsRiskResult | null>(null);
  const [error, setError] = React.useState('');

  async function check() {
    if (!itemName.trim()) {
      setError("Tovar nomini kiriting.");
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError('');
    haptic('light');

    try {
      const response = await apiFetch<CustomsRiskResult>('/api/customs/risk', {
        json: {
          itemName,
          category,
          declaredValue,
          currency,
          quantity,
          weightKg: weight,
          fromCountry,
          purpose,
          hasBrandLogo: flags.includes('brand'),
          isBattery: flags.includes('battery'),
          isLiquid: flags.includes('liquid'),
        },
      });
      setResult(response);
      setStatus('ready');
      track('customs_risk_checked', { level: response.level, purpose });
      haptic(response.level === 'red' ? 'warning' : 'success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Tekshiruv bajarilmadi.');
      setStatus('error');
    }
  }

  function toggleFlag(flag: string) {
    setFlags((current) =>
      current.includes(flag) ? current.filter((item) => item !== flag) : [...current, flag],
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Bojxona xavfi" />

      <Card className="space-y-3 p-4">
        <Field label="Tovar nomi" htmlFor="risk-name">
          <Input
            id="risk-name"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            placeholder="Masalan: power bank 20000 mAh"
            maxLength={160}
          />
        </Field>

        <Field label="Kategoriya" htmlFor="risk-category">
          <Select
            id="risk-category"
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Bir dona qiymati" htmlFor="risk-value">
            <div className="flex gap-2">
              <Input
                id="risk-value"
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
          <Field label="Miqdor" htmlFor="risk-qty">
            <Input
              id="risk-qty"
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Og'irligi (kg)" htmlFor="risk-weight">
            <Input
              id="risk-weight"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
            />
          </Field>
          <Field label="Davlat" htmlFor="risk-country">
            <Select
              id="risk-country"
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
        </div>

        <Field label="Foydalanish maqsadi" htmlFor="risk-purpose">
          <Select
            id="risk-purpose"
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

        <div>
          <p className="mb-2 text-sm font-medium text-content">Tovar xususiyatlari</p>
          <div className="scroll-x flex gap-2">
            <Chip selected={flags.includes('brand')} onClick={() => toggleFlag('brand')}>
              Brend logotipi bor
            </Chip>
            <Chip selected={flags.includes('battery')} onClick={() => toggleFlag('battery')}>
              Batareya bor
            </Chip>
            <Chip selected={flags.includes('liquid')} onClick={() => toggleFlag('liquid')}>
              Suyuqlik
            </Chip>
          </div>
        </div>

        <Button block loading={status === 'loading'} onClick={() => void check()}>
          Xavfni tekshirish
        </Button>
      </Card>

      {status === 'loading' ? <ListSkeleton count={2} /> : null}

      {status === 'error' ? (
        <ErrorState title="Tekshiruv bajarilmadi" description={error} onAction={() => void check()} />
      ) : null}

      {status === 'ready' && result ? (
        <>
          <Card className="p-4">
            <div className="mb-2 flex items-center gap-3">
              <RiskBadge level={result.level} />
              <p className="text-[15px] font-bold text-content">{result.title}</p>
            </div>
            <p className="text-[13px] text-content-secondary">Xavf ballari: {result.score}/100</p>
          </Card>

          <Card className="p-4">
            <SectionHeader title="Asosiy sabablar" className="mb-2" />
            <ul className="space-y-2">
              {result.reasons.map((reason) => (
                <li key={reason} className="flex gap-2 text-[13px] leading-snug text-content-secondary">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                  {reason}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <SectionHeader title="Nimalarni tekshirish kerak" className="mb-2" />
            <ul className="space-y-2">
              {result.checkList.map((item) => (
                <li key={item} className="flex gap-2 text-[13px] leading-snug text-content-secondary">
                  <ListChecks className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>

          {result.possibleDocuments.length > 0 ? (
            <Card className="p-4">
              <SectionHeader title="Kerak bo'lishi mumkin bo'lgan hujjatlar" className="mb-2" />
              <ul className="space-y-2">
                {result.possibleDocuments.map((doc) => (
                  <li key={doc} className="flex gap-2 text-[13px] leading-snug text-content-secondary">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-content-secondary" aria-hidden="true" />
                    {doc}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="p-4">
            <SectionHeader title="Keyingi qadamlar" className="mb-2" />
            <ol className="space-y-1.5">
              {result.nextSteps.map((step, index) => (
                <li key={step} className="text-[13px] leading-snug text-content-secondary">
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-xs leading-snug text-content-secondary">
              Manba: {result.legalSource}
            </p>
            <p className="text-xs text-content-secondary">
              Ma&apos;lumot yangilangan: {result.updatedAt}
            </p>
          </Card>

          {result.needsConsultation ? (
            <Link href="/consultation?type=customs_issue">
              <Button block>Mutaxassis bilan maslahatlashish</Button>
            </Link>
          ) : null}
        </>
      ) : null}

      <CommercialIntentCard category={category} declaredValue={declaredValue} currency={currency} />

      <Link
        href="/customs/why-duty"
        className="flex h-12 items-center justify-center rounded-sm border border-border text-sm font-semibold text-content"
      >
        Nima uchun boj chiqdi?
      </Link>
    </div>
  );
}
