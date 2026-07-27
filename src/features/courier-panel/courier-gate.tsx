'use client';

import * as React from 'react';
import type { AppUser } from '@/types';
import { apiFetch } from '@/lib/api/client';
import { useAsyncData } from '@/hooks/use-async-data';
import { ListSkeleton, PermissionDeniedState, ErrorState } from '@/components/ui/states';

const fetchMe = () => apiFetch<AppUser>('/api/me');

/** Convenience gate; the courier API verifies the role server-side as well. */
export function CourierGate({ children }: { children: React.ReactNode }) {
  const { data, status, reload } = useAsyncData<AppUser>(fetchMe);

  if (status === 'loading') return <ListSkeleton count={2} />;

  if (status !== 'ready' || !data) {
    return (
      <ErrorState
        title="Kirish tekshirilmadi"
        description="Kuryer kabinetiga kirish uchun Telegram orqali autentifikatsiyadan o'ting."
        onAction={reload}
      />
    );
  }

  if (data.role !== 'courier' && data.role !== 'admin') {
    return (
      <PermissionDeniedState description="Bu bo'lim kuryer vakillari uchun. Ruxsat olish uchun administratorga murojaat qiling." />
    );
  }

  return <>{children}</>;
}
