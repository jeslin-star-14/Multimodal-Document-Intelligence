import React from 'react';
import { FileText, Table as TableIcon, Image as ImageIcon, BarChart2 } from 'lucide-react';
import type { Citation, ChunkType } from '../../types';

interface CitationChipProps {
  citation: Citation;
  isSelected?: boolean;
  onClick: (citation: Citation) => void;
}

export const CitationChip: React.FC<CitationChipProps> = ({
  citation,
  isSelected = false,
  onClick,
}) => {
  const getChunkIcon = (type: ChunkType) => {
    switch (type) {
      case 'chart':
        return <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'table':
        return <TableIcon className="w-3.5 h-3.5 text-indigo-400" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-rose-400" />;
      case 'text':
      default:
        return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <button
      onClick={() => onClick(citation)}
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
        isSelected
          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30 scale-105'
          : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-indigo-500/50 light:bg-slate-100 light:text-slate-800 light:border-slate-300 light:hover:bg-slate-200'
      }`}
      title={`Click to inspect ${citation.label} in Evidence Panel`}
    >
      <span>{getChunkIcon(citation.chunkType)}</span>
      <span className="font-mono">{citation.label}</span>
      <span className="text-[10px] opacity-75 font-normal">({Math.round(citation.similarityScore * 100)}%)</span>
    </button>
  );
};
