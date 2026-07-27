import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { CourierCard } from '@/components/courier/courier-card';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/misc';
import { SaveButton } from '@/components/product/save-button';
import { ExternalLinkButton } from '@/components/product/external-link-button';
import { VolumetricCalculator } from '@/features/courier-comparison/volumetric-calculator';
import { ReviewList } from '@/features/reviews/review-list';
import { getDataSource } from '@/lib/data';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import { COUNTRIES } from '@/constants';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const SERVICE_LABEL = {
  economy: 'Ekonom',
  standard: 'Standart',
  express: 'Ekspress',
} as const;

export default async function CourierDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getDataSource();
  const courier = await data.getCourier(slug);
  if (!courier) notFound();

  const reviews = (await data.listReviews(courier.id)).filter(
    (review) => review.status === 'published',
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={courier.name} />

      <CourierCard courier={courier} />

      <Card className="p-4">
        <SectionHeader title="Tariflar" className="mb-2" />
        <div className="space-y-3">
          {courier.tariffs.map((tariff) => (
            <div key={tariff.id} className="rounded-sm border border-border p-3">
              <p className="text-sm font-bold text-content">
                {COUNTRIES[tariff.fromCountry]} → {COUNTRIES[tariff.toCountry]} ·{' '}
                {SERVICE_LABEL[tariff.serviceType]}
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]">
                <div className="flex justify-between gap-2">
                  <dt className="text-content-secondary">1 kg narxi</dt>
                  <dd className="font-medium text-content">{formatUzs(tariff.pricePerKgUzs)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-content-secondary">Minimal</dt>
                  <dd className="font-medium text-content">{formatUzs(tariff.minChargeUzs)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-content-secondary">Muddat</dt>
                  <dd className="font-medium text-content">
                    {formatDeliveryDays(tariff.deliveryDays)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-content-secondary">Hajmiy bo&apos;luvchi</dt>
                  <dd className="font-medium text-content">{tariff.volumetricDivisor}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-content-secondary">
                Kuchga kirgan: {formatDate(tariff.effectiveFrom)} · Yangilangan:{' '}
                {formatDate(tariff.updatedAt)}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <VolumetricCalculator
        defaultDivisor={courier.tariffs[0]?.volumetricDivisor ?? 6000}
        pricePerKgUzs={courier.tariffs[0]?.pricePerKgUzs}
        minChargeUzs={courier.tariffs[0]?.minChargeUzs}
      />

      <div className="flex gap-2">
        <ExternalLinkButton url={courier.supportChannel} label="Kuryer bilan bog'lanish" />
        <SaveButton kind="courier" refId={courier.id} title={courier.name} subtitle="Kuryer" />
      </div>

      <section aria-label="Sharhlar">
        <SectionHeader title="Foydalanuvchi sharhlari" />
        <ReviewList reviews={reviews} subject="courier" subjectId={courier.id} />
      </section>
    </div>
  );
}
