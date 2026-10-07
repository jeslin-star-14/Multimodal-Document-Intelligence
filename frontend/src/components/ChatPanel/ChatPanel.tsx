import React, { useRef, useEffect } from 'react';
import type { ChatMessage as MessageType, Citation, ConflictRecord, LanguageCode, ChatAttachment } from '../../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  messages: MessageType[];
  isLoading: boolean;
  selectedCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
  onSendMessage: (text: string, attachments?: ChatAttachment[]) => void;
  onFileUpload?: (files: FileList | File[]) => void;
  stagedAttachments?: ChatAttachment[];
  onRemoveAttachment?: (id: string) => void;
  onOpenConflicts: (conflicts: ConflictRecord[]) => void;
  language: LanguageCode;
  selectedDocName?: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  isLoading,
  selectedCitation,
  onCitationClick,
  onSendMessage,
  onFileUpload,
  stagedAttachments = [],
  onRemoveAttachment,
  onOpenConflicts,
  language,
  selectedDocName,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, stagedAttachments.length]);

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden relative">
      {/* Scrollable Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full min-h-[360px] flex flex-col items-center justify-center text-center px-4 max-w-lg mx-auto select-none">
            <div className="w-12 h-12 rounded-2xl bg-[#eaf5f2] text-[#0d5c4d] flex items-center justify-center mb-4 shadow-xs">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Multimodal Document Intelligence
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Upload documents or ask questions to query across PDFs, scans, charts, and tables with pixel-level grounded citations and visual evidence.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-6 w-full text-left">
              <button
                onClick={() => onSendMessage("Summarize the key metrics and figures across the uploaded documents.")}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#0d5c4d]/50 hover:bg-[#eaf5f2]/20 transition-all text-xs text-slate-700 cursor-pointer"
              >
                <span className="font-medium text-slate-900 block">📊 Summarize metrics</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Extract key KPIs, figures, and dates</span>
              </button>
              <button
                onClick={() => onSendMessage("Are there any conflicting numbers or statements between the files?")}
                className="p-3 rounded-xl border border-slate-200 hover:border-[#0d5c4d]/50 hover:bg-[#eaf5f2]/20 transition-all text-xs text-slate-700 cursor-pointer"
              >
                <span className="font-medium text-slate-900 block">🔍 Detect conflicts</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Cross-document discrepancy analysis</span>
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              selectedCitation={selectedCitation}
              onCitationClick={onCitationClick}
              onOpenConflicts={onOpenConflicts}
              language={language}
            />
          ))
        )}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-[#0d5c4d] font-medium py-2">
            <span className="w-2 h-2 rounded-full bg-[#0d5c4d] animate-ping" />
            <span>Reading and analyzing document evidence...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Bottom Input Bar */}
      <ChatInput
        onSendMessage={onSendMessage}
        onFileUpload={onFileUpload}
        stagedAttachments={stagedAttachments}
        onRemoveAttachment={onRemoveAttachment}
        isLoading={isLoading}
        language={language}
        selectedDocName={selectedDocName}
      />
    </div>
  );
};
