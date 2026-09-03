import React, { useState, useEffect } from 'react';
import {
  History,
  TrendingDown,
  HardDrive,
  FileCheck2,
  Trash2,
  Download,
  Cpu,
  Server,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  getHistory,
  removeHistoryRecord,
  clearAllHistory,
  calculateStats,
  onHistoryChange,
  ConversionHistoryRecord,
  StatsSummary,
} from '../utils/historyStorage';
import { Language } from '../types';

interface ConversionHistoryPanelProps {
  language: Language;
}

export const ConversionHistoryPanel: React.FC<ConversionHistoryPanelProps> = ({ language }) => {
  const [history, setHistory] = useState<ConversionHistoryRecord[]>(() => getHistory());
  const [stats, setStats] = useState<StatsSummary>(() => calculateStats(getHistory()));
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const records = getHistory();
      setHistory(records);
      setStats(calculateStats(records));
    };

    const cleanup = onHistoryChange(update);
    return cleanup;
  }, []);

  const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return language === 'bn' ? 'এইমাত্র' : 'Just now';
    if (diff < 3600) {
      const mins = Math.floor(diff / 60);
      return language === 'bn' ? `${mins} মি. আগে` : `${mins}m ago`;
    }
    const hours = Math.floor(diff / 3600);
    return language === 'bn' ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
  };

  const handleDownload = (item: ConversionHistoryRecord) => {
    if (item.downloadUrl) {
      const a = document.createElement('a');
      a.href = item.downloadUrl;
      a.download = item.outputFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{language === 'bn' ? 'রিসেন্ট কনভার্সন ও হিস্টোরি' : 'Recent Conversions & Activity'}</span>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {language === 'bn' ? 'জিরো-কস্ট লোকালস্টোরেজ' : 'Zero-Cost LocalStorage'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'bn'
                  ? 'আপনার ব্রাউজারে সংরক্ষিত সাম্প্রতিক রূপান্তর এবং লাইভ সাইজ রিডাকশন স্ট্যাটাস'
                  : 'Tracked locally in your browser with zero server database fees.'}
              </p>
            </div>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={() => {
              if (confirm(language === 'bn' ? 'আপনি কি সব হিস্টোরি মুছে ফেলতে চান?' : 'Clear all conversion history?')) {
                clearAllHistory();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{language === 'bn' ? 'হিস্টোরি ক্লিয়ার করুন' : 'Clear History'}</span>
          </button>
        )}
      </div>

      {/* LIVE FILE SIZE STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 my-6">
        {/* Stat 1: Total Files */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'মোট কনভার্টকৃত ফাইল' : 'Files Converted'}
            </span>
            <FileCheck2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {stats.totalFiles}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {stats.wasmCount > 0 ? `${stats.wasmCount} via Client WASM` : 'Local conversions'}
          </p>
        </div>

        {/* Stat 2: Total Input Data */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {language === 'bn' ? 'প্রসেসকৃত মোট সাইজ' : 'Total Processed'}
            </span>
            <HardDrive className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatBytes(stats.totalInputBytes)}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
            {language === 'bn' ? 'ইনপুট ব্যান্ডউইথ' : 'Original input data'}
          </p>
        </div>

        {/* Stat 3: Total Saved Space */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-950/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              {language === 'bn' ? 'মোট সাইজ বাঁচানো হয়েছে' : 'Storage Space Saved'}
            </span>
            <TrendingDown className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {formatBytes(stats.totalSavedBytes)}
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            {stats.averageSavingsPercent > 0 ? `-${stats.averageSavingsPercent}% size reduction` : 'Optimized storage'}
          </p>
        </div>

        {/* Stat 4: Zero-Cost WASM Execution */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-950/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
              {language === 'bn' ? 'WASM ক্লায়েন্ট মোড' : 'Zero-Cost Engine'}
            </span>
            <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-700 dark:text-blue-400">
            100% Free
          </div>
          <p className="mt-0.5 text-[11px] text-blue-600 dark:text-blue-300">
            {language === 'bn' ? 'ব্রাউজারেই সম্পূর্ণ গোপনীয়' : '100% In-Browser Privacy'}
          </p>
        </div>
      </div>

      {/* RECENT LIST */}
      {history.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Clock className="h-6 w-6" />
          </div>
          <h4 className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            {language === 'bn' ? 'এখনো কোনো কনভার্সন হিস্টোরি নেই' : 'No conversion history yet'}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {language === 'bn'
              ? 'উপরের ড্রপজোনে যেকোনো ফাইল আপলোড করে কনভার্ট করুন। আপনার সমস্ত কনভার্সন ও কম্প্রেশন স্ট্যাটাস এখানে অটোমেটিক সেভ হবে।'
              : 'Upload and convert files above to see live compression savings and download links here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
            <span>{language === 'bn' ? 'সাম্প্রতিক ফাইলসমূহ' : 'Recent Files'}</span>
            <span>{history.length} {language === 'bn' ? 'টি আইটেম' : 'items'}</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white hover:bg-slate-50/80 dark:bg-slate-900 dark:hover:bg-slate-850/50 transition-colors"
              >
                {/* File info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-xs uppercase">
                    {item.toFormat}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-white max-w-[200px] sm:max-w-xs" title={item.originalName}>
                        {item.originalName}
                      </span>
                      <div className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <span>.{item.fromFormat}</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                        <span className="text-blue-600 dark:text-blue-400">.{item.toFormat}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{formatBytes(item.originalSize)} → {formatBytes(item.outputSize)}</span>
                      {item.savedPercent > 0 && (
                        <span className="rounded-full bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                          -{item.savedPercent}% saved
                        </span>
                      )}
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        {item.mode === 'wasm' ? (
                          <span className="text-blue-600 dark:text-blue-400 font-medium inline-flex items-center">
                            <Cpu className="h-2.5 w-2.5 mr-0.5" /> WASM Client
                          </span>
                        ) : (
                          <span className="text-slate-500 font-medium inline-flex items-center">
                            <Server className="h-2.5 w-2.5 mr-0.5" /> Server
                          </span>
                        )}
                      </span>
                      <span>•</span>
                      <span>{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {item.downloadUrl && (
                    <button
                      onClick={() => handleDownload(item)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{language === 'bn' ? 'ডাউনলোড' : 'Download'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => removeHistoryRecord(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title={language === 'bn' ? 'মুছে ফেলুন' : 'Remove item'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
