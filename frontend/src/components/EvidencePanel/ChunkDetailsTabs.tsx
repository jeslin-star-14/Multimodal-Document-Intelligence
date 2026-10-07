import React, { useState } from 'react';
import { 
  FileText, 
  Table as TableIcon, 
  Image as ImageIcon, 
  TrendingUp,
  Download,
  Check,
  Edit3,
  RefreshCw,
  AlertTriangle,
  Table
} from 'lucide-react';
import type { DocumentChunk, ChunkType, LanguageCode } from '../../types';

interface ChunkDetailsTabsProps {
  chunks: DocumentChunk[];
  activeChunkId?: string;
  onSelectChunk: (chunk: DocumentChunk) => void;
  language?: LanguageCode;
}

export const ChunkDetailsTabs: React.FC<ChunkDetailsTabsProps> = ({
  chunks,
  activeChunkId,
  onSelectChunk,
}) => {
  const [selectedTab, setSelectedTab] = useState<ChunkType>('chart');
  const [decompiledData, setDecompiledData] = useState<Record<string, any>>({});
  const [editingOcrChunkId, setEditingOcrChunkId] = useState<string | null>(null);
  const [editedOcrText, setEditedOcrText] = useState<string>('');
  const [savingOcr, setSavingOcr] = useState(false);
  const [savedSuccessChunkId, setSavedSuccessChunkId] = useState<string | null>(null);

  // Group chunks by type
  const textChunks = chunks.filter((c) => c.type === 'text');
  const tableChunks = chunks.filter((c) => c.type === 'table');
  const imageChunks = chunks.filter((c) => c.type === 'image' || c.type === 'chart');

  const getActiveTabChunks = () => {
    switch (selectedTab) {
      case 'table':
        return tableChunks;
      case 'image':
      case 'chart':
        return imageChunks;
      case 'text':
      default:
        return textChunks;
    }
  };

  const currentTabChunks = getActiveTabChunks();

  // Export CSV helper
  const handleDownloadCsv = (chunkId: string, title: string) => {
    const data = decompiledData[chunkId];
    if (!data) return;
    const csvContent = data.csv_export || "data:text/csv;charset=utf-8," + encodeURIComponent(
      [data.headers?.join(",") || ""].concat((data.rows || []).map((r: any[]) => r.join(","))).join("\n")
    );
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}_decompiled.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // OCR Correction helper
  const handleSaveOcrCorrection = async (chunk: DocumentChunk) => {
    setSavingOcr(true);
    try {
      const res = await fetch(`/api/evidence/${chunk.id}/correct-ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrected_text: editedOcrText })
      });
      if (res.ok) {
        chunk.content = editedOcrText;
        setSavedSuccessChunkId(chunk.id);
        setEditingOcrChunkId(null);
        setTimeout(() => setSavedSuccessChunkId(null), 3000);
      }
    } catch (err) {
      console.error('Failed to save OCR correction:', err);
    } finally {
      setSavingOcr(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Tab Switcher */}
      <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          onClick={() => setSelectedTab('chart')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            selectedTab === 'chart' || selectedTab === 'image'
              ? 'bg-[#0d5c4d] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Visual & Charts</span>
          <span className="text-[10px] opacity-80">({imageChunks.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('table')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            selectedTab === 'table'
              ? 'bg-[#0d5c4d] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Tables</span>
          <span className="text-[10px] opacity-80">({tableChunks.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('text')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            selectedTab === 'text'
              ? 'bg-[#0d5c4d] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Text & OCR</span>
          <span className="text-[10px] opacity-80">({textChunks.length})</span>
        </button>
      </div>

      {/* Chunk Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {currentTabChunks.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-slate-200 rounded-xl bg-slate-50">
            No {selectedTab} chunks extracted for this document.
          </div>
        ) : (
          currentTabChunks.map((chunk) => {
            const isActive = activeChunkId === chunk.id;
            const isEditingThisOcr = editingOcrChunkId === chunk.id;

            return (
              <div
                key={chunk.id}
                onClick={() => onSelectChunk(chunk)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50/40 border-[#0d5c4d] shadow-sm ring-1 ring-[#0d5c4d]/40'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Chunk Meta Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold">
                      Page {chunk.pageNumber}
                    </span>
                    <span className="text-slate-600 truncate max-w-[140px] font-medium">
                      {chunk.documentName}
                    </span>
                  </div>

                  {/* Similarity Score Badge */}
                  <div className="flex items-center space-x-1 text-[#0d5c4d] font-semibold text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{Math.round((chunk.similarityScore || 0.95) * 100)}% Match</span>
                  </div>
                </div>

                {/* Content Render: Table or Text or Chart */}
                <div className="mt-2.5 text-xs text-slate-700 leading-relaxed">
                  {chunk.type === 'table' && chunk.rawTableData ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 my-1">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            {chunk.rawTableData.headers.map((h, i) => (
                              <th key={i} className="p-1.5 text-slate-700 font-bold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {chunk.rawTableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-1.5 text-slate-700 font-mono">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div>
                      {/* FEATURE 6: Low-Confidence OCR Interactive Correction */}
                      {isEditingThisOcr ? (
                        <div className="space-y-2 mt-1" onClick={(e) => e.stopPropagation()}>
                          <textarea
                            value={editedOcrText}
                            onChange={(e) => setEditedOcrText(e.target.value)}
                            className="w-full p-2.5 text-xs font-mono border border-amber-300 rounded-lg bg-amber-50/40 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0d5c4d]"
                            rows={4}
                          />
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setEditingOcrChunkId(null)}
                              className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveOcrCorrection(chunk)}
                              disabled={savingOcr}
                              className="px-3 py-1 text-xs font-semibold bg-[#0d5c4d] text-white rounded-md flex items-center space-x-1 shadow-2xs hover:bg-emerald-900"
                            >
                              {savingOcr ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              <span>Save & Re-Index</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          {/* Highlight low-confidence OCR words with dashed underline */}
                          <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-[11px] leading-relaxed text-slate-800">
                            {chunk.ocr_words && chunk.ocr_words.length > 0 ? (
                              <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                                {chunk.ocr_words.map((w, wi) => (
                                  <span
                                    key={wi}
                                    title={w.is_low_confidence ? `Low OCR Confidence: ${Math.round(w.confidence * 100)}% (Click Edit to Correct)` : undefined}
                                    className={w.is_low_confidence ? 'underline decoration-amber-500 decoration-wavy text-amber-900 font-bold bg-amber-100/60 px-0.5 rounded cursor-pointer' : ''}
                                  >
                                    {w.text}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="line-clamp-4">{chunk.content}</p>
                            )}
                          </div>

                          {/* Quick OCR Edit Trigger */}
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            {savedSuccessChunkId === chunk.id ? (
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Updated & Vector Store Synchronized!
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOcrChunkId(chunk.id);
                                  setEditedOcrText(chunk.content);
                                }}
                                className="text-slate-500 hover:text-[#0d5c4d] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3 text-slate-400" />
                                <span>Correct OCR Extraction</span>
                              </button>
                            )}

                            {chunk.ocr_words && chunk.ocr_words.some(w => w.is_low_confidence) && (
                              <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                Low Confidence Tokens Detected
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* FEATURE 3: Dynamic Chart-to-Data Decompiler & Editable Spreadsheet */}
                      {(chunk.type === 'chart' || chunk.type === 'image') && (
                        <div className="mt-2.5">
                          {decompiledData[chunk.id] ? (
                            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-[11px] space-y-2">
                              <div className="flex items-center justify-between text-emerald-950 font-bold">
                                <span className="flex items-center gap-1.5">
                                  <Table className="w-3.5 h-3.5 text-[#0d5c4d]" />
                                  <span>Decompiled Visual Table</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadCsv(chunk.id, chunk.documentName);
                                  }}
                                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white border border-emerald-300 text-[#0d5c4d] font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>CSV Export</span>
                                </button>
                              </div>

                              <div className="overflow-x-auto max-h-40 rounded-lg border border-emerald-200/80 bg-white">
                                <table className="w-full text-left text-[11px] border-collapse font-mono">
                                  <thead>
                                    <tr className="bg-emerald-100/70 border-b border-emerald-200">
                                      {decompiledData[chunk.id].headers?.map((h: string, i: number) => (
                                        <th key={i} className="p-1.5 text-emerald-950 font-bold">{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {decompiledData[chunk.id].rows?.map((row: string[], ri: number) => (
                                      <tr key={ri} className="border-b border-slate-100 hover:bg-emerald-50/50">
                                        {row.map((cell: string, ci: number) => (
                                          <td key={ci} className="p-1.5 text-slate-800">
                                            <input
                                              type="text"
                                              value={cell}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                const newRows = [...decompiledData[chunk.id].rows];
                                                newRows[ri][ci] = e.target.value;
                                                setDecompiledData({
                                                  ...decompiledData,
                                                  [chunk.id]: { ...decompiledData[chunk.id], rows: newRows }
                                                });
                                              }}
                                              className="w-full bg-transparent font-mono border-b border-transparent focus:border-[#0d5c4d] focus:bg-amber-50 outline-none px-0.5 rounded"
                                            />
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  const res = await fetch('/api/charts/decompile', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ chart_title: chunk.documentName, page_number: chunk.pageNumber })
                                  });
                                  if (res.ok) {
                                    const d = await res.json();
                                    setDecompiledData((prev) => ({ ...prev, [chunk.id]: d.decompiled }));
                                  }
                                } catch (err) {
                                  console.log('Decompile error:', err);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0d5c4d] border border-emerald-300 text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                            >
                              <Table className="w-3.5 h-3.5 text-[#0d5c4d]" />
                              <span>Decompile Visual Chart into CSV / Spreadsheet</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Grounding Bound Badge */}
                {chunk.boundingBox && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span>Region: {chunk.boundingBox.label}</span>
                    <span className="text-[#0d5c4d] font-semibold">Pixel Grounded</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
