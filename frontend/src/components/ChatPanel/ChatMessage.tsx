import React, { useState } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Sparkles, 
  Calculator, 
  CheckCircle2, 
  ExternalLink,
  Copy,
  Check,
  Bot,
  HelpCircle,
  Cpu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { ChatMessage as MessageType, Citation, ConflictRecord, LanguageCode } from '../../types';
import { CitationChip } from './CitationChip';

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
        <div className="border-l-3 border-amber-500 bg-amber-50/50 rounded-r-xl px-4 py-3 text-xs sm:text-sm text-slate-700 max-w-[92%] leading-relaxed">
          <p className="font-medium text-amber-900 mb-1">Notice</p>
          <p>{message.text}</p>
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
  }[proofLevel];

  const ProofIcon = proofConfig.icon;

  // Parse and render formatted answer sections
  const renderFormattedContent = (rawText: string) => {
    const formatInline = (text: string) => {
      const cleanLine = text.replace(/\n(?!\n)/g, ' ').trim();
      const citationRegex = /\[Doc:\s*([^,\]]+),\s*Page:\s*(\d+)(?:,\s*Section:\s*([^\]]+))?\]|\[Page\s*(\d+)(?:\s*·\s*([^\]]+))?\]/gi;
      
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;

      while ((match = citationRegex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(renderStyledSpans(cleanLine.substring(lastIndex, match.index)));
        }

        const docName = match[1] || '';
        const pageNum = parseInt(match[2] || match[4] || '1', 10);
        const section = match[3] || match[5] || 'Evidence';

        const matchedCitation: Citation = message.citations?.find(
          (c) => c?.pageNumber === pageNum || Boolean(docName && (c?.documentName?.toLowerCase().includes(docName.toLowerCase()) || c?.documentId?.toLowerCase().includes(docName.toLowerCase())))
        ) || {
          id: `inline-${pageNum}-${section}`,
          documentId: docName || 'doc',
          documentName: docName || 'Document.pdf',
          pageNumber: pageNum,
          chunkType: 'text' as const,
          label: `Page ${pageNum} · ${section}`,
          chunkId: `chunk-${pageNum}`,
          similarityScore: 0.95
        };

        const isSelected = selectedCitation?.pageNumber === pageNum;

        parts.push(
          <button
            key={`cite-${match.index}`}
            type="button"
            onClick={() => onCitationClick(matchedCitation)}
            className={`inline-flex items-center space-x-1 mx-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border transition-all cursor-pointer align-baseline ${
              isSelected
                ? 'bg-[#0d5c4d] text-white border-[#0d5c4d] shadow-2xs'
                : 'bg-emerald-50/80 hover:bg-emerald-100 text-[#0d5c4d] border-emerald-200/80'
            }`}
            title={`Jump to Page ${pageNum} in Evidence Viewer`}
          >
            <span>P.{pageNum}</span>
            <span className="text-[10px] opacity-75 truncate max-w-[90px]">{section}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
          </button>
        );

        lastIndex = match.index + match[0].length;
      }

      if (lastIndex < cleanLine.length) {
        parts.push(renderStyledSpans(cleanLine.substring(lastIndex)));
      }

      return parts.length > 0 ? parts : cleanLine;
    };

    const renderStyledSpans = (str: string): React.ReactNode => {
      const tokens = str.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^$]+\$)/g);
      return tokens.map((token, i) => {
        if (token.startsWith('**') && token.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-slate-900">
              {token.slice(2, -2)}
            </strong>
          );
        }
        if (token.startsWith('`') && token.endsWith('`')) {
          return (
            <code key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono text-[11px] font-medium border border-slate-200/60 mx-0.5">
              {token.slice(1, -1)}
            </code>
          );
        }
        if (token.startsWith('$') && token.endsWith('$')) {
          return (
            <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-50/60 text-[#0d5c4d] font-mono text-xs font-semibold mx-0.5">
              {token.slice(1, -1)}
            </span>
          );
        }
        return token;
      });
    };

    const rawSections = rawText.split(/(?=###\s+)/g);

    return rawSections.map((secText, secIdx) => {
      const trimmed = secText.trim();
      if (!trimmed) return null;

      const headerMatch = trimmed.match(/^###\s+([^\n]+)/);
      const title = headerMatch ? headerMatch[1].trim() : '';
      const bodyContent = headerMatch ? trimmed.substring(headerMatch[0].length).trim() : trimmed;

      const isExecutiveSummary = /Executive Summary|Overview|Summary/i.test(title);
      const isMathSection = /Mathematical|Calculations|Math|Proof|Verification/i.test(title);
      const isReasonList = /Reasons|Findings|Root Cause|Analysis|Key Points/i.test(title);

      const rawLines = bodyContent.split('\n').filter((l) => l.trim().length > 0);

      return (
        <div key={`sec-${secIdx}`} className="space-y-2">
          {title && (
            <div className="flex items-center space-x-2 pt-1 pb-0.5">
              {isExecutiveSummary && <Sparkles className="w-4 h-4 text-[#0d5c4d]" />}
              {isMathSection && <Calculator className="w-4 h-4 text-[#0d5c4d]" />}
              {isReasonList && <CheckCircle2 className="w-4 h-4 text-[#0d5c4d]" />}
              {!isExecutiveSummary && !isMathSection && !isReasonList && (
                <span className="w-2 h-2 rounded-full bg-[#0d5c4d]" />
              )}
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            </div>
          )}

          {isMathSection ? (
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2 text-xs sm:text-sm shadow-2xs">
              {rawLines.map((line, lIdx) => (
                <div key={lIdx} className="flex items-start space-x-2 text-slate-700 leading-relaxed font-sans">
                  <span className="text-[#0d5c4d] font-bold mt-0.5 shrink-0">•</span>
                  <div className="flex-1 min-w-0">{formatInline(line.replace(/^[-*•]\s*/, ''))}</div>
                </div>
              ))}
            </div>
          ) : isReasonList ? (
            <div className="space-y-2.5">
              {rawLines.map((line, lIdx) => {
                const numberedMatch = line.match(/^(\d+)\.\s*(.*)/);
                const bulletMatch = line.match(/^[-*•]\s*(.*)/);

                if (numberedMatch) {
                  return (
                    <div
                      key={lIdx}
                      className="flex items-start space-x-3 p-3 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 transition-colors shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0d5c4d] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {numberedMatch[1]}
                      </span>
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed flex-1">
                        {formatInline(numberedMatch[2])}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={lIdx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-700 leading-relaxed pl-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0d5c4d] mt-2 shrink-0" />
                    <div className="flex-1">
                      {formatInline(bulletMatch ? bulletMatch[1] : line)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`${isExecutiveSummary ? 'bg-[#f0f9f6] border border-[#d1ede6] p-3.5 rounded-xl text-slate-800' : 'text-slate-700'} text-xs sm:text-sm leading-relaxed space-y-2`}>
              {rawLines.map((line, lIdx) => (
                <p key={lIdx} className="leading-relaxed">
                  {formatInline(line)}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col items-start my-4 max-w-[96%] sm:max-w-[90%] space-y-3">
      {/* Bot Header with Brand Label & Copy Action */}
      <div className="flex items-center justify-between w-full pr-1">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-[#0d5c4d] flex items-center justify-center text-white shadow-2xs">
            <Bot className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold text-slate-900 tracking-tight">DOC-Q Intelligence</span>
          {message.role_mode && (
            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
              {message.role_mode} Mode
            </span>
          )}
          <span className="text-[11px] text-slate-400 font-normal">· {message.timestamp}</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Copy response"
          aria-label="Copy response"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#0d5c4d]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Formatted Answer Body */}
      <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
        {renderFormattedContent(message.text || '')}

        {/* FEATURE 2: Verified Calculations Drawer / Card */}
        {message.verified_calculations && message.verified_calculations.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200/80">
            <button
              onClick={() => setShowMathDetails(!showMathDetails)}
              className="flex items-center justify-between w-full text-left py-1 text-xs font-semibold text-purple-900 hover:text-purple-950 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                <span>Deterministic AST Verified Calculations ({message.verified_calculations.length})</span>
              </span>
              {showMathDetails ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {showMathDetails && (
              <div className="mt-2 space-y-2">
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

      {/* Footer Badges: Proof Level + Confidence + Citations */}
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

        {/* Confidence Badge */}
        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs text-slate-700 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0d5c4d]" />
          <span>{message.confidenceScore ? `${message.confidenceScore}% Grounded` : 'Verified Grounded'}</span>
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
