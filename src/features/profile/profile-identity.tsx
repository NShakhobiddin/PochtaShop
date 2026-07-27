'use client';

import * as React from 'react';
import { User } from 'lucide-react';
import type { SubscriptionTier } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTelegram } from '@/features/telegram-auth/telegram-provider';

export function ProfileIdentity({ tier }: { tier: SubscriptionTier }) {
  const { user, insideTelegram } = useTelegram();
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : 'Foydalanuvchi';

  return (
    <Card className="flex items-center gap-4 p-4">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-light text-primary">
        {user?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <User className="h-7 w-7" aria-hidden="true" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-bold text-content">{name}</p>
        {user?.username ? (
          <p className="truncate text-[13px] text-content-secondary">@{user.username}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge tone={tier === 'premium' ? 'primary' : 'neutral'}>
            {tier === 'premium' ? 'Premium' : 'Bepul tarif'}
          </Badge>
          {!insideTelegram ? <Badge tone="outline">Brauzer rejimi</Badge> : null}
        </div>
      </div>
    </Card>
  );
}
