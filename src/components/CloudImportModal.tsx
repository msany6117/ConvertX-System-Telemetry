import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Cloud,
  FolderOpen,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Download,
  FileText,
  Video,
  Music,
  Image as ImageIcon,
  BookOpen,
  Archive,
} from 'lucide-react';

export type CloudSource = 'gdrive' | 'dropbox' | 'onedrive' | 'url';

interface CloudImportModalProps {
  isOpen: boolean;
  initialSource?: CloudSource;
  onClose: () => void;
  onFileImported: (file: File) => void;
}

interface SampleCloudItem {
  name: string;
  size: string;
  type: string;
  source: CloudSource;
  icon: any;
  directUrl: string;
  content: string; // Base64 or text representation for instant zero-lag offline demo
}

// Built-in verified sample cloud files that can be imported instantly from any provider
const SAMPLE_CLOUD_FILES: SampleCloudItem[] = [
  {
    name: 'Pride_and_Prejudice_Chapter1.epub',
    size: '14.2 KB',
    type: 'E-Book (EPUB)',
    source: 'gdrive',
    icon: BookOpen,
    directUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    content: 'EPUB_SAMPLE',
  },
  {
    name: 'sample_iphone_portrait.heic',
    size: '1.2 MB',
    type: 'High Efficiency Image (HEIC)',
    source: 'dropbox',
    icon: ImageIcon,
    directUrl: 'https://filesamples.com/samples/image/heic/sample1.heic',
    content: 'HEIC_SAMPLE',
  },
  {
    name: 'project_archive_backup.rar',
    size: '34.8 KB',
    type: 'Archive (RAR)',
    source: 'onedrive',
    icon: Archive,
    directUrl: 'https://filesamples.com/samples/archive/rar/sample1.rar',
    content: 'RAR_SAMPLE',
  },
  {
    name: 'quarterly_financial_report.docx',
    size: '28.5 KB',
    type: 'Word Document (DOCX)',
    source: 'gdrive',
    icon: FileText,
    directUrl: 'https://calibre-ebook.com/downloads/demos/demo.docx',
    content: 'DOCX_SAMPLE',
  },
  {
    name: 'nature_drone_cinematic.mp4',
    size: '1.5 MB',
    type: 'HD Video (MP4)',
    source: 'dropbox',
    icon: Video,
    directUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    content: 'MP4_SAMPLE',
  },
];

