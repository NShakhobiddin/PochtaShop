'use client';

import * as React from 'react';
import Link from 'next/link';
import { Paperclip } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { KeyValueRow, SectionHeader } from '@/components/ui/misc';
import { explainDuty, type DutyExplanationResult } from './duty-explanation';
import { validateUploadedFile } from '@/lib/validation/schemas';
import { formatUzs } from '@/lib/currency';
import { CURRENCY, type CurrencyCode } from '@/constants';
import { haptic } from '@/lib/telegram/webapp';

export function WhyDutyScreen() {
  const [itemName, setItemName] = React.useState('');
  const [declaredValue, setDeclaredValue] = React.useState(150);
  const [currency, setCurrency] = React.useState<CurrencyCode>('USD');
  const [quantity, setQuantity] = React.useState(1);
  const [weight, setWeight] = React.useState(1);
  const [chargedAmount, setChargedAmount] = React.useState(300_000);
  const [documentName, setDocumentName] = React.useState<string | undefined>();
  const [fileError, setFileError] = React.useState('');
  const [result, setResult] = React.useState<DutyExplanationResult | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  function analyse() {
    haptic('light');
    setResult(
      explainDuty({
        itemName: itemName || 'Nomsiz tovar',
        declaredValue: Math.max(0, declaredValue),
        currency,
        quantity: Math.max(1, quantity),
        weightKg: Math.max(0, weight),
        chargedAmountUzs: Math.max(0, chargedAmount),
        documentName,
      }),
    );
  }

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const kind = file.type === 'application/pdf' ? 'document' : 'image';
    const validation = validateUploadedFile(
      { name: file.name, type: file.type, size: file.size },
      kind,
    );
    if (!validation.ok) {
      setFileError(validation.error ?? "Fayl qabul qilinmadi.");
      setDocumentName(undefined);
      return;
    }
    // Only the file name is used; the document itself is never uploaded here.
    setFileError('');
    setDocumentName(file.name);
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Nima uchun boj chiqdi?" />

      <Card className="space-y-3 p-4">
        <Field label="Tovar nomi" htmlFor="wd-name">
          <Input
            id="wd-name"
            value={itemName}
            onChange={(event) => setItemName(event.target.value)}
            maxLength={160}
            placeholder="Masalan: noutbuk"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Qiymati (bir dona)" htmlFor="wd-value">
            <div className="flex gap-2">
              <Input
                id="wd-value"
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
          <Field label="Miqdori" htmlFor="wd-qty">
            <Input
              id="wd-qty"
              type="number"
              inputMode="numeric"
              min={1}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Og'irligi (kg)" htmlFor="wd-weight">
            <Input
              id="wd-weight"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.1}
              value={weight}
              onChange={(event) => setWeight(Number(event.target.value))}
            />
          </Field>
          <Field label="Bojxona summasi (so'm)" htmlFor="wd-charged">
            <Input
              id="wd-charged"
              type="number"
              inputMode="numeric"
              min={0}
              value={chargedAmount}
              onChange={(event) => setChargedAmount(Number(event.target.value))}
            />
          </Field>
        </div>

        <div>
          <Button variant="outline" block onClick={() => inputRef.current?.click()}>
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            {documentName ?? 'Hujjat yoki screenshot biriktirish'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={onFile}
          />
          {fileError ? (
            <p role="alert" className="mt-1 text-xs font-medium text-danger">
              {fileError}
            </p>
          ) : null}
        </div>

        <Button block onClick={analyse}>
          Sababini tushuntirish
        </Button>
      </Card>

      {result ? (
        <>
          <Card className="p-4">
            <SectionHeader title="Hisob-kitob taqqoslash" className="mb-2" />
            <KeyValueRow label="Hisob bo'yicha kutilgan" value={formatUzs(result.expectedUzs)} />
            <KeyValueRow label="Sizdan olingan" value={formatUzs(result.chargedUzs)} />
            <div className="mt-1 border-t border-border pt-1">
              <KeyValueRow
                label="Farq"
                value={`${result.differenceUzs >= 0 ? '+' : ''}${formatUzs(result.differenceUzs)}`}
                strong
              />
            </div>
          </Card>

          <Card className="p-4">
            <SectionHeader title="Ehtimoliy sabablar" className="mb-2" />
            <ul className="space-y-2">
              {result.likelyCauses.map((cause) => (
                <li key={cause} className="text-[13px] leading-snug text-content-secondary">
                  • {cause}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4">
            <SectionHeader title="Hisoblash mantiqi" className="mb-2" />
            <ol className="space-y-1.5">
              {result.calculationSteps.map((step, index) => (
                <li key={step} className="text-[13px] leading-snug text-content-secondary">
                  {index + 1}. {step}
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-4">
            <SectionHeader title="Nimani tekshirish kerak" className="mb-2" />
            <ul className="space-y-2">
              {result.whatToVerify.map((item) => (
                <li key={item} className="text-[13px] leading-snug text-content-secondary">
                  • {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-snug text-content-secondary">{result.disclaimer}</p>
            <p className="text-xs text-content-secondary">Manba: {result.legalSource}</p>
          </Card>

          {result.consultationRecommended ? (
            <Link href="/consultation?type=customs_issue">
              <Button block>Konsultatsiya so&apos;rash</Button>
            </Link>
          ) : (
            <Card className="p-4">
              <p className="text-[13px] text-content-secondary">
                Farq katta emas — konsultatsiya shart emas. Baribir savolingiz bo&apos;lsa,
                mutaxassisga murojaat qilishingiz mumkin.
              </p>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
