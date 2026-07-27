import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KeyValueRow, SectionHeader } from '@/components/ui/misc';
import { RiskBadge } from '@/components/customs/risk-badge';
import { PlacementLabelBadge } from '@/components/ads/placement-label';
import { ExternalLinkButton } from '@/components/product/external-link-button';
import { SaveButton } from '@/components/product/save-button';
import { CompatibilityChecker } from '@/features/product-search/compatibility-checker';
import { getDataSource } from '@/lib/data';
import { formatMoney, formatUzs, formatDeliveryDays, toUzs } from '@/lib/currency';
import { calculateCustoms } from '@/features/customs-calculator/calculate';
import { evaluateCustomsRisk } from '@/features/customs-risk/risk';
import { quoteCourier } from '@/features/courier-comparison/quote';
import { COUNTRIES, CATEGORY_LABELS } from '@/constants';

export const dynamic = 'force-dynamic';

/** Pre-renders every catalogue product for the static export. */
export async function generateStaticParams() {
  const products = await getDataSource().listProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getDataSource();
  const product = await data.getProduct(slug);
  if (!product) notFound();

  const [offers, couriers, restrictedGoods] = await Promise.all([
    data.listOffers(product.id),
    data.listCouriers(),
    data.listRestrictedGoods(),
  ]);

  const bestOffer = [...offers].sort(
    (a, b) => toUzs(a.price.amount, a.price.currency) - toUzs(b.price.amount, b.price.currency),
  )[0];

  if (!bestOffer) notFound();

  const [store, seller] = await Promise.all([
    data.getStore(bestOffer.storeId),
    data.getSeller(bestOffer.sellerId),
  ]);

  const quotes = couriers
    .flatMap((courier) =>
      quoteCourier(courier, {
        fromCountry: bestOffer.shippingFrom,
        actualWeightKg: product.weightKg,
        dimensionsCm: product.dimensionsCm,
      }).map((quote) => ({ quote, courier })),
    )
    .sort((a, b) => a.quote.costUzs - b.quote.costUzs);

  const recommended = quotes[0];

  const customs = calculateCustoms({
    category: product.category,
    itemName: product.title,
    quantity: 1,
    declaredValue: bestOffer.price.amount,
    currency: bestOffer.price.currency,
    weightKg: product.weightKg,
    shippingCostUzs: recommended?.quote.costUzs ?? 0,
    fromCountry: bestOffer.shippingFrom,
    previousMonthlyValueUsd: 0,
    purpose: 'personal',
  });

  const risk = evaluateCustomsRisk(
    {
      itemName: product.title,
      category: product.category,
      declaredValue: bestOffer.price.amount,
      currency: bestOffer.price.currency,
      quantity: 1,
      weightKg: product.weightKg,
      fromCountry: bestOffer.shippingFrom,
      purpose: 'personal',
      hasBrandLogo: Boolean(product.brand),
    },
    restrictedGoods,
  );

  const discount =
    bestOffer.oldPrice && bestOffer.oldPrice.amount > bestOffer.price.amount
      ? Math.round((1 - bestOffer.price.amount / bestOffer.oldPrice.amount) * 100)
      : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Mahsulot" />

      <Card className="p-4">
        <div className="flex items-start gap-4">
          <span
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-surface-muted text-5xl"
            aria-hidden="true"
          >
            {product.imageEmoji}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] font-bold leading-snug text-content">{product.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-2xl font-extrabold text-primary">
                {formatMoney(bestOffer.price.amount, bestOffer.price.currency)}
              </span>
              {bestOffer.oldPrice ? (
                <span className="text-sm text-content-secondary line-through">
                  {formatMoney(bestOffer.oldPrice.amount, bestOffer.oldPrice.currency)}
                </span>
              ) : null}
              {discount ? <Badge tone="danger">-{discount}%</Badge> : null}
            </div>
            <p className="mt-1 text-[13px] text-content-secondary">
              ≈ {formatUzs(toUzs(bestOffer.price.amount, bestOffer.price.currency))}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{CATEGORY_LABELS[product.category]}</Badge>
              {bestOffer.isSponsored ? <PlacementLabelBadge label="ad" /> : null}
              {product.isDemo ? <Badge tone="outline">Demo</Badge> : null}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-snug text-content-secondary">{product.description}</p>
      </Card>

      {store && seller ? (
        <Card className="p-4">
          <SectionHeader title="Do'kon va sotuvchi" className="mb-2" />
          <KeyValueRow
            label="Do'kon"
            value={
              <Link href={`/stores/${store.slug}`} className="text-primary">
                {store.logoEmoji} {store.name}
              </Link>
            }
          />
          <KeyValueRow label="Davlat" value={COUNTRIES[store.country]} />
          <KeyValueRow label="Sotuvchi" value={seller.name} />
          <KeyValueRow
            label="Sotuvchi reytingi"
            value={
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
                {seller.rating.toFixed(1)}
              </span>
            }
          />
          <KeyValueRow label="Sotuvlar soni" value={seller.salesCount.toLocaleString('uz-UZ')} />
          <KeyValueRow label="Sharhlar soni" value={seller.reviewCount.toLocaleString('uz-UZ')} />
          <KeyValueRow
            label="Rasmiy do'kon"
            value={seller.officialStore ? 'Ha' : "Yo'q"}
          />
          <KeyValueRow
            label="Original bo'lish ehtimoli"
            value={`${product.authenticityLikelihood}%`}
          />
          <KeyValueRow label="Qaytarish" value={product.returnPolicy} />
          <KeyValueRow
            label="Yetkazish (do'kondan omborga)"
            value={formatDeliveryDays(bestOffer.estimatedDeliveryDays)}
          />
        </Card>
      ) : null}

      {product.variants.length > 0 ? (
        <Card className="p-4">
          <SectionHeader title="Mavjud variantlar" className="mb-2" />
          <div className="flex flex-wrap gap-2">
            {product.variants.map((variant) => (
              <Badge key={variant.id} tone={variant.available ? 'primary' : 'neutral'}>
                {variant.label}
                {!variant.available ? ' — mavjud emas' : ''}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}

      <CompatibilityChecker category={product.category} />

      {recommended ? (
        <Card className="p-4">
          <SectionHeader title="Kuryer tavsiyasi" className="mb-2" />
          <KeyValueRow
            label="Kuryer"
            value={`${recommended.courier.logoEmoji} ${recommended.courier.name}`}
          />
          <KeyValueRow
            label="Hisoblanadigan og'irlik"
            value={`${recommended.quote.chargeableWeightKg} kg`}
          />
          <KeyValueRow label="Yetkazish narxi" value={formatUzs(recommended.quote.costUzs)} />
          <KeyValueRow label="Muddat" value={formatDeliveryDays(recommended.quote.deliveryDays)} />
          <Link
            href={`/couriers?country=${bestOffer.shippingFrom}`}
            className="mt-2 inline-block text-sm font-semibold text-primary"
          >
            Boshqa kuryerlarni taqqoslash
          </Link>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-[17px] font-bold text-content">Bojxona va yakuniy xarajat</h2>
          <RiskBadge level={risk.level} />
        </div>
        <KeyValueRow label="Mahsulot" value={formatUzs(customs.goodsCostUzs)} />
        <KeyValueRow label="Yetkazish" value={formatUzs(customs.shippingCostUzs)} />
        <KeyValueRow label="Taxminiy bojxona" value={formatUzs(customs.totalCustomsUzs)} />
        <div className="mt-2 border-t border-border pt-2">
          <KeyValueRow label="Jami taxminiy" value={formatUzs(customs.grandTotalUzs)} strong />
        </div>
        <p className="mt-2 text-xs leading-snug text-content-secondary">{customs.disclaimer}</p>
        <Link
          href={`/customs/risk?item=${encodeURIComponent(product.title)}&category=${product.category}`}
          className="mt-2 inline-block text-sm font-semibold text-primary"
        >
          Bojxona xavfini batafsil tekshirish
        </Link>
      </Card>

      <div className="flex gap-2">
        <ExternalLinkButton
          url={bestOffer.affiliateUrl ?? store?.url ?? '#'}
          label="Do'konga o'tish"
          storeId={store?.id}
          isAffiliate={Boolean(bestOffer.affiliateUrl)}
        />
        <SaveButton kind="product" refId={product.id} title={product.title} subtitle={store?.name} />
      </div>

      <div className="flex gap-2">
        <Link
          href={`/seller-assistant?product=${product.id}`}
          className="flex h-12 flex-1 items-center justify-center rounded-sm border border-border text-sm font-semibold text-content"
        >
          Sotuvchiga yozish
        </Link>
        <Link
          href={`/assisted-order?product=${encodeURIComponent(store?.url ?? '')}`}
          className="flex h-12 flex-1 items-center justify-center rounded-sm bg-primary-light text-sm font-semibold text-primary"
        >
          Men uchun buyurtma bering
        </Link>
      </div>

      {offers.length > 1 ? (
        <Card className="p-4">
          <SectionHeader title="Boshqa takliflar" className="mb-2" />
          <div className="space-y-2">
            {offers.map((offer) => (
              <div key={offer.id} className="flex items-center justify-between gap-2 text-[13px]">
                <span className="text-content-secondary">
                  {COUNTRIES[offer.shippingFrom]} · {formatDeliveryDays(offer.estimatedDeliveryDays)}
                </span>
                <span className="font-semibold text-content">
                  {formatMoney(offer.price.amount, offer.price.currency)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
