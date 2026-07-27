'use client';

import * as React from 'react';
import type { Courier, CourierChangeRequest, Review } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/misc';
import { ErrorState, ListSkeleton } from '@/components/ui/states';
import { apiFetch } from '@/lib/api/client';
import { useAsyncData } from '@/hooks/use-async-data';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { COUNTRIES } from '@/constants';

interface PanelData {
  couriers: Courier[];
  requests: CourierChangeRequest[];
  reviews: Review[];
}

const FIELDS = [
  { value: 'pricePerKgUzs', label: "1 kg narxi (so'm)" },
  { value: 'minChargeUzs', label: "Minimal tarif (so'm)" },
  { value: 'deliveryDays', label: 'Yetkazish muddati' },
  { value: 'routes', label: "Yo'nalishlar" },
  { value: 'warehouseAddress', label: 'Ombor manzili' },
  { value: 'serviceTerms', label: 'Xizmat shartlari' },
  { value: 'promotion', label: 'Aksiya' },
] as const;

const fetchPanel = () => apiFetch<PanelData>('/api/courier-panel');

export default function CourierPanelPage() {
  const { data, status, reload } = useAsyncData<PanelData>(fetchPanel);

  const [courierId, setCourierId] = React.useState('');
  const [field, setField] = React.useState<(typeof FIELDS)[number]['value']>('pricePerKgUzs');
  const [newValue, setNewValue] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);

  const couriers = data?.couriers ?? [];
  const selected = couriers.find((courier) => courier.id === courierId) ?? couriers[0];
  const activeId = courierId || selected?.id || '';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeId) return;
    setPending(true);
    setError('');
    try {
      await apiFetch('/api/courier-panel', {
        json: {
          courierId: activeId,
          field,
          previousValue: currentValue(selected, field),
          newValue,
        },
      });
      setSubmitted(true);
      setNewValue('');
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "O'zgarish yuborilmadi.");
    } finally {
      setPending(false);
    }
  }

  if (status === 'loading') return <ListSkeleton count={3} />;
  if (status !== 'ready' || !data) {
    return (
      <ErrorState
        title="Ma'lumot yuklanmadi"
        description="Qayta urinib ko'ring."
        onAction={reload}
      />
    );
  }

  const myRequests = data.requests.filter((request) => request.courierId === activeId);
  const myReviews = data.reviews.filter((review) => review.subjectId === activeId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-content">Kuryer kabineti</h1>
        <p className="mt-1 text-sm text-content-secondary">
          Har bir o&apos;zgarish administrator tasdig&apos;idan keyin e&apos;lon qilinadi.
        </p>
      </div>

      <Card className="p-4">
        <Field label="Kuryer profili" htmlFor="cp-courier">
          <Select
            id="cp-courier"
            value={activeId}
            onChange={(event) => setCourierId(event.target.value)}
          >
            {couriers.map((courier) => (
              <option key={courier.id} value={courier.id}>
                {courier.name}
              </option>
            ))}
          </Select>
        </Field>

        {selected ? (
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-content-secondary">Reyting</dt>
              <dd className="font-medium text-content">
                ⭐ {selected.rating.toFixed(1)} ({selected.reviewCount})
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-content-secondary">Yo&apos;nalishlar</dt>
              <dd className="font-medium text-content">
                {selected.routes
                  .map((route) => `${COUNTRIES[route.from]}→${COUNTRIES[route.to]}`)
                  .join(', ')}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-content-secondary">Ombor manzili</dt>
              <dd className="max-w-[60%] text-right font-medium text-content">
                {selected.warehouseAddressHint}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-content-secondary">Yangilangan</dt>
              <dd className="font-medium text-content">{formatDate(selected.updatedAt)}</dd>
            </div>
          </dl>
        ) : null}
      </Card>

      <Card className="p-4">
        <SectionHeader title="Tariflar" className="mb-2" />
        <ul className="space-y-2 text-sm">
          {(selected?.tariffs ?? []).map((tariff) => (
            <li key={tariff.id} className="rounded-sm border border-border p-3">
              {COUNTRIES[tariff.fromCountry]} → {COUNTRIES[tariff.toCountry]} · {tariff.serviceType}
              <br />
              {formatUzs(tariff.pricePerKgUzs)} / kg · min {formatUzs(tariff.minChargeUzs)} ·{' '}
              {formatDeliveryDays(tariff.deliveryDays)}
            </li>
          ))}
        </ul>
      </Card>

      <form onSubmit={submit}>
        <Card className="space-y-4 p-4">
          <SectionHeader title="O'zgarish yuborish" className="mb-0" />

          <Field label="Maydon" htmlFor="cp-field">
            <Select
              id="cp-field"
              value={field}
              onChange={(event) =>
                setField(event.target.value as (typeof FIELDS)[number]['value'])
              }
            >
              {FIELDS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Joriy qiymat" htmlFor="cp-current">
            <Input id="cp-current" value={currentValue(selected, field)} readOnly disabled />
          </Field>

          <Field label="Yangi qiymat" htmlFor="cp-new">
            <Textarea
              id="cp-new"
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
              required
              maxLength={500}
              placeholder="Yangi qiymatni kiriting"
            />
          </Field>

          {error ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          ) : null}

          {submitted ? (
            <p className="rounded-sm bg-success-bg p-3 text-sm font-medium text-success">
              O&apos;zgarish yuborildi va admin tasdig&apos;ini kutmoqda.
            </p>
          ) : null}

          <Button type="submit" block loading={pending} disabled={!newValue.trim()}>
            Tasdiqlashga yuborish
          </Button>
        </Card>
      </form>

      <section aria-label="Yuborilgan o'zgarishlar">
        <SectionHeader title="Yuborilgan o'zgarishlar" />
        {myRequests.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-content-secondary">Hozircha o&apos;zgarishlar yo&apos;q.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {myRequests.map((request) => (
              <Card key={request.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-content">{request.field}</p>
                  <p className="truncate text-xs text-content-secondary">
                    {request.previousValue || '—'} → {request.newValue}
                  </p>
                </div>
                <Badge
                  tone={
                    request.status === 'approved'
                      ? 'success'
                      : request.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {request.status === 'approved'
                    ? 'Tasdiqlangan'
                    : request.status === 'rejected'
                      ? 'Rad etilgan'
                      : 'Kutilmoqda'}
                </Badge>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-label="Foydalanuvchi baholari">
        <SectionHeader title="Foydalanuvchi baholari" />
        {myReviews.length === 0 ? (
          <Card className="p-4">
            <p className="text-sm text-content-secondary">Hozircha sharhlar yo&apos;q.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {myReviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-content">
                    {review.authorName} · {review.rating}/5
                  </p>
                  {review.verifiedPurchase ? (
                    <Badge tone="success">Tasdiqlangan xarid</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-content-secondary">{review.body}</p>
                {review.officialReply ? (
                  <p className="mt-2 rounded-sm bg-surface-muted p-2 text-xs text-content-secondary">
                    Rasmiy javob: {review.officialReply}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-content-secondary">
                    Rasmiy javob berish uchun administratorga murojaat qiling.
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function currentValue(
  courier: Courier | undefined,
  field: (typeof FIELDS)[number]['value'],
): string {
  if (!courier) return '';
  const tariff = courier.tariffs[0];

  switch (field) {
    case 'pricePerKgUzs':
      return tariff ? String(tariff.pricePerKgUzs) : '';
    case 'minChargeUzs':
      return tariff ? String(tariff.minChargeUzs) : '';
    case 'deliveryDays':
      return tariff ? formatDeliveryDays(tariff.deliveryDays) : '';
    case 'routes':
      return courier.routes.map((route) => `${route.from}→${route.to}`).join(', ');
    case 'warehouseAddress':
      return courier.warehouseAddressHint;
    default:
      return '';
  }
}
