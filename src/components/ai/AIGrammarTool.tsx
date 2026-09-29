import React, { useState } from 'react';
import {
  CheckCircle,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  ListChecks,
} from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';
import { AIFileUploadZone } from './AIFileUploadZone';

export const AIGrammarTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [structuredData, setStructuredData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string>('groq');
  const [lastModel, setLastModel] = useState<string>('');
  const [switched, setSwitched] = useState(false);

  const handleFix = async (textToFix?: string) => {
    const text = (textToFix || inputText).trim();
    if (!text) return;

    setIsProcessing(true);
    setError(null);
    setStructuredData(null);

    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'grammar',
          input: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Grammar fix failed.');

      if (data.structuredData && data.structuredData.corrected) {
        setCorrectedText(data.structuredData.corrected);
        setStructuredData(data.structuredData);
      } else {
        setCorrectedText(data.result || '');
      }

      setLastProvider(data.provider);
      setLastModel(data.model);
      setSwitched(Boolean(data.switchedEngine));
    } catch (err: any) {
      setError(err.message || 'Error occurred fixing grammar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!correctedText) return;
    navigator.clipboard.writeText(correctedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!correctedText) return;
    const blob = new Blob([correctedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'corrected_text.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
            <CheckCircle className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Grammar & Clarity Fixer</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detects and fixes spelling, punctuation, awkward phrasing, and subject-verb mismatches
            </p>
          </div>
        </div>

        <AIProviderStatusBadge
          lastProviderUsed={lastProvider}
          lastModelUsed={lastModel}
          switchedEngine={switched}
        />
      </div>

      {/* File Upload Zone */}
      <AIFileUploadZone
        onTextExtracted={(text) => {
          setInputText(text);
          handleFix(text);
        }}
        disabled={isProcessing}
      />

      {/* Dual Textarea Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Textarea */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/50">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Original Text</span>
            {inputText && (
              <button
                onClick={() => {
                  setInputText('');
                  setCorrectedText('');
                  setStructuredData(null);
                }}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste text with grammatical errors, spelling mistakes, or unclear phrasing..."
            rows={10}
            className="w-full p-4 resize-none text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 leading-relaxed font-sans"
          />

          <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              onClick={() => handleFix()}
              disabled={isProcessing || !inputText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Checking grammar...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Fix Grammar & Polish</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Textarea */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Corrected Version</span>
              {structuredData?.clarityScore && (
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Score: {structuredData.clarityScore}/100
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!correctedText}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!correctedText}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="text-[11px]">Download</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 p-4 overflow-y-auto max-h-[300px] min-h-[220px]">
            {isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xs gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Proofreading with multi-AI router...
                </span>
              </div>
            ) : correctedText ? (
              <p className="whitespace-pre-wrap text-sm text-slate-900 dark:text-white leading-relaxed">
                {correctedText}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Polished text will appear here
              </div>
            )}
          </div>

          {correctedText && (
            <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span>{correctedText.split(/\s+/).filter(Boolean).length} words</span>
              <button
                onClick={() => handleFix()}
                className="inline-flex items-center gap-1 hover:text-teal-600 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Re-check</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Structured Changes Breakdown if available */}
      {structuredData?.changes && structuredData.changes.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <ListChecks className="h-4 w-4 text-teal-600" />
            <span>Detailed Corrections ({structuredData.changes.length}):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {structuredData.changes.map((c: any, idx: number) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 text-xs space-y-1"
              >
                <div className="flex items-center gap-1">
                  <span className="line-through text-rose-500 font-mono">{c.original}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-emerald-600 font-mono font-semibold">{c.fixed}</span>
                </div>
                {c.reason && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.reason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
