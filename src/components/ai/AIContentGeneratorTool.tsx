import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  Trash2,
  Loader2,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';
import { runAIProcess } from '../../services/aiClient';

const TEMPLATES = [
  'Blog post',
  'Product description',
  'SEO title',
  'Meta description',
  'Social media caption',
  'YouTube title',
  'YouTube description',
  'Email',
  'Advertisement copy',
  'Business description',
];

const TONES = ['Professional', 'Casual', 'Friendly', 'Exciting', 'Persuasive', 'Authoritative'];
const LENGTHS = ['Short', 'Medium', 'Detailed / Long-form'];
const LANGUAGES = ['English', 'Bengali', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Portuguese'];

export const AIContentGeneratorTool: React.FC = () => {
  const [template, setTemplate] = useState('Blog post');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium');
  const [language, setLanguage] = useState('English');
  const [keywords, setKeywords] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [generatedContent, setGeneratedContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string>('groq');
  const [lastModel, setLastModel] = useState<string>('');
  const [switched, setSwitched] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setIsProcessing(true);
    setError(null);

    const keywordList = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const data = await runAIProcess({
        task: 'content',
        input: additionalNotes || topic,
        options: {
          contentType: template,
          topic,
          tone,
          length,
          targetLanguage: language,
          keywords: keywordList,
        },
      });

      setGeneratedContent(data.result || '');
      setLastProvider(data.provider);
      setLastModel(data.model);
      setSwitched(Boolean(data.switchedEngine));
    } catch (err: any) {
      setError(err.message || 'Error occurred generating content.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedContent) return;
    const blob = new Blob([generatedContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.toLowerCase().replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-pink-600 text-white flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">AI Content & Copy Generator</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create SEO blogs, ad copy, product listings, emails, and social media captions in seconds
            </p>
          </div>
        </div>

        <AIProviderStatusBadge
          lastProviderUsed={lastProvider}
          lastModelUsed={lastModel}
          switchedEngine={switched}
        />
      </div>

      {/* Template Pills */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Select Content Template:
        </label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl}
              onClick={() => setTemplate(tmpl)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                template === tmpl
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {tmpl}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Inputs */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Topic or Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 5 reasons why WebP is better than PNG for websites"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Length
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                {LENGTHS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Keywords (comma separated)
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. compression, speed, image converter, web development"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Additional Details or Key Points (Optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Specific points to mention, call to action, discount code, etc..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isProcessing || !topic.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Crafting {template}...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate {template}</span>
              </>
            )}
          </button>
        </div>

        {/* Output Area */}
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Generated {template}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                disabled={!generatedContent}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownload}
                disabled={!generatedContent}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="text-[11px]">Download .md</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 p-4 overflow-y-auto max-h-[420px] min-h-[300px]">
            {isProcessing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xs gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-pink-600 dark:text-pink-400" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  AI is creating your content...
                </span>
              </div>
            ) : generatedContent ? (
              <div className="whitespace-pre-wrap text-sm text-slate-900 dark:text-white leading-relaxed font-sans">
                {generatedContent}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                Generated copy and markdown preview will appear here
              </div>
            )}
          </div>

          {generatedContent && (
            <div className="p-3 bg-slate-50/40 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
              <span>{generatedContent.split(/\s+/).filter(Boolean).length} words</span>
              <button
                onClick={handleGenerate}
                className="inline-flex items-center gap-1 hover:text-pink-600 transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Regenerate Variation</span>
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
