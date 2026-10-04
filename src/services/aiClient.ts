/**
 * ConvertX Hybrid AI Client Engine
 * Provides dual-mode operation:
 * 1. Server-side proxy routing (/api/ai/process) with full quota and rate management.
 * 2. Automatic Direct Client-Side Fallback on static hosting (e.g., Vercel static export,
 *    404 routes, non-200 responses, or non-JSON payloads).
 * 3. Graceful error handling and defensive response parsing to eliminate
 *    "Failed to execute 'json' on 'Response': Unexpected end of JSON input".
 */

import { cleanTranslatedText } from '../utils/aiTextCleaner';

export interface AIProcessRequest {
  task:
    | 'translate'
    | 'rewrite'
    | 'summarize'
    | 'grammar'
    | 'analyzer'
    | 'content'
    | 'code'
    | 'ask_pdf'
    | 'ocr_image';
  input: string;
  options?: Record<string, any>;
  signal?: AbortSignal;
}

export interface AIProcessResponse {
  result: string;
  provider: string;
  model: string;
  switchedEngine?: boolean;
  isClientFallback?: boolean;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SafeParsedResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  rawText: string;
  error?: string;
  isJson: boolean;
}

/**
 * Defensive JSON Parser
 * Ensures response.json() is NEVER called if the response is not valid JSON,
 * preventing unhandled syntax exceptions and "Unexpected end of JSON input".
 */
export async function safeParseJsonResponse<T = any>(
  response: Response
): Promise<SafeParsedResponse<T>> {
  const status = response.status;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isJsonHeader = contentType.includes('application/json');

  let rawText = '';
  try {
    rawText = await response.text();
  } catch (readErr: any) {
    return {
      ok: false,
      status,
      data: null,
      rawText: '',
      error: readErr?.message || 'Failed to read response body',
      isJson: false,
    };
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      ok: false,
      status,
      data: null,
      rawText: '',
      error: response.ok
        ? 'Empty response received from server'
        : `Server returned empty error response (HTTP ${status})`,
      isJson: false,
    };
  }

  // Check if payload looks like JSON
  const looksLikeJson =
    isJsonHeader ||
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'));

  if (looksLikeJson) {
    try {
      const data = JSON.parse(trimmed) as T;
      return {
        ok: response.ok,
        status,
        data,
        rawText: trimmed,
        error: response.ok
          ? undefined
          : (data as any)?.error || (data as any)?.message || `Server error (HTTP ${status})`,
        isJson: true,
      };
    } catch {
      return {
        ok: false,
        status,
        data: null,
        rawText: trimmed,
        error: `Invalid JSON syntax from server (HTTP ${status})`,
        isJson: false,
      };
    }
  }

  // Non-JSON response (e.g. 404 HTML on static Vercel)
  return {
    ok: false,
    status,
    data: null,
    rawText: trimmed,
    error: `Server returned non-JSON content (${contentType || 'unknown'}, HTTP ${status})`,
    isJson: false,
  };
}

/**
 * Resolve client-side API keys with multi-prefix fallback
 * Supports NEXT_PUBLIC_*, VITE_*, and environment variables
 */
