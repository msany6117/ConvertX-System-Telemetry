import React, { useState } from 'react';
import {
  PenTool,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';
import { AIFileUploadZone } from './AIFileUploadZone';
import { runAIProcess } from '../../services/aiClient';

const TONES = [
  { id: 'Professional', label: 'Professional', desc: 'Crisp, articulate business standard' },
  { id: 'Casual', label: 'Casual', desc: 'Relaxed, conversational and natural' },
  { id: 'Friendly', label: 'Friendly', desc: 'Warm, encouraging, and welcoming' },
  { id: 'Formal', label: 'Formal', desc: 'Diplomatic, academic, and serious' },
  { id: 'Simple', label: 'Simple', desc: 'Clear plain language, easily readable' },
  { id: 'Shorter', label: 'Shorter', desc: 'Concise summary eliminating fluff' },
  { id: 'Longer', label: 'Longer', desc: 'Expanded with richer detail & examples' },
  { id: 'Marketing', label: 'Marketing', desc: 'Persuasive, engaging, conversion-focused' },
];

export const AIRewriteTool: React.FC = () => {
  const [selectedTone, setSelectedTone] = useState('Professional');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string>('groq');
  const [lastModel, setLastModel] = useState<string>('');
  const [switched, setSwitched] = useState(false);

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;

  const handleRewrite = async (textToRewrite?: string) => {
    const text = (textToRewrite || inputText).trim();
    if (!text) return;

    setIsProcessing(true);
    setError(null);

    try {
      const data = await runAIProcess({
        task: 'rewrite',
        input: text,
        options: { tone: selectedTone },
      });

      setOutputText(data.result || '');
      setLastProvider(data.provider);
      setLastModel(data.model);
      setSwitched(Boolean(data.switchedEngine));
    } catch (err: any) {
      setError(err.message || 'Error occurred during rewrite.');
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
    a.download = `rewrite_${selectedTone.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
            <PenTool className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Content Rewriter</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instantly rewrite text into professional, casual, shorter, marketing, or simplified styles
            </p>
          </div>
        </div>

        <AIProviderStatusBadge
          lastProviderUsed={lastProvider}
          lastModelUsed={lastModel}
          switchedEngine={switched}
        />
      </div>

      {/* Tone Options Pills */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Target Tone & Style:
        </label>
        <div className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelectedTone(tone.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                selectedTone === tone.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {tone.label}
            </button>
          ))}
        </div>
      </div>

      {/* File Upload Zone */}
      <AIFileUploadZone
        onTextExtracted={(text) => {
          setInputText(text);
          handleRewrite(text);
        }}
        disabled={isProcessing}
      />

      {/* Input / Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Textarea */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/50">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Original Text</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span>{wordCount} words</span>
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
            placeholder="Paste drafts, paragraphs, emails, or articles to rewrite in your chosen tone..."
            rows={10}
            className="w-full p-4 resize-none text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 leading-relaxed font-sans"
          />

          <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <button
              onClick={() => handleRewrite()}
              disabled={isProcessing || !inputText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Rewriting with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Rewrite as {selectedTone}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Textarea */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Rewritten Result ({selectedTone})
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
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Transforming text...
                </span>
              </div>
            ) : outputText ? (
              <p className="whitespace-pre-wrap text-sm text-slate-900 dark:text-white leading-relaxed">
                {outputText}
              </p>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Rewritten content will appear here
              </div>
            )}
          </div>

          {outputText && (
            <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span>{outputText.split(/\s+/).filter(Boolean).length} words</span>
              <button
                onClick={() => handleRewrite()}
                className="inline-flex items-center gap-1 hover:text-emerald-600 transition-colors cursor-pointer"
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
