import React, { useState } from 'react';
import {
  BarChart3,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Loader2,
  Clock,
  BookOpen,
  Smile,
  Hash,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';
import { AIFileUploadZone } from './AIFileUploadZone';

export const AITextAnalyzerTool: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string>('groq');
  const [lastModel, setLastModel] = useState<string>('');
  const [switched, setSwitched] = useState(false);

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = (textToAnalyze || inputText).trim();
    if (!text) return;

    setIsProcessing(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'analyzer',
          input: text,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Text analysis failed.');

      if (data.structuredData) {
        setAnalysis(data.structuredData);
      } else {
        // Fallback parse attempt
        try {
          const parsed = JSON.parse(data.result);
          setAnalysis(parsed);
        } catch {
          setAnalysis({ summary: data.result });
        }
      }

      setLastProvider(data.provider);
      setLastModel(data.model);
      setSwitched(Boolean(data.switchedEngine));
    } catch (err: any) {
      setError(err.message || 'Error occurred analyzing text.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyReport = () => {
    if (!analysis) return;
    const report = JSON.stringify(analysis, null, 2);
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-violet-600 text-white flex items-center justify-center">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Linguistic & Tone Analyzer</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates readability grade, emotional sentiment, key topics, and reading time
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
          handleAnalyze(text);
        }}
        disabled={isProcessing}
      />

      {/* Input Textarea */}
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-violet-500/50">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Input Document or Script</span>
          {inputText && (
            <button
              onClick={() => {
                setInputText('');
                setAnalysis(null);
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
          placeholder="Paste essay, speech, marketing campaign, product review, or research paper..."
          rows={7}
          className="w-full p-4 resize-none text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 leading-relaxed font-sans"
        />

        <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
          </span>
          <button
            onClick={() => handleAnalyze()}
            disabled={isProcessing || !inputText.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing text...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Run Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysis && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Analysis Findings</h3>
            <button
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied JSON' : 'Copy Report'}</span>
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <BookOpen className="h-4 w-4 mx-auto text-blue-600 mb-1" />
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Reading Level
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {analysis.readingLevel || 'Standard'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <Smile className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Sentiment
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {analysis.sentiment || 'Neutral'}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <Clock className="h-4 w-4 mx-auto text-amber-600 mb-1" />
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Read Time
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                ~{analysis.estimatedReadTimeMinutes || 1} min
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
              <Hash className="h-4 w-4 mx-auto text-purple-600 mb-1" />
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Tone
              </div>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                {analysis.tone || 'Neutral'}
              </div>
            </div>
          </div>

          {/* Keywords & Topics */}
          {analysis.keywords && analysis.keywords.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Key Extracted Keywords:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.keywords.map((kw: string, i: number) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 px-2.5 py-1 text-xs font-medium"
                  >
                    <Tag className="h-3 w-3" />
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Summary Synopsis */}
          {analysis.summary && (
            <div className="rounded-xl bg-slate-50 p-3.5 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">Synopsis: </span>
              {analysis.summary}
            </div>
          )}
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
