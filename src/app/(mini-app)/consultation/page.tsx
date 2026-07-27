import { ConsultationScreen } from '@/features/consultation/consultation-screen';
import { CONSULTATION_TYPES } from '@/features/consultation/types';
import type { ConsultationType } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ConsultationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const initialType = CONSULTATION_TYPES.find((item) => item.value === params.type)?.value;
  return <ConsultationScreen initialType={(initialType as ConsultationType) ?? 'product_selection'} />;
}
