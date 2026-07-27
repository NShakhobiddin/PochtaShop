import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Minimal bot command handler.
 *
 * Telegram authenticates webhook calls with a secret token header set when the
 * webhook is registered (setWebhook?secret_token=...). Requests without a
 * matching token are rejected.
 */
const SECRET_HEADER = 'x-telegram-bot-api-secret-token';

interface TelegramUpdate {
  message?: {
    chat?: { id?: number };
    text?: string;
  };
}

function constantTimeEquals(a: string, b: string): boolean {
  const left = createHmac('sha256', 'webhook').update(a).digest();
  const right = createHmac('sha256', 'webhook').update(b).digest();
  return timingSafeEqual(left, right);
}

const HELP_TEXT = [
  'PochtaShop — chet eldan xavfsiz xarid qilish bo‘yicha shaxsiy yordamchi.',
  '',
  '/app — ilovani ochish',
  '/help — yordam',
  '/consultation — mutaxassis bilan bog‘lanish',
].join('\n');

async function send(token: string, chatId: number, text: string, appUrl: string, withApp: boolean) {
  const body: Record<string, unknown> = { chat_id: chatId, text };

  if (withApp) {
    body.reply_markup = {
      inline_keyboard: [[{ text: 'PochtaShop’ni ochish', web_app: { url: appUrl } }]],
    };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) logger.error('telegram:send_failed', { status: response.status });
}

export async function POST(request: Request) {
  const env = getServerEnv();

  if (!env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? '';
  const provided = request.headers.get(SECRET_HEADER) ?? '';
  if (!secret || !constantTimeEquals(secret, provided)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const chatId = update.message?.chat?.id;
  const text = (update.message?.text ?? '').trim();
  if (!chatId || !text.startsWith('/')) return NextResponse.json({ ok: true });

  const command = text.split(/[\s@]/)[0];
  const appUrl = env.NEXT_PUBLIC_APP_URL;

  try {
    switch (command) {
      case '/start':
        await send(
          env.TELEGRAM_BOT_TOKEN,
          chatId,
          'Xush kelibsiz! PochtaShop chet eldan xarid qilishda yordam beradi.\n\n' + HELP_TEXT,
          appUrl,
          true,
        );
        break;
      case '/app':
        await send(env.TELEGRAM_BOT_TOKEN, chatId, 'Ilovani oching:', appUrl, true);
        break;
      case '/consultation':
        await send(
          env.TELEGRAM_BOT_TOKEN,
          chatId,
          'Mutaxassis bilan bog‘lanish uchun ilovadagi “Konsultatsiya” bo‘limiga o‘ting.',
          `${appUrl}/consultation`,
          true,
        );
        break;
      case '/help':
      default:
        await send(env.TELEGRAM_BOT_TOKEN, chatId, HELP_TEXT, appUrl, false);
    }
  } catch (error) {
    logger.error('telegram:webhook', error);
  }

  return NextResponse.json({ ok: true });
}
