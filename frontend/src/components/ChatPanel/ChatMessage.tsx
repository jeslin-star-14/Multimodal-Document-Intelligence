import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ChatMessage as MessageType, Citation, ConflictRecord, LanguageCode } from '../../types';
import { CitationChip } from './CitationChip';
import { FormattedAnswer } from './FormattedAnswer';

interface ChatMessageProps {
  message: MessageType;
  selectedCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
  onOpenConflicts?: (conflicts: ConflictRecord[]) => void;
  language: LanguageCode;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  selectedCitation,
  onCitationClick,
}) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const [showAllCitations, setShowAllCitations] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-3 space-y-1.5">
        {/* Attached files badge if user attached something */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-700 shadow-xs"
              >
                {att.isImage ? (
                  <ImageIcon className="w-3 h-3 text-[#0d5c4d]" />
                ) : (
                  <FileText className="w-3 h-3 text-[#0d5c4d]" />
                )}
                <span className="font-medium truncate max-w-[140px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* User text bubble */}
        {message.text && (
          <div className="bg-[#182230] text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-normal max-w-[85%] shadow-xs">
            {message.text}
          </div>
        )}
      </div>
    );
  }

  // Not Found or Warning State (Left Orange border)
  if (message.notFound) {
    return (
      <div className="flex justify-start my-3 w-full">
        <div className="border-l-3 border-amber-500 bg-amber-50/50 rounded-r-xl p-3 text-xs sm:text-sm text-amber-900 max-w-[90%] leading-relaxed shadow-xs">
          {message.text}
        </div>
      </div>
    );
  }

  // Deduplicate citations by label or page+section to avoid flooding
  const uniqueCitations = (message.citations || []).filter(
    (c, idx, arr) => arr.findIndex((x) => x.id === c.id || (x.pageNumber === c.pageNumber && x.label === c.label)) === idx
  );

  const visibleCitations = showAllCitations ? uniqueCitations : uniqueCitations.slice(0, 5);
  const remainingCount = uniqueCitations.length - 5;

  return (
    <div className="flex flex-col items-start my-4 max-w-[96%] space-y-3 group">
      {/* Formatted Answer Container */}
      <div className="w-full bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs relative">
        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          title="Copy response"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Beautiful Markdown Content */}
        <FormattedAnswer content={message.text || ''} />
      </div>

      {/* Footer Badges & Citations */}
      {uniqueCitations.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 pt-1 text-xs pl-1">
          {/* Confidence dot */}
          <span className="inline-flex items-center space-x-1.5 text-xs text-[#0d5c4d] font-semibold bg-[#eaf5f2] px-2.5 py-1 rounded-full border border-[#0d5c4d]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0d5c4d] animate-pulse" />
            <span>Grounded Proof</span>
          </span>

          {/* Citation Chips */}
          {visibleCitations.map((cite, idx) => (
            <CitationChip
              key={cite.id || `cite-${idx}`}
              citation={cite}
              isSelected={selectedCitation?.id === cite.id}
              onClick={onCitationClick}
            />
          ))}

          {/* Show more / less toggle */}
          {remainingCount > 0 && (
            <button
              onClick={() => setShowAllCitations(!showAllCitations)}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-[11px] transition-colors cursor-pointer"
            >
              <span>{showAllCitations ? 'Show fewer' : `+${remainingCount} more sources`}</span>
              {showAllCitations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
