import Link from 'next/link';
import { AdminGate } from '@/features/admin/admin-gate';
import { TelegramProvider } from '@/features/telegram-auth/telegram-provider';

const SECTIONS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Foydalanuvchilar' },
  { href: '/admin/stores', label: "Internet-do'konlar" },
  { href: '/admin/categories', label: 'Mahsulot kategoriyalari' },
  { href: '/admin/couriers', label: 'Kuryerlar' },
  { href: '/admin/tariffs', label: 'Tariflar' },
  { href: '/admin/customs-rules', label: 'Bojxona qoidalari' },
  { href: '/admin/prohibited', label: 'Taqiqlangan tovarlar' },
  { href: '/admin/restricted', label: 'Cheklangan tovarlar' },
  { href: '/admin/courses', label: "O'quv kurslari" },
  { href: '/admin/course-steps', label: 'Dars bosqichlari' },
  { href: '/admin/promotions', label: 'Aksiyalar' },
  { href: '/admin/reviews', label: 'Sharhlar' },
  { href: '/admin/consultations', label: 'Konsultatsiyalar' },
  { href: '/admin/orders', label: "Buyurtma so'rovlari" },
  { href: '/admin/premium', label: 'Premium' },
  { href: '/admin/ads', label: 'Reklama' },
  { href: '/admin/ai-logs', label: 'AI loglari' },
  { href: '/admin/settings', label: 'Sozlamalar' },
  { href: '/admin/audit', label: 'Audit log' },
];

/** Desktop-first shell: a persistent sidebar plus a keyboard-reachable nav. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      <AdminGate>
        <div className="flex min-h-dvh bg-background">
          <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
            <div className="px-5 py-5">
              <Link href="/admin" className="text-lg font-extrabold text-primary">
                PochtaShop <span className="text-content-secondary">admin</span>
              </Link>
            </div>
            <nav aria-label="Admin bo'limlari" className="px-2 pb-6">
              <ul className="space-y-0.5">
                {SECTIONS.map((section) => (
                  <li key={section.href}>
                    <Link
                      href={section.href}
                      className="block rounded-sm px-3 py-2 text-sm text-content-secondary hover:bg-surface-muted hover:text-content focus-visible:bg-surface-muted"
                    >
                      {section.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            <header className="border-b border-border bg-surface px-5 py-3 lg:hidden">
              <Link href="/admin" className="text-base font-extrabold text-primary">
                PochtaShop admin
              </Link>
              <nav aria-label="Admin bo'limlari" className="scroll-x mt-2 flex gap-2">
                {SECTIONS.map((section) => (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-content-secondary"
                  >
                    {section.label}
                  </Link>
                ))}
              </nav>
            </header>

            <main className="p-5">{children}</main>
          </div>
        </div>
      </AdminGate>
    </TelegramProvider>
  );
}