export function getClientAIKeys() {
  const resolve = (keys: string[], defaultFallback: string): string => {
    // 1. Check import.meta.env
    try {
      const metaEnv = (import.meta as any)?.env;
      if (metaEnv) {
        for (const k of keys) {
          const val = metaEnv[k];
          if (val && typeof val === 'string' && val.trim() && !val.includes('YOUR_')) {
            return val.trim();
          }
        }
      }
    } catch {}

    // 2. Check process.env
    try {
      if (typeof process !== 'undefined' && process.env) {
        for (const k of keys) {
          const val = (process.env as any)[k];
          if (val && typeof val === 'string' && val.trim() && !val.includes('YOUR_')) {
            return val.trim();
          }
        }
      }
    } catch {}

    // 3. Check window
    try {
      if (typeof window !== 'undefined') {
        for (const k of keys) {
          const val = (window as any)[k];
          if (val && typeof val === 'string' && val.trim() && !val.includes('YOUR_')) {
            return val.trim();
          }
        }
      }
    } catch {}

    return defaultFallback;
  };

  return {
    groqKey: resolve(
      ['NEXT_PUBLIC_GROQ_API_KEY', 'VITE_GROQ_API_KEY', 'GROQ_API_KEY'],
      ''
    ),
    geminiKey: resolve(
      ['NEXT_PUBLIC_GEMINI_API_KEY', 'VITE_GEMINI_API_KEY', 'GEMINI_API_KEY'],
      ''
    ),
    deepseekKey: resolve(
      ['NEXT_PUBLIC_DEEPSEEK_API_KEY', 'VITE_DEEPSEEK_API_KEY', 'DEEPSEEK_API_KEY'],
      ''
    ),
    openrouterKey: resolve(
      ['NEXT_PUBLIC_OPENROUTER_API_KEY', 'VITE_OPENROUTER_API_KEY', 'OPENROUTER_API_KEY'],
      ''
    ),
  };
}

/**
 * Build task prompts for direct client execution
 */
function buildClientPrompt(
  task: AIProcessRequest['task'],
  input: string,
  options: Record<string, any> = {}
): { prompt: string; systemInstruction: string } {
  const baseSystem =
    'You are ConvertX AI, an elite conversion and content intelligence engine. Provide clean, direct, and helpful results.';

  switch (task) {
    case 'translate': {
      const src = options.sourceLanguage || 'Auto-detect';
      const target = options.targetLanguage || 'English';
      return {
        systemInstruction: `${baseSystem}
You are a professional multilingual translator.
Translate the provided text accurately and fluently into ${target}.
CRITICAL RULES:
- Output ONLY the raw, pure translated human-readable text.
- Do NOT wrap in quotes, triple quotes ("""), or markdown code blocks (\`\`\`).
- Do NOT output JSON, object brackets ({}, []), escape slashes (\\), or delimiters (|).
- Do NOT include conversational filler, notes, labels, or intros (no "Translation:", no "Target Translation:").
- Preserve natural paragraph breaks.`,
        prompt: `Translate the following text from ${src} to ${target}. Output only the clean translation without quotes, brackets, or code markup:\n\n${input}`,
      };
    }

    case 'rewrite': {
      const tone = options.tone || 'Professional';
      return {
        systemInstruction: `${baseSystem}
Rewrite the provided text to match the "${tone}" tone and style cleanly without conversational preambles.`,
        prompt: `Rewrite the following text with a "${tone}" tone:\n\n${input}`,
      };
    }

    case 'summarize': {
      const style = options.summaryStyle || 'medium';
      return {
        systemInstruction: `${baseSystem}
Summarize the key ideas cleanly and accurately. Avoid fluff.`,
        prompt: `Summarize the following text in a "${style}" format (short, medium, detailed, bullet points):\n\n${input}`,
      };
    }

    case 'grammar': {
      return {
        systemInstruction: `${baseSystem}
Fix grammar, spelling, punctuation, capitalization, sentence structure, and clarity.
Return strict JSON with schema:
{
  "corrected": "the fully corrected text",
  "correctionsCount": 3,
  "changes": [{ "original": "text", "fixed": "text", "reason": "reason" }],
  "clarityScore": 95
}`,
        prompt: `Correct the grammar, spelling, and clarity of this text:\n\n${input}`,
      };
    }

    case 'analyzer': {
      return {
        systemInstruction: `${baseSystem}
Analyze the text and return valid JSON with schema:
{
  "wordCount": 100,
  "charCount": 500,
  "readingLevel": "Grade 8",
  "sentiment": "Positive",
  "estimatedReadingTimeMinutes": 1,
  "tone": "Informative",
  "summary": "Brief summary",
  "tags": ["tag1", "tag2"]
}`,
        prompt: `Analyze this text:\n\n${input}`,
      };
    }

    case 'content': {
      const template = options.template || 'blog_intro';
      return {
        systemInstruction: `${baseSystem}
Generate high quality content matching the requested template: ${template}. Do not add commentary.`,
        prompt: `Generate content for template "${template}" based on this prompt:\n\n${input}`,
      };
    }

    case 'code': {
      const action = options.action || 'explain';
      const language = options.language || 'auto';
      return {
        systemInstruction: `${baseSystem}
You are an expert software engineer. Provide code explanation, bug fixing, optimization, or translation with syntax highlighted markdown code blocks.`,
        prompt: `Action: ${action}\nLanguage: ${language}\n\nCode/Request:\n${input}`,
      };
    }

    case 'ask_pdf': {
      const doc = options.documentContext || '';
      return {
        systemInstruction: `${baseSystem}
You are an intelligent PDF document assistant. Analyze the document context provided below and accurately answer the user's questions. Be clear, concise, and helpful.`,
        prompt: `DOCUMENT CONTEXT:\n${doc}\n\nUSER QUESTION:\n${input}`,
      };
    }

    case 'ocr_image': {
      return {
        systemInstruction: `${baseSystem}
You are an Optical Character Recognition (OCR) model. Transcribe all text from the provided image accurately.`,
        prompt: input,
      };
    }

    default:
      return {
        systemInstruction: baseSystem,
        prompt: input,
      };
  }
}

