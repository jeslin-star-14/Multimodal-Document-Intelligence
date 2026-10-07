import React, { useState } from 'react';
import { Scan } from 'lucide-react';
import type { DocumentChunk, BoundingBox, DocumentItem, LanguageCode } from '../../types';
import { PageViewer } from './PageViewer';
import { ChunkDetailsTabs } from './ChunkDetailsTabs';
import { translations } from '../../translations/i18n';

interface EvidencePanelProps {
  activeDocument: DocumentItem | null;
  currentPageNumber: number;
  onPageChange: (newPage: number) => void;
  boundingBoxes: BoundingBox[];
  activeBoxId?: string;
  onBoxClick?: (box: BoundingBox) => void;
  chunks: DocumentChunk[];
  activeChunkId?: string;
  onSelectChunk: (chunk: DocumentChunk) => void;
  language: LanguageCode;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  activeDocument,
  currentPageNumber,
  onPageChange,
  boundingBoxes,
  activeBoxId,
  onBoxClick,
  chunks,
  activeChunkId,
  onSelectChunk,
  language,
}) => {
  const [viewMode, setViewMode] = useState<'both' | 'page' | 'chunks'>('both');
  const t = translations[language];

  const currentPageImage =
    activeDocument?.pageImages?.[currentPageNumber - 1] ||
    activeDocument?.pageImages?.[0] ||
    '';

  const totalPages = activeDocument?.pageCount || 1;

  return (
    <div className="h-full flex flex-col bg-slate-950/60 border-l border-slate-800/80 light:bg-white light:border-slate-200">
      {/* Panel Top Header */}
      <div className="p-4 border-b border-slate-800/80 light:border-slate-200 flex items-center justify-between bg-slate-950/80 light:bg-white">
        <div className="flex items-center space-x-2">
          <Scan className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 light:text-slate-800">
            {t.evidenceTab}
          </h2>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs light:bg-slate-100 light:border-slate-300">
          <button
            onClick={() => setViewMode('both')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              viewMode === 'both'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            Split
          </button>
          <button
            onClick={() => setViewMode('page')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              viewMode === 'page'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            Page
          </button>
          <button
            onClick={() => setViewMode('chunks')}
            className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              viewMode === 'chunks'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
            }`}
          >
            Chunks
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-3 flex flex-col gap-3">
        {/* Page Preview Canvas with Bounding Box Overlay */}
        {(viewMode === 'both' || viewMode === 'page') && (
          <div className={viewMode === 'both' ? 'h-[50%]' : 'h-full'}>
            <PageViewer
              pageImage={currentPageImage}
              currentPage={currentPageNumber}
              totalPages={totalPages}
              onPageChange={onPageChange}
              boundingBoxes={boundingBoxes}
              activeBoxId={activeBoxId}
              onBoxClick={onBoxClick}
              language={language}
            />
          </div>
        )}

        {/* Multimodal Chunks Inspector Tabs */}
        {(viewMode === 'both' || viewMode === 'chunks') && (
          <div className={viewMode === 'both' ? 'h-[50%]' : 'h-full'}>
            <ChunkDetailsTabs
              chunks={chunks}
              activeChunkId={activeChunkId}
              onSelectChunk={onSelectChunk}
              language={language}
            />
          </div>
        )}
      </div>
    </div>
  );
};
