import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { StoreCard } from '@/components/product/store-card';
import { Card } from '@/components/ui/card';
import { SectionHeader } from '@/components/ui/misc';
import { ExternalLinkButton } from '@/components/product/external-link-button';
import { SaveButton } from '@/components/product/save-button';
import { ReviewList } from '@/features/reviews/review-list';
import { getDataSource } from '@/lib/data';

export const dynamic = 'force-dynamic';

/** Pre-renders every store for the static export. */
export async function generateStaticParams() {
  const stores = await getDataSource().listStores();
  return stores.map((store) => ({ slug: store.slug }));
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = getDataSource();
  const store = await data.getStore(slug);
  if (!store) notFound();

  const reviews = (await data.listReviews(store.id)).filter(
    (review) => review.status === 'published',
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={store.name} />

      <StoreCard store={store} />

      <Card className="p-4">
        <SectionHeader title="Nimalarga e'tibor berish kerak" className="mb-2" />
        <ul className="space-y-2 text-[13px] leading-snug text-content-secondary">
          {!store.shipsDirectToUzbekistan ? (
            <li>
              • Bu do&apos;kon O&apos;zbekistonga to&apos;g&apos;ridan-to&apos;g&apos;ri yubormaydi.
              Yetkazish manzili sifatida kuryer ombori manzilini kiriting.
            </li>
          ) : null}
          {store.authenticityScore < 65 ? (
            <li>
              • Platformada soxta tovar ehtimoli yuqoriroq. Sotuvchi reytingi, sotuvlar soni va real
              xaridor rasmlarini tekshiring.
            </li>
          ) : null}
          {!store.returnsSupported ? (
            <li>• Qaytarish qo&apos;llab-quvvatlanmaydi — variantni oldindan aniq tanlang.</li>
          ) : null}
          <li>• To&apos;lov chekini saqlang: bojxonada qiymatni tasdiqlash uchun kerak bo&apos;lishi mumkin.</li>
        </ul>
      </Card>

      <div className="flex gap-2">
        <ExternalLinkButton url={store.url} label="Do'konga o'tish" storeId={store.id} />
        <SaveButton kind="store" refId={store.id} title={store.name} subtitle="Internet-do'kon" />
      </div>

      {store.learningPlatformId ? (
        <Link
          href={`/learn?platform=${store.learningPlatformId}`}
          className="flex h-12 items-center justify-center rounded-sm bg-primary-light text-sm font-semibold text-primary"
        >
          Bu platformada buyurtma qilishni o&apos;rganish
        </Link>
      ) : null}

      <section aria-label="Sharhlar">
        <SectionHeader title="Foydalanuvchi sharhlari" />
        <ReviewList reviews={reviews} subject="store" subjectId={store.id} />
      </section>
    </div>
  );
}
