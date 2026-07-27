import { CourierListScreen } from '@/features/courier-comparison/courier-list-screen';
import { getDataSource } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function CouriersPage() {
  const couriers = await getDataSource().listCouriers();
  return <CourierListScreen couriers={couriers} />;
}
