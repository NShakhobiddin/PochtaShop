import { Check, X } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon3D } from '@/components/ui/icon-3d';
import { PremiumCta } from '@/features/subscriptions/premium-cta';
import { PLAN_FEATURES, PREMIUM_PRICE_UZS } from '@/features/subscriptions/plans';
import { requireUser } from '@/features/telegram-auth/server';
import { formatUzs } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export default async function PremiumPage() {
  const { user } = await requireUser();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Premium tarif" />

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Icon3D name="ai" />
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[17px] font-bold text-content">Premium</p>
              {user.tier === 'premium' ? <Badge tone="success">Faol</Badge> : null}
            </div>
            <p className="text-[13px] text-content-secondary">
              {formatUzs(PREMIUM_PRICE_UZS)} / oy
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <caption className="sr-only">Bepul va Premium tariflar taqqoslash</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="p-3 text-left font-semibold text-content">
                Imkoniyat
              </th>
              <th scope="col" className="w-16 p-3 text-center font-semibold text-content-secondary">
                Bepul
              </th>
              <th scope="col" className="w-16 p-3 text-center font-semibold text-primary">
                Premium
              </th>
            </tr>
          </thead>
          <tbody>
            {PLAN_FEATURES.map((feature) => (
              <tr key={feature.label} className="border-b border-border last:border-0">
                <th scope="row" className="p-3 text-left font-normal text-content-secondary">
                  {feature.label}
                </th>
                <td className="p-3 text-center">
                  <FeatureMark enabled={feature.free} />
                </td>
                <td className="p-3 text-center">
                  <FeatureMark enabled={feature.premium} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <PremiumCta tier={user.tier} />

      <Card className="p-4">
        <p className="text-[13px] leading-snug text-content-secondary">
          Birinchi versiyada Premium admin tomonidan faollashtiriladi. To&apos;lov provayderi
          keyinchalik ulanadi — kod bazasi buning uchun tayyor.
        </p>
      </Card>
    </div>
  );
}

function FeatureMark({ enabled }: { enabled: boolean }) {
  return enabled ? (
    <>
      <Check className="mx-auto h-4 w-4 text-success" aria-hidden="true" />
      <span className="sr-only">Mavjud</span>
    </>
  ) : (
    <>
      <X className="mx-auto h-4 w-4 text-content-secondary" aria-hidden="true" />
      <span className="sr-only">Mavjud emas</span>
    </>
  );
}
