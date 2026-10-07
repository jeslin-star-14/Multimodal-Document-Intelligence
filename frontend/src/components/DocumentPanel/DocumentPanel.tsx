import React from 'react';
import { Files } from 'lucide-react';
import type { DocumentItem, LanguageCode } from '../../types';
import { FileUploadZone } from './FileUploadZone';
import { DocumentList } from './DocumentList';
import { DocumentInsights } from './DocumentInsights';
import { translations } from '../../translations/i18n';

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
  const t = translations[language];
  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  return (
    <div className="h-full flex flex-col bg-slate-950/60 border-r border-slate-800/80 light:bg-white light:border-slate-200 overflow-y-auto">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800/80 light:border-slate-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Files className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 light:text-slate-800">
            {t.documentsTab}
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 light:bg-slate-100 light:text-slate-600">
          {documents.length} Files
        </span>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Upload Zone */}
        <FileUploadZone language={language} onFileUpload={onFileUpload} />

        {/* Document List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 light:text-slate-600">
            <span>Uploaded Corpus</span>
          </div>
          <DocumentList
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDocument={onSelectDocument}
          />
        </div>

        {/* Auto Generated Insights */}
        {selectedDoc && (
          <DocumentInsights
            insights={selectedDoc.insights}
            language={language}
            onSelectQuestion={onSelectQuestion}
          />
        )}
      </div>
    </div>
  );
};
