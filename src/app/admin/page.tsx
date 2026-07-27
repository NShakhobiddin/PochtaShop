'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  AdminPageTitle,
  AdminSectionState,
  StatCard,
  useAdminSection,
} from '@/features/admin/admin-ui';

interface DashboardStats {
  users: number;
  premiumUsers: number;
  consultations: number;
  openConsultations: number;
  assistedOrders: number;
  activeCouriers: number;
  staleTariffs: number;
  pendingReviews: number;
  auditEntries: number;
}

const SHORTCUTS = [
  { href: '/admin/consultations', label: 'Konsultatsiyalarni ko‘rish' },
  { href: '/admin/reviews', label: 'Sharhlarni moderatsiya qilish' },
  { href: '/admin/couriers', label: 'Kuryer tariflarini tekshirish' },
  { href: '/admin/audit', label: 'Audit logni ochish' },
];

export default function AdminDashboard() {
  const { data, status, reload } = useAdminSection<DashboardStats>('dashboard');

  return (
    <>
      <AdminPageTitle title="Dashboard" subtitle="Asosiy ko'rsatkichlar" />

      <AdminSectionState status={status} onRetry={reload} />

      {status === 'ready' && data ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Foydalanuvchilar" value={data.users} />
            <StatCard label="Premium foydalanuvchilar" value={data.premiumUsers} />
            <StatCard
              label="Konsultatsiya so'rovlari"
              value={data.consultations}
              hint={`${data.openConsultations} ta ochiq`}
            />
            <StatCard label="Buyurtma so'rovlari" value={data.assistedOrders} />
            <StatCard label="Faol kuryerlar" value={data.activeCouriers} />
            <StatCard
              label="Eskirgan tariflar"
              value={data.staleTariffs}
              hint="90 kundan eski"
            />
            <StatCard label="Moderatsiya kutayotgan sharhlar" value={data.pendingReviews} />
            <StatCard label="Audit yozuvlari" value={data.auditEntries} />
          </div>

          <Card className="mt-5 p-4">
            <h2 className="text-base font-semibold text-content">Tezkor havolalar</h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.href}>
                  <Link
                    href={shortcut.href}
                    className="block rounded-sm border border-border px-4 py-3 text-sm text-content hover:bg-surface-muted"
                  >
                    {shortcut.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </>
      ) : null}
    </>
  );
}
