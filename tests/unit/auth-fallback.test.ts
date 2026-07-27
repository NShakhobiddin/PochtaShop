import { beforeEach, describe, expect, it } from 'vitest';
import { AuthError, resolveTelegramUser } from '@/features/telegram-auth/server';
import { resetServerEnvCache } from '@/lib/env';
import { signInitData } from '@/lib/telegram/init-data';

const BOT_TOKEN = '999:PROD-TOKEN';

function setEnv(values: Record<string, string>) {
  process.env.APP_ENV = values.APP_ENV ?? 'development';
  process.env.TELEGRAM_BOT_TOKEN = values.TELEGRAM_BOT_TOKEN ?? '';
  process.env.ALLOW_INSECURE_TELEGRAM_AUTH = values.ALLOW_INSECURE_TELEGRAM_AUTH ?? 'false';
  resetServerEnvCache();
}

function validInitData() {
  return signInitData(
    {
      auth_date: String(Math.floor(Date.now() / 1000)),
      user: JSON.stringify({ id: 4242, first_name: 'Real' }),
    },
    BOT_TOKEN,
  );
}

beforeEach(() => resetServerEnvCache());

describe('resolveTelegramUser development fallback', () => {
  it('uses the demo identity in development when no bot token is configured', () => {
    // A fresh clone runs exactly like this, and must be usable in a browser.
    setEnv({ APP_ENV: 'development', TELEGRAM_BOT_TOKEN: '' });
    expect(resolveTelegramUser(null).firstName).toBe('Demo');
  });

  it('still verifies real initData once a bot token exists', () => {
    setEnv({ APP_ENV: 'development', TELEGRAM_BOT_TOKEN: BOT_TOKEN });
    expect(resolveTelegramUser(validInitData()).id).toBe(4242);
  });

  it('rejects a missing header in development once a bot token exists', () => {
    setEnv({ APP_ENV: 'development', TELEGRAM_BOT_TOKEN: BOT_TOKEN });
    expect(() => resolveTelegramUser(null)).toThrow(AuthError);
  });

  it('rejects a forged signature in development', () => {
    setEnv({ APP_ENV: 'development', TELEGRAM_BOT_TOKEN: BOT_TOKEN });
    const forged = signInitData(
      { auth_date: String(Math.floor(Date.now() / 1000)), user: '{"id":1,"first_name":"M"}' },
      'wrong-token',
    );
    expect(() => resolveTelegramUser(forged)).toThrow(AuthError);
  });

  it('never falls back in production', () => {
    // Production without a token cannot boot at all.
    setEnv({ APP_ENV: 'production', TELEGRAM_BOT_TOKEN: '' });
    expect(() => resolveTelegramUser(null)).toThrow(/TELEGRAM_BOT_TOKEN is required/);

    setEnv({ APP_ENV: 'production', TELEGRAM_BOT_TOKEN: BOT_TOKEN });
    expect(() => resolveTelegramUser(null)).toThrow(AuthError);
  });

  it('refuses to boot production with insecure auth enabled', () => {
    setEnv({
      APP_ENV: 'production',
      TELEGRAM_BOT_TOKEN: BOT_TOKEN,
      ALLOW_INSECURE_TELEGRAM_AUTH: 'true',
    });
    expect(() => resolveTelegramUser(null)).toThrow(/must be false in production/);
  });
});
