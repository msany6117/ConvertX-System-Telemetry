import { GoogleGenAI } from '@google/genai';
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

export class GeminiAdapter extends BaseAdapter implements AIProviderAdapter {
  readonly id: AIProviderId = 'gemini';
  readonly name = 'Google Gemini';

  private client: GoogleGenAI | null = null;
  private readonly defaultModel = 'gemini-3.8-flash';
  private readonly fallbackModels = ['gemini-3.1-pro-preview', 'gemini-flash-latest'];

  constructor() {
    super();
    this.initClient();
  }

  private getApiKey(): string {
    return process.env.GEMINI_API_KEY || '';
  }

  private initClient(): GoogleGenAI | null {
    const key = this.getApiKey();
    if (key && key.length > 5) {
      try {
        this.client = new GoogleGenAI({ apiKey: key });
        return this.client;
      } catch (err) {
        console.error('[GeminiAdapter] Failed to initialize GoogleGenAI client:', err);
      }
    }
    return null;
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return Boolean(key && key.length > 10 && !key.includes('YOUR_GEMINI'));
  }

  getDefaultModel(): string {
    return AI_CONFIG.models.gemini || this.defaultModel;
  }

  getAvailableModels(): string[] {
    return ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-flash-latest'];
  }

  async execute(
    prompt: string,
    options: AIExecutionOptions,
    signal?: AbortSignal
  ): Promise<NormalizedAIResponse> {
    if (!this.client) {
      this.initClient();
    }
    if (!this.client) {
      throw new Error('Gemini API key is missing or invalid.');
    }

    const modelName = options.model || this.getDefaultModel();
    const timeoutMs = options.timeoutMs || AI_CONFIG.timeoutMs;
    const { cleanup } = this.createTimeoutSignal(timeoutMs, signal);
    const startTime = Date.now();

    try {
      const contents = options.systemInstruction
        ? `${options.systemInstruction}\n\n${prompt}`
        : prompt;

      const response = await this.client.models.generateContent({
        model: modelName,
        contents,
        config: {
          temperature: options.temperature ?? AI_CONFIG.temperature,
          maxOutputTokens: options.maxOutputTokens ?? AI_CONFIG.maxOutputTokens,
        },
      });

      const latencyMs = Date.now() - startTime;
      const text = response.text || '';

      // Check if structured output is requested
      let structuredData: any = undefined;
      const trimmed = text.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          structuredData = JSON.parse(trimmed);
        } catch {
          // not strictly json, keep plain text
        }
      }

      return {
        success: true,
        result: text,
        structuredData,
        provider: this.id,
        providerName: this.name,
        model: modelName,
        usage: {
          latencyMs,
          inputTokens: response.usageMetadata?.promptTokenCount,
          outputTokens: response.usageMetadata?.candidatesTokenCount,
        },
      };
    } finally {
      cleanup();
    }
  }

  async executeChat(
    messages: ChatMessage[],
    options: AIExecutionOptions,
    signal?: AbortSignal
  ): Promise<NormalizedAIResponse> {
    if (!this.client) {
      this.initClient();
    }
    if (!this.client) {
      throw new Error('Gemini API key is missing or invalid.');
    }

    const modelName = options.model || this.getDefaultModel();
    const timeoutMs = options.timeoutMs || AI_CONFIG.timeoutMs;
    const { cleanup } = this.createTimeoutSignal(timeoutMs, signal);
    const startTime = Date.now();

    try {
      // Build conversation text or pass system instructions
      const systemInstruction = options.systemInstruction || 'You are ConvertX AI assistant.';
      const formattedPrompt = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');

      const response = await this.client.models.generateContent({
        model: modelName,
        contents: `${systemInstruction}\n\n${formattedPrompt}\n\nASSISTANT:`,
        config: {
          temperature: options.temperature ?? AI_CONFIG.temperature,
          maxOutputTokens: options.maxOutputTokens ?? AI_CONFIG.maxOutputTokens,
        },
      });

      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        result: response.text || '',
        provider: this.id,
        providerName: this.name,
        model: modelName,
        usage: {
          latencyMs,
          inputTokens: response.usageMetadata?.promptTokenCount,
          outputTokens: response.usageMetadata?.candidatesTokenCount,
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
        message: 'Gemini API key not configured',
        latencyMs: 0,
      };
    }

    const start = Date.now();
    try {
      if (!this.client) this.initClient();
      if (!this.client) throw new Error('Client uninitialized');

      // Lightweight test prompt with short token limit
      await this.client.models.generateContent({
        model: this.getDefaultModel(),
        contents: 'ping',
        config: { maxOutputTokens: 2 },
      });

      const latencyMs = Date.now() - start;
      return {
        healthy: true,
        status: 'healthy',
        message: 'Operational',
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - start;
      if (BaseAdapter.isRateLimitError(err)) {
        return { healthy: false, status: 'rate limited' as any, message: 'Rate limited (429)', latencyMs };
      }
      if (BaseAdapter.isServiceUnavailableError(err)) {
        return { healthy: false, status: 'degraded', message: 'High demand / 503 unavailable', latencyMs };
      }
      return { healthy: false, status: 'unhealthy', message: err.message || 'Error connecting to Gemini', latencyMs };
    }
  }
}
