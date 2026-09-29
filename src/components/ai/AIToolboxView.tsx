import React from 'react';
import {
  Sparkles,
  Languages,
  PenTool,
  FileText,
  CheckCircle,
  BarChart3,
  Code,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
} from 'lucide-react';
import { AITranslatorTool } from './AITranslatorTool';
import { AIRewriteTool } from './AIRewriteTool';
import { AISummarizerTool } from './AISummarizerTool';
import { AIGrammarTool } from './AIGrammarTool';
import { AITextAnalyzerTool } from './AITextAnalyzerTool';
import { AIContentGeneratorTool } from './AIContentGeneratorTool';
import { AICodeAssistantTool } from './AICodeAssistantTool';
import { AIChatTool } from './AIChatTool';
import { AIProviderStatusBadge } from './AIProviderStatusBadge';

interface AIToolboxViewProps {
  activeSubRoute?: string;
  onNavigate: (route: string) => void;
}

const AI_TOOLS = [
  {
    id: 'translate',
    route: '/ai/translate',
    title: 'AI Translator',
    badge: '14+ Languages',
    description: 'Accurate translations between English, Bengali, Hindi, Arabic, Spanish, French, German, and more with paragraph preservation.',
    icon: Languages,
    color: 'from-blue-500 to-indigo-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  },
  {
    id: 'rewrite',
    route: '/ai/rewrite',
    title: 'AI Rewrite & Paraphrase',
    badge: '8 Tones',
    description: 'Transform rough notes or drafts into professional, casual, marketing, or simplified copy.',
    icon: PenTool,
    color: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'summarize',
    route: '/ai/summarize',
    title: 'AI Summarizer',
    badge: 'Bullet / Executive',
    description: 'Condense long research papers, legal documents, reports, and books into concise summaries.',
    icon: FileText,
    color: 'from-indigo-500 to-purple-600',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'grammar',
    route: '/ai/grammar',
    title: 'AI Grammar & Clarity',
    badge: 'Deep Scan',
    description: 'Fix spelling, punctuation, capitalization, phrasing, and syntax errors with clarity scoring.',
    icon: CheckCircle,
    color: 'from-teal-500 to-emerald-600',
    lightBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
  },
  {
    id: 'analyzer',
    route: '/ai/analyzer',
    title: 'AI Text & Tone Analyzer',
    badge: 'Readability',
    description: 'Extract reading grade levels, sentiment analysis, estimated read time, and key topics.',
    icon: BarChart3,
    color: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400',
  },
  {
    id: 'content',
    route: '/ai/content-generator',
    title: 'AI Content Generator',
    badge: '10 Templates',
    description: 'Produce SEO blogs, product descriptions, video titles, sales copy, and social media captions.',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-600',
    lightBg: 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400',
  },
  {
    id: 'code',
    route: '/ai/code-assistant',
    title: 'AI Code Assistant',
    badge: '10+ Languages',
    description: 'Explain code, locate bugs, optimize complexity, and transpile between programming languages.',
    icon: Code,
    color: 'from-sky-500 to-blue-600',
    lightBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400',
  },
  {
    id: 'chat',
    route: '/ai/chat',
    title: 'Ask ConvertX AI',
    badge: 'Conversational',
    description: 'Interactive session assistant to solve conversion puzzles, draft code, or answer questions.',
    icon: MessageSquare,
    color: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  },
];

export const AIToolboxView: React.FC<AIToolboxViewProps> = ({ activeSubRoute = '/ai', onNavigate }) => {
  const currentSub = activeSubRoute.replace(/\/$/, '');

  const renderActiveTool = () => {
    switch (currentSub) {
      case '/ai/translate':
        return <AITranslatorTool />;
      case '/ai/rewrite':
        return <AIRewriteTool />;
      case '/ai/summarize':
        return <AISummarizerTool />;
      case '/ai/grammar':
        return <AIGrammarTool />;
      case '/ai/analyzer':
        return <AITextAnalyzerTool />;
      case '/ai/content-generator':
        return <AIContentGeneratorTool />;
      case '/ai/code-assistant':
        return <AICodeAssistantTool />;
      case '/ai/chat':
        return <AIChatTool />;
      default:
        return null;
    }
  };

  const isSpecificTool = currentSub !== '/ai';

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 dark:border-slate-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ALL-IN-ONE CONVERTER + AI TOOLBOX</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            ConvertX AI Suite
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            High-speed document intelligence, translation, rewriting, and code engineering backed by automated multi-provider failover.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AIProviderStatusBadge />
        </div>
      </div>

      {/* Sub-tool Navigation Tabs */}
      <div className="flex overflow-x-auto pb-2 scrollbar-none gap-1.5 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => onNavigate('/ai')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
            !isSpecificTool
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          All AI Tools
        </button>

        {AI_TOOLS.map((tool) => {
          const isActive = currentSub === tool.route;
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => onNavigate(tool.route)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tool.title.replace('AI ', '')}</span>
            </button>
          );
        })}
      </div>

      {/* Render selected tool OR the Hub grid */}
      {isSpecificTool ? (
        <div className="animate-in fade-in duration-150">{renderActiveTool()}</div>
      ) : (
        <div className="space-y-8 animate-in fade-in">
          {/* Card Grid of AI Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {AI_TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => onNavigate(tool.route)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50 transition-all cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${tool.lightBg}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {tool.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <span>Open Tool</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Architecture & Redundancy Showcase */}
          <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-6 sm:p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-950 shadow-2xs space-y-6">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <Cpu className="h-4 w-4" />
                <span>FAULT-TOLERANT ARCHITECTURE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                Zero Downtime Multi-Provider Engine
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                ConvertX router continuously tracks quota limits, latency spikes, and 429 rate-limiting events across Google Gemini, DeepSeek, and Groq LPU to guarantee your conversions never fail.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Google Gemini</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  High-capacity context window for deep document analysis, summarizing, and reasoning.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">DeepSeek V3</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Specialized for technical algorithms, code syntax transpilation, and precision grammar.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Groq LPU Engine</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Sub-second response speeds for translations, marketing copy, and instant chat turns.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
