import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import type { BoundingBox, LanguageCode } from '../../types';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { translations } from '../../translations/i18n';

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
  totalPages,
  onPageChange,
  boundingBoxes,
  activeBoxId,
  onBoxClick,
  language,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const t = translations[language];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 60));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-hidden light:bg-slate-100 light:border-slate-300">
      {/* Control bar */}
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 light:bg-white light:border-slate-200">
        {/* Page Nav */}
        <div className="flex items-center space-x-1.5 text-xs text-slate-300 light:text-slate-700">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed light:hover:bg-slate-100 cursor-pointer"
            title="Previous Page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium">
            {t.page} <span className="text-indigo-400 font-bold">{currentPage}</span> {t.of} {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed light:hover:bg-slate-100 cursor-pointer"
            title="Next Page"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 text-xs">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 light:hover:bg-slate-100 light:text-slate-600 cursor-pointer"
            title={t.zoomOut}
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 light:hover:bg-slate-100 light:text-slate-600 cursor-pointer"
            title={t.zoomIn}
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 light:hover:bg-slate-100 light:text-slate-600 ml-1 cursor-pointer"
            title={t.resetZoom}
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Page Canvas Container with Scroll */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/40 relative">
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
          className="relative max-w-full shadow-2xl rounded-lg overflow-hidden border border-slate-700/50"
        >
          <img
            src={pageImage}
            alt={`Page ${currentPage} Preview`}
            className="block w-full max-w-[560px] h-auto object-contain select-none"
          />

          {/* Bounding Box Highlights on top of the page */}
          <BoundingBoxOverlay
            boxes={boundingBoxes}
            activeBoxId={activeBoxId}
            onBoxClick={onBoxClick}
          />
        </div>
      </div>
    </div>
  );
};
