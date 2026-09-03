import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { UploadedFileItem } from '../types';

interface ConversionSettingsModalProps {
  item: UploadedFileItem | null;
  onClose: () => void;
  onSave: (itemId: string, updatedOptions: Record<string, any>) => void;
}

export const ConversionSettingsModal: React.FC<ConversionSettingsModalProps> = ({
  item,
  onClose,
  onSave,
}) => {
  if (!item) return null;

  const [options, setOptions] = useState<Record<string, any>>(item.options || {});

  const handleSave = () => {
    onSave(item.id, options);
    onClose();
  };

  const isImage = item.category === 'image';
  const isVideo = item.category === 'video';
  const isAudio = item.category === 'audio';
  const isPdf = item.category === 'pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Conversion Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* File preview summary */}
        <div className="my-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[260px]">
            {item.originalName}
          </span>
          <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">
            Target: {item.targetFormat}
          </span>
        </div>

        {/* Modal Options Body */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* IMAGE SETTINGS */}
          {isImage && (
            <>
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <span>Image Quality</span>
                  <span className="text-blue-600 dark:text-blue-400">{options.quality || 85}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={options.quality || 85}
                  onChange={(e) => setOptions({ ...options, quality: parseInt(e.target.value, 10) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Width (px)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1920"
                    value={options.width || ''}
                    onChange={(e) => setOptions({ ...options, width: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custom Height (px)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1080"
                    value={options.height || ''}
                    onChange={(e) => setOptions({ ...options, height: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rotate Orientation
                </label>
                <select
                  value={options.rotate || 0}
                  onChange={(e) => setOptions({ ...options, rotate: parseInt(e.target.value, 10) })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value={0}>No rotation (Original)</option>
                  <option value={90}>90° Clockwise</option>
                  <option value={180}>180° Half turn</option>
                  <option value={270}>270° Counter-clockwise</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="strip-meta"
                  checked={options.stripMetadata ?? true}
                  onChange={(e) => setOptions({ ...options, stripMetadata: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="strip-meta" className="text-xs text-slate-600 dark:text-slate-300">
                  Strip EXIF & camera metadata (Enhances privacy & shrinks size)
                </label>
              </div>
            </>
          )}

          {/* VIDEO SETTINGS */}
          {isVideo && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Preset
                </label>
                <select
                  value={options.resolution || 'original'}
                  onChange={(e) => setOptions({ ...options, resolution: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="original">Original resolution</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="720p">720p HD</option>
                  <option value="480p">480p Standard</option>
                  <option value="360p">360p Mobile</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Frame Rate (FPS)
                  </label>
                  <select
                    value={options.fps || 0}
                    onChange={(e) => setOptions({ ...options, fps: e.target.value ? parseInt(e.target.value, 10) : undefined })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value={0}>Original FPS</option>
                    <option value={24}>24 fps (Cinematic)</option>
                    <option value={30}>30 fps (Standard)</option>
                    <option value={60}>60 fps (Smooth)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audio Bitrate
                  </label>
                  <select
                    value={options.audioBitrate || '128k'}
                    onChange={(e) => setOptions({ ...options, audioBitrate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="96k">96 kbps (Voice/Low)</option>
                    <option value="128k">128 kbps (Standard)</option>
                    <option value="192k">192 kbps (High)</option>
                    <option value="320k">320 kbps (Maximum)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trim Start (HH:MM:SS)
                  </label>
                  <input
                    type="text"
                    placeholder="00:00:00"
                    value={options.startTime || ''}
                    onChange={(e) => setOptions({ ...options, startTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trim End (HH:MM:SS)
                  </label>
                  <input
                    type="text"
                    placeholder="00:00:30"
                    value={options.endTime || ''}
                    onChange={(e) => setOptions({ ...options, endTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mute-audio"
                  checked={options.mute || false}
                  onChange={(e) => setOptions({ ...options, mute: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="mute-audio" className="text-xs text-slate-600 dark:text-slate-300">
                  Mute Audio (remove audio stream completely)
                </label>
              </div>
            </>
          )}

          {/* AUDIO SETTINGS */}
          {isAudio && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Audio Bitrate
                </label>
                <select
                  value={options.bitrate || '192k'}
                  onChange={(e) => setOptions({ ...options, bitrate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="96k">96 kbps (Voice)</option>
                  <option value="128k">128 kbps (Standard)</option>
                  <option value="192k">192 kbps (High Quality)</option>
                  <option value="256k">256 kbps (Very High)</option>
                  <option value="320k">320 kbps (Studio Master)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sample Rate
                  </label>
                  <select
                    value={options.sampleRate || 44100}
                    onChange={(e) => setOptions({ ...options, sampleRate: parseInt(e.target.value, 10) })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value={44100}>44.1 kHz (CD Quality)</option>
                    <option value={48000}>48.0 kHz (Video/Pro)</option>
                    <option value={22050}>22.0 kHz (Speech)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Audio Channels
                  </label>
                  <select
                    value={options.channels || 2}
                    onChange={(e) => setOptions({ ...options, channels: parseInt(e.target.value, 10) })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value={2}>Stereo (2 Channels)</option>
                    <option value={1}>Mono (1 Channel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trim Start
                  </label>
                  <input
                    type="text"
                    placeholder="00:00:00"
                    value={options.startTime || ''}
                    onChange={(e) => setOptions({ ...options, startTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trim End
                  </label>
                  <input
                    type="text"
                    placeholder="00:02:30"
                    value={options.endTime || ''}
                    onChange={(e) => setOptions({ ...options, endTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </>
          )}

          {/* PDF SETTINGS */}
          {isPdf && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Extract Specific Pages (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1, 3, 5-8"
                  value={options.pageRanges || ''}
                  onChange={(e) => setOptions({ ...options, pageRanges: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="text-[11px] text-slate-400 mt-1">Leave empty to convert all pages.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Compression Preset
                </label>
                <select
                  value={options.compressionLevel || 'balanced'}
                  onChange={(e) => setOptions({ ...options, compressionLevel: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="balanced">Balanced (150 DPI - Best for reading & sharing)</option>
                  <option value="high">High Compression (72 DPI - Smallest file size)</option>
                  <option value="low">Low Compression (300 DPI - High print quality)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rotate Pages
                </label>
                <select
                  value={options.rotationDegrees || 0}
                  onChange={(e) => setOptions({ ...options, rotationDegrees: parseInt(e.target.value, 10) })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value={0}>0° (No rotation)</option>
                  <option value={90}>90° Clockwise</option>
                  <option value={180}>180° Half Turn</option>
                  <option value={270}>270° Counter-Clockwise</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20"
          >
            <Check className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
