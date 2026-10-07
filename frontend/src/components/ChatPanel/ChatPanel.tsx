import React, { useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, Bot } from 'lucide-react';
import type { ChatMessage as MessageType, Citation, ConflictRecord, LanguageCode } from '../../types';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { translations } from '../../translations/i18n';

interface ChatPanelProps {
  messages: MessageType[];
  isLoading: boolean;
  selectedCitation: Citation | null;
  onCitationClick: (citation: Citation) => void;
  onSendMessage: (text: string) => void;
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
  onOpenConflicts,
  language,
  selectedDocName,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="h-full flex flex-col bg-slate-950/40 light:bg-slate-50/50">
      {/* Chat Panel Header */}
      <div className="p-4 border-b border-slate-800/80 light:border-slate-200 flex items-center justify-between bg-slate-950/60 light:bg-white">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 light:text-slate-800">
            {t.chatTab}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-medium text-slate-400 light:text-slate-500">
            Active Reasoning
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300 light:text-slate-700">
              Multimodal Visual Grounding
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 light:text-slate-500">
              Ask questions about tables, charts, scanned invoices, or text paragraphs across your documents.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                selectedCitation={selectedCitation}
                onCitationClick={onCitationClick}
                onOpenConflicts={onOpenConflicts}
                language={language}
              />
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl w-fit animate-pulse">
                <Bot className="w-4 h-4 animate-bounce" />
                <span>Retrieving multimodal chunks & computing grounding bounds...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input Bar */}
      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        language={language}
        selectedDocName={selectedDocName}
      />
    </div>
  );
};
