import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Languages,
  ArrowRightLeft,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';
import { AIFileUploadZone } from './AIFileUploadZone';
import { cleanTranslatedText } from '../../utils/aiTextCleaner';
import { safeFetchJson } from '../../utils/apiClient';

const LANGUAGES = [
  'Auto-detect',
  'English',
  'Bengali',
  'Hindi',
  'Arabic',
  'Spanish',
  'French',
  'German',
  'Portuguese',
  'Chinese',
  'Japanese',
  'Korean',
  'Russian',
  'Italian',
  'Turkish',
];

export const AITranslatorTool: React.FC = () => {
  const [sourceLanguage, setSourceLanguage] = useState('Auto-detect');
  const [targetLanguage, setTargetLanguage] = useState('Bengali');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string>('groq');
  const [lastModel, setLastModel] = useState<string>('');
  const [switched, setSwitched] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastTranslatedKeyRef = useRef<string>('');

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;
  const outputWordCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;
  const outputCharCount = outputText.length;

  /**
   * Core translation execution using AI Router
   */
  const executeTranslation = useCallback(
    async (text: string, srcLang: string, tgtLang: string, force = false) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setOutputText('');
        setIsTranslating(false);
        setIsTyping(false);
        return;
      }

      const cacheKey = `${srcLang}::${tgtLang}::${trimmed}`;
      if (!force && lastTranslatedKeyRef.current === cacheKey && outputText) {
        setIsTranslating(false);
        setIsTyping(false);
        return;
      }

      // Cancel previous pending fetch to prevent race conditions on fast typing
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsTranslating(true);
      setError(null);

      try {
        const data = await safeFetchJson('/api/ai/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task: 'translate',
            input: trimmed,
            options: {
              sourceLanguage: srcLang === 'Auto-detect' ? undefined : srcLang,
              targetLanguage: tgtLang,
            },
          }),
          signal: controller.signal,
        });

        // Clean any quotes, triple quotes, markdown wrappers, JSON brackets, escape slashes, or symbol noise
        const sanitizedResult = cleanTranslatedText(data.result || '');
        setOutputText(sanitizedResult);
        setLastProvider(data.provider);
        setLastModel(data.model);
        setSwitched(Boolean(data.switchedEngine));
        lastTranslatedKeyRef.current = cacheKey;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // Normal abort from continuous typing, do not show error
          return;
        }
        setError(err.message || 'Error occurred during translation.');
      } finally {
        if (abortControllerRef.current === controller) {
          setIsTranslating(false);
          setIsTyping(false);
        }
      }
    },
    [outputText]
  );

  /**
   * Handle text changes with 500ms debounce
   */
  const handleInputChange = (newText: string) => {
    setInputText(newText);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!newText.trim()) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setOutputText('');
      setIsTranslating(false);
      setIsTyping(false);
      setError(null);
      lastTranslatedKeyRef.current = '';
      return;
    }

    setIsTyping(true);

    debounceTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      executeTranslation(newText, sourceLanguage, targetLanguage);
    }, 500);
  };

  /**
   * Trigger immediate re-translation when source or target language changes
   */
  const handleSourceLanguageChange = (newSrc: string) => {
    setSourceLanguage(newSrc);
    if (inputText.trim()) {
      executeTranslation(inputText, newSrc, targetLanguage, true);
    }
  };

  const handleTargetLanguageChange = (newTgt: string) => {
    setTargetLanguage(newTgt);
    if (inputText.trim()) {
      executeTranslation(inputText, sourceLanguage, newTgt, true);
    }
  };

  /**
   * Swap source and target languages
   */
  const swapLanguages = () => {
    const newSrc = targetLanguage;
    const newTgt = sourceLanguage === 'Auto-detect' ? 'English' : sourceLanguage;
    setSourceLanguage(newSrc);
    setTargetLanguage(newTgt);

    if (outputText) {
      const swappedInput = outputText;
      setInputText(swappedInput);
      setOutputText('');
      executeTranslation(swappedInput, newSrc, newTgt, true);
    } else if (inputText) {
      executeTranslation(inputText, newSrc, newTgt, true);
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
    a.download = `translation_${targetLanguage.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setInputText('');
    setOutputText('');
    setError(null);
    setIsTranslating(false);
    setIsTyping(false);
    lastTranslatedKeyRef.current = '';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Languages className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>AI Multilingual Translator</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                <Zap className="h-2.5 w-2.5" />
                Auto-Translate Active
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Translates automatically as you type • Clean natural output with multi-provider failover
            </p>
          </div>
        </div>

        <AIProviderStatusBadge
          lastProviderUsed={lastProvider}
          lastModelUsed={lastModel}
          switchedEngine={switched}
        />
      </div>

      {/* Language selectors & Swap */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-xs font-semibold text-slate-500 pl-2">From:</span>
          <select
            value={sourceLanguage}
            onChange={(e) => handleSourceLanguageChange(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={swapLanguages}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer hover:shadow-2xs active:scale-95"
          title="Swap source and target language"
        >
          <ArrowRightLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <span className="text-xs font-semibold text-slate-500 pl-2">To:</span>
          <select
            value={targetLanguage}
            onChange={(e) => handleTargetLanguageChange(e.target.value)}
            className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {LANGUAGES.filter((l) => l !== 'Auto-detect').map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Direct File Extractor */}
      <AIFileUploadZone
        onTextExtracted={(text) => {
          setInputText(text);
          executeTranslation(text, sourceLanguage, targetLanguage, true);
        }}
        disabled={isTranslating}
      />

      {/* Dual Textarea grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Textarea */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Source ({sourceLanguage})
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} chars</span>
              {inputText && (
                <button
                  onClick={handleClear}
                  className="text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Clear text"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type or paste text to translate... It translates automatically as you type without pressing any button."
            rows={10}
            className="w-full p-4 resize-none text-sm text-slate-900 dark:text-white bg-transparent focus:outline-none placeholder:text-slate-400 leading-relaxed font-sans"
          />

          {/* Real-time typing status banner (replaces the manual translate button) */}
          <div className="px-4 py-2.5 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            {isTranslating ? (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Auto-translating to {targetLanguage}...</span>
              </div>
            ) : isTyping ? (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span>Typing detected • translating shortly...</span>
              </div>
            ) : inputText.trim() && outputText ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="h-3.5 w-3.5" />
                <span>Automatically up to date</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                <span>Type above to translate automatically</span>
              </div>
            )}

            <span className="text-[11px] text-slate-400">Debounced (500ms)</span>
          </div>
        </div>

        {/* Translation Output Textarea */}
        <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden transition-all">
          {/* Subtle top indicator bar when re-translating an existing text */}
          {isTranslating && outputText && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse z-10" />
          )}

          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>Translation ({targetLanguage})</span>
              {isTranslating && (
                <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
              )}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!outputText}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
                title="Copy translation"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!outputText}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
                title="Download as .txt"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="text-[11px]">Download</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 p-4 overflow-y-auto max-h-[300px] min-h-[220px]">
            {isTranslating && !outputText ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-2.5 py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium">Translating automatically with ConvertX AI...</span>
              </div>
            ) : outputText ? (
              <div className="whitespace-pre-wrap text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-sans select-text">
                {outputText}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 dark:text-slate-500 italic py-12">
                <span>Start typing in the source box to see live translation</span>
              </div>
            )}
          </div>

          {outputText && (
            <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span>{outputWordCount} words</span>
                <span>•</span>
                <span>{outputCharCount} chars</span>
              </div>
              <button
                onClick={() => executeTranslation(inputText, sourceLanguage, targetLanguage, true)}
                disabled={isTranslating || !inputText.trim()}
                className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 transition-colors cursor-pointer"
                title="Re-translate with AI"
              >
                <RefreshCw className={`h-3 w-3 ${isTranslating ? 'animate-spin' : ''}`} />
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
