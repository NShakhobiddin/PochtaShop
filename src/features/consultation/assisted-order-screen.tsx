'use client';

import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import type { AssistedOrderRequest } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Textarea } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/misc';
import { Icon3D } from '@/components/ui/icon-3d';
import { ListSkeleton } from '@/components/ui/states';
import { CONSULTATION_STATUS_LABEL, CONSULTATION_STATUS_TONE } from './types';
import { apiFetch } from '@/lib/api/client';
import { useAsyncData } from '@/hooks/use-async-data';
import { formatUzs } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { haptic } from '@/lib/telegram/webapp';

const fetchOrders = () => apiFetch<AssistedOrderRequest[]>('/api/assisted-orders');

/**
 * "Order for me" is a paid service, not an AI recommendation, so it is kept
 * visually and structurally separate — and nothing happens without the user's
 * explicit confirmation.
 */
export function AssistedOrderScreen({ initialUrl }: { initialUrl: string }) {
  const { data, status, reload } = useAsyncData<AssistedOrderRequest[]>(fetchOrders);

  const [productUrl, setProductUrl] = React.useState(initialUrl);
  const [variant, setVariant] = React.useState('');
  const [quantity, setQuantity] = React.useState(1);
  const [maxBudget, setMaxBudget] = React.useState(1_000_000);
  const [note, setNote] = React.useState('');
  const [confirmed, setConfirmed] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');
  const [sent, setSent] = React.useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await apiFetch('/api/assisted-orders', {
        json: {
          productUrl,
          variant,
          quantity,
          maxBudgetUzs: maxBudget,
          note: note || undefined,
          userConfirmed: true,
        },
      });
      haptic('success');
      setSent(true);
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "So'rov yuborilmadi.");
      haptic('error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Men uchun buyurtma bering" />

      <Card className="border-2 border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <Icon3D name="order" />
          <div>
            <div className="mb-1 flex items-center gap-2">
              <p className="text-[15px] font-bold text-content">Pulli xizmat</p>
              <Badge tone="primary">Xizmat</Badge>
            </div>
            <p className="text-[13px] leading-snug text-content-secondary">
              Bu AI tavsiyasi emas. Buyurtmani jamoamiz siz nomingizdan rasmiylashtiradi.
            </p>
          </div>
        </div>
      </Card>

      {sent ? (
        <Card className="p-4">
          <p className="text-sm font-bold text-success">So&apos;rovingiz qabul qilindi</p>
          <p className="mt-1 text-[13px] text-content-secondary">
            Mutaxassis mahsulot va yakuniy narxni tasdiqlash uchun siz bilan bog&apos;lanadi.
          </p>
          <Button variant="outline" block className="mt-3" onClick={() => setSent(false)}>
            Yangi so&apos;rov
          </Button>
        </Card>
      ) : (
        <form onSubmit={submit}>
          <Card className="space-y-4 p-4">
            <Field label="Mahsulot havolasi" htmlFor="ao-url">
              <Input
                id="ao-url"
                type="url"
                inputMode="url"
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="https://..."
                required
                maxLength={2048}
              />
            </Field>

            <Field label="Kerakli variant" htmlFor="ao-variant" hint="Rang, o'lcham, model.">
              <Input
                id="ao-variant"
                value={variant}
                onChange={(event) => setVariant(event.target.value)}
                placeholder="Masalan: oq rang, 42-o'lcham"
                maxLength={160}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Miqdor" htmlFor="ao-qty">
                <Input
                  id="ao-qty"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
                />
              </Field>
              <Field label="Maksimal budjet (so'm)" htmlFor="ao-budget">
                <Input
                  id="ao-budget"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={maxBudget}
                  onChange={(event) => setMaxBudget(Number(event.target.value))}
                />
              </Field>
            </div>

            <Field label="Izoh" htmlFor="ao-note">
              <Textarea
                id="ao-note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Qo'shimcha talablaringiz"
                maxLength={1000}
              />
            </Field>

            <label className="flex items-start gap-3 rounded-sm bg-warning-bg p-3 text-[13px] leading-snug text-warning">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                required
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-warning accent-[rgb(217,119,6)]"
              />
              <span className="flex-1">
                <ShieldCheck className="mr-1 inline h-4 w-4" aria-hidden="true" />
                Yakuniy mahsulot, narx va buyurtma mening tasdig&apos;imdan keyin amalga oshirilishini
                tushunaman.
              </span>
            </label>

            {error ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" block size="lg" loading={pending} disabled={!confirmed}>
              So&apos;rov yuborish
            </Button>
          </Card>
        </form>
      )}

      <section aria-label="Buyurtma so'rovlarim">
        <SectionHeader title="So'rovlarim" />
        {status === 'loading' ? <ListSkeleton count={2} /> : null}
        {status === 'ready' && (data?.length ?? 0) === 0 ? (
          <Card className="p-4">
            <p className="text-[13px] text-content-secondary">Hozircha so&apos;rovlar yo&apos;q.</p>
          </Card>
        ) : null}
        <div className="space-y-2">
          {(data ?? []).map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-content">
                  {order.productUrl}
                </p>
                <Badge tone={CONSULTATION_STATUS_TONE[order.status]}>
                  {CONSULTATION_STATUS_LABEL[order.status]}
                </Badge>
              </div>
              <p className="mt-1 text-[13px] text-content-secondary">
                {order.quantity} dona · {formatUzs(order.maxBudgetUzs)} gacha
              </p>
              <p className="mt-1 text-xs text-content-secondary">{formatDate(order.createdAt)}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
