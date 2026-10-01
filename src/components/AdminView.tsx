import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  HardDrive,
  Cpu,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Clock,
  ArrowUpDown,
} from 'lucide-react';

import { safeParseJsonResponse, fetchAIProvidersStatus } from '../services/aiClient';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'system' | 'ai'>('system');
  const [stats, setStats] = useState<any>(null);
  const [aiData, setAiData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [resSys, aiStatus] = await Promise.all([
        fetch('/api/admin/stats').catch(() => null),
        fetchAIProvidersStatus().catch(() => null),
      ]);
      if (resSys) {
        const parsed = await safeParseJsonResponse(resSys);
        if (parsed.ok && parsed.data) setStats(parsed.data);
      }
      if (aiStatus) {
        setAiData(aiStatus);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerCleanup = async () => {
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' });
      const parsed = await safeParseJsonResponse<any>(res);
      if (parsed.ok && parsed.data) {
        setCleanupMessage(`Cleanup executed: Purged ${parsed.data.deletedFiles || 0} old files.`);
      } else {
        setCleanupMessage('Cleanup completed.');
      }
      fetchStats();
      setTimeout(() => setCleanupMessage(null), 4000);
    } catch (err) {
      setCleanupMessage('Cleanup failed.');
    }
  };

  const handleResetCooldown = async (providerId: string) => {
    try {
      const res = await fetch('/api/ai/admin/reset-cooldown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      if (res.ok) {
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleProvider = async (providerId: string, currentEnabled: boolean) => {
    try {
      await fetch('/api/ai/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: { [providerId]: !currentEnabled },
        }),
      });
      fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">ConvertX System Telemetry</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live engine monitoring, multi-provider AI failover cluster, and storage lifecycle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleTriggerCleanup}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-2xs cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Run File Cleanup</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <HardDrive className="h-3.5 w-3.5" />
          <span>Storage & Queue Telemetry</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          <span>AI Multi-Provider Cluster</span>
        </button>
      </div>

      {cleanupMessage && (
        <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {cleanupMessage}
        </div>
      )}

      {/* TAB 1: SYSTEM STORAGE & QUEUE */}
      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Running Jobs</span>
              <div className="mt-2 text-3xl font-extrabold text-blue-600">
                {stats?.queue?.runningJobs ?? 0}
              </div>
              <span className="text-[11px] text-slate-400">Max concurrent: 5</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Queued Jobs</span>
              <div className="mt-2 text-3xl font-extrabold text-amber-500">
                {stats?.queue?.queuedJobs ?? 0}
              </div>
              <span className="text-[11px] text-slate-400">Waiting in FIFO line</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Processed Jobs</span>
              <div className="mt-2 text-3xl font-extrabold text-emerald-600">
                {stats?.queue?.totalProcessed ?? 0}
              </div>
              <span className="text-[11px] text-slate-400">Since last server boot</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Disk Consumption</span>
              <div className="mt-2 text-2xl font-extrabold text-slate-800 dark:text-white">
                {formatBytes(stats?.diskUsage?.totalBytes || 0)}
              </div>
              <span className="text-[11px] text-slate-400">Auto-purged every 60 mins</span>
            </div>
          </div>

          {/* Installed Tools Check */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="h-4 w-4 text-blue-500" />
              Binary Engine Availability
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'FFmpeg (Audio/Video)', available: stats?.installedTools?.ffmpeg },
                { name: 'ImageMagick (Raster/Vector)', available: stats?.installedTools?.imagemagick },
                { name: 'Ghostscript (PDF Engine)', available: stats?.installedTools?.ghostscript },
                { name: 'LibreOffice (Office Docs)', available: stats?.installedTools?.libreoffice },
              ].map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">{tool.name}</span>
                  {tool.available ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <div className="flex items-center gap-1 text-[11px] text-amber-500">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Fallback</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI MULTI-PROVIDER CLUSTER */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60">
            <div className="space-y-1">
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Active Provider Priority Sequence
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {(aiData?.priority || ['gemini', 'deepseek', 'groq']).join(' → ')}
              </p>
            </div>
            <span className="text-[11px] font-mono bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold">
              Failover: Automatic
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(aiData?.providers || []).map((p: any) => {
              const inCooldown = p.cooldownUntil && p.cooldownUntil > Date.now();
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          inCooldown
                            ? 'bg-amber-500 animate-pulse'
                            : p.status === 'healthy'
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                      />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</h4>
                    </div>

                    <button
                      onClick={() => handleToggleProvider(p.id, p.enabled)}
                      className="cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      title={p.enabled ? 'Disable provider' : 'Enable provider'}
                    >
                      {p.enabled ? (
                        <ToggleRight className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Status:</span>
                      <span
                        className={`font-semibold capitalize ${
                          inCooldown
                            ? 'text-amber-600'
                            : p.status === 'healthy'
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {inCooldown ? 'In Cooldown' : p.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>Model:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">
                        {p.currentModel}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>API Key:</span>
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {p.apiKeyMasked}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>Requests (Success / Fail):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {p.successfulRequests} / {p.failedRequests}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-500">
                      <span>Rate Limit Events (429):</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {p.rateLimitEvents || 0}
                      </span>
                    </div>

                    {inCooldown && (
                      <div className="mt-2 pt-2 border-t border-amber-100 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-400 flex items-center justify-between">
                        <span>Cooldown active</span>
                        <button
                          onClick={() => handleResetCooldown(p.id)}
                          className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 font-bold hover:bg-amber-200 cursor-pointer"
                        >
                          Clear Cooldown
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 text-xs text-slate-500 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white">Security & API Masking Guarantee</h4>
            <p className="leading-relaxed">
              Real API keys are isolated on the Node server runtime only and are NEVER sent to the client browser. Normal users will experience zero interruptions as 429 rate limits or transient errors are absorbed silently by the failover router.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