/**
 * Direct Client Call: Groq LPU
 */
async function callClientGroq(
  prompt: string,
  systemInstruction: string,
  model = 'openai/gpt-oss-120b',
  signal?: AbortSignal
): Promise<string> {
  const { groqKey } = getClientAIKeys();
  if (!groqKey) throw new Error('Groq API key is not configured.');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
    signal,
  });

  const parsed = await safeParseJsonResponse<any>(res);
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || `Groq request failed with status ${res.status}`);
  }

  const content = parsed.data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq returned empty response');
  return content;
}

/**
 * Direct Client Call: Gemini
 */
async function callClientGemini(
  prompt: string,
  systemInstruction: string,
  model = 'gemini-3.8-flash',
  signal?: AbortSignal
): Promise<string> {
  const { geminiKey } = getClientAIKeys();
  if (!geminiKey) throw new Error('Gemini API key is not configured.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: `${systemInstruction}\n\n${prompt}` }],
        },
      ],
    }),
    signal,
  });

  const parsed = await safeParseJsonResponse<any>(res);
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || `Gemini request failed with status ${res.status}`);
  }

  const text = parsed.data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty candidate');
  return text;
}

/**
 * Direct Client Call: DeepSeek
 */
async function callClientDeepSeek(
  prompt: string,
  systemInstruction: string,
  model = 'deepseek-chat',
  signal?: AbortSignal
): Promise<string> {
  const { deepseekKey } = getClientAIKeys();
  if (!deepseekKey) throw new Error('DeepSeek API key is not configured.');

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
    }),
    signal,
  });

  const parsed = await safeParseJsonResponse<any>(res);
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || `DeepSeek request failed with status ${res.status}`);
  }

  const content = parsed.data.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek returned empty response');
  return content;
}

/**
 * Direct Client Call: OpenRouter
 */
async function callClientOpenRouter(
  prompt: string,
  systemInstruction: string,
  model = 'deepseek/deepseek-chat',
  signal?: AbortSignal
): Promise<string> {
  const { openrouterKey } = getClientAIKeys();
  if (!openrouterKey) throw new Error('OpenRouter API key is not configured.');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openrouterKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://convertx.app',
      'X-Title': 'ConvertX PDF Studio',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: prompt },
      ],
    }),
    signal,
  });

  const parsed = await safeParseJsonResponse<any>(res);
  if (!parsed.ok || !parsed.data) {
    throw new Error(parsed.error || `OpenRouter request failed with status ${res.status}`);
  }

  const content = parsed.data.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned empty response');
  return content;
}

/**
 * Execute client-side fallback across available providers
 */
