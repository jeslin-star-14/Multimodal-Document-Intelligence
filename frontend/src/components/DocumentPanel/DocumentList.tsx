import React from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Image as ImageIcon, 
  FileCode, 
  CheckCircle2, 
  Loader2
} from 'lucide-react';
import type { DocumentItem, DocumentStatus } from '../../types';

interface DocumentListProps {
  documents: DocumentItem[];
  selectedDocId: string | null;
  onSelectDocument: (id: string) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocId,
  onSelectDocument,
}) => {
  const getFileIcon = (type: DocumentItem['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'pptx':
        return <FileSpreadsheet className="w-4 h-4 text-amber-400" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      default:
        return <FileCode className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getStatusBadge = (status: DocumentStatus, progress: number) => {
    switch (status) {
      case 'Ready':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Ready
          </span>
        );
      case 'Parsing':
      case 'OCR':
      case 'Embedding':
      case 'Uploading':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 animate-pulse">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            {status} ({progress}%)
          </span>
        );
      case 'Error':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Error
          </span>
        );
    }
  };

  return (
    <div className="space-y-2">
      {documents.map((doc) => {
        const isSelected = selectedDocId === doc.id;
        return (
          <div
            key={doc.id}
            onClick={() => onSelectDocument(doc.id)}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              isSelected
                ? 'bg-indigo-600/10 border-indigo-500 shadow-sm shadow-indigo-500/10'
                : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700 light:bg-slate-50 light:border-slate-200 light:hover:bg-slate-100'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-slate-800/80 light:bg-white border border-slate-700/50 light:border-slate-200 mt-0.5 shrink-0">
                  {getFileIcon(doc.type)}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-slate-200 truncate light:text-slate-800">
                    {doc.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 light:text-slate-500">
                    <span>{doc.size}</span>
                    <span>•</span>
                    <span>{doc.pageCount} pages</span>
                    <span>•</span>
                    <span>{doc.uploadedAt}</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 flex items-center space-x-1">
                {getStatusBadge(doc.status, doc.progress)}
              </div>
            </div>

            {/* Processing Steps Bar for in-progress docs */}
            {doc.status !== 'Ready' && (
              <div className="mt-2.5 space-y-1">
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden light:bg-slate-200">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${doc.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span className="capitalize">{doc.currentStepDescription || doc.status}</span>
                  <span>{doc.progress}%</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
