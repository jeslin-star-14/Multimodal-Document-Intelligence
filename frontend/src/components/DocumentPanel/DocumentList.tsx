import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
import type { DocumentItem } from '../../types';

interface DocumentListProps {
  documents: DocumentItem[];
  selectedDocId: string | null;
  onSelectDocument: (id: string) => void;
  onAttachToChat?: (doc: DocumentItem) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocId,
  onSelectDocument,
  onAttachToChat,
}) => {
  const getBadgeLabel = (type: DocumentItem['type']) => {
    switch (type) {
      case 'pdf':
        return 'PDF';
      case 'image':
        return 'IMG';
      case 'docx':
        return 'DOC';
      case 'pptx':
        return 'PPT';
      default:
        return 'DOC';
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-500">
        Documents
      </div>

      <div className="space-y-2">
        {documents.map((doc) => {
          const isSelected = selectedDocId === doc.id;
          const isReady = doc.status === 'Ready';

          return (
            <div
              key={doc.id}
              onClick={() => onSelectDocument(doc.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer group relative ${
                isSelected
                  ? 'bg-[#eaf5f2] border-[#cbe8e1]'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                {/* File Badge */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase border shrink-0 ${
                    isSelected
                      ? 'bg-white text-[#0d5c4d] border-[#bce2d8]'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {getBadgeLabel(doc.type)}
                </div>

                {/* Text Metadata */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-semibold text-slate-900 truncate">
                    {doc.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {isReady
                      ? `${doc.pageCount} pages · Ready`
                      : doc.currentStepDescription || 'Processing...'}
                  </p>
                </div>

                {/* "Upload in Chat / Ask in Chat" Button */}
                {onAttachToChat && isReady && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAttachToChat(doc);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#0d5c4d] text-slate-500 hover:text-[#0d5c4d] shadow-xs cursor-pointer"
                    title="Upload to Chat (Ask in chat)"
                    aria-label="Upload to chat"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Progress bar for reading/parsing docs */}
              {!isReady && (
                <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-[#0d5c4d] h-1 rounded-full transition-all duration-300"
                    style={{ width: `${doc.progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
