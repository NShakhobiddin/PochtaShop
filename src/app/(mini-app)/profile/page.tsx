import Link from 'next/link';
import { ChevronRight, Crown, History, Headset, PackageCheck, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProfileIdentity } from '@/features/profile/profile-identity';
import { requireUser } from '@/features/telegram-auth/server';
import { getDataSource } from '@/lib/data';

export const dynamic = 'force-dynamic';

const LINKS = [
  { href: '/profile/history', label: 'Tarix', icon: History },
  { href: '/premium', label: 'Premium tarif', icon: Crown },
  { href: '/consultation', label: 'Konsultatsiyalarim', icon: Headset },
  { href: '/assisted-order', label: 'Buyurtma so‘rovlarim', icon: PackageCheck },
];

export default async function ProfilePage() {
  const { user } = await requireUser();
  const data = getDataSource();
  const [saved, consultations] = await Promise.all([
    data.listSavedItems(user.telegramId),
    data.listConsultations(user.telegramId),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Profil" showBack={false} />

      <ProfileIdentity tier={user.tier} />

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <p className="text-2xl font-extrabold text-primary">{saved.length}</p>
          <p className="text-[13px] text-content-secondary">Saqlangan element</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-extrabold text-primary">{consultations.length}</p>
          <p className="text-[13px] text-content-secondary">Konsultatsiya so&apos;rovi</p>
        </Card>
      </div>

      <Card className="divide-y divide-border">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-[56px] items-center gap-3 px-4 py-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary-light text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="flex-1 text-[15px] font-medium text-content">{link.label}</span>
              <ChevronRight className="h-5 w-5 text-content-secondary" aria-hidden="true" />
            </Link>
          );
        })}
      </Card>

      {user.role !== 'user' ? (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="text-[15px] font-bold text-content">Xizmat panellari</p>
            <Badge tone="primary">{user.role === 'admin' ? 'Admin' : 'Kuryer'}</Badge>
          </div>
          <div className="flex gap-2">
            {user.role === 'admin' ? (
              <Link
                href="/admin"
                className="flex h-11 flex-1 items-center justify-center rounded-sm bg-primary-light text-sm font-semibold text-primary"
              >
                Admin panel
              </Link>
            ) : null}
            <Link
              href="/courier-panel"
              className="flex h-11 flex-1 items-center justify-center rounded-sm border border-border text-sm font-semibold text-content"
            >
              Kuryer kabineti
            </Link>
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <p className="text-[13px] leading-snug text-content-secondary">
          PochtaShop pasport, karta va uy manzili ma&apos;lumotlarini saqlamaydi. Yuklangan rasmlar
          AI tahlilidan so&apos;ng avtomatik o&apos;chiriladi.
        </p>
      </Card>
    </div>
  );
}