async function executeClientFallback(
  task: AIProcessRequest['task'],
  input: string,
  options: Record<string, any> = {},
  signal?: AbortSignal
): Promise<AIProcessResponse> {
  const { prompt, systemInstruction } = buildClientPrompt(task, input, options);
  const errors: string[] = [];

  // 1. Try Groq LPU (Fastest, High Availability)
  try {
    const rawResult = await callClientGroq(prompt, systemInstruction, 'openai/gpt-oss-120b', signal);
    const result = task === 'translate' ? cleanTranslatedText(rawResult) : rawResult;
    return {
      result,
      provider: 'groq',
      model: 'openai/gpt-oss-120b (Client Direct)',
      isClientFallback: true,
    };
  } catch (groqErr: any) {
    if (signal?.aborted) throw groqErr;
    errors.push(`Groq: ${groqErr.message}`);
  }

  // 2. Try Gemini
  try {
    const rawResult = await callClientGemini(prompt, systemInstruction, 'gemini-3.8-flash', signal);
    const result = task === 'translate' ? cleanTranslatedText(rawResult) : rawResult;
    return {
      result,
      provider: 'gemini',
      model: 'gemini-3.8-flash (Client Direct)',
      isClientFallback: true,
      switchedEngine: true,
    };
  } catch (geminiErr: any) {
    if (signal?.aborted) throw geminiErr;
    errors.push(`Gemini: ${geminiErr.message}`);
  }

  // 3. Try DeepSeek
  try {
    const rawResult = await callClientDeepSeek(prompt, systemInstruction, 'deepseek-chat', signal);
    const result = task === 'translate' ? cleanTranslatedText(rawResult) : rawResult;
    return {
      result,
      provider: 'deepseek',
      model: 'deepseek-chat (Client Direct)',
      isClientFallback: true,
      switchedEngine: true,
    };
  } catch (dsErr: any) {
    if (signal?.aborted) throw dsErr;
    errors.push(`DeepSeek: ${dsErr.message}`);
  }

  // 4. Try OpenRouter
  try {
    const rawResult = await callClientOpenRouter(prompt, systemInstruction, 'deepseek/deepseek-chat', signal);
    const result = task === 'translate' ? cleanTranslatedText(rawResult) : rawResult;
    return {
      result,
      provider: 'openrouter',
      model: 'openrouter/deepseek-chat (Client Direct)',
      isClientFallback: true,
      switchedEngine: true,
    };
  } catch (orErr: any) {
    if (signal?.aborted) throw orErr;
    errors.push(`OpenRouter: ${orErr.message}`);
  }

  throw new Error(`All client AI providers failed: ${errors.join(' | ')}`);
}

/**
 * Primary AI Process Entry Point
 * Tries server endpoint first; on any non-200, non-JSON, or network failure,
 * immediately and seamlessly executes client-side fallback.
 */
export async function runAIProcess(params: AIProcessRequest): Promise<AIProcessResponse> {
  const { task, input, options = {}, signal } = params;

  // Attempt server-side proxy endpoint first
  try {
    const res = await fetch('/api/ai/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, input, options }),
      signal,
    });

    const parsed = await safeParseJsonResponse<any>(res);

    if (parsed.ok && parsed.data && parsed.data.result) {
      const clean = task === 'translate' ? cleanTranslatedText(parsed.data.result) : parsed.data.result;
      return {
        result: clean,
        provider: parsed.data.provider || 'ai',
        model: parsed.data.model || '',
        switchedEngine: Boolean(parsed.data.switchedEngine),
        isClientFallback: false,
      };
    }

    // Server responded with error, 404, or non-JSON HTML (common on Vercel static)
    console.warn(
      `[AIClient] Server API endpoint /api/ai/process unavailable (HTTP ${parsed.status}, isJson=${parsed.isJson}). Triggering direct client fallback...`
    );
  } catch (serverErr: any) {
    if (signal?.aborted) throw serverErr;
    console.warn('[AIClient] Network failure contacting server API. Triggering direct client fallback...', serverErr.message);
  }

  // Seamless Client-Side Fallback
  return await executeClientFallback(task, input, options, signal);
}

