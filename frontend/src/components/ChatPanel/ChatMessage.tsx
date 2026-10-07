import React from 'react';
import { 
  Bot, 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  AlertCircle, 
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import type { ChatMessage as MessageType, Citation, ConflictRecord, LanguageCode } from '../../types';
import { CitationChip } from './CitationChip';
import { translations } from '../../translations/i18n';

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
  onOpenConflicts,
  language,
}) => {
  const isUser = message.sender === 'user';
  const t = translations[language];

  // Helper for confidence badge styling
  const getConfidenceBadge = (score?: number) => {
    if (score === undefined) return null;

    let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    let icon = <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />;
    let label = 'High Grounding';

    if (score < 70) {
      badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      icon = <ShieldAlert className="w-3 h-3 mr-1 text-rose-400" />;
      label = 'Low Evidence';
    } else if (score < 90) {
      badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      icon = <ShieldCheck className="w-3 h-3 mr-1 text-amber-400" />;
      label = 'Moderate';
    }

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}
      >
        {icon}
        <span>{t.confidence}: {score}% ({label})</span>
      </span>
    );
  };

  return (
    <div className={`flex flex-col space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
      {/* Message Header */}
      <div className="flex items-center space-x-2 text-[11px] text-slate-400 px-1">
        {isUser ? (
          <>
            <span>You</span>
            <span>•</span>
            <span>{message.timestamp}</span>
            <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px]">
              <User className="w-3 h-3" />
            </div>
          </>
        ) : (
          <>
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center text-white text-[10px]">
              <Bot className="w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-300 light:text-slate-700">Intelligence Engine</span>
            <span>•</span>
            <span>{message.timestamp}</span>
          </>
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm transition-all ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-none'
            : 'bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-none light:bg-white light:border-slate-200 light:text-slate-800'
        }`}
      >
        {/* If Not Found State */}
        {message.notFound ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>{t.notFoundTitle}</span>
            </div>
            <p className="text-xs text-slate-300 light:text-slate-600">
              {message.text || t.notFoundDesc}
            </p>
          </div>
        ) : (
          <div className="whitespace-pre-wrap font-sans">
            {message.text}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />
            )}
          </div>
        )}

        {/* Cross Document Conflict Callout if present */}
        {message.conflicts && message.conflicts.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t.crossDocConflict}</span>
              </div>
              {onOpenConflicts && (
                <button
                  onClick={() => onOpenConflicts(message.conflicts!)}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-[11px] flex items-center space-x-1 cursor-pointer"
                >
                  <span>{t.viewConflict}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-300 mt-1 light:text-slate-700">
              {message.conflicts[0].variance}
            </p>
          </div>
        )}

        {/* Assistant Footer: Confidence & Clickable Citation Chips */}
        {!isUser && !message.notFound && !message.isStreaming && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 light:border-slate-100 flex flex-col space-y-2.5">
            {/* Confidence Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              {getConfidenceBadge(message.confidenceScore)}
              <span className="text-[10px] text-slate-500">
                Click citations to inspect bounding box
              </span>
            </div>

            {/* Citation Chips */}
            {message.citations && message.citations.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 light:text-slate-500 mr-1">
                  {t.sources}:
                </span>
                {message.citations.map((cite) => (
                  <CitationChip
                    key={cite.id}
                    citation={cite}
                    isSelected={selectedCitation?.id === cite.id}
                    onClick={onCitationClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
