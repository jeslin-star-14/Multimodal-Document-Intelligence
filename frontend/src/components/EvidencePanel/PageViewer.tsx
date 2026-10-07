import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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
  totalPages,
  onPageChange,
  boundingBoxes,
  activeBoxId,
  onBoxClick,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [inputPage, setInputPage] = useState<string>(String(currentPage));

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
      setInputPage(String(currentPage - 1));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
      setInputPage(String(currentPage + 1));
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(inputPage, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      onPageChange(p);
    } else {
      setInputPage(String(currentPage));
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(200, prev + 25));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 25));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <div className="flex flex-col w-full space-y-2 select-none">
      {/* Top Page Navigation Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
        {/* Prev / Page Input / Next */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-medium text-[11px]">Page</span>
            <input
              type="text"
              value={inputPage}
              onChange={(e) => setInputPage(e.target.value)}
              onBlur={handlePageInputSubmit}
              className="w-10 text-center py-0.5 px-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0d5c4d]"
            />
            <span className="text-slate-500 font-medium text-[11px]">of {totalPages}</span>
          </form>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-600 w-9 text-center">{zoomLevel}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1 rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer ml-0.5"
            title="Reset zoom (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Image Canvas Container */}
      <div className="relative w-full rounded-lg overflow-auto border border-slate-200/90 shadow-xs bg-slate-100 min-h-[360px] max-h-[640px] flex items-center justify-center p-2">
        <div
          className="relative transition-transform duration-150 origin-top shadow-md rounded bg-white"
          style={{ transform: `scale(${zoomLevel / 100})`, width: '100%' }}
        >
          {pageImage ? (
            <img
              src={pageImage}
              alt={`Page ${currentPage} Preview`}
              className="block w-full h-auto object-contain select-none rounded"
            />
          ) : (
            <div className="p-12 text-center text-slate-400 select-none flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold text-slate-700">Page {currentPage} Preview</span>
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
      </div>
    </div>
  );
};