/**
 * Conversational Chat Entry Point with Client-Side Fallback
 */
export async function runAIChat(
  messages: AIChatMessage[],
  signal?: AbortSignal
): Promise<{
  reply: string;
  provider: string;
  model: string;
  isClientFallback?: boolean;
  switchedEngine?: boolean;
}> {
  // Attempt server chat endpoint first
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal,
    });

    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok && parsed.data && parsed.data.reply) {
      return {
        reply: parsed.data.reply,
        provider: parsed.data.provider || 'ai',
        model: parsed.data.model || '',
        isClientFallback: false,
      };
    }
  } catch (err: any) {
    if (signal?.aborted) throw err;
  }

  // Client-Side Chat Fallback across providers: Groq -> Gemini -> DeepSeek -> OpenRouter
  const { groqKey, geminiKey, deepseekKey, openrouterKey } = getClientAIKeys();

  // 1. Try Groq
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages,
          temperature: 0.5,
        }),
        signal,
      });
      const parsed = await safeParseJsonResponse<any>(res);
      if (parsed.ok && parsed.data?.choices?.[0]?.message?.content) {
        return {
          reply: parsed.data.choices[0].message.content,
          provider: 'groq',
          model: 'openai/gpt-oss-120b (Client Direct)',
          isClientFallback: true,
        };
      }
    } catch {}
  }

  // 2. Try Gemini
  if (geminiKey) {
    try {
      const lastUser = messages.filter((m) => m.role === 'user').pop()?.content || '';
      const prompt = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
      const text = await callClientGemini(prompt, 'You are ConvertX AI assistant.', 'gemini-3.8-flash', signal);
      if (text) {
        return {
          reply: text,
          provider: 'gemini',
          model: 'gemini-3.8-flash (Client Direct)',
          isClientFallback: true,
          switchedEngine: true,
        };
      }
    } catch {}
  }

  // 3. Try DeepSeek
  if (deepseekKey) {
    try {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
        }),
        signal,
      });
      const parsed = await safeParseJsonResponse<any>(res);
      if (parsed.ok && parsed.data?.choices?.[0]?.message?.content) {
        return {
          reply: parsed.data.choices[0].message.content,
          provider: 'deepseek',
          model: 'deepseek-chat (Client Direct)',
          isClientFallback: true,
          switchedEngine: true,
        };
      }
    } catch {}
  }

  // 4. Try OpenRouter
  if (openrouterKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openrouterKey}`,
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://convertx.app',
          'X-Title': 'ConvertX PDF Studio',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages,
        }),
        signal,
      });
      const parsed = await safeParseJsonResponse<any>(res);
      if (parsed.ok && parsed.data?.choices?.[0]?.message?.content) {
        return {
          reply: parsed.data.choices[0].message.content,
          provider: 'openrouter',
          model: 'openrouter/deepseek-chat (Client Direct)',
          isClientFallback: true,
          switchedEngine: true,
        };
      }
    } catch {}
  }

  throw new Error('AI Chat service is temporarily unavailable. Please configure an API key.');
}

/**
 * Fetch provider status with client fallback
 */
export async function fetchAIProvidersStatus(): Promise<any> {
  try {
    const res = await fetch('/api/ai/providers');
    const parsed = await safeParseJsonResponse<any>(res);
    if (parsed.ok && parsed.data) {
      return parsed.data;
    }
  } catch {}

  // Fallback status for static hosts
  return {
    priority: ['groq', 'gemini', 'deepseek'],
    providers: [
      { id: 'groq', name: 'Groq LPU (Client Direct)', status: 'healthy', model: 'openai/gpt-oss-120b' },
      { id: 'gemini', name: 'Google Gemini (Client Direct)', status: 'healthy', model: 'gemini-3.8-flash' },
      { id: 'deepseek', name: 'DeepSeek AI (Client Direct)', status: 'healthy', model: 'deepseek-chat' },
    ],
  };
}
