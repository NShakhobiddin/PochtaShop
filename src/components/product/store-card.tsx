import * as React from 'react';
import Link from 'next/link';
import { Check, X, Star } from 'lucide-react';
import type { Store } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { COUNTRIES, CATEGORY_LABELS } from '@/constants';
import { formatDate } from '@/lib/utils';

const PRICE_LABEL: Record<Store['priceLevel'], string> = {
  low: 'Arzon',
  medium: "O'rtacha",
  high: 'Qimmat',
};

function Feature({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <li className="flex items-center gap-1.5 text-[13px] text-content-secondary">
      {enabled ? (
        <Check className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
      ) : (
        <X className="h-4 w-4 shrink-0 text-content-secondary" aria-hidden="true" />
      )}
      <span>
        {label}: <span className="font-medium">{enabled ? 'bor' : "yo'q"}</span>
      </span>
    </li>
  );
}

export function StoreCard({ store }: { store: Store }) {
  const authenticityTone =
    store.authenticityScore >= 75 ? 'success' : store.authenticityScore >= 55 ? 'warning' : 'danger';

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm bg-surface-muted text-2xl"
          aria-hidden="true"
        >
          {store.logoEmoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[16px] font-bold text-content">{store.name}</h3>
            {store.isDemo ? <Badge tone="outline">Demo</Badge> : null}
          </div>
          <p className="mt-0.5 text-[13px] text-content-secondary">
            {COUNTRIES[store.country]} · {PRICE_LABEL[store.priceLevel]} narx
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[13px] text-content-secondary">
            <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
            {store.rating.toFixed(1)} ({store.reviewCount})
          </p>
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-snug text-content-secondary">{store.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone={authenticityTone}>Original ishonchliligi: {store.authenticityScore}%</Badge>
        {store.categories.slice(0, 3).map((category) => (
          <Badge key={category} tone="neutral">
            {CATEGORY_LABELS[category]}
          </Badge>
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        <Feature label="Xaridor himoyasi" enabled={store.buyerProtection} />
        <Feature label="Qaytarish" enabled={store.returnsSupported} />
        <Feature label="O'zbekistonga to'g'ridan-to'g'ri" enabled={store.shipsDirectToUzbekistan} />
        <Feature label="Kuryer omboriga" enabled={store.shipsToForwarder} />
      </ul>

      <p className="mt-3 text-xs text-content-secondary">
        Ma&apos;lumot yangilangan: {formatDate(store.updatedAt)}
      </p>

      <div className="mt-3 flex gap-2">
        {store.learningPlatformId ? (
          <Link
            href={`/learn?platform=${store.learningPlatformId}`}
            className="flex h-11 flex-1 items-center justify-center rounded-sm bg-primary-light text-sm font-semibold text-primary"
          >
            O&apos;rganish
          </Link>
        ) : null}
        <Link
          href={`/stores/${store.slug}`}
          className="flex h-11 flex-1 items-center justify-center rounded-sm border border-border text-sm font-semibold text-content"
        >
          Batafsil
        </Link>
      </div>
    </Card>
  );
}
