import { SearchScreen } from '@/features/product-search/search-screen';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  return <SearchScreen initialQuery={params.q ?? ''} />;
}
