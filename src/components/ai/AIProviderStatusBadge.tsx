import React, { useState, useEffect } from 'react';
import { Cpu, ShieldCheck, Zap, RefreshCw, ChevronDown, CheckCircle2 } from 'lucide-react';

interface AIProviderStatusBadgeProps {
  lastProviderUsed?: string;
  lastModelUsed?: string;
  switchedEngine?: boolean;
}

export const AIProviderStatusBadge: React.FC<AIProviderStatusBadgeProps> = ({
  lastProviderUsed,
  lastModelUsed,
  switchedEngine,
}) => {
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetch('/api/ai/providers')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [lastProviderUsed]);

  const activeProvider = lastProviderUsed || data?.priority?.[0] || 'groq';

  const getProviderLabel = (id: string) => {
    if (id === 'gemini') return 'Gemini 3.8';
    if (id === 'deepseek') return 'DeepSeek V3';
    if (id === 'groq') return 'Groq LPU (Ultra-Fast)';
    return id.toUpperCase();
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-[11px] font-medium text-slate-700 shadow-2xs hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
        title="View multi-provider failover routing status"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-slate-900 dark:text-white">AI Engine:</span>
        <span className="text-blue-600 dark:text-blue-400 font-medium">
          {getProviderLabel(activeProvider)}
        </span>
        {switchedEngine && (
          <span className="text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold">
            Auto-Switched
          </span>
        )}
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Multi-Provider AI Router
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                Triple Redundancy
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 py-2 leading-relaxed">
              If an AI engine is busy or rate-limited, ConvertX automatically fails over to the next engine in milliseconds without interrupting your workflow.
            </p>

            <div className="space-y-2 pt-1">
              {(data?.providers || [
                { id: 'gemini', name: 'Google Gemini', status: 'healthy', currentModel: 'gemini-3.8-flash' },
                { id: 'deepseek', name: 'DeepSeek AI', status: 'healthy', currentModel: 'deepseek-chat' },
                { id: 'groq', name: 'Groq LPU Engine', status: 'healthy', currentModel: 'openai/gpt-oss-120b' },
              ]).map((p: any) => {
                const isCurrent = (lastProviderUsed || activeProvider) === p.id;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                      isCurrent
                        ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/30'
                        : 'border-slate-100 bg-slate-50/50 dark:border-slate-800/80 dark:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          p.status === 'healthy'
                            ? 'bg-emerald-500'
                            : p.status === 'cooldown'
                            ? 'bg-amber-500'
                            : 'bg-slate-400'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {p.currentModel}
                        </div>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {data?.userQuota && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
                <span>Free Daily Quota:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {data.userQuota.remainingRequests} / {data.userQuota.dailyLimit} remaining
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
