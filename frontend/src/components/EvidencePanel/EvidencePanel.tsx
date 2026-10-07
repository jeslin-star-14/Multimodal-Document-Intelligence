import React, { useState } from 'react';
import { PanelRightClose, FileSearch } from 'lucide-react';
import type { DocumentChunk, BoundingBox, DocumentItem, LanguageCode, Citation } from '../../types';
import { PageViewer } from './PageViewer';

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
  onClosePanel?: () => void;
  language: LanguageCode;
  selectedCitation?: Citation | null;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  activeDocument,
  currentPageNumber,
  onPageChange,
  boundingBoxes,
  activeBoxId,
  onBoxClick,
  chunks = [],
  activeChunkId,
  onClosePanel,
  language,
  selectedCitation,
}) => {
  const [activeTab, setActiveTab] = useState<'page' | 'data' | 'text'>('page');

  if (!activeDocument) {
    return (
      <div className="h-full flex flex-col bg-white p-6 justify-between select-none">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h2 className="font-semibold text-sm text-slate-800">Visual Evidence</h2>
          {onClosePanel && (
            <button
              onClick={onClosePanel}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Hide evidence panel"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <FileSearch className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-700">No Evidence Selected</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Upload a document and click on any citation in chat to inspect its grounded page, bounding box highlights, and extracted tables.
          </p>
        </div>
      </div>
    );
  }

  const currentPageImage =
    activeDocument?.pageImages?.[currentPageNumber - 1] ||
    activeDocument?.pageImages?.[0] ||
    '';

  const totalPages = activeDocument.pageCount || 1;
  const docTitle = activeDocument.name;
  const activeChunk = chunks.find((c) => c.id === activeChunkId) || chunks[0];
  const chunkType = selectedCitation?.chunkType || activeChunk?.type || 'Evidence';
  const matchScore = selectedCitation?.similarityScore ?? activeChunk?.similarityScore;

  // Automatically load all extracted tables and visual figures for active document
  const [docChunks, setDocChunks] = React.useState<DocumentChunk[]>([]);
  React.useEffect(() => {
    if (!activeDocument) return;
    fetch(`/api/documents/${activeDocument.id}/chunks`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && data.chunks) {
          setDocChunks(data.chunks);
        }
      })
      .catch(() => {});
  }, [activeDocument?.id]);

  const allAvailableChunks = docChunks.length > 0 ? docChunks : chunks;
  const allDocTables = allAvailableChunks.filter((c) => c.rawTableData && c.rawTableData.rows && c.rawTableData.rows.length > 0);
  const visualFigures = allAvailableChunks.filter((c) => ['chart', 'graph', 'image'].includes(c.type));

  return (
    <div className="h-full flex flex-col bg-white p-6 overflow-y-auto relative select-none">
      {/* Top Header */}
      <div className="flex items-start justify-between pb-4">
        <div className="min-w-0 pr-2">
          <h2 className="font-serif text-base text-slate-800 font-normal truncate" title={docTitle}>
            {docTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Page {currentPageNumber} of {totalPages}
          </p>
        </div>

        {/* Top Right Controls: Chunk Type Badge + Hide button */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border border-[#0d5c4d] text-[#0d5c4d] bg-[#eaf5f2]/40 capitalize">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0d5c4d]" />
            <span>{chunkType}</span>
          </span>

          {onClosePanel && (
            <button
              onClick={onClosePanel}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
              title="Hide evidence panel"
              aria-label="Hide evidence panel"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-6 border-b border-slate-200 text-xs mb-4">
        <button
          onClick={() => setActiveTab('page')}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === 'page'
              ? 'border-b-2 border-[#0d5c4d] font-semibold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Page
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === 'data'
              ? 'border-b-2 border-[#0d5c4d] font-semibold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Extracted data ({allDocTables.length + visualFigures.length})
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'border-b-2 border-[#0d5c4d] font-semibold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Text
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col justify-start">
        {activeTab === 'page' && (
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
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Extracted Tables Section */}
            {allDocTables.length > 0 ? (
              allDocTables.map((t, idx) => (
                <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50 text-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      Table {idx + 1} ({t.rawTableData?.rows.length || 0} rows)
                    </span>
                    <button
                      type="button"
                      onClick={() => onPageChange(t.pageNumber)}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[#0d5c4d] font-medium text-[11px] hover:bg-[#eaf5f2] cursor-pointer"
                    >
                      View on Page {t.pageNumber}
                    </button>
                  </div>
                  {t.rawTableData && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px] bg-white rounded border border-slate-200">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200">
                            {t.rawTableData.headers.map((h, i) => (
                              <th key={i} className="p-2 font-semibold text-slate-700">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {t.rawTableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-100 last:border-b-0">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-2 font-mono text-slate-800">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))
            ) : null}

            {/* Visual Figures & Diagrams Section */}
            {visualFigures.length > 0 ? (
              <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 text-xs space-y-3">
                <h4 className="font-semibold text-slate-800">Visual Figures & Plotted Diagrams Detected</h4>
                <div className="space-y-2">
                  {visualFigures.map((fig, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded border border-slate-200 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <span className="font-medium text-slate-800 capitalize">
                          {fig.type} on Page {fig.pageNumber}
                        </span>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {fig.content || "Visual elements extracted by VLM"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onPageChange(fig.pageNumber)}
                        className="px-2 py-1 rounded bg-[#eaf5f2] text-[#0d5c4d] text-[11px] font-medium shrink-0 hover:bg-[#d8efe8] cursor-pointer"
                      >
                        Jump to Page {fig.pageNumber}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {allDocTables.length === 0 && visualFigures.length === 0 && (
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50 text-center text-slate-400 text-xs">
                No structured tables or visual figures extracted for this document.
              </div>
            )}
          </div>
        )}

        {activeTab === 'text' && (() => {
          const currentTextChunk = allAvailableChunks.find((c) => c.pageNumber === currentPageNumber && c.content) || activeChunk;
          return (
            <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800">Extracted Text Content</h4>
                <span className="text-[10px] text-slate-400">Page {currentPageNumber}</span>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed bg-white p-3 rounded border border-slate-200 text-[11px] max-h-96 overflow-y-auto">
                {currentTextChunk?.content || activeDocument.insights?.summary || "No text content extracted for this chunk."}
              </p>
            </div>
          );
        })()}
      </div>

      {/* Bottom Metadata Bar */}
      <div className="pt-4 mt-auto flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
        <div>
          {matchScore !== undefined ? (
            <>Match <span className="font-semibold text-slate-700">{matchScore.toFixed(2)}</span></>
          ) : (
            <span className="text-slate-400">Visual grounding active</span>
          )}
        </div>
        <div>
          Type: <span className="font-bold text-slate-900 capitalize">{chunkType}</span>
        </div>
      </div>
    </div>
  );
};

