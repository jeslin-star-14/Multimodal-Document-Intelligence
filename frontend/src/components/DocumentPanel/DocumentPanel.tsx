import React from 'react';
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
  language: LanguageCode;
}

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  selectedDocId,
  onSelectDocument,
  onFileUpload,
  onSelectQuestion,
  language,
}) => {
  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  return (
    <div className="h-full flex flex-col bg-[#f8fafc] border-r border-slate-200/80 p-4 space-y-4 overflow-y-auto">
      {/* Top File Upload Drop Zone */}
      <FileUploadZone language={language} onFileUpload={onFileUpload} />

      {/* Documents List */}
      <DocumentList
        documents={documents}
        selectedDocId={selectedDocId}
        onSelectDocument={onSelectDocument}
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
