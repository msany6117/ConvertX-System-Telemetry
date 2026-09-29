import {
  AIProviderAdapter,
  AIProviderId,
  AIProviderStatus,
  AIProviderStats,
  AITaskType,
  AIExecutionOptions,
  NormalizedAIResponse,
  ChatMessage,
} from './types';
import { AI_CONFIG, maskApiKey } from './config';
import { buildPromptForTask } from './prompts';
import { BaseAdapter } from './adapters/BaseAdapter';
import { GeminiAdapter } from './adapters/GeminiAdapter';
import { DeepSeekAdapter } from './adapters/DeepSeekAdapter';
import { GroqAdapter } from './adapters/GroqAdapter';
import { cleanTranslatedText } from './sanitizer';

class AIRouter {
  private adapters: Map<AIProviderId, AIProviderAdapter> = new Map();
  private stats: Map<AIProviderId, AIProviderStats> = new Map();

  constructor() {
    this.registerAdapter(new GeminiAdapter());
    this.registerAdapter(new DeepSeekAdapter());
    this.registerAdapter(new GroqAdapter());
  }

  private registerAdapter(adapter: AIProviderAdapter): void {
    this.adapters.set(adapter.id, adapter);
    this.stats.set(adapter.id, {
      id: adapter.id,
      name: adapter.name,
      enabled: AI_CONFIG.enabled[adapter.id] ?? true,
      status: adapter.isConfigured() ? 'healthy' : 'disabled',
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rateLimitEvents: 0,
      timeoutEvents: 0,
      lastSuccessTimestamp: null,
      lastFailureTimestamp: null,
      lastErrorMessage: null,
      cooldownUntil: null,
      currentModel: adapter.getDefaultModel(),
      availableModels: adapter.getAvailableModels(),
    });
  }

  public getAdapter(id: AIProviderId): AIProviderAdapter | undefined {
    return this.adapters.get(id);
  }

  /**
   * Determine available, sorted candidate providers based on:
   * 1. Enabled status
   * 2. Configuration existence (has API key)
   * 3. Priority sequence
   * 4. Cooldown expiration
   */
  private getCandidateProviders(preferredProvider?: AIProviderId): AIProviderAdapter[] {
    const now = Date.now();
    const priorityList: AIProviderId[] = preferredProvider
      ? [preferredProvider, ...AI_CONFIG.priority.filter((p) => p !== preferredProvider)]
      : [...AI_CONFIG.priority];

    // Ensure all configured adapters are represented
    for (const [id] of this.adapters) {
      if (!priorityList.includes(id)) {
        priorityList.push(id);
      }
    }

    const healthyList: AIProviderAdapter[] = [];
    const cooldownList: AIProviderAdapter[] = [];

    for (const id of priorityList) {
      const adapter = this.adapters.get(id);
      const stat = this.stats.get(id);
      if (!adapter || !stat) continue;

      if (!stat.enabled || !adapter.isConfigured()) {
        continue;
      }

      // Check if cooldown has expired
      if (stat.cooldownUntil && stat.cooldownUntil <= now) {
        stat.cooldownUntil = null;
        stat.status = 'healthy';
      }

      if (stat.cooldownUntil && stat.cooldownUntil > now) {
        // Still in cooldown, keep as emergency fallback
        cooldownList.push(adapter);
      } else {
        healthyList.push(adapter);
      }
    }

    // Try healthy candidates first; if none available, try cooldown candidates
    return [...healthyList, ...cooldownList];
  }

