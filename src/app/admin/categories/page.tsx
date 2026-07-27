'use client';

import { AdminPageTitle, AdminTable } from '@/features/admin/admin-ui';
import { PRODUCT_CATEGORIES } from '@/constants';

type Category = (typeof PRODUCT_CATEGORIES)[number];

export default function AdminCategoriesPage() {
  return (
    <>
      <AdminPageTitle
        title="Mahsulot kategoriyalari"
        subtitle="Kategoriyalar moslik tekshiruvi va bojxona qoidalariga bog'langan"
      />
      <AdminTable<Category>
        rows={[...PRODUCT_CATEGORIES]}
        getKey={(row) => row.id}
        emptyLabel="Kategoriyalar yo'q"
        columns={[
          { header: 'Kod', render: (row) => row.id },
          { header: 'Nomi', render: (row) => row.label },
        ]}
      />
    </>
  );
}
