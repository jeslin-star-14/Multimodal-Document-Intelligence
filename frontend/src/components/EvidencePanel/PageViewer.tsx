import React from 'react';
import type { BoundingBox, LanguageCode } from '../../types';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';

interface PageViewerProps {
  pageImage: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  boundingBoxes: BoundingBox[];
  activeBoxId?: string;
  onBoxClick?: (box: BoundingBox) => void;
  language: LanguageCode;
}

export const PageViewer: React.FC<PageViewerProps> = ({
  pageImage,
  currentPage,
  boundingBoxes,
  activeBoxId,
  onBoxClick,
}) => {
  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-slate-200/90 shadow-xs bg-white min-h-[300px] flex items-center justify-center">
      {pageImage ? (
        <img
          src={pageImage}
          alt={`Page ${currentPage} Preview`}
          className="block w-full h-auto object-contain select-none"
        />
      ) : (
        <div className="p-8 text-center text-slate-400 select-none flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-slate-600">Page {currentPage} Preview</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Visual grounding active</span>
        </div>
      )}

      {/* Bounding Box Highlights on top of the page */}
      {boundingBoxes && boundingBoxes.length > 0 && (
        <BoundingBoxOverlay
          boxes={boundingBoxes}
          activeBoxId={activeBoxId}
          onBoxClick={onBoxClick}
        />
      )}
    </div>
  );
};