  private handleProviderFailure(id: AIProviderId, error: any, latencyMs: number): void {
    const stat = this.stats.get(id);
    if (!stat) return;

    stat.totalRequests += 1;
    stat.failedRequests += 1;
    stat.lastFailureTimestamp = Date.now();
    stat.lastErrorMessage = error?.message || 'Unknown error';

    const isRateLimit = BaseAdapter.isRateLimitError(error);
    const isQuota = BaseAdapter.isQuotaExceededError(error);
    const isTimeout = BaseAdapter.isTimeoutError(error);
    const isUnavailable = BaseAdapter.isServiceUnavailableError(error);

    if (isRateLimit) {
      stat.rateLimitEvents += 1;
      stat.status = 'cooldown';
      stat.cooldownUntil = Date.now() + AI_CONFIG.cooldownSeconds * 1000;
      console.warn(`[AIRouter] ${stat.name} rate limited (429). Cooldown for ${AI_CONFIG.cooldownSeconds}s.`);
    } else if (isQuota) {
      stat.status = 'cooldown';
      // Longer cooldown for depleted quota (5 minutes)
      stat.cooldownUntil = Date.now() + 5 * 60 * 1000;
      console.warn(`[AIRouter] ${stat.name} quota depleted / insufficient balance. Cooldown for 5m.`);
    } else if (isTimeout) {
      stat.timeoutEvents += 1;
      stat.status = 'cooldown';
      stat.cooldownUntil = Date.now() + 30 * 1000;
      console.warn(`[AIRouter] ${stat.name} timed out. Cooldown for 30s.`);
    } else if (isUnavailable) {
      stat.status = 'cooldown';
      stat.cooldownUntil = Date.now() + 45 * 1000;
      console.warn(`[AIRouter] ${stat.name} 503 unavailable. Cooldown for 45s.`);
    } else {
      stat.status = 'degraded';
      stat.cooldownUntil = Date.now() + 20 * 1000;
    }
  }

  private handleProviderSuccess(id: AIProviderId, latencyMs: number): void {
    const stat = this.stats.get(id);
    if (!stat) return;

    stat.totalRequests += 1;
    stat.successfulRequests += 1;
    stat.status = 'healthy';
    stat.cooldownUntil = null;
    stat.lastSuccessTimestamp = Date.now();
    stat.lastErrorMessage = null;
  }

  /**
   * Main task execution router with automatic failover
   */
  async processTask(
    task: AITaskType,
    input: string,
    options: AIExecutionOptions = {},
    preferredProvider?: AIProviderId,
    signal?: AbortSignal
  ): Promise<NormalizedAIResponse> {
    const { prompt, systemInstruction } = buildPromptForTask(task, input, options);
    const candidates = this.getCandidateProviders(preferredProvider);

    if (candidates.length === 0) {
      throw new Error(
        'No AI providers are currently configured or enabled. Please check API keys in server configuration.'
      );
    }

    const attempts: Array<{
      provider: AIProviderId;
      model: string;
      error: string;
      latencyMs: number;
    }> = [];

    let didSwitch = false;

    for (let i = 0; i < candidates.length; i++) {
      const adapter = candidates[i];
      const model = adapter.getDefaultModel();
      const startTime = Date.now();

      if (i > 0) {
        didSwitch = true;
        console.log(`[AIRouter] Failing over to ${adapter.name} (${model})...`);
      }

      try {
        const response = await adapter.execute(
          prompt,
          {
            ...options,
            systemInstruction: options.systemInstruction || systemInstruction,
          },
          signal
        );

        this.handleProviderSuccess(adapter.id, Date.now() - startTime);

        const cleanResult = task === 'translate' ? cleanTranslatedText(response.result) : response.result;

        return {
          ...response,
          result: cleanResult,
          attempts: attempts.length > 0 ? attempts : undefined,
          switchedEngine: didSwitch,
        };
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        this.handleProviderFailure(adapter.id, err, latencyMs);

        attempts.push({
          provider: adapter.id,
          model,
          error: err.message || 'Execution error',
          latencyMs,
        });

        // If client aborted request manually, do not try next providers
        if (signal?.aborted) {
          throw err;
        }
      }
    }

    // If all providers failed, throw friendly error
    console.error('[AIRouter] All AI providers exhausted:', attempts);
    const allErrors = attempts.map((a) => `${a.provider}: ${a.error}`).join(' | ');
    const friendlyError: any = new Error(
      'AI service is temporarily busy or unavailable across all engines. Please try again in a few moments.'
    );
    friendlyError.attempts = attempts;
    friendlyError.technicalDetails = allErrors;
    throw friendlyError;
  }

