import { BaseAdapter } from './BaseAdapter';
import {
  AIProviderAdapter,
  AIProviderId,
  AIProviderStatus,
  AIExecutionOptions,
  NormalizedAIResponse,
  ChatMessage,
} from '../types';
import { AI_CONFIG } from '../config';

export class GroqAdapter extends BaseAdapter implements AIProviderAdapter {
  readonly id: AIProviderId = 'groq';
  readonly name = 'Groq LPU Engine';

  private readonly endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly defaultModel = 'openai/gpt-oss-120b';
  private readonly availableModels = [
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.8-27b',
  ];

  private getApiKey(): string {
    return process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY || '';
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.length > 10 && !key.includes('YOUR_GROQ'));
  }

  getDefaultModel(): string {
    return AI_CONFIG.models.groq || this.defaultModel;
  }

  getAvailableModels(): string[] {
    return this.availableModels;
  }

  async execute(
    prompt: string,
    options: AIExecutionOptions,
    signal?: AbortSignal
  ): Promise<NormalizedAIResponse> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error('Groq API key is missing or invalid.');
    }

    const messages: ChatMessage[] = [];
    if (options.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    return this.sendChatRequest(messages, options, signal);
  }

  async executeChat(
    messages: ChatMessage[],
    options: AIExecutionOptions,
    signal?: AbortSignal
  ): Promise<NormalizedAIResponse> {
    const formattedMessages: ChatMessage[] = [];
    if (options.systemInstruction) {
      formattedMessages.push({ role: 'system', content: options.systemInstruction });
    }
    formattedMessages.push(...messages);

    return this.sendChatRequest(formattedMessages, options, signal);
  }

  private async sendChatRequest(
    messages: ChatMessage[],
    options: AIExecutionOptions,
    signal?: AbortSignal
  ): Promise<NormalizedAIResponse> {
    const key = this.getApiKey();
    const modelName = options.model || this.getDefaultModel();
    const timeoutMs = options.timeoutMs || AI_CONFIG.timeoutMs;
    const { signal: timeoutSignal, cleanup } = this.createTimeoutSignal(timeoutMs, signal);
    const startTime = Date.now();

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: options.temperature ?? AI_CONFIG.temperature,
          max_tokens: options.maxOutputTokens ?? AI_CONFIG.maxOutputTokens,
        }),
        signal: timeoutSignal,
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // not json
        }

        const errorMsg = errorData?.error?.message || errorText || `HTTP ${response.status}`;
        const err: any = new Error(`Groq Error (${response.status}): ${errorMsg}`);
        err.status = response.status;
        err.code = errorData?.error?.code;
        throw err;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      // Check if structured output is requested
      let structuredData: any = undefined;
      const trimmed = content.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          structuredData = JSON.parse(trimmed);
        } catch {
          // keep plain
        }
      }

      return {
        success: true,
        result: content,
        structuredData,
        provider: this.id,
        providerName: this.name,
        model: modelName,
        usage: {
          latencyMs,
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
        },
      };
    } finally {
      cleanup();
    }
  }

  async checkHealth(): Promise<{ healthy: boolean; status: AIProviderStatus; message: string; latencyMs: number }> {
    if (!this.isConfigured()) {
      return {
        healthy: false,
        status: 'disabled',
        message: 'Groq API key not configured',
        latencyMs: 0,
      };
    }

    const start = Date.now();
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${this.getApiKey()}` },
      });
      const latencyMs = Date.now() - start;
      if (res.ok) {
        return { healthy: true, status: 'healthy', message: 'Operational (ultra-fast)', latencyMs };
      }
      return { healthy: false, status: 'unhealthy', message: `HTTP ${res.status}`, latencyMs };
    } catch (err: any) {
      return { healthy: false, status: 'unhealthy', message: err.message || 'Network error', latencyMs: Date.now() - start };
    }
  }
}
