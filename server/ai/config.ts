import { AIProviderId } from './types';

export interface AIConfigState {
  priority: AIProviderId[];
  models: Record<AIProviderId, string>;
  enabled: Record<AIProviderId, boolean>;
  timeoutMs: number;
  maxRetriesPerProvider: number;
  cooldownSeconds: number;
  temperature: number;
  maxOutputTokens: number;
  freeDailyLimit: number;
  freeMaxInputLength: number;
  proDailyLimit: number;
  proMaxInputLength: number;
}

export const AI_CONFIG: AIConfigState = {
  priority: (process.env.AI_PROVIDER_PRIORITY
    ? process.env.AI_PROVIDER_PRIORITY.split(',').map((p) => p.trim() as AIProviderId)
    : ['groq', 'gemini', 'deepseek']
  ).filter((p): p is AIProviderId => ['groq', 'gemini', 'deepseek'].includes(p)),

  models: {
    gemini: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
    deepseek: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    groq: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet',
  },

  enabled: {
    gemini: true,
    deepseek: true,
    groq: true,
    openai: false,
    anthropic: false,
  },

  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '25000', 10),
  maxRetriesPerProvider: parseInt(process.env.AI_MAX_RETRIES || '1', 10),
  cooldownSeconds: parseInt(process.env.AI_COOLDOWN_SECONDS || '60', 10),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '3500', 10),

  freeDailyLimit: parseInt(process.env.FREE_AI_REQUESTS_PER_DAY || '60', 10),
  freeMaxInputLength: parseInt(process.env.FREE_MAX_INPUT_LENGTH || '10000', 10),
  proDailyLimit: parseInt(process.env.PRO_AI_REQUESTS_PER_DAY || '500', 10),
  proMaxInputLength: parseInt(process.env.PRO_MAX_INPUT_LENGTH || '100000', 10),
};

// Utility to get masked key representation (e.g. sk-••••••••1234)
export function maskApiKey(key: string | undefined): string {
  if (!key || key.length < 8) return 'Not configured';
  const prefix = key.slice(0, 4);
  const suffix = key.slice(-4);
  return `${prefix}${'•'.repeat(Math.min(key.length - 8, 10))}${suffix}`;
}
