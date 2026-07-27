import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { StoreCard } from '@/components/product/store-card';
import { EmptyState } from '@/components/ui/states';
import { getDataSource } from '@/lib/data';
import { COUNTRIES, PRODUCT_CATEGORIES, type CountryCode, type ProductCategoryId } from '@/constants';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function isCountry(value: string | undefined): value is CountryCode {
  return value === 'CN' || value === 'US' || value === 'TR' || value === 'UZ';
}

function isCategory(value: string | undefined): value is ProductCategoryId {
  return PRODUCT_CATEGORIES.some((category) => category.id === value);
}

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; category?: string }>;
}) {
  const params = await searchParams;
  const country = isCountry(params.country) ? params.country : undefined;
  const category = isCategory(params.category) ? params.category : undefined;

  const stores = await getDataSource().listStores({ country, category });

  const countryFilters: Array<{ value?: CountryCode; label: string }> = [
    { label: 'Barchasi' },
    { value: 'CN', label: COUNTRIES.CN },
    { value: 'US', label: COUNTRIES.US },
    { value: 'TR', label: COUNTRIES.TR },
  ];

  function href(next: { country?: CountryCode; category?: ProductCategoryId }): string {
    const query = new URLSearchParams();
    if (next.country) query.set('country', next.country);
    if (next.category) query.set('category', next.category);
    const suffix = query.toString();
    return suffix ? `/stores?${suffix}` : '/stores';
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Internet-do'konlar" />

      <div className="scroll-x -mx-4 flex gap-2 px-4">
        {countryFilters.map((filter) => (
          <Link
            key={filter.label}
            href={href({ country: filter.value, category })}
            className={cn(
              'inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-sm font-medium',
              country === filter.value
                ? 'border-primary bg-primary-light text-primary'
                : 'border-border bg-surface text-content-secondary',
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="scroll-x -mx-4 flex gap-2 px-4">
        <Link
          href={href({ country })}
          className={cn(
            'inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-[13px]',
            !category
              ? 'border-primary bg-primary-light text-primary'
              : 'border-border bg-surface text-content-secondary',
          )}
        >
          Barcha kategoriyalar
        </Link>
        {PRODUCT_CATEGORIES.map((item) => (
          <Link
            key={item.id}
            href={href({ country, category: item.id })}
            className={cn(
              'inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-[13px]',
              category === item.id
                ? 'border-primary bg-primary-light text-primary'
                : 'border-border bg-surface text-content-secondary',
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {stores.length === 0 ? (
        <EmptyState
          title="Do'kon topilmadi"
          description="Filtrlarni o'zgartirib ko'ring."
        />
      ) : (
        <div className="space-y-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  );
}
