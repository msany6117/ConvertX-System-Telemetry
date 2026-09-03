import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  File as FileIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Settings,
  ArrowRight,
  Link as LinkIcon,
  Loader2,
  FolderArchive,
  RefreshCw,
  Plus,
  Sparkles,
} from 'lucide-react';
import { UploadedFileItem, Language } from '../types';
import { en } from '../locales/en';
import { bn } from '../locales/bn';
import { ConversionSettingsModal } from './ConversionSettingsModal';

interface UniversalUploaderProps {
  language: Language;
  presetTargetFormat?: string;
  presetCategory?: string;
}

export const UniversalUploader: React.FC<UniversalUploaderProps> = ({
  language,
  presetTargetFormat,
  presetCategory,
}) => {
  const t = language === 'bn' ? bn : en;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState('');
  const [activeSettingsItem, setActiveSettingsItem] = useState<UploadedFileItem | null>(null);
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [batchTarget, setBatchTarget] = useState<string>('');
  const [registry, setRegistry] = useState<Record<string, any>>({});

  // Fetch registry formats on mount
  useEffect(() => {
    fetch('/api/registry')
      .then((res) => res.json())
      .then((data) => {
        if (data.formats) {
          setRegistry(data.formats);
        }
      })
      .catch((e) => console.warn('Could not fetch server registry:', e));
  }, []);

  // Format bytes helper
  const formatBytes = (bytes: number, decimals = 1) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Detect category & supported targets
  const getFormatDetails = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const reg = registry[ext];

    const defaultTargetsMap: Record<string, string[]> = {
      jpg: ['webp', 'png', 'avif', 'pdf'],
      jpeg: ['webp', 'png', 'avif', 'pdf'],
      png: ['webp', 'jpg', 'avif', 'pdf'],
      webp: ['jpg', 'png', 'avif', 'pdf'],
      mp4: ['mp3', 'gif', 'webm', 'mov', 'wav'],
      mov: ['mp4', 'mp3', 'gif', 'webm'],
      webm: ['mp4', 'gif', 'mp3'],
      mp3: ['wav', 'aac', 'flac', 'ogg'],
      wav: ['mp3', 'aac', 'flac', 'ogg'],
      pdf: ['jpg', 'png', 'compress', 'split', 'rotate'],
      docx: ['pdf', 'txt', 'html'],
      csv: ['xlsx', 'txt'],
      xlsx: ['csv', 'txt'],
      zip: ['tar'],
    };

    const targets = reg?.targetFormats || defaultTargetsMap[ext] || ['zip'];
    const cat = reg?.category || (
      ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp'].includes(ext)
        ? 'image'
        : ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext)
        ? 'video'
        : ['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(ext)
        ? 'audio'
        : ext === 'pdf'
        ? 'pdf'
        : 'document'
    );

    return {
      ext,
      category: cat,
      supportedTargets: targets,
      defaultTarget: presetTargetFormat || targets[0] || 'zip',
    };
  };

  // Add files to state
  const handleAddFiles = (fileList: FileList | File[]) => {
    const newItems: UploadedFileItem[] = [];
    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      if (items.length + newItems.length >= 10) {
        alert('Maximum 10 files can be converted simultaneously.');
        break;
      }
      if (file.size > 500 * 1024 * 1024) {
        alert(`File ${file.name} exceeds the 500 MB limit.`);
        continue;
      }

      const { ext, category, supportedTargets, defaultTarget } = getFormatDetails(file.name);
      let previewUrl: string | undefined;

      if (category === 'image' && file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        originalName: file.name,
        size: file.size,
        extension: ext,
        category,
        previewUrl,
        supportedTargets,
        targetFormat: defaultTarget,
        options: {},
        status: 'ready',
        progress: 0,
      });
    }

    if (newItems.length > 0) {
      setItems((prev) => [...prev, ...newItems]);
      if (!batchTarget && newItems[0].supportedTargets.length > 0) {
        setBatchTarget(presetTargetFormat || newItems[0].targetFormat);
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddFiles(e.dataTransfer.files);
    }
  };

  // From URL submission
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setUrlLoading(true);
    setUrlError('');

    try {
      const res = await fetch('/api/upload/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to download from URL.');
      }

      const fileInfo = data.file;
      const { ext, category, supportedTargets, defaultTarget } = getFormatDetails(fileInfo.originalName);

      const newItem: UploadedFileItem = {
        id: Math.random().toString(36).substring(2, 9),
        fileId: fileInfo.fileId,
        originalName: fileInfo.originalName,
        size: fileInfo.size,
        extension: ext,
        category,
        supportedTargets,
        targetFormat: defaultTarget,
        options: {},
        status: 'ready',
        progress: 0,
      };

      setItems((prev) => [...prev, newItem]);
      setUrlInput('');
      setIsUrlModalOpen(false);
    } catch (err: any) {
      setUrlError(err.message || 'Error importing URL.');
    } finally {
      setUrlLoading(false);
    }
  };

  // Remove single item
  const handleRemoveItem = async (itemId: string) => {
    const target = items.find((i) => i.id === itemId);
    if (target?.jobId) {
      // Optional delete call
      fetch(`/api/files/${target.jobId}`, { method: 'DELETE' }).catch(() => {});
    }
    if (target?.previewUrl) {
      URL.revokeObjectURL(target.previewUrl);
    }
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Convert single item
  const convertItem = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    // 1. Upload if not already uploaded
    let currentFileId = item.fileId;

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: 'uploading', progress: 20 } : i))
    );

    try {
      if (!currentFileId && item.file) {
        const formData = new FormData();
        formData.append('files', item.file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Upload failed.');
        }

        currentFileId = uploadData.files[0].fileId;
      }

      if (!currentFileId) {
        throw new Error('No uploaded file reference found.');
      }

      // 2. Submit conversion job
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, fileId: currentFileId, status: 'queued', progress: 40 }
            : i
        )
      );

      const jobRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobs: [
            {
              fileId: currentFileId,
              targetFormat: item.targetFormat,
              options: item.options,
            },
          ],
        }),
      });

      const jobData = await jobRes.json();
      if (!jobRes.ok) {
        throw new Error(jobData.error || 'Failed to initialize conversion job.');
      }

      const jobId = jobData.jobs[0].jobId;

      // 3. Poll for completion
      pollJobStatus(itemId, jobId);
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                status: 'failed',
                errorMessage: err.message || 'Conversion encountered an error.',
              }
            : i
        )
      );
    }
  };

  // Polling helper
  const pollJobStatus = (itemId: string, jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          clearInterval(interval);
          return;
        }

        const data = await res.json();

        if (data.status === 'COMPLETED') {
          clearInterval(interval);
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    jobId,
                    status: 'completed',
                    progress: 100,
                    outputFilename: data.outputFilename,
                    outputSize: data.outputSize,
                    savedPercent: data.savedPercent,
                    downloadUrl: data.downloadUrl,
                  }
                : i
            )
          );
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    jobId,
                    status: 'failed',
                    errorMessage: data.errorMessage || 'Conversion failed.',
                  }
                : i
            )
          );
        } else {
          setItems((prev) =>
            prev.map((i) =>
              i.id === itemId
                ? {
                    ...i,
                    jobId,
                    status: 'processing',
                    progress: Math.max(i.progress, data.progress || 50),
                  }
                : i
            )
          );
        }
      } catch (e) {
        console.warn('Poll error:', e);
      }
    }, 1000);
  };

  // Convert All button
  const handleConvertAll = async () => {
    setIsConvertingAll(true);
    const readyItems = items.filter((i) => i.status === 'ready' || i.status === 'failed');
    for (const item of readyItems) {
      await convertItem(item.id);
    }
    setIsConvertingAll(false);
  };

  // Download All as ZIP
  const handleDownloadAllZip = async () => {
    const completedJobIds = items
      .filter((i) => i.status === 'completed' && i.jobId)
      .map((i) => i.jobId as string);

    if (completedJobIds.length === 0) return;

    try {
      const res = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: completedJobIds }),
      });

      if (!res.ok) throw new Error('ZIP download failed.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ConvertX_Export.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download ZIP.');
    }
  };

  // Batch format change
  const handleBatchFormatChange = (fmt: string) => {
    setBatchTarget(fmt);
    setItems((prev) =>
      prev.map((i) => (i.status === 'ready' ? { ...i, targetFormat: fmt } : i))
    );
  };

  const hasCompletedItems = items.some((i) => i.status === 'completed');
  const hasReadyItems = items.some((i) => i.status === 'ready');

  return (
    <div className="w-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* DRAG & DROP HERO CARD */}
      <div
        id="universal-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-8 md:p-12 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 scale-[1.01]'
            : 'border-slate-300 bg-white/80 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/80 shadow-sm'
        }`}
      >
        <div className="mx-auto flex max-w-xl flex-col items-center">
          {/* Cloud Icon */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shadow-inner">
            <UploadCloud className="h-8 w-8 transition-transform group-hover:scale-110" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t.hero.dropTitle}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t.hero.dropSubtitle}
          </p>

          {/* Action buttons: Device & URL */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              id="choose-files-btn"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/25 hover:bg-blue-700 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{t.hero.fromDevice}</span>
            </button>

            <button
              id="from-url-btn"
              onClick={() => setIsUrlModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              <LinkIcon className="h-4 w-4 text-slate-400" />
              <span>{t.hero.fromUrl}</span>
            </button>
          </div>

          {/* Supported formats & limits */}
          <div className="mt-8 flex flex-col items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span className="font-medium tracking-wide uppercase text-[11px] text-slate-500 dark:text-slate-400">
              {t.hero.supportedBanner}
            </span>
            <span className="flex items-center gap-1.5 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              {t.uploader.maxLimitNotice}
            </span>
          </div>
        </div>
      </div>

      {/* QUEUE & FILE CARDS SECTION */}
      {items.length > 0 && (
        <div className="mt-8 space-y-4">
          {/* Top batch control bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">
                {items.length} {items.length === 1 ? 'file' : 'files'} in queue
              </span>

              {/* Batch target format */}
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span>Convert all to:</span>
                <select
                  id="batch-target-format-select"
                  value={batchTarget}
                  onChange={(e) => handleBatchFormatChange(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">Select target</option>
                  <option value="webp">WEBP (Image)</option>
                  <option value="jpg">JPG (Image)</option>
                  <option value="png">PNG (Image)</option>
                  <option value="pdf">PDF (Document)</option>
                  <option value="mp3">MP3 (Audio)</option>
                  <option value="mp4">MP4 (Video)</option>
                  <option value="gif">GIF (Animation)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="add-more-files-btn"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{t.actions.addMore}</span>
              </button>

              {hasCompletedItems && (
                <button
                  id="download-zip-btn"
                  onClick={handleDownloadAllZip}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
                >
                  <FolderArchive className="h-3.5 w-3.5" />
                  <span>{t.actions.downloadZip}</span>
                </button>
              )}

              {hasReadyItems && (
                <button
                  id="convert-all-btn"
                  onClick={handleConvertAll}
                  disabled={isConvertingAll}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 disabled:opacity-50"
                >
                  {isConvertingAll ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5" />
                  )}
                  <span>{t.actions.convertAll}</span>
                </button>
              )}

              <button
                id="clear-all-queue-btn"
                onClick={() => setItems([])}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                title="Clear all"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* LIST OF FILE CARDS */}
          <div className="space-y-3">
            {items.map((item) => {
              const isCompleted = item.status === 'completed';
              const isFailed = item.status === 'failed';
              const isBusy = item.status === 'uploading' || item.status === 'queued' || item.status === 'processing';

              return (
                <div
                  key={item.id}
                  id={`file-card-${item.id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left: Thumbnail & Name & Sizes */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Thumbnail or Category Icon */}
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FileIcon className="h-6 w-6 text-slate-400 dark:text-slate-500" />
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-slate-900/70 text-[9px] font-bold text-white text-center uppercase tracking-wider py-0.5">
                          {item.extension}
                        </span>
                      </div>

                      {/* File Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate max-w-[280px] sm:max-w-md">
                            {item.originalName}
                          </p>
                          {isCompleted && (
                            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Ready
                            </span>
                          )}
                        </div>

                        {/* Size & Savings */}
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>{formatBytes(item.size)}</span>

                          {isCompleted && item.outputSize && (
                            <>
                              <span>→</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {formatBytes(item.outputSize)}
                              </span>
                              {item.savedPercent !== undefined && item.savedPercent > 0 && (
                                <span className="rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold px-1.5 py-0.2 text-[10px]">
                                  {item.savedPercent}% saved
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Target Selector, Settings, Action Button */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5">
                      {!isCompleted ? (
                        <>
                          {/* Target format select */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 hidden sm:inline">to:</span>
                            <select
                              value={item.targetFormat}
                              disabled={isBusy}
                              onChange={(e) => {
                                const newTarget = e.target.value;
                                setItems((prev) =>
                                  prev.map((i) =>
                                    i.id === item.id ? { ...i, targetFormat: newTarget } : i
                                  )
                                );
                              }}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900 uppercase dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            >
                              {item.supportedTargets.map((target) => (
                                <option key={target} value={target}>
                                  {target.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Gear / Options modal */}
                          <button
                            onClick={() => setActiveSettingsItem(item)}
                            disabled={isBusy}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            title="Advanced Settings"
                          >
                            <Settings className="h-4 w-4" />
                          </button>

                          {/* Convert Single Button */}
                          <button
                            onClick={() => convertItem(item.id)}
                            disabled={isBusy}
                            className="flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 shadow-xs"
                          >
                            {isBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span>{isBusy ? t.actions.processing : t.nav.convert}</span>
                          </button>
                        </>
                      ) : (
                        /* Completed State Action Buttons */
                        <div className="flex items-center gap-2">
                          <a
                            href={item.downloadUrl || '#'}
                            download={item.outputFilename}
                            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>{t.actions.download}</span>
                          </a>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                            title="Delete and remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {!isCompleted && !isBusy && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500"
                          title="Remove from queue"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar (while active) */}
                  {isBusy && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>
                          {item.status === 'uploading'
                            ? t.actions.uploading
                            : item.status === 'queued'
                            ? 'In queue...'
                            : t.actions.processing}
                        </span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error display */}
                  {isFailed && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{item.errorMessage || 'Conversion failed. Please try again with different settings.'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FROM URL MODAL */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import File from URL</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Provide a direct downloadable link (HTTP/HTTPS only).
            </p>

            <form onSubmit={handleUrlSubmit} className="mt-4 space-y-4">
              <div>
                <input
                  type="url"
                  placeholder="https://example.com/document.pdf"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {urlError && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{urlError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUrlModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={urlLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {urlLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Import File</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Advanced Settings Modal */}
      {activeSettingsItem && (
        <ConversionSettingsModal
          item={activeSettingsItem}
          onClose={() => setActiveSettingsItem(null)}
          onSave={(itemId, newOpts) => {
            setItems((prev) =>
              prev.map((i) => (i.id === itemId ? { ...i, options: newOpts } : i))
            );
          }}
        />
      )}
    </div>
  );
};
