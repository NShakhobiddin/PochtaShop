import Link from 'next/link';
import { ChevronRight, Play } from 'lucide-react';
import { HomeHeader } from '@/components/layout/home-header';
import { UniversalSearchBar } from '@/features/product-search/universal-search-bar';
import { Icon3D, type Icon3DName } from '@/components/ui/icon-3d';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/ui/misc';
import { getDataSource } from '@/lib/data';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import { PlacementLabelBadge } from '@/components/ads/placement-label';
import { ContinueLearningCard } from '@/features/learning-simulator/continue-card';

const ACTIONS: Array<{
  href: string;
  icon: Icon3DName;
  title: string;
  body: string;
}> = [
  {
    href: '/search',
    icon: 'store',
    title: 'Mahsulot topish',
    body: 'Nom, rasm, screenshot yoki havola orqali.',
  },
  {
    href: '/learn',
    icon: 'learning',
    title: "O'rganish",
    body: 'Pinduoduo, Taobao, Amazon va Trendyol.',
  },
  {
    href: '/calculator',
    icon: 'calculator',
    title: 'Xarajatni hisoblash',
    body: 'Mahsulot, yetkazish va bojxona hisoboti.',
  },
  {
    href: '/customs/risk',
    icon: 'customs',
    title: 'Bojxona xavfi',
    body: 'Tovarni oldindan tekshiring.',
  },
];

export default async function HomePage() {
  const data = getDataSource();
  const [couriers, promotions, products] = await Promise.all([
    data.listCouriers({ sort: 'reliable' }),
    data.listPromotions(),
    data.listProducts(),
  ]);

  const recommendedCouriers = couriers.slice(0, 3);
  const weeklyOffers = promotions.filter((promo) => promo.targetType === 'product');

  return (
    <div className="flex flex-col gap-6">
      <HomeHeader />

      <UniversalSearchBar />

      <section aria-label="Asosiy harakatlar">
        <div className="grid grid-cols-2 gap-3">
          {ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex min-h-[150px] flex-col justify-between rounded-md bg-surface p-4 shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="max-w-[7.5rem] text-[15px] font-bold leading-snug text-content">
                  {action.title}
                </h2>
                <Icon3D name={action.icon} size="sm" />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-content-secondary">{action.body}</p>
              <span className="mt-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-primary">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <ContinueLearningCard />

      <section aria-label="Tavsiya etilgan kuryerlar">
        <SectionHeader
          title="Tavsiya etilgan kuryerlar"
          action={
            <Link href="/couriers" className="text-sm font-semibold text-primary">
              Barchasini ko&apos;rish
            </Link>
          }
        />
        <div className="scroll-x -mx-4 flex gap-3 px-4 pb-1">
          {recommendedCouriers.map((courier) => {
            const cheapest = [...courier.tariffs].sort(
              (a, b) => a.pricePerKgUzs - b.pricePerKgUzs,
            )[0];
            return (
              <Link
                key={courier.id}
                href={`/couriers/${courier.slug}`}
                className="w-[220px] shrink-0"
              >
                <Card className="h-full p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">
                      {courier.logoEmoji}
                    </span>
                    <span className="font-semibold text-content">{courier.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {courier.isVerified ? (
                      <PlacementLabelBadge label="verified_courier" />
                    ) : null}
                    {courier.isSponsored ? <PlacementLabelBadge label="ad" /> : null}
                  </div>
                  {cheapest ? (
                    <p className="mt-3 text-sm text-content-secondary">
                      {formatUzs(cheapest.pricePerKgUzs)} / kg ·{' '}
                      {formatDeliveryDays(cheapest.deliveryDays)}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm font-medium text-content">
                    ⭐ {courier.rating.toFixed(1)}{' '}
                    <span className="font-normal text-content-secondary">
                      ({courier.reviewCount})
                    </span>
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Haftaning takliflari">
        <SectionHeader
          title="Haftaning takliflari"
          action={
            <Link href="/search" className="text-sm font-semibold text-primary">
              Barchasini ko&apos;rish
            </Link>
          }
        />
        <div className="scroll-x -mx-4 flex gap-3 px-4 pb-1">
          {weeklyOffers.map((promo) => {
            const product = products.find((item) => item.id === promo.targetId);
            if (!product) return null;
            return (
              <Link
                key={promo.id}
                href={`/product/${product.slug}`}
                className="w-[280px] shrink-0"
              >
                <div className="flex h-full flex-col justify-between rounded-md bg-gradient-primary p-4 text-white shadow-card">
                  <PlacementLabelBadge label={promo.label} onDark />
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[15px] font-bold leading-snug">{product.title}</p>
                      <p className="mt-1 text-xs text-white/80">{promo.body}</p>
                    </div>
                    <span className="text-4xl" aria-hidden="true">
                      {product.imageEmoji}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section aria-label="Mutaxassis yordami">
        <Card className="flex items-center gap-4 p-4">
          <Icon3D name="consultation" />
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-content">Mutaxassis yordami</h2>
            <p className="mt-0.5 text-sm text-content-secondary">
              Aniqroq hisob-kitob va shaxsiy maslahat uchun pulli konsultatsiya oling.
            </p>
          </div>
          <Link
            href="/consultation"
            aria-label="Konsultatsiya olish"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Link>
        </Card>
      </section>

      <section aria-label="Oxirgi tahlillar" className="pb-2">
        <Card className="flex items-center gap-4 p-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-light text-primary">
            <Play className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 className="text-[15px] font-bold text-content">Oxirgi tahlillar</h2>
            <p className="text-sm text-content-secondary">
              Qidiruv va AI tahlillaringiz tarixda saqlanadi.
            </p>
          </div>
          <Link href="/profile/history" className="text-sm font-semibold text-primary">
            Ochish
          </Link>
        </Card>
      </section>

      <Badge tone="outline" className="mx-auto">
        Demo ma&apos;lumotlar bilan ishlamoqda
      </Badge>
    </div>
  );
}
