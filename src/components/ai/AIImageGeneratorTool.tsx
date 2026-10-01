import React, { useState } from 'react';
import {
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Sliders,
  Maximize2,
  Wand2,
  AlertCircle,
  Eye,
  Layers,
} from 'lucide-react';
import { safeFetchJson } from '../../utils/apiClient';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  enhancedPrompt?: string;
  style: string;
  aspectRatio: string;
  timestamp: number;
}

const STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', promptSuffix: 'photorealistic, 8k resolution, ultra-detailed, cinematic lighting, shallow depth of field, 35mm photograph' },
  { id: 'digital-art', label: 'Digital Art', promptSuffix: 'trending on artstation, vibrant digital concept art, sharp focus, masterpiece, highly detailed' },
  { id: 'anime', label: 'Anime / Ghibli', promptSuffix: 'studio ghibli aesthetic, anime concept art, makoto shinkai style, beautifully lit, whimsical' },
  { id: 'cyberpunk', label: 'Cyberpunk', promptSuffix: 'cyberpunk neon city, futuristic synthwave, volumetric lighting, reflections, high-tech' },
  { id: '3d-render', label: '3D Render', promptSuffix: 'octane render, unreal engine 5, 3d isometric render, raytracing, soft ambient occlusion' },
  { id: 'watercolor', label: 'Watercolor', promptSuffix: 'delicate watercolor painting, artistic paper texture, soft washes, expressive brushstrokes' },
  { id: 'minimalist', label: 'Minimalist Vector', promptSuffix: 'clean minimalist vector illustration, flat colors, modern graphic design, sleek lines' },
];

const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 Square', width: 1024, height: 1024, desc: 'Social posts & avatars' },
  { id: '16:9', label: '16:9 Widescreen', width: 1280, height: 720, desc: 'YouTube & Desktop' },
  { id: '9:16', label: '9:16 Story', width: 720, height: 1280, desc: 'Reels, TikTok & Mobile' },
  { id: '4:3', label: '4:3 Photo', width: 1024, height: 768, desc: 'Classic photography' },
];

const SAMPLE_PROMPTS = [
  'A mystical crystal cave with glowing turquoise bioluminescent water and ancient runes',
  'A cozy cyberpunk coffee shop on a rainy evening with neon lights and holographic steam',
  'A cute red panda wearing a tiny astronaut helmet floating among colorful cosmic nebulae',
  'A sleek futuristic electric sports car speeding through a sunlit alpine mountain pass',
];

