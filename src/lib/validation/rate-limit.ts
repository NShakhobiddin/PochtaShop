import { RateLimitError } from '@/lib/api/response';

interface Bucket {
  count: number;
  resetAt: number;
}

const globalStore = globalThis as typeof globalThis & {
  __pochtashopRateLimit?: Map<string, Bucket>;
};

function store(): Map<string, Bucket> {
  if (!globalStore.__pochtashopRateLimit) globalStore.__pochtashopRateLimit = new Map();
  return globalStore.__pochtashopRateLimit;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  ai: { limit: 20, windowMs: 60_000 },
  upload: { limit: 10, windowMs: 60_000 },
  write: { limit: 30, windowMs: 60_000 },
  read: { limit: 120, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitOptions>;

/**
 * Fixed-window limiter keyed by feature + caller. In-process by design: a
 * multi-instance deployment should point this at Redis or Supabase.
 */
export function checkRateLimit(key: string, options: RateLimitOptions, now = Date.now()): void {
  const bucket = store().get(key);

  if (!bucket || bucket.resetAt <= now) {
    store().set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (bucket.count >= options.limit) throw new RateLimitError();
  bucket.count += 1;
}

export function resetRateLimits(): void {
  store().clear();
}
