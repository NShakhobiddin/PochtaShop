import { z } from 'zod';

/**
 * Server-side environment. Never import this module from a client component —
 * it holds secrets that must not reach the browser bundle.
 */
const serverSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),

  NEXT_PUBLIC_SUPABASE_URL: z.string().default(''),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  SUPABASE_UPLOAD_BUCKET: z.string().default('uploads'),

  TELEGRAM_BOT_TOKEN: z.string().default(''),
  ALLOW_INSECURE_TELEGRAM_AUTH: z
    .string()
    .default('false')
    .transform((value) => value === 'true'),

  AI_PROVIDER: z.enum(['mock', 'anthropic', 'openai']).default('mock'),
  ANTHROPIC_API_KEY: z.string().default(''),
  OPENAI_API_KEY: z.string().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-5'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  FILE_DELETE_AFTER_ANALYSIS: z
    .string()
    .default('true')
    .transform((value) => value !== 'false'),

  ADMIN_EMAIL: z.string().default(''),
});

export type ServerEnv = z.infer<typeof serverSchema> & {
  isSupabaseConfigured: boolean;
  isProduction: boolean;
};

let cached: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }

  const env = parsed.data;
  const isProduction = env.APP_ENV === 'production';

  if (isProduction) {
    if (!env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN is required when APP_ENV=production');
    }
    if (env.ALLOW_INSECURE_TELEGRAM_AUTH) {
      throw new Error('ALLOW_INSECURE_TELEGRAM_AUTH must be false in production');
    }
  }

  cached = {
    ...env,
    isProduction,
    isSupabaseConfigured: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };

  return cached;
}

/** Test helper — clears the memoised environment. */
export function resetServerEnvCache(): void {
  cached = null;
}