export const AIImageGeneratorTool: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('blurry, low quality, distorted, extra limbs, bad anatomy, watermark, text');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  // Enhance prompt with AI
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const data = await safeFetchJson('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'image_generate',
          input: prompt,
        }),
      });
      if (data?.result) {
        setPrompt(data.result.trim());
      }
    } catch {
      // Fallback local enhancement if backend fails
      const styleObj = STYLES.find((s) => s.id === selectedStyle);
      const enhanced = `${prompt.trim()}, ${styleObj?.promptSuffix || 'masterpiece, 8k, highly detailed'}`;
      setPrompt(enhanced);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    const ratioObj = ASPECT_RATIOS.find((r) => r.id === selectedRatio) || ASPECT_RATIOS[0];
    const styleObj = STYLES.find((s) => s.id === selectedStyle);
    const finalPrompt = `${prompt.trim()}${styleObj ? `, ${styleObj.promptSuffix}` : ''}`;
    const seed = Math.floor(Math.random() * 9999999);

    try {
      // Client-side fallback with Pollinations / Flux API
      const encodedPrompt = encodeURIComponent(finalPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${ratioObj.width}&height=${ratioObj.height}&seed=${seed}&nologo=true`;

      // Preload image to ensure it is generated and rendered before displaying
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to generate image. Please try again.'));
        img.src = imageUrl;
      });

      const newImage: GeneratedImage = {
        id: 'img_' + Date.now(),
        url: imageUrl,
        prompt: prompt.trim(),
        enhancedPrompt: finalPrompt,
        style: styleObj?.label || selectedStyle,
        aspectRatio: selectedRatio,
        timestamp: Date.now(),
      };

      setHistory((prev) => [newImage, ...prev]);
    } catch (err: any) {
      console.error('[AIImageGenerator Error]', err);
      setError(err?.message || 'Failed to generate image. Please check your network and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (img: GeneratedImage) => {
    try {
      const response = await fetch(img.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convertx-ai-${img.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(img.url, '_blank');
    }
  };

  const handleCopyPrompt = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.prompt);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Image Generator</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
              Flux & DALL-E Fallback
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Turn natural language prompts into stunning high-resolution artwork, photos, and digital designs.
          </p>
        </div>
      </div>

      {/* ERROR NOTICE */}
      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
        </div>
      )}

      {/* GENERATION CONTROLS & INPUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: PROMPT & CONTROLS */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Describe Your Image
              </label>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing || !prompt.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors disabled:opacity-50"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                {isEnhancing ? 'Enhancing...' : 'Magic Prompt Enhancer'}
              </button>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A serene Japanese zen garden at dawn with cherry blossoms, mossy stones, and mist rising from a koi pond..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
            />

            {/* QUICK SAMPLE PROMPTS */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">Try these prompts:</span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_PROMPTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sample)}
                    className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-left truncate max-w-xs transition-colors"
                    title={sample}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* STYLES SELECTOR */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Visual Art Style
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStyle(st.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-center border transition-all ${
                      selectedStyle === st.id
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ASPECT RATIO */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => setSelectedRatio(ratio.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedRatio === ratio.id
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{ratio.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{ratio.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* GENERATE BUTTON */}
            <button
              type="button"
              onClick={() => handleGenerate()}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 transition-all shadow-md shadow-violet-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating High-Res Artwork...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Image
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COL: CURRENT PREVIEW */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Latest Creation
            </h3>

            {isGenerating ? (
              <div className="aspect-square w-full rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-dashed border-violet-300 dark:border-violet-800 flex flex-col items-center justify-center p-6 text-center animate-pulse">
                <Sparkles className="w-10 h-10 text-violet-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Synthesizing pixels...
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Rendering lighting, textures, and details with Flux & SDXL engine.
                </p>
              </div>
            ) : history.length > 0 ? (
              <div className="space-y-3">
                <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-black/5">
                  <img
                    src={history[0].url}
                    alt={history[0].prompt}
                    className="w-full h-auto object-cover max-h-[360px] rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setLightboxImage(history[0])}
                      className="p-2 rounded-lg bg-white/90 text-slate-900 hover:bg-white text-xs font-semibold flex items-center gap-1 shadow"
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                    </button>
                    <button
                      onClick={() => handleDownload(history[0])}
                      className="p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 text-xs font-semibold flex items-center gap-1 shadow"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Style: <strong>{history[0].style}</strong></span>
                    <span>Ratio: <strong>{history[0].aspectRatio}</strong></span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                    "{history[0].prompt}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-square w-full rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <ImageIcon className="w-10 h-10 mb-2 stroke-1 text-slate-300 dark:text-slate-600" />
                <p className="text-xs">Your generated artwork will appear here in high definition.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GALLERY / RECENT GENERATIONS */}
      {history.length > 1 && (
        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-500" />
              Session Gallery ({history.length} images)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {history.map((img) => (
              <div
                key={img.id}
                className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
              >
                <img
                  src={img.url}
                  alt={img.prompt}
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-white">
                  <p className="text-[11px] line-clamp-2">{img.prompt}</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleCopyPrompt(img)}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                      title="Copy Prompt"
                    >
                      {copiedId === img.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setLightboxImage(img)}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                      title="View Full Size"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(img)}
                      className="p-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl space-y-4 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400">
                {lightboxImage.style} · {lightboxImage.aspectRatio}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(lightboxImage)}
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PNG
                </button>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex justify-center bg-black/40 rounded-xl overflow-hidden max-h-[65vh]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.prompt}
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            <p className="text-xs text-slate-300">
              <strong>Prompt:</strong> {lightboxImage.prompt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
