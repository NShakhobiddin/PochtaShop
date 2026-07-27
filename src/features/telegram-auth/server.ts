import 'server-only';
import { headers } from 'next/headers';
import { getServerEnv } from '@/lib/env';
import { validateInitData, type InitDataError } from '@/lib/telegram/init-data';
import type { AppUser, TelegramUser } from '@/types';
import { getDataSource } from '@/lib/data';

export const TELEGRAM_INIT_DATA_HEADER = 'x-telegram-init-data';

export interface AuthContext {
  telegram: TelegramUser;
  user: AppUser;
}

export class AuthError extends Error {
  constructor(
    public readonly reason: InitDataError | 'forbidden',
    public readonly status: number = 401,
  ) {
    super(`Telegram authentication failed: ${reason}`);
    this.name = 'AuthError';
  }
}

/**
 * Development fallback so the Mini App can be opened in a plain browser.
 * Guarded by ALLOW_INSECURE_TELEGRAM_AUTH, which is rejected in production.
 */
const DEV_USER: TelegramUser = {
  id: 100_000_001,
  firstName: 'Demo',
  lastName: 'Foydalanuvchi',
  username: 'demo_user',
  languageCode: 'uz',
};

export function resolveTelegramUser(initData: string | null): TelegramUser {
  const env = getServerEnv();

  // Without a bot token, initData signatures cannot be verified at all — so
  // outside production the only useful behaviour is the demo identity. The
  // environment validator already refuses to boot production without a token,
  // and refuses ALLOW_INSECURE_TELEGRAM_AUTH there, so this cannot leak.
  const devFallbackAllowed =
    !env.isProduction && (env.ALLOW_INSECURE_TELEGRAM_AUTH || !env.TELEGRAM_BOT_TOKEN);

  if (!initData) {
    if (devFallbackAllowed) return DEV_USER;
    throw new AuthError('missing_init_data');
  }

  if (!env.TELEGRAM_BOT_TOKEN) {
    if (devFallbackAllowed) return DEV_USER;
    throw new AuthError('missing_bot_token', 500);
  }

  const result = validateInitData(initData, env.TELEGRAM_BOT_TOKEN);
  if (!result.ok) throw new AuthError(result.reason);
  return result.data.user;
}

/** Reads and verifies the caller from request headers, then loads the app user. */
export async function requireUser(): Promise<AuthContext> {
  const headerList = await headers();
  const telegram = resolveTelegramUser(headerList.get(TELEGRAM_INIT_DATA_HEADER));
  const user = await getDataSource().upsertUserFromTelegram(telegram);
  return { telegram, user };
}

export async function requireRole(role: 'admin' | 'courier'): Promise<AuthContext> {
  const context = await requireUser();
  if (context.user.role !== role && context.user.role !== 'admin') {
    throw new AuthError('forbidden', 403);
  }
  return context;
}
