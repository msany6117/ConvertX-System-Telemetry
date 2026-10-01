import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  PlusCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Sparkles,
  Loader2,
  StopCircle,
  Bot,
  User,
  Zap,
} from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';
import { safeFetchJson } from '../../utils/apiClient';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
}

const SAMPLE_PROMPTS = [
  'How do I convert a PDF to Word without losing tables?',
  'What is the difference between WebP, AVIF, and JPEG XL?',
  'How can I compress video files for Discord 8MB limit?',
  'Write a TypeScript function to convert bytes to human-readable KB/MB/GB',
];

export const AIChatTool: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm **ConvertX AI**, your all-in-one assistant for file conversions, coding, translations, and media optimization. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [lastProvider, setLastProvider] = useState<string>('groq');
  const [lastModel, setLastModel] = useState<string>('');
  const [switched, setSwitched] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSend = async (userText?: string) => {
    const text = (userText || input).trim();
    if (!text || isGenerating) return;

    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await safeFetchJson('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.result || 'No response generated.',
          provider: data.provider,
          model: data.model,
        },
      ]);

      setLastProvider(data.provider);
      setLastModel(data.model);
      setSwitched(Boolean(data.switchedEngine));
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '*(Generation stopped by user)*' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `⚠️ ${err.message || 'AI service is temporarily busy. Please try again.'}`,
          },
        ]);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleNewChat = () => {
    handleStop();
    setMessages([
      {
        role: 'assistant',
        content:
          "New chat started. I'm ready to assist with file questions, code, document transformations, and media tuning.",
      },
    ]);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleRegenerate = () => {
    if (isGenerating || messages.length < 2) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx !== -1) {
      const actualIdx = messages.length - 1 - lastUserIdx;
      const userMessage = messages[actualIdx].content;
      // Truncate to that point
      setMessages(messages.slice(0, actualIdx));
      handleSend(userMessage);
    }
  };

  return (
    <div className="flex flex-col h-[700px] max-h-[85vh] rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200/80 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Ask ConvertX AI</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                Live Assistant
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Conversational multi-engine AI with triple failover protection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AIProviderStatusBadge
            lastProviderUsed={lastProvider}
            lastModelUsed={lastModel}
            switchedEngine={switched}
          />

          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg, index) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={index}
              className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-xs rounded-tr-xs'
                    : 'bg-slate-100/90 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/50 dark:border-slate-700/50'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                {!isUser && index > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-mono">
                      {msg.provider ? `Engine: ${msg.provider}` : 'ConvertX AI'}
                    </span>
                    <button
                      onClick={() => handleCopy(msg.content, index)}
                      className="inline-flex items-center gap-1 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="h-7 w-7 rounded-lg bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex items-start gap-3 justify-start">
            <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-xs p-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
              <span>Thinking with multi-AI router...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts if only 1 greeting message */}
      {messages.length === 1 && (
        <div className="px-5 py-2 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/20">
          {SAMPLE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer text-left"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask ConvertX AI anything about conversion, code, formatting, or documents..."
            disabled={isGenerating}
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-all cursor-pointer"
            >
              <StopCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          )}

          {messages.length > 2 && !isGenerating && (
            <button
              type="button"
              onClick={handleRegenerate}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors cursor-pointer"
              title="Regenerate last response"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
