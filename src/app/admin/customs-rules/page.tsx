'use client';

import { Card } from '@/components/ui/card';
import { AdminPageTitle, AdminTable } from '@/features/admin/admin-ui';
import { CUSTOMS, CUSTOMS_DISCLAIMER } from '@/constants';

interface Rule {
  code: string;
  label: string;
  value: string;
}

const RULES: Rule[] = [
  { code: 'duty_free_limit', label: 'Bojsiz limit (jo\'natma)', value: `${CUSTOMS.DUTY_FREE_LIMIT_USD} USD` },
  { code: 'monthly_allowance', label: "Oylik bojsiz me'yor", value: `${CUSTOMS.MONTHLY_ALLOWANCE_USD} USD` },
  { code: 'duty_rate', label: 'Bojxona boji stavkasi', value: `${Math.round(CUSTOMS.DUTY_RATE * 100)}%` },
  { code: 'vat_rate', label: 'QQS stavkasi', value: `${Math.round(CUSTOMS.VAT_RATE * 100)}%` },
  {
    code: 'clearance_fee',
    label: "Rasmiylashtirish yig'imi",
    value: `${CUSTOMS.CLEARANCE_FEE_UZS.toLocaleString('uz-UZ')} so'm`,
  },
];

export default function AdminCustomsRulesPage() {
  return (
    <>
      <AdminPageTitle
        title="Bojxona qoidalari"
        subtitle="Qoidalar versiyalanadi: oldingi qiymat, yangi qiymat, o'zgartirgan admin va kuchga kirish sanasi customs_rules jadvalida saqlanadi"
      />

      <AdminTable<Rule>
        rows={RULES}
        getKey={(row) => row.code}
        emptyLabel="Qoidalar yo'q"
        columns={[
          { header: 'Kod', render: (row) => row.code },
          { header: 'Nomi', render: (row) => row.label },
          { header: 'Amaldagi qiymat', render: (row) => row.value },
          { header: 'Kuchga kirgan', render: () => CUSTOMS.UPDATED_AT },
        ]}
      />

      <Card className="mt-5 p-4">
        <p className="text-sm text-content-secondary">
          Huquqiy manba: {CUSTOMS.LEGAL_SOURCE}
        </p>
        <p className="mt-2 text-sm text-content-secondary">{CUSTOMS_DISCLAIMER}</p>
      </Card>
    </>
  );
}
