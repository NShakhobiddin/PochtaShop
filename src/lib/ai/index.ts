import type { AIProvider } from '@/types';
import { getServerEnv } from '@/lib/env';
import { logger } from '@/lib/logger';
import { MockAIProvider } from './mock-provider';
import { AnthropicChatClient, HostedAIProvider, OpenAIChatClient } from './hosted-provider';

let instance: AIProvider | null = null;

/**
 * Selects the AI provider from the environment. Swapping model vendors is a
 * config change — no call site depends on a concrete provider.
 */
export function getAIProvider(): AIProvider {
  if (instance) return instance;
  const env = getServerEnv();

  if (env.AI_PROVIDER === 'anthropic' && env.ANTHROPIC_API_KEY) {
    instance = new HostedAIProvider(
      new AnthropicChatClient(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL),
    );
  } else if (env.AI_PROVIDER === 'openai' && env.OPENAI_API_KEY) {
    instance = new HostedAIProvider(new OpenAIChatClient(env.OPENAI_API_KEY, env.OPENAI_MODEL));
  } else {
    if (env.AI_PROVIDER !== 'mock') {
      logger.warn(`ai:missing_key_for_${env.AI_PROVIDER}, falling back to mock provider`);
    }
    instance = new MockAIProvider();
  }

  return instance;
}

/** Test helper. */
export function setAIProvider(provider: AIProvider | null): void {
  instance = provider;
}

export { MockAIProvider } from './mock-provider';
export { HostedAIProvider } from './hosted-provider';
