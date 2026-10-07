import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  Calculator, 
  CheckCircle2, 
  Copy, 
  Check, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import type { ChatMessage as MessageType, Citation, ConflictRecord, LanguageCode } from '../../types';
import { CitationChip } from './CitationChip';
import { FormattedAnswer } from './FormattedAnswer';

interface ChatMessageProps {
  message: MessageType;
  selectedCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
  onOpenConflicts?: (conflicts: ConflictRecord[]) => void;
  language?: LanguageCode;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  selectedCitation,
  onCitationClick,
}) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);
  const [showAllCitations, setShowAllCitations] = useState(false);
  const [showProofTooltip, setShowProofTooltip] = useState(false);
  const [showMathDetails, setShowMathDetails] = useState(true);

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-4 space-y-2">
        {/* Attached files badge if user attached something */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 shadow-2xs"
              >
                {att.isImage ? (
                  <ImageIcon className="w-3.5 h-3.5 text-[#0d5c4d]" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-[#0d5c4d]" />
                )}
                <span className="font-medium truncate max-w-[160px]">{att.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* User text bubble */}
        {message.text && (
          <div className="bg-[#0d5c4d] text-white px-4 py-2.5 rounded-2xl rounded-tr-xs text-xs sm:text-sm font-normal max-w-[85%] shadow-xs leading-relaxed">
            {message.text}
          </div>
        )}
      </div>
    );
  }

  // Not Found / Warning State
  if (message.notFound) {
    return (
      <div className="flex justify-start my-4">
        <div className="border-l-3 border-amber-500 bg-amber-50/60 rounded-r-xl px-4 py-3 text-xs sm:text-sm text-slate-700 max-w-[92%] leading-relaxed shadow-xs">
          <p className="font-semibold text-amber-900 mb-1">Notice</p>
          <p className="text-amber-950">{message.text}</p>
        </div>
      </div>
    );
  }

  // Determine proof level styling
  const proofLevel = message.proof_level || 'Stated';
  const proofConfig = {
    Stated: {
      label: 'Stated in Document',
      bg: 'bg-emerald-50 text-[#0d5c4d] border-emerald-200/80',
      icon: CheckCircle2,
      dotColor: 'bg-[#0d5c4d]'
    },
    Calculated: {
      label: 'Calculated Proof (AST)',
      bg: 'bg-purple-50 text-purple-800 border-purple-200/80',
      icon: Calculator,
      dotColor: 'bg-purple-600'
    },
    Inferred: {
      label: 'Inferred Synthesis',
      bg: 'bg-amber-50 text-amber-900 border-amber-200/80',
      icon: Sparkles,
      dotColor: 'bg-amber-600'
    }
  }[proofLevel] || {
    label: 'Stated in Document',
    bg: 'bg-emerald-50 text-[#0d5c4d] border-emerald-200/80',
    icon: CheckCircle2,
    dotColor: 'bg-[#0d5c4d]'
  };

  const ProofIcon = proofConfig.icon;

  // Deduplicate citations safely
  const uniqueCitations = (message.citations || []).filter(
    (c, idx, arr) => 
      c && arr.findIndex((x) => x && (x.id === c.id || (x.pageNumber === c.pageNumber && x.label === c.label))) === idx
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

        {/* Beautiful Markdown & KaTeX Content */}
        <FormattedAnswer content={message.text || ''} />

        {/* FEATURE 2: Verified Calculations Section */}
        {message.verified_calculations && message.verified_calculations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2">
            <button
              onClick={() => setShowMathDetails(!showMathDetails)}
              className="flex items-center space-x-2 text-xs font-semibold text-purple-900 hover:text-purple-950 transition-colors cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-purple-600" />
              <span>Verified Math Proofs ({message.verified_calculations.length})</span>
              {showMathDetails ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
            </button>

            {showMathDetails && (
              <div className="space-y-2 mt-2">
                {message.verified_calculations.map((calc, cIdx) => (
                  <div
                    key={calc.id || cIdx}
                    className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/70 text-xs text-slate-700 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-purple-900 bg-white px-2 py-0.5 rounded border border-purple-200">
                        {calc.formula}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {calc.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-normal">
                      {calc.explanation}
                    </p>

                    {calc.inputs && Object.keys(calc.inputs).length > 0 && (
                      <div className="flex items-center flex-wrap gap-1.5 pt-1 text-[11px]">
                        <span className="text-slate-400 font-medium">Inputs:</span>
                        {Object.entries(calc.inputs).map(([k, v]) => (
                          <span key={k} className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px] text-slate-700">
                            {k}: <strong>{String(v)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Badges & Citations */}
      <div className="flex items-center flex-wrap gap-2 pt-0.5 text-xs">
        {/* FEATURE 1: Proof Level Badge with Tooltip */}
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => setShowProofTooltip(!showProofTooltip)}
            onMouseEnter={() => setShowProofTooltip(true)}
            onMouseLeave={() => setShowProofTooltip(false)}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all cursor-pointer ${proofConfig.bg}`}
          >
            <ProofIcon className="w-3.5 h-3.5" />
            <span>{proofConfig.label}</span>
            <HelpCircle className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {showProofTooltip && (
            <div className="absolute left-0 bottom-full mb-2 z-40 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-[11px] leading-relaxed animate-in fade-in-50">
              <div className="flex items-center space-x-1.5 font-bold mb-1 text-amber-300">
                <ProofIcon className="w-3.5 h-3.5" />
                <span>Proof Level: {proofLevel}</span>
              </div>
              <p className="text-slate-200">
                {message.proof_explanation || (
                  proofLevel === 'Calculated'
                    ? 'Derived deterministically via Python AST arithmetic across multiple document tables and charts.'
                    : proofLevel === 'Stated'
                    ? 'Directly extracted from verbatim text or explicit table cells in the uploaded file.'
                    : 'Logically synthesized by multimodal reasoning across visual charts and operational context.'
                )}
              </p>
            </div>
          )}
        </div>

        {/* Grounded Badge */}
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs text-slate-700 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0d5c4d]" />
          <span>{message.confidenceScore ? `${message.confidenceScore}% Grounded` : 'Verified Grounded'}</span>
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
    </div>
  );
};
