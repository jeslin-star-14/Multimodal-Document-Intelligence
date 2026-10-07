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
    <div className="relative w-full rounded-lg overflow-hidden border border-slate-200/90 shadow-xs bg-white">
      <img
        src={pageImage}
        alt={`Page ${currentPage} Preview`}
        className="block w-full h-auto object-contain select-none"
      />

      {/* Bounding Box Highlights on top of the page */}
      <BoundingBoxOverlay
        boxes={boundingBoxes}
        activeBoxId={activeBoxId}
        onBoxClick={onBoxClick}
      />
    </div>
  );
};
