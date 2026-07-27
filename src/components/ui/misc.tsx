'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Progress({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div
          className="h-full rounded-full bg-gradient-primary transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-primary">{clamped}%</span>
    </div>
  );
}

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function Chip({ selected, className, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors',
        selected
          ? 'border-primary bg-primary-light text-primary'
          : 'border-border bg-surface text-content-secondary hover:border-primary/40',
        className,
      )}
      {...props}
    >
      {selected ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      <h2 className="text-[17px] font-bold text-content">{title}</h2>
      {action}
    </div>
  );
}

export function Stepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-start justify-between gap-1" aria-label="Bosqichlar">
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'active' : 'todo';
        return (
          <li key={step} className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <div className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1', index === 0 ? 'bg-transparent' : state === 'todo' ? 'bg-border' : 'bg-primary')} />
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  state === 'done' && 'bg-primary text-white',
                  state === 'active' && 'bg-primary text-white ring-4 ring-primary-light',
                  state === 'todo' && 'bg-surface-muted text-content-secondary',
                )}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                {state === 'done' ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={cn('h-0.5 flex-1', index === steps.length - 1 ? 'bg-transparent' : state === 'done' ? 'bg-primary' : 'bg-border')} />
            </div>
            <span
              className={cn(
                'text-[11px] leading-tight',
                state === 'todo' ? 'text-content-secondary' : 'font-semibold text-primary',
              )}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-t border-border', className)} />;
}

export function KeyValueRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className={cn('text-sm', strong ? 'font-semibold text-content' : 'text-content-secondary')}>
        {label}
      </span>
      <span className={cn('text-right text-sm', strong ? 'text-base font-bold text-primary' : 'font-medium text-content')}>
        {value}
      </span>
    </div>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-border',
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all',
          checked ? 'left-6' : 'left-1',
        )}
      />
    </button>
  );
}