export const CloudImportModal: React.FC<CloudImportModalProps> = ({
  isOpen,
  initialSource = 'gdrive',
  onClose,
  onFileImported,
}) => {
  const [activeTab, setActiveTab] = useState<CloudSource>(initialSource);
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  // Resolve cloud sharing links to direct downloadable streams
  const resolveDirectDownloadUrl = (url: string, source: CloudSource): string => {
    const trimmed = url.trim();

    // Google Drive: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
    if (source === 'gdrive' || trimmed.includes('drive.google.com')) {
      const match1 = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
      const match2 = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
      const fileId = match1 ? match1[1] : match2 ? match2[1] : null;
      if (fileId) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      }
    }

    // Dropbox: https://www.dropbox.com/s/.../file.ext?dl=0
    if (source === 'dropbox' || trimmed.includes('dropbox.com')) {
      if (trimmed.includes('dl=0')) {
        return trimmed.replace('dl=0', 'dl=1');
      }
      if (!trimmed.includes('dl=1')) {
        return trimmed + (trimmed.includes('?') ? '&dl=1' : '?dl=1');
      }
    }

    // OneDrive: https://1drv.ms/u/... or onedrive.live.com
    if (source === 'onedrive' || trimmed.includes('1drv.ms') || trimmed.includes('onedrive.live.com')) {
      if (trimmed.includes('?')) {
        return `${trimmed}&download=1`;
      }
      return `${trimmed}?download=1`;
    }

    return trimmed;
  };

  // Execute download from direct URL or server proxy
  const handleImportUrl = async (targetUrl?: string) => {
    const rawUrl = targetUrl || inputUrl;
    if (!rawUrl.trim()) {
      setErrorMessage('Please enter a valid URL.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    setProgress(15);
    setStatusMessage('Resolving cloud link...');

    try {
      const directUrl = resolveDirectDownloadUrl(rawUrl, activeTab);
      setProgress(35);
      setStatusMessage('Connecting to source...');

      // Attempt 1: Direct Client-Side Fetch
      let blob: Blob | null = null;
      let filename = directUrl.split('/').pop()?.split('?')[0] || 'imported_file';

      try {
        const response = await fetch(directUrl, { mode: 'cors' });
        if (response.ok) {
          setProgress(70);
          setStatusMessage('Downloading file into browser memory...');
          blob = await response.blob();

          // Try getting filename from Content-Disposition header
          const disposition = response.headers.get('content-disposition');
          if (disposition && disposition.includes('filename=')) {
            const matched = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (matched && matched[1]) {
              filename = matched[1].replace(/['"]/g, '');
            }
          }
        }
      } catch (corsErr) {
        console.warn('Direct fetch failed due to CORS, falling back to server proxy...', corsErr);
      }

      // Attempt 2: Server-side URL import endpoint fallback
      if (!blob) {
        setProgress(50);
        setStatusMessage('Fetching via safe server bridge...');
        const proxyRes = await fetch('/api/upload/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: directUrl }),
        });

        if (!proxyRes.ok) {
          const errData = await proxyRes.json().catch(() => ({}));
          throw new Error(errData.error || `Failed to download file from ${activeTab.toUpperCase()}.`);
        }

        const data = await proxyRes.json();
        const fileInfo = data.file;

        if (fileInfo && fileInfo.downloadUrl) {
          const fileRes = await fetch(fileInfo.downloadUrl);
          blob = await fileRes.blob();
          filename = fileInfo.originalName || filename;
        } else {
          throw new Error('Could not retrieve downloaded file payload.');
        }
      }

      setProgress(95);
      setStatusMessage('Adding to conversion queue...');

      const file = new File([blob], filename, {
        type: blob.type || 'application/octet-stream',
        lastModified: Date.now(),
      });

      onFileImported(file);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      console.error('Import error:', err);
      setIsLoading(false);
      setErrorMessage(err.message || 'Failed to download file from cloud provider.');
    }
  };

  // Import mock/instant sample cloud file
  const handleImportSample = async (sample: SampleCloudItem) => {
    setIsLoading(true);
    setErrorMessage('');
    setProgress(30);
    setStatusMessage(`Importing ${sample.name} from ${sample.source.toUpperCase()}...`);

    try {
      let file: File;
      if (sample.name.endsWith('.epub')) {
        // Generate valid EPUB container bytes
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
        zip.file(
          'META-INF/container.xml',
          `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
        );
        zip.file(
          'OEBPS/content.opf',
          `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Pride and Prejudice</dc:title>
    <dc:creator>Jane Austen</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>`
        );
        zip.file(
          'OEBPS/chapter1.xhtml',
          `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter 1</title></head>
<body>
  <h1>Chapter 1</h1>
  <p>It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.</p>
  <p>However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.</p>
  <p>"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"</p>
</body>
</html>`
        );
        const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
        file = new File([blob], sample.name, { type: 'application/epub+zip' });
      } else if (sample.name.endsWith('.heic')) {
        // Sample HEIC container representation
        const dummyText = 'HEIC_SIMULATED_DATA_STREAM_' + Date.now();
        const blob = new Blob([dummyText], { type: 'image/heic' });
        file = new File([blob], sample.name, { type: 'image/heic' });
      } else if (sample.name.endsWith('.rar')) {
        // Sample RAR container representation
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        zip.file('document_inside_archive.txt', 'This is an archive extracted from RAR container.');
        const blob = await zip.generateAsync({ type: 'blob' });
        file = new File([blob], sample.name, { type: 'application/x-rar-compressed' });
      } else {
        // Standard text/docx sample
        const dummyContent = `ConvertX Cloud Sample Document\nImported from ${sample.source.toUpperCase()} at ${new Date().toISOString()}\n\nSample content for testing converters and tools.`;
        const blob = new Blob([dummyContent], { type: 'application/octet-stream' });
        file = new File([blob], sample.name, { type: 'application/octet-stream' });
      }

      setProgress(100);
      onFileImported(file);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('Failed to load sample cloud file: ' + err.message);
    }
  };

  const getProviderInfo = () => {
    switch (activeTab) {
      case 'gdrive':
        return {
          title: 'Google Drive',
          color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800',
          placeholder: 'Paste Google Drive sharing link (e.g. drive.google.com/file/d/...)',
          hint: 'Ensure link access is set to "Anyone with the link can view".',
        };
      case 'dropbox':
        return {
          title: 'Dropbox',
          color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800',
          placeholder: 'Paste Dropbox sharing link (e.g. dropbox.com/s/...)',
          hint: 'Public and shared Dropbox links will be directly converted.',
        };
      case 'onedrive':
        return {
          title: 'Microsoft OneDrive',
          color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-800',
          placeholder: 'Paste OneDrive link (e.g. 1drv.ms/u/... or onedrive.live.com)',
          hint: 'Supports direct links and public shared OneDrive files.',
        };
      default:
        return {
          title: 'Direct URL',
          color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
          placeholder: 'https://example.com/file.mp4 or document.pdf',
          hint: 'Direct HTTP/HTTPS link to any file on the web.',
        };
    }
  };

  const provider = getProviderInfo();
  const filteredSamples = SAMPLE_CLOUD_FILES.filter(
    (s) => activeTab === 'url' || s.source === activeTab
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/25">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import from Cloud & Web</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Import files directly without uploading from your phone/PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cloud Provider Tabs */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-xl bg-slate-100 p-1.5 dark:bg-slate-800/80">
          {[
            { id: 'gdrive', label: 'Google Drive', icon: '📁' },
            { id: 'dropbox', label: 'Dropbox', icon: '📦' },
            { id: 'onedrive', label: 'OneDrive', icon: '☁️' },
            { id: 'url', label: 'URL / Web', icon: '🌐' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as CloudSource);
                  setErrorMessage('');
                }}
                className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${
                  active
                    ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-900 dark:text-blue-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* URL Input Form */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {provider.title} Link
            </label>
            <span className="text-[11px] text-slate-400">Public or direct download link</span>
          </div>

          <div className="relative">
            <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="url"
              placeholder={provider.placeholder}
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setErrorMessage('');
              }}
              disabled={isLoading}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-24 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={() => handleImportUrl()}
              disabled={isLoading || !inputUrl.trim()}
              className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <span>Import</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            💡 {provider.hint}
          </p>

          {/* Loading status bar */}
          {isLoading && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-900/60 dark:bg-blue-950/40">
              <div className="flex items-center justify-between text-xs font-medium text-blue-700 dark:text-blue-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  {statusMessage}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-200 dark:bg-blue-900">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error display */}
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* 1-Click Cloud Test Files */}
        <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Or Choose from {provider.title} Samples (1-Click Test)
            </span>
            <span className="text-[10px] rounded bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 font-semibold text-blue-600 dark:text-blue-400">
              Instant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredSamples.map((sample) => {
              const Icon = sample.icon;
              return (
                <div
                  key={sample.name}
                  onClick={() => !isLoading && handleImportSample(sample)}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-blue-700/60 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-2xs dark:bg-slate-700 dark:text-blue-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {sample.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{sample.type} • {sample.size}</p>
                    </div>
                  </div>
                  <Download className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1 transition-colors" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
