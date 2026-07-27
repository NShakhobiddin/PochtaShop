import { CustomsRiskScreen } from '@/features/customs-risk/customs-risk-screen';
import { PRODUCT_CATEGORIES, type ProductCategoryId } from '@/constants';

export const dynamic = 'force-dynamic';

export default async function CustomsRiskPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string; category?: string }>;
}) {
  const params = await searchParams;
  const category = PRODUCT_CATEGORIES.find((item) => item.id === params.category)?.id;

  return (
    <CustomsRiskScreen
      initialItem={params.item ?? ''}
      initialCategory={(category as ProductCategoryId) ?? 'electronics'}
    />
  );
}
