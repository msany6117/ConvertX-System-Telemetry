import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  Trash2,
  Sparkles,
  Loader2,
  RefreshCw,
  AlertCircle,
  FileCode,
  Wrench,
  Zap,
  ArrowRightLeft,
  PlusCircle,
} from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';
import { AIFileUploadZone } from './AIFileUploadZone';
import { runAIProcess } from '../../services/aiClient';

const ACTIONS = [
  { id: 'explain', label: 'Explain Code', icon: FileCode, desc: 'Step-by-step breakdown of how code executes' },
  { id: 'fix', label: 'Fix Bugs', icon: Wrench, desc: 'Find errors, edge cases, and security flaws' },
  { id: 'optimize', label: 'Optimize', icon: Zap, desc: 'Improve execution speed & memory complexity' },
  { id: 'convert', label: 'Convert Language', icon: ArrowRightLeft, desc: 'Port code into another language' },
  { id: 'generate', label: 'Generate Code', icon: PlusCircle, desc: 'Build production functions from specs' },
];

const CODE_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'PHP',
  'HTML/CSS',
  'SQL',
  'Bash/Shell',
];

export const AICodeAssistantTool: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState<'explain' | 'fix' | 'optimize' | 'convert' | 'generate'>('explain');
  const [targetLang, setTargetLang] = useState('TypeScript');
  const [inputCode, setInputCode] = useState('');
  const [outputResult, setOutputResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string>('groq');
  const [lastModel, setLastModel] = useState<string>('');
  const [switched, setSwitched] = useState(false);

  const handleProcessCode = async (codeToProcess?: string) => {
    const code = (codeToProcess || inputCode).trim();
    if (!code) return;

    setIsProcessing(true);
    setError(null);

    try {
      const data = await runAIProcess({
        task: 'code',
        input: code,
        options: {
          codeAction: selectedAction,
          targetLanguageCode: targetLang,
        },
      });

      setOutputResult(data.result || '');
      setLastProvider(data.provider);
      setLastModel(data.model);
      setSwitched(Boolean(data.switchedEngine));
    } catch (err: any) {
      setError(err.message || 'Error occurred during code processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!outputResult) return;
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputResult) return;
    const extMap: Record<string, string> = {
      TypeScript: 'ts',
      JavaScript: 'js',
      Python: 'py',
      Java: 'java',
      'C++': 'cpp',
      Go: 'go',
      Rust: 'rs',
      PHP: 'php',
      SQL: 'sql',
      'HTML/CSS': 'html',
    };
    const ext = extMap[targetLang] || 'txt';
    const blob = new Blob([outputResult], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `convertx_${selectedAction}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sky-600 text-white flex items-center justify-center">
            <Code className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Code Engineer & Optimizer</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Debug, explain, optimize algorithmic complexity, and transpile between programming languages
            </p>
          </div>
        </div>

        <AIProviderStatusBadge
          lastProviderUsed={lastProvider}
          lastModelUsed={lastModel}
          switchedEngine={switched}
        />
      </div>

      {/* Action Selector Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => setSelectedAction(act.id as any)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  selectedAction === act.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>

        {(selectedAction === 'convert' || selectedAction === 'generate') && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Target Language:</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl px-3 py-1.5 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {CODE_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* File Upload Zone */}
      <AIFileUploadZone
        onTextExtracted={(text) => {
          setInputCode(text);
          handleProcessCode(text);
        }}
        disabled={isProcessing}
      />

      {/* Code Editor & Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Code */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-950 text-slate-100 shadow-2xs overflow-hidden focus-within:ring-2 focus-within:ring-sky-500/50">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <span>
              {selectedAction === 'generate' ? 'Requirements / Prompt' : 'Input Source Code'}
            </span>
            {inputCode && (
              <button
                onClick={() => {
                  setInputCode('');
                  setOutputResult('');
                }}
                className="text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder={
              selectedAction === 'generate'
                ? 'Describe the function or script you want generated (e.g., Write a debounce hook in TypeScript with unit tests)...'
                : '// Paste your code snippet here...\nfunction example() {\n  return "hello world";\n}'
            }
            rows={12}
            className="w-full p-4 resize-none text-xs font-mono text-emerald-400 bg-transparent focus:outline-none placeholder:text-slate-600 leading-relaxed"
          />

          <div className="p-3 bg-slate-900/60 border-t border-slate-800 flex justify-between items-center">
            <span className="text-[11px] text-slate-500 font-mono">
              {inputCode.split('\n').length} lines
            </span>
            <button
              onClick={() => handleProcessCode()}
              disabled={isProcessing || !inputCode.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing Code...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Execute {ACTIONS.find((a) => a.id === selectedAction)?.label}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Output Code / Analysis */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              AI Engineer Result
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!outputResult}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!outputResult}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="text-[11px]">Download</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 p-4 overflow-y-auto max-h-[350px] min-h-[260px] font-mono text-xs">
            {isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xs gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-sky-600 dark:text-sky-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 font-sans">
                  Running code engine across multi-AI cluster...
                </span>
              </div>
            ) : outputResult ? (
              <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed">
                {outputResult}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic font-sans">
                Code explanation, refactor, or converted output will appear here
              </div>
            )}
          </div>

          {outputResult && (
            <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500 font-sans">
              <span>Completed with multi-provider redundancy</span>
              <button
                onClick={() => handleProcessCode()}
                className="inline-flex items-center gap-1 hover:text-sky-600 transition-colors cursor-pointer"
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
