export { cn } from './cn';

export function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function daysBetween(from: string, to: Date = new Date()): number {
  const start = new Date(from).getTime();
  if (Number.isNaN(start)) return Number.POSITIVE_INFINITY;
  return Math.floor((to.getTime() - start) / 86_400_000);
}

/** Tariffs and customs rules older than this are surfaced as possibly stale. */
export const STALE_AFTER_DAYS = 90;

export function isStale(updatedAt: string, maxAgeDays = STALE_AFTER_DAYS): boolean {
  return daysBetween(updatedAt) > maxAgeDays;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

export function truncate(value: string, length: number): string {
  return value.length <= length ? value : `${value.slice(0, length - 1)}…`;
}
