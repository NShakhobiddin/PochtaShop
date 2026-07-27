import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AuthError } from '@/features/telegram-auth/server';
import { logger } from '@/lib/logger';

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400, code?: string): NextResponse {
  return NextResponse.json({ ok: false, error: { message, code } }, { status });
}

const AUTH_MESSAGES: Record<string, string> = {
  missing_init_data: "Telegram orqali kiring. Ilova Telegram ichida ishlaydi.",
  invalid_signature: "Sessiya tasdiqlanmadi. Ilovani qaytadan oching.",
  expired: "Sessiya muddati tugadi. Ilovani qaytadan oching.",
  forbidden: "Bu amal uchun ruxsatingiz yo'q.",
};

/** Converts thrown errors into a consistent, user-readable API response. */
export function handleApiError(error: unknown, context: string): NextResponse {
  if (error instanceof AuthError) {
    return fail(AUTH_MESSAGES[error.reason] ?? 'Avtorizatsiya xatosi.', error.status, error.reason);
  }

  if (error instanceof ZodError) {
    const first = error.issues[0];
    return fail(
      first ? `Ma'lumot noto'g'ri: ${first.path.join('.')}` : "Ma'lumot noto'g'ri.",
      422,
      'validation_error',
    );
  }

  if (error instanceof RateLimitError) {
    return fail(
      "Juda ko'p so'rov yuborildi. Bir oz kutib, qayta urinib ko'ring.",
      429,
      'rate_limited',
    );
  }

  logger.error(`api:${context}`, error);
  return fail("Kutilmagan xatolik yuz berdi. Qayta urinib ko'ring.", 500, 'internal_error');
}

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
  }
}
