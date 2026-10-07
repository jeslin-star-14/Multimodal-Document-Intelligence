import React from 'react';
import { PanelLeftClose } from 'lucide-react';
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
    <div className="h-full flex flex-col bg-[#f8fafc] p-4 select-none justify-between overflow-hidden">
      {/* Top Section: Workspace Documents & Drop Zone */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
        {/* Panel Close/Hide Button at top */}
        {onClosePanel && (
          <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
            <span className="text-xs font-semibold text-slate-700">Workspace</span>
            <button
              onClick={onClosePanel}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Hide panel"
              aria-label="Hide documents panel"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top File Upload Drop Zone */}
        <FileUploadZone language={language} onFileUpload={onFileUpload} />

        {/* Documents List */}
        <DocumentList
          documents={documents}
          selectedDocId={selectedDocId}
          onSelectDocument={onSelectDocument}
          onAttachToChat={onAttachToChat}
        />

        {/* Try Asking Questions */}
        <DocumentInsights
          insights={selectedDoc?.insights}
          language={language}
          onSelectQuestion={onSelectQuestion}
        />
      </div>

      {/* Bottom Section: Chat History & New Conversation Tab */}
      <div className="pt-3 mt-2 border-t border-slate-200/80 shrink-0">
        <ChatHistory
          sessions={chatSessions}
          activeSessionId={activeSessionId}
          onSelectSession={onSelectSession}
          onNewChat={onNewChat}
          onDeleteSession={onDeleteSession}
          language={language}
        />
      </div>
    </div>
  );
};

