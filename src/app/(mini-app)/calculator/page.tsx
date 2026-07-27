import { CalculatorScreen } from '@/features/customs-calculator/calculator-screen';
import { getDataSource } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function CalculatorPage() {
  const couriers = await getDataSource().listCouriers();
  return <CalculatorScreen couriers={couriers} />;
}
