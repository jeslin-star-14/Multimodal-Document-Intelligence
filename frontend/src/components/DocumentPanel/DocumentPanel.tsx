import React from 'react';
import { PanelLeftClose, Plus } from 'lucide-react';
import type { DocumentItem, LanguageCode, ChatSession } from '../../types';
import { FileUploadZone } from './FileUploadZone';
import { DocumentList } from './DocumentList';
import { DocumentInsights } from './DocumentInsights';
import { ChatHistory } from './ChatHistory';

interface DocumentPanelProps {
  documents: DocumentItem[];
  selectedDocId: string | null;
  onSelectDocument: (id: string) => void;
  onFileUpload: (files: FileList | File[]) => void;
  onSelectQuestion: (question: string) => void;
  onAttachToChat?: (doc: DocumentItem) => void;
  onDeleteDocument?: (id: string) => void;
  onClosePanel?: () => void;
  language: LanguageCode;
  chatSessions?: ChatSession[];
  activeSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
  onNewChat?: () => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  selectedDocId,
  onSelectDocument,
  onFileUpload,
  onSelectQuestion,
  onAttachToChat,
  onDeleteDocument,
  onClosePanel,
  language,
  chatSessions = [],
  activeSessionId = null,
  onSelectSession = () => {},
  onNewChat = () => {},
  onDeleteSession = () => {},
}) => {
  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] p-4 select-none overflow-hidden">
      {/* Top Header: Workspace Title + "+ New Chat" Button + Collapse Icon */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 shrink-0">
        <span className="text-xs font-semibold text-slate-700">Workspace</span>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={onNewChat}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#0d5c4d] hover:bg-[#0b4d40] text-white text-[11px] font-medium shadow-2xs transition-colors cursor-pointer"
            title="Start a new chat conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>

          {onClosePanel && (
            <button
              onClick={onClosePanel}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer ml-0.5"
              title="Hide panel"
              aria-label="Hide documents panel"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Split Area Container: 50% Top Workspace + 50% Bottom Chat History */}
      <div className="flex-1 flex flex-col min-h-0 pt-3">
        {/* Top Half: Document Upload Zone & Document List */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5">
          <FileUploadZone language={language} onFileUpload={onFileUpload} />

          <DocumentList
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDocument={onSelectDocument}
            onAttachToChat={onAttachToChat}
            onDeleteDocument={onDeleteDocument}
          />

          <DocumentInsights
            insights={selectedDoc?.insights}
            language={language}
            onSelectQuestion={onSelectQuestion}
          />
        </div>

        {/* Center Split Divider */}
        <div className="border-t border-slate-200/90 my-2.5 shrink-0" />

        {/* Bottom Half: Chat History starting right from center */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ChatHistory
            sessions={chatSessions}
            activeSessionId={activeSessionId}
            onSelectSession={onSelectSession}
            onDeleteSession={onDeleteSession}
            language={language}
          />
        </div>
      </div>
    </div>
  );
};


