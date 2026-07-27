import { AssistedOrderScreen } from '@/features/consultation/assisted-order-screen';

export const dynamic = 'force-dynamic';

export default async function AssistedOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const params = await searchParams;
  return <AssistedOrderScreen initialUrl={params.product ?? ''} />;
}
