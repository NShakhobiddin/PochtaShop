'use client';

import type { Courier, CourierTariff } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageTitle,
  AdminSectionState,
  AdminTable,
  useAdminSection,
} from '@/features/admin/admin-ui';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import { COUNTRIES } from '@/constants';
import { formatDate, isStale } from '@/lib/utils';

interface TariffRow extends CourierTariff {
  courierName: string;
}

export default function AdminTariffsPage() {
  const { data, status, reload } = useAdminSection<Courier[]>('couriers');

  const rows: TariffRow[] = (data ?? []).flatMap((courier) =>
    courier.tariffs.map((tariff) => ({ ...tariff, courierName: courier.name })),
  );

  return (
    <>
      <AdminPageTitle
        title="Tariflar"
        subtitle="Har bir tarif kuchga kirish va yangilanish sanasi bilan saqlanadi"
      />
      <AdminSectionState status={status} onRetry={reload} />
      {status === 'ready' ? (
        <AdminTable<TariffRow>
          rows={rows}
          getKey={(row) => row.id}
          emptyLabel="Tariflar yo'q"
          columns={[
            { header: 'Kuryer', render: (row) => row.courierName },
            {
              header: "Yo'nalish",
              render: (row) => `${COUNTRIES[row.fromCountry]} → ${COUNTRIES[row.toCountry]}`,
            },
            { header: 'Xizmat', render: (row) => row.serviceType },
            { header: '1 kg', render: (row) => formatUzs(row.pricePerKgUzs) },
            { header: 'Minimal', render: (row) => formatUzs(row.minChargeUzs) },
            { header: 'Muddat', render: (row) => formatDeliveryDays(row.deliveryDays) },
            { header: "Bo'luvchi", render: (row) => row.volumetricDivisor },
            { header: 'Kuchga kirgan', render: (row) => formatDate(row.effectiveFrom) },
            {
              header: 'Yangilangan',
              render: (row) => (
                <span>
                  {formatDate(row.updatedAt)}
                  {isStale(row.updatedAt) ? (
                    <Badge tone="warning" className="ml-1">
                      Eskirgan
                    </Badge>
                  ) : null}
                </span>
              ),
            },
          ]}
        />
      ) : null}
    </>
  );
}
