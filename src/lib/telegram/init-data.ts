import { createHmac, timingSafeEqual } from 'node:crypto';
import type { TelegramUser } from '@/types';

export interface ParsedInitData {
  user: TelegramUser;
  authDate: number;
  queryId?: string;
  startParam?: string;
}

export type InitDataValidation =
  | { ok: true; data: ParsedInitData }
  | { ok: false; reason: InitDataError };

export type InitDataError =
  | 'missing_init_data'
  | 'missing_hash'
  | 'missing_user'
  | 'malformed_user'
  | 'invalid_signature'
  | 'expired'
  | 'missing_bot_token';

/** Telegram initData older than this is rejected as a replay. */
export const INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;

interface TelegramUserPayload {
  id?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  username?: unknown;
  language_code?: unknown;
  photo_url?: unknown;
  is_premium?: unknown;
}

function parseUser(raw: string): TelegramUser | null {
  let payload: TelegramUserPayload;
  try {
    payload = JSON.parse(raw) as TelegramUserPayload;
  } catch {
    return null;
  }

  const id = typeof payload.id === 'number' ? payload.id : Number(payload.id);
  if (!Number.isFinite(id) || id <= 0) return null;
  if (typeof payload.first_name !== 'string' || payload.first_name.length === 0) return null;

  return {
    id,
    firstName: payload.first_name,
    lastName: typeof payload.last_name === 'string' ? payload.last_name : undefined,
    username: typeof payload.username === 'string' ? payload.username : undefined,
    languageCode: typeof payload.language_code === 'string' ? payload.language_code : undefined,
    photoUrl: typeof payload.photo_url === 'string' ? payload.photo_url : undefined,
    isPremium: payload.is_premium === true,
  };
}

/**
 * Verifies a Telegram Mini App `initData` string as described in
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * The data-check-string is every field except `hash`, sorted by key and joined
 * with newlines. The signing key is HMAC-SHA256("WebAppData", botToken).
 */
export function validateInitData(
  initData: string,
  botToken: string,
  options: { maxAgeSeconds?: number; now?: Date } = {},
): InitDataValidation {
  if (!initData) return { ok: false, reason: 'missing_init_data' };
  if (!botToken) return { ok: false, reason: 'missing_bot_token' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, reason: 'missing_hash' };

  const pairs: string[] = [];
  params.forEach((value, key) => {
    if (key === 'hash') return;
    pairs.push(`${key}=${value}`);
  });
  pairs.sort();
  const dataCheckString = pairs.join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const expected = Buffer.from(computed, 'hex');
  let provided: Buffer;
  try {
    provided = Buffer.from(hash, 'hex');
  } catch {
    return { ok: false, reason: 'invalid_signature' };
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: 'invalid_signature' };
  }

  const authDate = Number(params.get('auth_date'));
  if (Number.isFinite(authDate) && authDate > 0) {
    const maxAge = options.maxAgeSeconds ?? INIT_DATA_MAX_AGE_SECONDS;
    const now = Math.floor((options.now ?? new Date()).getTime() / 1000);
    if (now - authDate > maxAge) return { ok: false, reason: 'expired' };
  }

  const rawUser = params.get('user');
  if (!rawUser) return { ok: false, reason: 'missing_user' };
  const user = parseUser(rawUser);
  if (!user) return { ok: false, reason: 'malformed_user' };

  return {
    ok: true,
    data: {
      user,
      authDate: Number.isFinite(authDate) ? authDate : 0,
      queryId: params.get('query_id') ?? undefined,
      startParam: params.get('start_param') ?? undefined,
    },
  };
}

/** Builds a signed initData string. Used by tests and local development only. */
export function signInitData(
  fields: Record<string, string>,
  botToken: string,
): string {
  const pairs = Object.entries(fields)
    .map(([key, value]) => `${key}=${value}`)
    .sort();
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(pairs.join('\n')).digest('hex');
  const params = new URLSearchParams(fields);
  params.set('hash', hash);
  return params.toString();
}
