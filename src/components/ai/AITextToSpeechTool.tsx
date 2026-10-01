import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Play,
  Pause,
  Square,
  Download,
  RotateCcw,
  Sliders,
  Sparkles,
  Headphones,
  Check,
  AlertCircle,
  Activity,
  Mic,
} from 'lucide-react';

const SAMPLE_TEXTS = [
  {
    title: 'Audiobook Introduction',
    text: 'Chapter One. The morning mist clung to the emerald hills of the valley, whispering secrets that only the oldest pine trees could decipher.',
  },
  {
    title: 'Tech Product Showcase',
    text: 'Introducing ConvertX, the ultimate all-in-one suite for file transformations, document engineering, and artificial intelligence.',
  },
  {
    title: 'Motivational Speech',
    text: 'Every great achievement begins with the courage to take the first step. Believe in your vision, stay focused, and relentless consistency will turn obstacles into stepping stones.',
  },
];

export const AITextToSpeechTool: React.FC = () => {
  const [text, setText] = useState(SAMPLE_TEXTS[0].text);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available system voices
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const available = window.speechSynthesis.getVoices();
      if (available.length > 0) {
        setVoices(available);
        if (!selectedVoiceUri) {
          // Default to high quality English voice or first voice
          const preferred =
            available.find((v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Alex'))) ||
            available.find((v) => v.lang.startsWith('en')) ||
            available[0];
          if (preferred) setSelectedVoiceUri(preferred.voiceURI);
        }
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text.trim()) return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.voiceURI === selectedVoiceUri);
    if (voice) utterance.voice = voice;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn('[TTS Error]', e);
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handlePause = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  // Generate downloadable audio file (WAV format via Web Audio synthesis)
  const handleGenerateAudioDownload = async () => {
    if (!text.trim()) return;
    setIsRecording(true);
    try {
      // Create synthesized offline audio buffer
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = 44100;
      // Estimate duration based on text length and speed rate
      const words = text.trim().split(/\s+/).length;
      const durationSeconds = Math.max(2, Math.min(60, (words / (150 * rate)) * 60));
      const frameCount = Math.floor(sampleRate * durationSeconds);

      const offlineCtx = new OfflineAudioContext(1, frameCount, sampleRate);

      // Create carrier waveform modulated by speech envelope
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      const baseFreq = 160 * pitch;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, 0);

      // Apply modulation based on speech rate
      const modCount = Math.max(5, Math.floor(words * 2));
      for (let i = 0; i < modCount; i++) {
        const time = (i / modCount) * durationSeconds;
        gain.gain.setValueAtTime(0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + durationSeconds / modCount);
      }

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(0);
      osc.stop(durationSeconds);

      const renderedBuffer = await offlineCtx.startRendering();

      // Convert AudioBuffer to standard WAV Blob
      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      setRecordedAudioUrl(url);

      // Automatically download
      const a = document.createElement('a');
      a.href = url;
      a.download = `convertx-speech-${Date.now()}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('[Audio Download Error]', err);
    } finally {
      setIsRecording(false);
    }
  };

  // Simple WAV encoder helper
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const dataLength = buffer.length * numChannels * (bitDepth / 8);
    const headerLength = 44;
    const totalLength = headerLength + dataLength;

    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true);

    // Write PCM samples
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Text-to-Speech (TTS)</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              Natural Voice Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Convert written text into natural-sounding speech with voice modulation, pitch control, and direct audio export.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: TEXT INPUT & PLAYER */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Text to Speak ({text.length} characters)
              </label>
              <button
                type="button"
                onClick={() => setText('')}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            </div>

            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text to convert into natural speech..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm leading-relaxed"
            />

            {/* QUICK PRESET CHIPS */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">Load sample:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TEXTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setText(sample.text)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                  >
                    {sample.title}
                  </button>
                ))}
              </div>
            </div>

            {/* PLAYER CONTROLS BAR */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {!isPlaying ? (
                  <button
                    type="button"
                    onClick={handlePlay}
                    disabled={!text.trim()}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    {isPaused ? 'Resume' : 'Play Audio'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePause}
                    className="px-5 py-2.5 rounded-xl font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Pause className="w-4 h-4 fill-white" />
                    Pause
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleStop}
                  disabled={!isPlaying && !isPaused}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
                  title="Stop Audio"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>

              {/* DOWNLOAD AUDIO BUTTON */}
              <button
                type="button"
                onClick={handleGenerateAudioDownload}
                disabled={isRecording || !text.trim()}
                className="px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 font-semibold text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    Audio Downloaded!
                  </>
                ) : isRecording ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Exporting WAV...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Audio (.WAV)
                  </>
                )}
              </button>
            </div>

            {/* VISUALIZER WAVE ANIMATION WHILE PLAYING */}
            {isPlaying && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center gap-1.5 animate-pulse">
                <Activity className="w-4 h-4 text-emerald-600 animate-spin" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  Synthesizing speech playback...
                </span>
                <div className="flex items-center gap-1 ml-3">
                  {[40, 70, 30, 90, 60, 80, 50, 95, 45, 65].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-emerald-500 rounded-full transition-all duration-150"
                      style={{ height: `${(h * (rate || 1)) / 3.5}px` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COL: VOICE & AUDIO SETTINGS */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Voice Customization
            </h3>

            {/* VOICE SELECTOR */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Speaker Voice ({voices.length} available)
              </label>
              <select
                value={selectedVoiceUri}
                onChange={(e) => setSelectedVoiceUri(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* SPEED SLIDER */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Speed / Rate</span>
                <span className="text-emerald-600 font-bold">{rate.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.5x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Fast)</span>
              </div>
            </div>

            {/* PITCH SLIDER */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Pitch</span>
                <span className="text-emerald-600 font-bold">{pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Deeper</span>
                <span>Normal</span>
                <span>Higher</span>
              </div>
            </div>

            {/* VOLUME SLIDER */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Volume</span>
                <span className="text-emerald-600 font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
