import React from 'react';
import { UnifiedPdfWorkspace } from './pdf/UnifiedPdfWorkspace';

export type PdfTab = 'workspace' | 'edit' | 'organize' | 'ocr' | 'merge' | 'split' | 'compress' | 'rotate';

export const PdfToolsView: React.FC<{ initialTab?: PdfTab }> = ({ initialTab = 'workspace' }) => {
  return (
    <div className="w-full">
      <UnifiedPdfWorkspace initialAction={initialTab} />
    </div>
  );
};
