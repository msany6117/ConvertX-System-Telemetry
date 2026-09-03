import fs from 'fs';
import { spawn } from 'child_process';

export interface VideoOptions {
  resolution?: string; // '1080p' | '720p' | '480p' | '360p' | 'original'
  customWidth?: number;
  customHeight?: number;
  fps?: number; // 24, 25, 30, 60
  videoCodec?: string; // 'h264' | 'hevc' | 'vp9' | 'auto'
  audioCodec?: string; // 'aac' | 'mp3' | 'copy'
  videoBitrate?: string; // 'low' | 'medium' | 'high' | custom kbps
  audioBitrate?: string; // '128k' | '192k' | '320k'
  mute?: boolean;
  volume?: number; // 0.5 to 2.0
  rotate?: number; // 90, 180, 270
  startTime?: string; // '00:00:05'
  endTime?: string; // '00:00:15'
  duration?: number; // in seconds
  quality?: number; // 1-100
  compressionLevel?: 'best' | 'balanced' | 'max';
  onProgress?: (percent: number) => void;
}

export function processVideo(
  inputPath: string,
  outputPath: string,
  targetFormat: string,
  options: VideoOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const normTarget = targetFormat.toLowerCase().replace('.', '');
    const isAudioOutput = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(normTarget);
    const isGifOutput = normTarget === 'gif';

    const args: string[] = ['-y']; // Overwrite

    // Trimming start
    if (options.startTime) {
      args.push('-ss', options.startTime);
    }

    // Input file
    args.push('-i', inputPath);

    // Trimming end / duration
    if (options.endTime) {
      args.push('-to', options.endTime);
    } else if (options.duration) {
      args.push('-t', String(options.duration));
    }

    // 1. VIDEO TO AUDIO EXTRACTION
    if (isAudioOutput) {
      args.push('-vn'); // Discard video stream
      if (normTarget === 'mp3') {
        args.push('-c:a', 'libmp3lame', '-b:a', options.audioBitrate || '192k');
      } else if (normTarget === 'wav') {
        args.push('-c:a', 'pcm_s16le');
      } else if (normTarget === 'aac') {
        args.push('-c:a', 'aac', '-b:a', options.audioBitrate || '192k');
      } else if (normTarget === 'flac') {
        args.push('-c:a', 'flac');
      } else if (normTarget === 'ogg') {
        args.push('-c:a', 'libvorbis');
      }

      if (options.volume && options.volume !== 1) {
        args.push('-filter:a', `volume=${options.volume}`);
      }

      args.push(outputPath);
      return runFFmpeg(args, resolve, reject, options.onProgress);
    }

    // 2. VIDEO TO HIGH QUALITY GIF
    if (isGifOutput) {
      const fps = options.fps || 15;
      const width = options.customWidth || 480;
      // High-grade two-pass palette filter
      const filter = `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`;
      args.push('-vf', filter);
      args.push(outputPath);
      return runFFmpeg(args, resolve, reject, options.onProgress);
    }

    // 3. VIDEO TRANSCODING / COMPRESSION
    const videoFilters: string[] = [];

    // Resolution scaling
    if (options.resolution && options.resolution !== 'original') {
      const resMap: Record<string, string> = {
        '2160p': 'scale=-2:2160',
        '1440p': 'scale=-2:1440',
        '1080p': 'scale=-2:1080',
        '720p': 'scale=-2:720',
        '480p': 'scale=-2:480',
        '360p': 'scale=-2:360',
        '240p': 'scale=-2:240',
      };
      if (resMap[options.resolution]) {
        videoFilters.push(resMap[options.resolution]);
      }
    } else if (options.customWidth || options.customHeight) {
      const w = options.customWidth ? Math.floor(options.customWidth) : -2;
      const h = options.customHeight ? Math.floor(options.customHeight) : -2;
      videoFilters.push(`scale=${w}:${h}`);
    }

    // Rotation
    if (options.rotate === 90) {
      videoFilters.push('transpose=1');
    } else if (options.rotate === 180) {
      videoFilters.push('transpose=1,transpose=1');
    } else if (options.rotate === 270) {
      videoFilters.push('transpose=2');
    }

    if (videoFilters.length > 0) {
      args.push('-vf', videoFilters.join(','));
    }

    // FPS
    if (options.fps) {
      args.push('-r', String(options.fps));
    }

    // Audio Mute or Volume
    if (options.mute) {
      args.push('-an');
    } else {
      if (options.volume && options.volume !== 1) {
        args.push('-af', `volume=${options.volume}`);
      }
      if (options.audioBitrate) {
        args.push('-b:a', options.audioBitrate);
      }
    }

    // Codecs and Containers
    if (normTarget === 'webm') {
      args.push('-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0');
      if (!options.mute) args.push('-c:a', 'libopus');
    } else {
      // Default H264 for MP4, MOV, MKV, AVI
      args.push('-c:v', 'libx264', '-preset', 'veryfast');
      
      // Quality / Compression level CRF
      let crf = '23';
      if (options.compressionLevel === 'max') crf = '28';
      else if (options.compressionLevel === 'balanced') crf = '24';
      else if (options.compressionLevel === 'best') crf = '20';
      else if (options.quality) {
        // Map 1-100 to CRF 40-18
        crf = String(Math.round(40 - (options.quality / 100) * 22));
      }
      args.push('-crf', crf);

      if (!options.mute) {
        args.push('-c:a', 'aac', '-b:a', options.audioBitrate || '128k');
      }
    }

    args.push(outputPath);
    runFFmpeg(args, resolve, reject, options.onProgress);
  });
}

function runFFmpeg(
  args: string[],
  resolve: () => void,
  reject: (err: Error) => void,
  onProgress?: (percent: number) => void
) {
  const proc = spawn('ffmpeg', args);
  let stderr = '';

  proc.stderr.on('data', (d) => {
    const text = d.toString();
    stderr += text;
    // Optional progress parsing: time=00:01:23.45
    if (onProgress && text.includes('time=')) {
      onProgress(50); // intermediate progress notification
    }
  });

  proc.on('close', (code) => {
    if (code === 0) {
      resolve();
    } else {
      reject(new Error(`FFmpeg exited with code ${code}. Error: ${stderr.slice(-300)}`));
    }
  });

  proc.on('error', (err) => reject(err));
}
