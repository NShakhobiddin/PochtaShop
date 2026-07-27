import { NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';
import { getDataSource } from '@/lib/data';
import { getAIProvider } from '@/lib/ai';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const env = getServerEnv();

  let database: 'connected' | 'demo' | 'error' = 'demo';
  try {
    const source = getDataSource();
    const alive = await source.ping();
    if (source.kind === 'supabase') database = alive ? 'connected' : 'error';
    else database = 'demo';
  } catch (error) {
    logger.error('health:database', error);
    database = 'error';
  }

  const provider = getAIProvider();
  const ai = provider.name === 'mock' ? 'mock' : 'configured';

  return NextResponse.json({
    status: database === 'error' ? 'degraded' : 'ok',
    database,
    ai,
    telegram: env.TELEGRAM_BOT_TOKEN ? 'configured' : 'not_configured',
    timestamp: new Date().toISOString(),
  });
}
