import React, { useState, useEffect } from 'react';
import { PanelRightClose, FileSearch, ChevronLeft, ChevronRight, Copy, Check, FileText } from 'lucide-react';
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
  onSelectChunk,
  onClosePanel,
  language,
  selectedCitation,
}) => {
  const [activeTab, setActiveTab] = useState<'page' | 'data' | 'text'>('page');
  const [docChunks, setDocChunks] = useState<DocumentChunk[]>([]);
  const [copiedText, setCopiedText] = useState(false);
  const [showFullDocText, setShowFullDocText] = useState(false);

  // Fetch document chunks dynamically by ID or Name
  useEffect(() => {
    if (!activeDocument) return;
    const fetchChunks = async () => {
      try {
        let res = await fetch(`/api/documents/${encodeURIComponent(activeDocument.id)}/chunks`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.chunks && data.chunks.length > 0) {
            setDocChunks(data.chunks);
            return;
          }
        }
        // Fallback search by document name
        res = await fetch(`/api/documents/${encodeURIComponent(activeDocument.name)}/chunks`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.chunks) {
            setDocChunks(data.chunks);
          }
        }
      } catch (err) {
        console.error('Failed to load document chunks:', err);
      }
    };
    fetchChunks();
  }, [activeDocument?.id, activeDocument?.name]);

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
          <h3 className="text-sm font-semibold text-slate-700">No Document Selected</h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
            Upload a document or select one from the left panel to inspect its high-resolution pages, tables, and visual evidence.
          </p>
        </div>
      </div>
    );
  }

  const totalPages = activeDocument.pageCount || 1;
  const currentPageImage =
    activeDocument?.pageImages?.[currentPageNumber - 1] ||
    activeDocument?.pageImages?.[0] ||
    '';

  const docTitle = activeDocument.name;
  const allAvailableChunks = docChunks.length > 0 ? docChunks : chunks;
  const activeChunk = allAvailableChunks.find((c) => c.id === activeChunkId) || allAvailableChunks[0];
  const chunkType = selectedCitation?.chunkType || activeChunk?.type || 'Evidence';
  const matchScore = selectedCitation?.similarityScore ?? activeChunk?.similarityScore;

  const allDocTables = allAvailableChunks.filter((c) => c.rawTableData && c.rawTableData.rows && c.rawTableData.rows.length > 0);
  const visualFigures = allAvailableChunks.filter((c) => ['chart', 'graph', 'image'].includes(c.type));

  // Handler for jumping to a specific page from Extracted Data or Text tabs
  const handleJumpToPage = (targetPage: number, chunk?: DocumentChunk) => {
    onPageChange(targetPage);
    setActiveTab('page');
    if (chunk) {
      onSelectChunk(chunk);
    }
  };

  // Text content logic
  const currentPageTextChunks = allAvailableChunks.filter(
    (c) => c.pageNumber === currentPageNumber && c.content && c.type !== 'image'
  );
  const pageText = currentPageTextChunks.map((c) => c.content).join('\n\n');

  // All pages that have extracted text
  const pagesWithText = Array.from(
    new Set(allAvailableChunks.filter((c) => c.content && c.type !== 'image').map((c) => c.pageNumber))
  ).sort((a, b) => a - b);

  const fullDocumentText = allAvailableChunks
    .filter((c) => c.content && c.type !== 'image')
    .map((c) => `--- [Page ${c.pageNumber}] ---\n${c.content}`)
    .join('\n\n');

  const handleCopyText = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-white p-5 overflow-y-auto relative select-none">
      {/* Top Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-100">
        <div className="min-w-0 pr-2">
          <h2 className="font-serif text-base text-slate-900 font-semibold truncate" title={docTitle}>
            {docTitle}
          </h2>
          {/* Quick Page Indicator with Prev/Next mini buttons */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
            <span>Page <strong className="text-slate-800">{currentPageNumber}</strong> of {totalPages}</span>
            <div className="flex items-center space-x-0.5 ml-1">
              <button
                type="button"
                onClick={() => currentPageNumber > 1 && onPageChange(currentPageNumber - 1)}
                disabled={currentPageNumber <= 1}
                className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => currentPageNumber < totalPages && onPageChange(currentPageNumber + 1)}
                disabled={currentPageNumber >= totalPages}
                className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Top Right Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-[#0d5c4d]/20 text-[#0d5c4d] bg-[#eaf5f2] capitalize">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0d5c4d]" />
            <span>{chunkType}</span>
          </span>

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
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-6 border-b border-slate-200 text-xs my-3">
        <button
          onClick={() => setActiveTab('page')}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === 'page'
              ? 'border-b-2 border-[#0d5c4d] font-semibold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Page Preview
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === 'data'
              ? 'border-b-2 border-[#0d5c4d] font-semibold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Extracted Data ({allDocTables.length + visualFigures.length})
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'border-b-2 border-[#0d5c4d] font-semibold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Text Content
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col justify-start">
        {/* Tab 1: Page Viewer with Full Navigation Controls */}
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

        {/* Tab 2: Extracted Data (Tables + Figures) with Working Jump-to-Page */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Extracted Tables Section */}
            {allDocTables.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-slate-800 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Extracted Tables ({allDocTables.length})</span>
                </h4>
                {allDocTables.map((t, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 p-3.5 bg-slate-50 text-xs space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        Table {idx + 1} &middot; Page {t.pageNumber} ({t.rawTableData?.rows.length || 0} rows)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleJumpToPage(t.pageNumber, t)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-medium text-[11px] hover:bg-emerald-800 transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
                      >
                        <span>View on Page {t.pageNumber}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    {t.rawTableData && (
                      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-200">
                              {t.rawTableData.headers.map((h, i) => (
                                <th key={i} className="p-2 font-semibold text-slate-700">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {t.rawTableData.rows.slice(0, 10).map((row, rIdx) => (
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
                ))}
              </div>
            )}

            {/* Visual Figures & Diagrams Section */}
            {visualFigures.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-xs text-slate-800 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Visual Figures &amp; Plotted Diagrams ({visualFigures.length})</span>
                </h4>
                <div className="space-y-2">
                  {visualFigures.map((fig, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                      <div className="min-w-0 pr-3">
                        <span className="font-semibold text-slate-900 capitalize text-xs">
                          {fig.type} on Page {fig.pageNumber}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {fig.content || "Visual elements extracted by multimodal VLM"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJumpToPage(fig.pageNumber, fig)}
                        className="px-2.5 py-1 rounded-lg bg-[#0d5c4d] text-white text-[11px] font-medium shrink-0 hover:bg-[#094338] transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
                      >
                        <span>Jump to Page {fig.pageNumber}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allDocTables.length === 0 && visualFigures.length === 0 && (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400 text-xs">
                No structured tables or figures detected in this document.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Text Content with Page Switching & Full Document View */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            {/* Text Tab Controls Bar */}
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => currentPageNumber > 1 && onPageChange(currentPageNumber - 1)}
                  disabled={currentPageNumber <= 1}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page text"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-semibold text-slate-800 text-[11px]">
                  Page {currentPageNumber} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => currentPageNumber < totalPages && onPageChange(currentPageNumber + 1)}
                  disabled={currentPageNumber >= totalPages}
                  className="p-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page text"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFullDocText(!showFullDocText)}
                  className="px-2 py-1 rounded bg-white border border-slate-200 text-slate-700 text-[11px] font-medium hover:bg-slate-100 cursor-pointer"
                >
                  {showFullDocText ? 'Show Page Text' : 'View All Pages'}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(showFullDocText ? fullDocumentText : (pageText || activeDocument.insights?.summary || ''))}
                  className="px-2 py-1 rounded bg-white border border-slate-200 text-[#0d5c4d] text-[11px] font-medium hover:bg-[#eaf5f2] cursor-pointer flex items-center space-x-1"
                >
                  {copiedText ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Text View Body */}
            {showFullDocText ? (
              <div className="p-4 bg-white rounded-xl border border-slate-200 max-h-[500px] overflow-y-auto">
                <h4 className="font-semibold text-xs text-slate-800 mb-2">Complete Extracted Text ({totalPages} pages)</h4>
                <pre className="text-slate-700 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {fullDocumentText || "No text available across document."}
                </pre>
              </div>
            ) : pageText ? (
              <div className="p-4 bg-white rounded-xl border border-slate-200 max-h-[500px] overflow-y-auto shadow-xs">
                <pre className="text-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {pageText}
                </pre>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-semibold text-slate-700">No Text On Page {currentPageNumber}</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  This page may be an image cover or diagram. Jump to a page with extracted text:
                </p>
                {pagesWithText.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center max-w-xs mx-auto pt-1">
                    {pagesWithText.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onPageChange(p)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                          p === currentPageNumber
                            ? 'bg-[#0d5c4d] text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-[#eaf5f2]'
                        }`}
                      >
                        Page {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Metadata Bar */}
      <div className="pt-3 mt-auto flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
        <div>
          {matchScore !== undefined ? (
            <>Match <span className="font-semibold text-slate-800">{matchScore.toFixed(2)}</span></>
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
