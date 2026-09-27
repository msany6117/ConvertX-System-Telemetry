import React from 'react';

interface ConvertXLogoProps {
  size?: number; // size in px for the icon mark
  className?: string;
  showText?: boolean;
  showTagline?: boolean;
  layout?: 'horizontal' | 'stacked' | 'mark-only';
}

export const ConvertXIconMark: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="ConvertX Logo Mark"
    >
      <defs>
        {/* Gradient for Top-Left to Bottom-Right Stroke */}
        <linearGradient id="cxGradBack" x1="15%" y1="15%" x2="85%" y2="85%">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="45%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>

        {/* Gradient for Bottom-Left to Top-Right Arrow Stroke */}
        <linearGradient id="cxGradFront" x1="15%" y1="85%" x2="85%" y2="15%">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="42%" stopColor="#2563eb" />
          <stop offset="78%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>

        {/* Overlap shadow for 3D depth */}
        <filter id="cxOverlapShadow" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="-6" dy="7" stdDeviation="9" floodColor="#050d26" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* 1. Background Pill: Top-Left to Bottom-Right (rotated -45 deg) */}
      <rect
        x="198"
        y="46"
        width="116"
        height="420"
        rx="58"
        transform="rotate(-45 256 256)"
        fill="url(#cxGradBack)"
      />

      {/* 2. Foreground Arrow: Bottom-Left to Top-Right (rotated +45 deg) */}
      <g transform="rotate(45 256 256)" filter="url(#cxOverlapShadow)">
        <path
          d="
            M 198 408
            C 198 440, 224 466, 256 466
            C 288 466, 314 440, 314 408
            L 314 200
            L 366 200
            C 378 200, 384 185, 376 177
            L 265 52
            C 260 46, 252 46, 247 52
            L 136 177
            C 128 185, 134 200, 146 200
            L 198 200
            Z
          "
          fill="url(#cxGradFront)"
        />
      </g>
    </svg>
  );
};

export const ConvertXLogo: React.FC<ConvertXLogoProps> = ({
  size = 32,
  className = '',
  showText = true,
  showTagline = false,
  layout = 'horizontal',
}) => {
  if (layout === 'mark-only' || !showText) {
    return <ConvertXIconMark size={size} className={className} />;
  }

  if (layout === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <ConvertXIconMark size={size * 1.5} className="mb-2 transition-transform hover:scale-105" />
        <div className="flex items-center tracking-tight font-extrabold text-slate-900 dark:text-white">
          <span style={{ fontSize: `${Math.round(size * 0.85)}px` }}>Convert</span>
          <div className="inline-flex items-center ml-0.5" style={{ width: `${Math.round(size * 0.75)}px` }}>
            <ConvertXIconMark size={Math.round(size * 0.75)} />
          </div>
        </div>
        {showTagline && (
          <p className="text-[11px] font-medium tracking-[0.18em] text-slate-400 dark:text-slate-500 uppercase mt-1">
            Convert • Compress • Create
          </p>
        )}
      </div>
    );
  }

  // Default: Horizontal
  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className="flex items-center gap-2">
        <ConvertXIconMark size={size} className="transition-transform duration-200 group-hover:scale-105" />
        <div className="flex items-baseline font-black tracking-tight text-slate-900 dark:text-white">
          <span style={{ fontSize: `${Math.round(size * 0.65)}px`, lineHeight: 1 }}>Convert</span>
          <span
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent ml-0.5"
            style={{ fontSize: `${Math.round(size * 0.68)}px`, lineHeight: 1 }}
          >
            X
          </span>
        </div>
      </div>
      {showTagline && (
        <span className="text-[9px] font-medium tracking-[0.14em] text-slate-400 dark:text-slate-500 uppercase -mt-0.5 pl-0.5">
          Convert • Compress • Create
        </span>
      )}
    </div>
  );
};
