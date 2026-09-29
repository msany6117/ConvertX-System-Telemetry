import { AIProviderId, AIProviderStatus, NormalizedAIResponse, AIExecutionOptions } from '../types';

export abstract class BaseAdapter {
  abstract readonly id: AIProviderId;
  abstract readonly name: string;

  public static isRateLimitError(err: any): boolean {
    const msg = (err?.message || (typeof err === 'string' ? err : '')).toLowerCase();
    const status = err?.status || err?.statusCode || err?.code;
    return (
      status === 429 ||
      msg.includes('rate limit') ||
      msg.includes('too many requests') ||
      msg.includes('resource_exhausted') ||
      msg.includes('quota')
    );
  }

  public static isQuotaExceededError(err: any): boolean {
    const msg = (err?.message || (typeof err === 'string' ? err : '')).toLowerCase();
    const status = err?.status || err?.statusCode || err?.code;
    return (
      status === 402 ||
      msg.includes('insufficient balance') ||
      msg.includes('quota exceeded') ||
      msg.includes('exceeded your current quota') ||
      msg.includes('credit')
    );
  }

  public static isAuthError(err: any): boolean {
    const msg = (err?.message || (typeof err === 'string' ? err : '')).toLowerCase();
    const status = err?.status || err?.statusCode || err?.code;
    return (
      status === 401 ||
      status === 403 ||
      msg.includes('invalid api key') ||
      msg.includes('unauthorized') ||
      msg.includes('forbidden')
    );
  }

  public static isTimeoutError(err: any): boolean {
    const msg = (err?.message || (typeof err === 'string' ? err : '')).toLowerCase();
    return (
      err?.name === 'AbortError' ||
      msg.includes('timeout') ||
      msg.includes('etimedout') ||
      msg.includes('aborted')
    );
  }

  public static isServiceUnavailableError(err: any): boolean {
    const msg = (err?.message || (typeof err === 'string' ? err : '')).toLowerCase();
    const status = err?.status || err?.statusCode || err?.code;
    return (
      status === 503 ||
      status === 502 ||
      status === 504 ||
      msg.includes('service unavailable') ||
      msg.includes('high demand') ||
      msg.includes('bad gateway')
    );
  }

  protected createTimeoutSignal(timeoutMs: number, parentSignal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort(new Error(`AI Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    if (parentSignal) {
      if (parentSignal.aborted) {
        controller.abort(parentSignal.reason);
      } else {
        parentSignal.addEventListener('abort', () => controller.abort(parentSignal.reason));
      }
    }

    return {
      signal: controller.signal,
      cleanup: () => clearTimeout(timer),
    };
  }
}
