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
