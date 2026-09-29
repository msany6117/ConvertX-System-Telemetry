export type AIProviderId = 'gemini' | 'deepseek' | 'groq' | 'openai' | 'anthropic';

export type AIProviderStatus = 'healthy' | 'degraded' | 'cooldown' | 'unhealthy' | 'disabled';

export type AITaskType =
  | 'translate'
  | 'rewrite'
  | 'summarize'
  | 'grammar'
  | 'analyzer'
  | 'content'
  | 'code'
  | 'chat'
  | 'file_process';

export interface AIProviderStats {
  id: AIProviderId;
  name: string;
  enabled: boolean;
  status: AIProviderStatus;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitEvents: number;
  timeoutEvents: number;
  lastSuccessTimestamp: number | null;
  lastFailureTimestamp: number | null;
  lastErrorMessage: string | null;
  cooldownUntil: number | null;
  currentModel: string;
  availableModels: string[];
}

export interface AIUsageMetrics {
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
  latencyMs?: number;
}

export interface NormalizedAIResponse {
  success: boolean;
  result: string;
  structuredData?: Record<string, any>;
  provider: AIProviderId;
  providerName: string;
  model: string;
  usage?: AIUsageMetrics;
  attempts?: Array<{
    provider: AIProviderId;
    model: string;
    error: string;
    latencyMs: number;
  }>;
  switchedEngine?: boolean;
}

export interface AIExecutionOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  systemInstruction?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  tone?: string;
  length?: string;
  codeAction?: 'explain' | 'fix' | 'optimize' | 'convert' | 'generate';
  targetLanguageCode?: string;
  contentType?: string;
  keywords?: string[];
  topic?: string;
  summaryStyle?: 'short' | 'medium' | 'detailed' | 'bullet';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProviderAdapter {
  readonly id: AIProviderId;
  readonly name: string;
  isConfigured(): boolean;
  getDefaultModel(): string;
  getAvailableModels(): string[];
  execute(
    prompt: string,
    options: AIExecutionOptions,
    signal?: AbortSignal
  ): Promise<NormalizedAIResponse>;
  executeChat?(
    messages: ChatMessage[],
    options: AIExecutionOptions,
    signal?: AbortSignal
  ): Promise<NormalizedAIResponse>;
  checkHealth(): Promise<{ healthy: boolean; status: AIProviderStatus; message: string; latencyMs: number }>;
}
