import * as React from 'react';
import Link from 'next/link';
import { Package, ShieldCheck, MapPin, Star } from 'lucide-react';
import type { Courier } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlacementLabelBadge } from '@/components/ads/placement-label';
import { StaleDataNotice } from '@/components/ui/states';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import { COUNTRIES, type CountryCode } from '@/constants';
import { formatDate, isStale } from '@/lib/utils';

const SERVICE_LABEL = {
  economy: 'Ekonom',
  standard: 'Standart',
  express: 'Ekspress',
} as const;

export function CourierCard({
  courier,
  country,
  highlight,
}: {
  courier: Courier;
  country?: CountryCode;
  highlight?: 'cheapest' | 'fastest' | 'reliable';
}) {
  const tariffs = country
    ? courier.tariffs.filter((tariff) => tariff.fromCountry === country)
    : courier.tariffs;
  const best = [...tariffs].sort((a, b) => a.pricePerKgUzs - b.pricePerKgUzs)[0];
  const stale = best ? isStale(best.updatedAt) : false;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-primary-light text-2xl"
          aria-hidden="true"
        >
          {courier.logoEmoji}
        </span>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {highlight === 'cheapest' ? <Badge tone="success">Eng arzon</Badge> : null}
            {highlight === 'fastest' ? <Badge tone="primary">Eng tez</Badge> : null}
            {highlight === 'reliable' ? <Badge tone="primary">Ishonchli</Badge> : null}
            {courier.isVerified ? <PlacementLabelBadge label="verified_courier" /> : null}
            {courier.isSponsored ? <PlacementLabelBadge label="ad" /> : null}
            {courier.isDemo ? <Badge tone="outline">Demo</Badge> : null}
          </div>

          <h3 className="text-[16px] font-bold text-content">{courier.name}</h3>
          <p className="mt-0.5 text-[13px] text-content-secondary">
            {courier.routes
              .map((route) => `${COUNTRIES[route.from]} → ${COUNTRIES[route.to]}`)
              .join(', ')}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-content-secondary">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
            {courier.rating.toFixed(1)} ({courier.reviewCount.toLocaleString('uz-UZ')})
          </p>
        </div>

        {best ? (
          <div className="shrink-0 text-right">
            <p className="text-[17px] font-extrabold text-primary">
              {formatUzs(best.pricePerKgUzs)}
            </p>
            <p className="text-xs text-content-secondary">/ kg</p>
            <p className="mt-1 text-xs text-content-secondary">
              {formatDeliveryDays(best.deliveryDays)}
            </p>
          </div>
        ) : null}
      </div>

      {best ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
          <div className="flex justify-between gap-2">
            <dt className="text-content-secondary">Xizmat</dt>
            <dd className="font-medium text-content">{SERVICE_LABEL[best.serviceType]}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-content-secondary">Minimal tarif</dt>
            <dd className="font-medium text-content">{formatUzs(best.minChargeUzs)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-content-secondary">Hajmiy formula</dt>
            <dd className="font-medium text-content">
              L×W×H / {best.volumetricDivisor}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-content-secondary">Min. og&apos;irlik</dt>
            <dd className="font-medium text-content">{best.minWeightKg} kg</dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {courier.trackingAvailable ? <Badge tone="neutral">Kuzatuv</Badge> : null}
        {courier.insuranceAvailable ? <Badge tone="neutral">Sug&apos;urta</Badge> : null}
        {courier.customsSupport ? (
          <Badge tone="neutral">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Bojxona yordami
          </Badge>
        ) : null}
        {courier.acceptsElectronics ? <Badge tone="neutral">Elektronika</Badge> : null}
        {courier.acceptsFragile ? <Badge tone="neutral">Sinuvchan</Badge> : null}
        {courier.acceptsOversized ? (
          <Badge tone="neutral">
            <Package className="h-3 w-3" aria-hidden="true" />
            Katta hajm
          </Badge>
        ) : null}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs leading-snug text-content-secondary">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {courier.warehouseAddressHint}
      </p>

      <p className="mt-2 text-xs text-content-secondary">
        Ma&apos;lumot yangilangan: {formatDate(courier.updatedAt)}
      </p>

      {stale ? (
        <div className="mt-2">
          <StaleDataNotice label="Ushbu kuryer tarifi eskirgan bo'lishi mumkin." />
        </div>
      ) : null}

      <Link
        href={`/couriers/${courier.slug}`}
        className="mt-3 flex h-11 items-center justify-center rounded-sm bg-primary-light text-sm font-semibold text-primary"
      >
        Batafsil
      </Link>
    </Card>
  );
}
