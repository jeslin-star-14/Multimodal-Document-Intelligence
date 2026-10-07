import React from 'react';
import { FileText, Image as ImageIcon } from 'lucide-react';
import type { ChatMessage as MessageType, Citation, ConflictRecord, LanguageCode } from '../../types';
import { CitationChip } from './CitationChip';

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

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-3 space-y-1.5">
        {/* Attached files badge if user attached something */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[11px] text-slate-700 shadow-xs"
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
      <div className="flex justify-start my-3">
        <div className="border-l-2 border-amber-600 pl-3.5 py-1 text-xs sm:text-sm text-slate-600 max-w-[90%] leading-relaxed">
          {message.text}
        </div>
      </div>
    );
  }

  // Normal Grounded AI Answer
  return (
    <div className="flex flex-col items-start my-3 max-w-[95%] space-y-2.5">
      {/* Answer Text */}
      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed">
        <p className="whitespace-pre-wrap">
          {message.text}
        </p>
      </div>

      {/* Footer Badges & Citations */}
      <div className="flex items-center flex-wrap gap-2.5 pt-0.5 text-xs">
        {/* Confidence dot */}
        <span className="inline-flex items-center space-x-1.5 text-xs text-[#0d5c4d] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0d5c4d]" />
          <span>High confidence</span>
        </span>

        {/* Citation Chips */}
        {message.citations && message.citations.map((cite) => (
          <CitationChip
            key={cite.id}
            citation={cite}
            isSelected={selectedCitation?.id === cite.id}
            onClick={onCitationClick}
          />
        ))}
      </div>
    </div>
  );
};
