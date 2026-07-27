'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bookmark, Home, Search, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram/webapp';

const ITEMS = [
  { href: '/', label: 'Bosh sahifa', icon: Home },
  { href: '/search', label: 'Qidiruv', icon: Search },
  { href: '/ai', label: 'AI', icon: Sparkles, accent: true },
  { href: '/saved', label: 'Saqlanganlar', icon: Bookmark },
  { href: '/profile', label: 'Profil', icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Asosiy navigatsiya"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1.5">
        {ITEMS.map((item) => {
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                onClick={() => haptic('selection')}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-sm px-1 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-content-secondary',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-11 items-center justify-center rounded-full transition-colors',
                    'accent' in item && item.accent && active && 'bg-primary-light',
                    'accent' in item && item.accent && !active && 'bg-surface-muted',
                  )}
                >
                  <Icon className="h-[22px] w-[22px]" aria-hidden="true" strokeWidth={active ? 2.4 : 1.9} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
