import React, { useState } from 'react';
import { 
  FileText, 
  Table as TableIcon, 
  Image as ImageIcon, 
  TrendingUp
} from 'lucide-react';
import type { DocumentChunk, ChunkType, LanguageCode } from '../../types';
import { translations } from '../../translations/i18n';

interface ChunkDetailsTabsProps {
  chunks: DocumentChunk[];
  activeChunkId?: string;
  onSelectChunk: (chunk: DocumentChunk) => void;
  language: LanguageCode;
}

export const ChunkDetailsTabs: React.FC<ChunkDetailsTabsProps> = ({
  chunks,
  activeChunkId,
  onSelectChunk,
  language,
}) => {
  const [selectedTab, setSelectedTab] = useState<ChunkType>('chart');
  const t = translations[language];

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

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Tab Switcher */}
      <div className="flex items-center space-x-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 light:bg-slate-100 light:border-slate-300">
        <button
          onClick={() => setSelectedTab('chart')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            selectedTab === 'chart' || selectedTab === 'image'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{t.imageChunks}</span>
          <span className="text-[10px] opacity-80">({imageChunks.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('table')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            selectedTab === 'table'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>{t.tableChunks}</span>
          <span className="text-[10px] opacity-80">({tableChunks.length})</span>
        </button>

        <button
          onClick={() => setSelectedTab('text')}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-all cursor-pointer ${
            selectedTab === 'text'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 light:text-slate-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{t.textChunks}</span>
          <span className="text-[10px] opacity-80">({textChunks.length})</span>
        </button>
      </div>

      {/* Chunk Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {currentTabChunks.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-slate-800/80 rounded-xl bg-slate-900/30">
            No {selectedTab} chunks extracted for this query.
          </div>
        ) : (
          currentTabChunks.map((chunk) => {
            const isActive = activeChunkId === chunk.id;

            return (
              <div
                key={chunk.id}
                onClick={() => onSelectChunk(chunk)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700 light:bg-white light:border-slate-200'
                }`}
              >
                {/* Chunk Meta Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 light:border-slate-100 text-[11px]">
                  <div className="flex items-center space-x-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] uppercase light:bg-slate-100 light:text-slate-700">
                      Page {chunk.pageNumber}
                    </span>
                    <span className="text-slate-400 truncate max-w-[140px] font-medium">
                      {chunk.documentName}
                    </span>
                  </div>

                  {/* Similarity Score Badge */}
                  <div className="flex items-center space-x-1 text-emerald-400 font-semibold">
                    <TrendingUp className="w-3 h-3" />
                    <span>{Math.round(chunk.similarityScore * 100)}% Match</span>
                  </div>
                </div>

                {/* Content Render: Table or Text or Chart */}
                <div className="mt-2.5 text-xs text-slate-300 light:text-slate-700 leading-relaxed">
                  {chunk.type === 'table' && chunk.rawTableData ? (
                    <div className="overflow-x-auto rounded-lg border border-slate-800 my-1 light:border-slate-200">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-800/70 light:bg-slate-100 border-b border-slate-700">
                            {chunk.rawTableData.headers.map((h, i) => (
                              <th key={i} className="p-1.5 text-slate-300 font-semibold light:text-slate-700">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {chunk.rawTableData.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-800/60 hover:bg-indigo-600/10">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-1.5 text-slate-300 light:text-slate-700 font-mono">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="line-clamp-4 font-mono text-[11px] bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 light:bg-slate-50 light:border-slate-200">
                      {chunk.content}
                    </p>
                  )}
                </div>

                {/* Grounding Bound Badge */}
                {chunk.boundingBox && (
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Region: {chunk.boundingBox.label}</span>
                    <span className="text-indigo-400 font-semibold">Grounded</span>
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
