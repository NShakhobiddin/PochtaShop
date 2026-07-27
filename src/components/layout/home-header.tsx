'use client';

import * as React from 'react';
import Link from 'next/link';
import { History, User } from 'lucide-react';
import { useTelegram } from '@/features/telegram-auth/telegram-provider';
import { APP_NAME } from '@/constants';

export function HomeHeader() {
  const { user } = useTelegram();

  return (
    <header className="mb-4 flex items-center justify-between gap-3 pt-3 safe-top">
      <Link href="/" className="text-[22px] font-extrabold tracking-tight text-primary">
        Pochta<span className="text-primary-dark">Shop</span>
        <span className="sr-only"> — {APP_NAME}</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/profile/history"
          aria-label="Tarix"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-content-secondary"
        >
          <History className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link
          href="/profile"
          aria-label="Profil"
          className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-light text-primary"
        >
          {user?.photoUrl ? (
            // Telegram avatars are remote and small; next/image adds no value here.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5" aria-hidden="true" />
          )}
        </Link>
      </div>
    </header>
  );
}
