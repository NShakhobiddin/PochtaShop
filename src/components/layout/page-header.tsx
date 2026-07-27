'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram/webapp';

export interface PageHeaderProps {
  title: string;
  action?: React.ReactNode;
  /** Hidden inside Telegram, where the native back button is used instead. */
  showBack?: boolean;
  className?: string;
}

export function PageHeader({ title, action, showBack = true, className }: PageHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 bg-background/90 px-4 pb-3 pt-3 backdrop-blur safe-top',
        className,
      )}
    >
      {showBack ? (
        <button
          type="button"
          aria-label="Orqaga"
          onClick={() => {
            haptic('light');
            router.back();
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-content"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}
      <h1 className="flex-1 truncate text-[19px] font-bold text-content">{title}</h1>
      {action}
    </header>
  );
}
