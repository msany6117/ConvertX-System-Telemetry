import React from 'react';

interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'mark-with-text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'mark-with-text',
  size = 'md',
  showSubtitle = false,
  className = '',
}) => {
  // Sizing definitions
  const iconDimensions = {
    sm: { w: 26, h: 26 },
    md: { w: 34, h: 34 },
    lg: { w: 46, h: 46 },
    xl: { w: 64, h: 64 },
  }[size];

  const textSize = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  /* 
   * High-fidelity vector rendition of the official ConvertX icon mark:
   * Dynamic crossing ribbons with cyan-blue-purple 3D gradient and top-right arrow
   */
  const renderIconSvg = () => (
    <svg
      width={iconDimensions.w}
      height={iconDimensions.h}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200 group-hover:scale-105"
    >
      <defs>
        {/* Main Ribbon 1 Gradient (Top-Left to Bottom-Right) */}
        <linearGradient id="cxGradTL_BR" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00C0FA" />
          <stop offset="45%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>

        {/* Main Ribbon 2 with Arrow (Bottom-Left to Top-Right) */}
        <linearGradient id="cxGradBL_TR" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00B4D8" />
          <stop offset="35%" stopColor="#3B82F6" />
          <stop offset="75%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>

        {/* Soft shadow for realistic 3D crossover */}
        <filter id="cxCrossoverShadow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="-2" dy="2" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Ribbon 1: Top-Left to Bottom-Right stroke */}
      <path
        d="M20 15 C13 15 10 22 15 28 L72 85 C77 90 84 90 88 85 C92 81 91 74 86 69 L28 17 C25 15 22 15 20 15 Z"
        fill="url(#cxGradTL_BR)"
      />

      {/* Ribbon 2 with Arrow: Bottom-Left to Top-Right ascending crossover */}
      <g filter="url(#cxCrossoverShadow)">
        {/* Main body of ascending bar + arrow head */}
        <path
          d="M17 76 C12 81 13 88 18 92 C23 96 30 95 35 90 L63 56 L61 46 L51 44 L25 70 C20 73 18 75 17 76 Z"
          fill="url(#cxGradBL_TR)"
        />
        {/* Shaft leading smoothly into the arrow */}
        <path
          d="M32 63 L65 30 L63 21 L85 14 L80 37 L72 35 L50 57 Z"
          fill="url(#cxGradBL_TR)"
        />
        {/* Arrow head on top-right */}
        <path
          d="M62 20 L87 14 C90 13 92 15 91 18 L84 43 L73 39 L79 26 L66 32 Z"
          fill="url(#cxGradBL_TR)"
        />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderIconSvg()}
      </div>
    );
  }

  return (
    <div className={`group inline-flex items-center gap-2 select-none ${className}`}>
      {renderIconSvg()}

      <div className="flex flex-col">
        <div className="flex items-baseline">
          <span
            className={`font-black tracking-tight text-slate-900 dark:text-white ${textSize} leading-none`}
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
          >
            Convert
          </span>
          <span
            className={`font-black tracking-tight ${textSize} leading-none bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent`}
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
          >
            X
          </span>
        </div>

        {showSubtitle && (
          <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-slate-400 dark:text-slate-500 mt-0.5">
            Convert • Compress • Create
          </span>
        )}
      </div>
    </div>
  );
};
