import React, { useState, useEffect } from 'react';
import { ShieldCheck, HardDrive, Cpu, RefreshCw, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerCleanup = async () => {
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' });
      const data = await res.json();
      setCleanupMessage(`Cleanup executed: Purged ${data.deletedFiles} old files.`);
      fetchStats();
      setTimeout(() => setCleanupMessage(null), 4000);
    } catch (err) {
      setCleanupMessage('Cleanup failed.');
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
              Live engine monitoring, job queue metrics, and automated storage lifecycle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 shadow-2xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleTriggerCleanup}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-2xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Run File Cleanup</span>
          </button>
        </div>
      </div>

      {cleanupMessage && (
        <div className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {cleanupMessage}
        </div>
      )}

      {/* Metrics Cards */}
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
          <span className="text-[11px] text-slate-400">
            Auto-purged every 60 mins
          </span>
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

      {/* Security policies reminder */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Privacy & Security Policies</h3>
        <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 list-disc pl-5">
          <li>All uploaded and converted files are automatically destroyed 1 hour after creation.</li>
          <li>Users can trigger immediate permanent deletion via the "Delete" action button.</li>
          <li>Remote URL downloads use strict SSRF guardrails (blocking RFC1918 private subnets and localhost).</li>
          <li>Rate limiter restricts per-IP burst to 60 requests per minute to preserve system stability.</li>
        </ul>
      </div>
    </div>
  );
};