  /**
   * Conversational Chat Router with automatic failover
   */
  async processChat(
    messages: ChatMessage[],
    options: AIExecutionOptions = {},
    preferredProvider?: AIProviderId,
    signal?: AbortSignal
  ): Promise<NormalizedAIResponse> {
    const candidates = this.getCandidateProviders(preferredProvider);

    if (candidates.length === 0) {
      throw new Error('No AI providers configured.');
    }

    const attempts: Array<{
      provider: AIProviderId;
      model: string;
      error: string;
      latencyMs: number;
    }> = [];

    let didSwitch = false;

    for (let i = 0; i < candidates.length; i++) {
      const adapter = candidates[i];
      const model = adapter.getDefaultModel();
      const startTime = Date.now();

      if (i > 0) {
        didSwitch = true;
        console.log(`[AIRouter Chat] Failing over to ${adapter.name}...`);
      }

      try {
        let response: NormalizedAIResponse;
        if (adapter.executeChat) {
          response = await adapter.executeChat(messages, options, signal);
        } else {
          const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
          response = await adapter.execute(lastUserMessage, options, signal);
        }

        this.handleProviderSuccess(adapter.id, Date.now() - startTime);

        return {
          ...response,
          attempts: attempts.length > 0 ? attempts : undefined,
          switchedEngine: didSwitch,
        };
      } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        this.handleProviderFailure(adapter.id, err, latencyMs);

        attempts.push({
          provider: adapter.id,
          model,
          error: err.message || 'Execution error',
          latencyMs,
        });

        if (signal?.aborted) {
          throw err;
        }
      }
    }

    throw new Error('AI chat service is temporarily unavailable. Please try again shortly.');
  }

  /**
   * Return provider overview for frontend / admin panel
   */
  getDashboardData() {
    const providers = Array.from(this.stats.values()).map((stat) => {
      let masked = 'Not configured';
      if (stat.id === 'gemini') masked = maskApiKey(process.env.GEMINI_API_KEY);
      else if (stat.id === 'deepseek') masked = maskApiKey(process.env.DEEPSEEK_API_KEY);
      else if (stat.id === 'groq') masked = maskApiKey(process.env.GROQ_API_KEY);

      return {
        ...stat,
        apiKeyMasked: masked,
        isConfigured: masked !== 'Not configured',
      };
    });

    return {
      providers,
      priority: AI_CONFIG.priority,
      settings: {
        timeoutMs: AI_CONFIG.timeoutMs,
        cooldownSeconds: AI_CONFIG.cooldownSeconds,
        temperature: AI_CONFIG.temperature,
        freeDailyLimit: AI_CONFIG.freeDailyLimit,
        freeMaxInputLength: AI_CONFIG.freeMaxInputLength,
      },
    };
  }

  /**
   * Admin configuration update
   */
  updateConfig(updates: {
    priority?: AIProviderId[];
    enabled?: Partial<Record<AIProviderId, boolean>>;
    models?: Partial<Record<AIProviderId, string>>;
    timeoutMs?: number;
    cooldownSeconds?: number;
  }): void {
    if (updates.priority) {
      AI_CONFIG.priority = updates.priority;
    }
    if (updates.enabled) {
      for (const [id, isEnabled] of Object.entries(updates.enabled)) {
        AI_CONFIG.enabled[id as AIProviderId] = isEnabled;
        const stat = this.stats.get(id as AIProviderId);
        if (stat) stat.enabled = isEnabled;
      }
    }
    if (updates.models) {
      for (const [id, modelName] of Object.entries(updates.models)) {
        AI_CONFIG.models[id as AIProviderId] = modelName;
        const stat = this.stats.get(id as AIProviderId);
        if (stat) stat.currentModel = modelName;
      }
    }
    if (updates.timeoutMs) AI_CONFIG.timeoutMs = updates.timeoutMs;
    if (updates.cooldownSeconds) AI_CONFIG.cooldownSeconds = updates.cooldownSeconds;
  }

  /**
   * Reset cooldown manually
   */
  resetCooldown(id: AIProviderId): boolean {
    const stat = this.stats.get(id);
    if (stat) {
      stat.cooldownUntil = null;
      stat.status = 'healthy';
      return true;
    }
    return false;
  }
}

export const aiRouter = new AIRouter();
