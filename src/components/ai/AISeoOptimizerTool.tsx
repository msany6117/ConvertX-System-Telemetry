import React, { useState } from 'react';
import {
  TrendingUp,
  Target,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  BarChart,
  FileText,
  AlertCircle,
  Globe,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { safeFetchJson } from '../../utils/apiClient';

interface SeoAuditResult {
  seoScore: number;
  readabilityScore: number;
  readabilityLevel: string;
  wordCount: number;
  keywordMetrics: {
    keyword: string;
    occurrences: number;
    densityPercent: number;
    status: string;
  };
  titleSuggestions: string[];
  metaDescription: string;
  recommendedKeywords: string[];
  checklist: Array<{
    item: string;
    passed: boolean;
    tip: string;
  }>;
  improvedContent: string;
}

const SAMPLE_ARTICLE = `Cloud computing has revolutionized modern business operations across the globe. By migrating infrastructure to decentralized servers, companies experience scalable computing power, reduced capital expenditures, and improved disaster recovery. 

However, implementing a comprehensive cloud computing strategy requires thorough planning. Organizations must evaluate data sovereignty, compliance frameworks, and multi-cloud resilience before executing full migration.`;

export const AISeoOptimizerTool: React.FC = () => {
  const [content, setContent] = useState(SAMPLE_ARTICLE);
  const [keyword, setKeyword] = useState('cloud computing');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<SeoAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'optimized'>('audit');

  const handleAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || isAuditing) return;

    setIsAuditing(true);
    setError(null);

    try {
      const data = await safeFetchJson('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'seo_optimize',
          input: content,
          options: {
            targetKeyword: keyword.trim() || 'core topic',
          },
        }),
      });

      if (data?.structuredData) {
        setAuditResult(data.structuredData as SeoAuditResult);
      } else if (data?.result) {
        // Try parsing result as JSON
        try {
          const parsed = JSON.parse(data.result);
          setAuditResult(parsed);
        } catch {
          // Fallback algorithmic calculations if text returned
          const words = content.trim().split(/\s+/).length;
          const kwRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const occurrences = (content.match(kwRegex) || []).length;
          const density = words > 0 ? parseFloat(((occurrences / words) * 100).toFixed(1)) : 0;

          setAuditResult({
            seoScore: Math.min(95, Math.max(50, Math.round(75 + (density > 0.8 && density < 2.5 ? 15 : 0)))),
            readabilityScore: 82,
            readabilityLevel: 'Grade 8 / Clear',
            wordCount: words,
            keywordMetrics: {
              keyword: keyword || 'topic',
              occurrences,
              densityPercent: density,
              status: density >= 1.0 && density <= 2.5 ? 'Optimal' : density < 1.0 ? 'Under-optimized' : 'Over-optimized',
            },
            titleSuggestions: [
              `The Complete Guide to ${keyword || 'Modern Solutions'} in 2026`,
              `How to Master ${keyword || 'Strategy'}: A Practical Framework`,
            ],
            metaDescription: `Discover how ${keyword || 'this strategy'} can transform your results. Learn key architectures, best practices, and actionable takeaways in this comprehensive breakdown.`,
            recommendedKeywords: [`best ${keyword}`, `${keyword} framework`, `${keyword} strategy 2026`],
            checklist: [
              { item: 'Keyword in Content', passed: occurrences > 0, tip: `Occurred ${occurrences} times.` },
              { item: 'Optimal Keyword Density', passed: density >= 0.8 && density <= 2.5, tip: `Density is ${density}%.` },
              { item: 'Comprehensive Length', passed: words >= 100, tip: `Current word count: ${words}.` },
            ],
            improvedContent: data.result,
          });
        }
      }
    } catch (err: any) {
      console.error('[SEO Audit Error]', err);
      setError(err?.message || 'Failed to complete SEO audit. Please try again.');
    } finally {
      setIsAuditing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    if (score >= 60) return 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    return 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI SEO Content Optimizer</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              Audit & Score Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Score articles for search engines, analyze keyword density, generate Google SERP metadata, and produce rank-ready revisions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* INPUTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: ARTICLE & KEYWORD INPUT */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                  Target Keyword / Search Query
                </label>
                <div className="relative">
                  <Target className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="e.g. cloud computing strategy"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handleAudit()}
                  disabled={isAuditing || !content.trim()}
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  {isAuditing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Run SEO Audit
                    </>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
                Article / Blog Post Text ({content.trim().split(/\s+/).filter(Boolean).length} words)
              </label>
              <textarea
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your draft or article content here..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COL: SCORES OVERVIEW */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Audit Dashboard
            </h3>

            {auditResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center font-black ${getScoreColor(
                      auditResult.seoScore
                    )}`}
                  >
                    <span className="text-3xl">{auditResult.seoScore}</span>
                    <span className="text-[10px] uppercase font-semibold">SEO Score</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-slate-500 dark:text-slate-400">Readability Grade:</div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">
                      {auditResult.readabilityLevel} ({auditResult.readabilityScore}/100)
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">Word Count:</div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {auditResult.wordCount} words
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Keyword Density:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {auditResult.keywordMetrics.densityPercent}% ({auditResult.keywordMetrics.occurrences}x)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Density Rating:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {auditResult.keywordMetrics.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 text-xs">
                <BarChart className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                Run the audit to generate a detailed SEO breakdown and keyword scorecard.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DETAILED RESULTS SECTION */}
      {auditResult && (
        <div className="space-y-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          {/* TABS */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              SEO Checklist & SERP Preview
            </button>
            <button
              onClick={() => setActiveTab('optimized')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'optimized'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Optimized Revision
            </button>
          </div>

          {activeTab === 'audit' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* GOOGLE SERP PREVIEW */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Google Search Snippet Preview
                  </h4>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <span>https://example.com</span>
                    <span>› blog › {keyword.toLowerCase().replace(/\s+/g, '-')}</span>
                  </div>
                  <div className="text-base font-semibold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer">
                    {auditResult.titleSuggestions[0] || 'Optimized SEO Article Title'}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {auditResult.metaDescription}
                  </div>
                </div>

                {/* TITLE SUGGESTIONS LIST */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Recommended H1 / Title Tags
                  </label>
                  <div className="space-y-1.5">
                    {auditResult.titleSuggestions.map((title, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">{title}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(title);
                            setCopiedTitle(true);
                            setTimeout(() => setCopiedTitle(false), 2000);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600"
                        >
                          {copiedTitle ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RECOMMENDED LSI KEYWORDS */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Recommended Secondary & LSI Keywords
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {auditResult.recommendedKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 text-xs font-medium"
                      >
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTIONABLE CHECKLIST */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  SEO Best Practices Audit Checklist
                </h4>

                <div className="space-y-3">
                  {auditResult.checklist.map((chk, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start gap-3"
                    >
                      {chk.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-0.5 text-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{chk.item}</div>
                        <div className="text-slate-500 dark:text-slate-400">{chk.tip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'optimized' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Polished, Keyword-Optimized Revision
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(auditResult.improvedContent);
                      setCopiedContent(true);
                      setTimeout(() => setCopiedContent(false), 2000);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                  >
                    {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedContent ? 'Copied' : 'Copy Optimized Article'}
                  </button>
                </div>
              </div>

              <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
                {auditResult.improvedContent}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
