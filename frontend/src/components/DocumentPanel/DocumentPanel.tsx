import React from 'react';
import { PanelLeftClose } from 'lucide-react';
import type { DocumentItem, LanguageCode } from '../../types';
import { FileUploadZone } from './FileUploadZone';
import { DocumentList } from './DocumentList';
import { DocumentInsights } from './DocumentInsights';

interface DocumentPanelProps {
  documents: DocumentItem[];
  selectedDocId: string | null;
  onSelectDocument: (id: string) => void;
  onFileUpload: (files: FileList | File[]) => void;
  onSelectQuestion: (question: string) => void;
  onAttachToChat?: (doc: DocumentItem) => void;
  onClosePanel?: () => void;
  language: LanguageCode;
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
}) => {
  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] p-4 space-y-4 overflow-y-auto relative select-none">
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
  );
};
