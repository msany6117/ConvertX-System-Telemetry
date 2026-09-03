import { spawn } from 'child_process';

export interface AudioOptions {
  bitrate?: string; // '128k' | '192k' | '256k' | '320k'
  sampleRate?: number; // 44100, 48000
  channels?: number; // 1 = mono, 2 = stereo
  volume?: number; // 0.1 to 2.0
  startTime?: string;
  endTime?: string;
  fadeInSeconds?: number;
  fadeOutSeconds?: number;
}

export function processAudio(
  inputPath: string,
  outputPath: string,
  targetFormat: string,
  options: AudioOptions = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    const normTarget = targetFormat.toLowerCase().replace('.', '');
    const args: string[] = ['-y'];

    if (options.startTime) {
      args.push('-ss', options.startTime);
    }

    args.push('-i', inputPath);

    if (options.endTime) {
      args.push('-to', options.endTime);
    }

    // Codecs
    switch (normTarget) {
      case 'mp3':
        args.push('-c:a', 'libmp3lame', '-b:a', options.bitrate || '192k');
        break;
      case 'wav':
        args.push('-c:a', 'pcm_s16le');
        break;
      case 'aac':
        args.push('-c:a', 'aac', '-b:a', options.bitrate || '192k');
        break;
      case 'flac':
        args.push('-c:a', 'flac');
        break;
      case 'ogg':
        args.push('-c:a', 'libvorbis', '-b:a', options.bitrate || '160k');
        break;
      case 'm4a':
        args.push('-c:a', 'aac', '-b:a', options.bitrate || '192k');
        break;
      default:
        args.push('-c:a', 'copy');
    }

    // Audio filters
    const af: string[] = [];
    if (options.volume && options.volume !== 1) {
      af.push(`volume=${options.volume}`);
    }
    if (options.fadeInSeconds) {
      af.push(`afade=t=in:ss=0:d=${options.fadeInSeconds}`);
    }
    if (af.length > 0) {
      args.push('-af', af.join(','));
    }

    if (options.sampleRate) {
      args.push('-ar', String(options.sampleRate));
    }
    if (options.channels) {
      args.push('-ac', String(options.channels));
    }

    args.push(outputPath);

    const proc = spawn('ffmpeg', args);
    let stderr = '';

    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Audio conversion error (code ${code}): ${stderr.slice(-300)}`));
      }
    });
    proc.on('error', (err) => reject(err));
  });
}
