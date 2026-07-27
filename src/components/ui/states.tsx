'use client';

import * as React from 'react';
import { AlertTriangle, Inbox, Lock, RefreshCw, WifiOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3 p-4" aria-busy="true" aria-label="Yuklanmoqda">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </div>
  );
}

interface StateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

function StateShell({ title, description, actionLabel, onAction, className, icon }: StateProps) {
  return (
    <div className={cn('card flex flex-col items-center gap-3 p-8 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-light text-primary">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-content">{title}</h3>
      {description ? <p className="text-sm text-content-secondary">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState(props: Omit<StateProps, 'icon'>) {
  return <StateShell {...props} icon={<Inbox className="h-7 w-7" aria-hidden="true" />} />;
}

export function ErrorState(props: Omit<StateProps, 'icon'>) {
  return (
    <StateShell
      {...props}
      icon={<AlertTriangle className="h-7 w-7 text-danger" aria-hidden="true" />}
      actionLabel={props.actionLabel ?? 'Qayta urinish'}
    />
  );
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <StateShell
      title="Internet aloqasi talab qilinadi"
      description="Ulanishni tekshirib, qayta urinib ko'ring."
      actionLabel="Qayta urinish"
      onAction={onRetry}
      icon={<WifiOff className="h-7 w-7" aria-hidden="true" />}
    />
  );
}

export function PermissionDeniedState({ description }: { description?: string }) {
  return (
    <StateShell
      title="Ruxsat yo'q"
      description={description ?? "Bu bo'limga kirish uchun ruxsatingiz mavjud emas."}
      icon={<Lock className="h-7 w-7" aria-hidden="true" />}
    />
  );
}

export function StaleDataNotice({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 rounded-sm bg-warning-bg px-3 py-2 text-xs font-medium text-warning">
      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </p>
  );
}

export function InlineRetry({ onRetry, label }: { onRetry: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
    >
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
