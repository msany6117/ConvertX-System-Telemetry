import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';
import { AIFileUploadZone } from './AIFileUploadZone';

const STYLES = [
  { id: 'short', label: 'Short', desc: '1-2 sentence quick executive takeaway' },
  { id: 'medium', label: 'Medium', desc: 'Balanced summary covering all main points' },
  { id: 'detailed', label: 'Detailed', desc: 'Comprehensive section-by-section breakdown' },
  { id: 'bullet', label: 'Bullet Points', desc: 'Actionable bullet list of key findings' },
];

export const AISummarizerTool: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState('medium');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string>('groq');
  const [lastModel, setLastModel] = useState<string>('');
  const [switched, setSwitched] = useState(false);

  const inputWordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const outputWordCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
  const reductionPercent =
    inputWordCount > 0 && outputWordCount > 0
      ? Math.max(0, Math.round(((inputWordCount - outputWordCount) / inputWordCount) * 100))
      : 0;

  const handleSummarize = async (textToSummarize?: string) => {
    const text = (textToSummarize || inputText).trim();
    if (!text) return;

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'summarize',
          input: text,
          options: { summaryStyle: selectedStyle },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Summarization failed.');

      setOutputText(data.result || '');
      setLastProvider(data.provider);
      setLastModel(data.model);
      setSwitched(Boolean(data.switchedEngine));
    } catch (err: any) {
      setError(err.message || 'Error occurred during summarization.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_${selectedStyle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Document Summarizer</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Condense articles, papers, PDF reports, and transcripts with high factual accuracy
            </p>
          </div>
        </div>

        <AIProviderStatusBadge
          lastProviderUsed={lastProvider}
          lastModelUsed={lastModel}
          switchedEngine={switched}
        />
      </div>

      {/* Style selector pills */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Summary Length & Format:
        </label>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedStyle === style.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Zone */}
      <AIFileUploadZone
        onTextExtracted={(text) => {
          setInputText(text);
          handleSummarize(text);
        }}
        disabled={isProcessing}
      />

      {/* Dual Textarea Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Textarea */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Long-Form Text</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span>{inputWordCount} words</span>
              {inputText && (
                <button
                  onClick={() => {
                    setInputText('');
                    setOutputText('');
                  }}
                  className="text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your long document, report, legal text, or lecture notes..."
            rows={10}
            className="w-full p-4 resize-none text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 leading-relaxed font-sans"
          />

          <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              onClick={() => handleSummarize()}
              disabled={isProcessing || !inputText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Textarea */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Executive Summary ({selectedStyle})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!outputText}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!outputText}
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
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Synthesizing key insights...
                </span>
              </div>
            ) : outputText ? (
              <p className="whitespace-pre-wrap text-sm text-slate-900 dark:text-white leading-relaxed">
                {outputText}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Summary will appear here
              </div>
            )}
          </div>

          {outputText && (
            <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span>{outputWordCount} words</span>
                {reductionPercent > 0 && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    <TrendingDown className="h-3 w-3" />
                    {reductionPercent}% shorter
                  </span>
                )}
              </div>
              <button
                onClick={() => handleSummarize()}
                className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Regenerate</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
