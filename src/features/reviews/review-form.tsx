'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import type { ReviewSubject } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { apiFetch } from '@/lib/api/client';
import { haptic } from '@/lib/telegram/webapp';

const VERIFICATION_OPTIONS = [
  { value: 'none', label: 'Tasdiqlashsiz (oddiy sharh)' },
  { value: 'receipt', label: "To'lov cheki" },
  { value: 'tracking', label: 'Kuzatuv raqami' },
  { value: 'screenshot', label: 'Buyurtma screenshoti' },
] as const;

export function ReviewForm({
  subject,
  subjectId,
  onSubmitted,
  onCancel,
}: {
  subject: ReviewSubject;
  subjectId: string;
  onSubmitted: () => void;
  onCancel: () => void;
}) {
  const [rating, setRating] = React.useState(5);
  const [body, setBody] = React.useState('');
  const [method, setMethod] = React.useState<(typeof VERIFICATION_OPTIONS)[number]['value']>('none');
  const [reference, setReference] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await apiFetch('/api/reviews', {
        json: {
          subject,
          subjectId,
          rating,
          body,
          verificationMethod: method,
          verificationReference: reference || undefined,
        },
      });
      haptic('success');
      onSubmitted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sharh yuborilmadi.');
      haptic('error');
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-content">Bahoyingiz</legend>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={`${value} yulduz`}
                aria-pressed={rating === value}
                onClick={() => setRating(value)}
                className="flex h-12 w-12 items-center justify-center rounded-sm border border-border"
              >
                <Star
                  className={
                    value <= rating ? 'h-6 w-6 fill-warning text-warning' : 'h-6 w-6 text-border'
                  }
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Tajribangiz" htmlFor="review-body" hint="Kamida 20 ta belgi.">
          <Textarea
            id="review-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Yetkazish qancha davom etdi, qadoq holati qanday edi..."
            required
            minLength={20}
            maxLength={1500}
          />
        </Field>

        <Field
          label="Xaridni tasdiqlash"
          htmlFor="review-verification"
          hint="Tasdiqlangan sharhlar ro'yxatda yuqorida turadi."
        >
          <Select
            id="review-verification"
            value={method}
            onChange={(event) =>
              setMethod(event.target.value as (typeof VERIFICATION_OPTIONS)[number]['value'])
            }
          >
            {VERIFICATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        {method !== 'none' ? (
          <Field
            label="Tasdiqlash ma'lumoti"
            htmlFor="review-reference"
            hint="Shaxsiy ma'lumotlaringiz sharhda ko'rsatilmaydi."
          >
            <Input
              id="review-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Masalan, kuzatuv raqami"
              maxLength={120}
            />
          </Field>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" block loading={pending}>
            Yuborish
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Bekor qilish
          </Button>
        </div>
      </form>
    </Card>
  );
}
