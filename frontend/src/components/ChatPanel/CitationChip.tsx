import React from 'react';
import type { Citation } from '../../types';

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
  return (
    <button
      onClick={() => onClick(citation)}
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
        isSelected
          ? 'bg-white text-[#0d5c4d] border-[#0d5c4d] shadow-xs'
          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
      }`}
      title={`Click to inspect ${citation.label} in Evidence Panel`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isSelected ? 'bg-[#0d5c4d]' : 'bg-slate-400'
        }`}
      />
      <span>{citation.label}</span>
    </button>
  );
};
