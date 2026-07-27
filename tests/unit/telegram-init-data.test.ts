import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { signInitData, validateInitData } from '@/lib/telegram/init-data';

const BOT_TOKEN = '123456:TEST-BOT-TOKEN';

function buildInitData(overrides: Record<string, string> = {}, authDate = Math.floor(Date.now() / 1000)) {
  return signInitData(
    {
      auth_date: String(authDate),
      query_id: 'AAEjTest',
      user: JSON.stringify({
        id: 555_001,
        first_name: 'Aziz',
        last_name: 'Karimov',
        username: 'aziz',
        language_code: 'uz',
      }),
      ...overrides,
    },
    BOT_TOKEN,
  );
}

describe('validateInitData', () => {
  it('accepts a correctly signed payload and parses the user', () => {
    const result = validateInitData(buildInitData(), BOT_TOKEN);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.user.id).toBe(555_001);
    expect(result.data.user.firstName).toBe('Aziz');
    expect(result.data.user.username).toBe('aziz');
    expect(result.data.queryId).toBe('AAEjTest');
  });

  it('rejects a payload signed with a different bot token', () => {
    const initData = signInitData(
      {
        auth_date: String(Math.floor(Date.now() / 1000)),
        user: JSON.stringify({ id: 1, first_name: 'Mallory' }),
      },
      'another-token',
    );

    const result = validateInitData(initData, BOT_TOKEN);
    expect(result).toEqual({ ok: false, reason: 'invalid_signature' });
  });

  it('rejects a tampered field even when the hash is present', () => {
    const initData = buildInitData();
    const params = new URLSearchParams(initData);
    params.set('user', JSON.stringify({ id: 999, first_name: 'Mallory' }));

    const result = validateInitData(params.toString(), BOT_TOKEN);
    expect(result).toEqual({ ok: false, reason: 'invalid_signature' });
  });

  it('rejects initData older than the replay window', () => {
    const stale = Math.floor(Date.now() / 1000) - 60 * 60 * 25;
    const result = validateInitData(buildInitData({}, stale), BOT_TOKEN);
    expect(result).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects a missing hash', () => {
    const params = new URLSearchParams(buildInitData());
    params.delete('hash');
    expect(validateInitData(params.toString(), BOT_TOKEN)).toEqual({
      ok: false,
      reason: 'missing_hash',
    });
  });

  it('rejects an empty bot token', () => {
    expect(validateInitData(buildInitData(), '')).toEqual({
      ok: false,
      reason: 'missing_bot_token',
    });
  });

  it('rejects a payload without a user', () => {
    const initData = signInitData({ auth_date: String(Math.floor(Date.now() / 1000)) }, BOT_TOKEN);
    expect(validateInitData(initData, BOT_TOKEN)).toEqual({ ok: false, reason: 'missing_user' });
  });

  it('rejects malformed user JSON', () => {
    const initData = signInitData(
      { auth_date: String(Math.floor(Date.now() / 1000)), user: 'not-json' },
      BOT_TOKEN,
    );
    expect(validateInitData(initData, BOT_TOKEN)).toEqual({ ok: false, reason: 'malformed_user' });
  });

  it('builds the data-check-string exactly as Telegram specifies', () => {
    // Independent re-implementation of the documented algorithm.
    const fields = {
      auth_date: '1700000000',
      user: JSON.stringify({ id: 7, first_name: 'Test' }),
    };
    const dataCheckString = Object.entries(fields)
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n');
    const secret = createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const expectedHash = createHmac('sha256', secret).update(dataCheckString).digest('hex');

    const signed = new URLSearchParams(signInitData(fields, BOT_TOKEN));
    expect(signed.get('hash')).toBe(expectedHash);
  });
});
