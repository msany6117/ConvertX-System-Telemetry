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
  const textSize = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  const subSize = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[10px]',
    xl: 'text-xs',
  }[size];

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center font-black ${textSize} select-none ${className}`}>
        <span className="text-slate-900 dark:text-white">C</span>
        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          X
        </span>
      </div>
    );
  }

  return (
    <div className={`group inline-flex flex-col select-none ${className}`}>
      <div className="flex items-baseline tracking-tight">
        <span
          className={`font-black text-slate-900 dark:text-white ${textSize} leading-none`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
        >
          Convert
        </span>
        <span
          className={`font-black ${textSize} leading-none bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
        >
          X
        </span>
      </div>

      {showSubtitle && (
        <span className={`${subSize} font-semibold tracking-[0.22em] uppercase text-slate-400 dark:text-slate-500 mt-1`}>
          Convert • Compress • Create
        </span>
      )}
    </div>
  );
};
