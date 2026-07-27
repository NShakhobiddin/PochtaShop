'use client';

import * as React from 'react';
import type { AppUser } from '@/types';
import { apiFetch } from '@/lib/api/client';
import { useAsyncData } from '@/hooks/use-async-data';
import { ListSkeleton, PermissionDeniedState, ErrorState } from '@/components/ui/states';

const fetchMe = () => apiFetch<AppUser>('/api/me');

/**
 * Client-side gate for the admin shell. It is a convenience only — every admin
 * API route independently verifies the caller's role on the server.
 */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { data, status, reload } = useAsyncData<AppUser>(fetchMe);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-md p-6">
        <ListSkeleton count={2} />
      </div>
    );
  }

  if (status !== 'ready' || !data) {
    return (
      <div className="mx-auto max-w-md p-6">
        <ErrorState
          title="Kirish tekshirilmadi"
          description="Admin panelga kirish uchun Telegram orqali autentifikatsiyadan o'ting."
          onAction={reload}
        />
      </div>
    );
  }

  if (data.role !== 'admin') {
    return (
      <div className="mx-auto max-w-md p-6">
        <PermissionDeniedState description="Bu bo'lim faqat administratorlar uchun." />
      </div>
    );
  }

  return <>{children}</>;
}
