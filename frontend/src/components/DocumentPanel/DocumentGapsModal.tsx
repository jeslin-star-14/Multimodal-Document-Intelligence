import React, { useEffect, useState } from 'react';
import { 
  X, 
  FileSearch, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import type { DocumentGap } from '../../types';

interface DocumentGapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string | null;
  documentName?: string;
}

export const DocumentGapsModal: React.FC<DocumentGapsModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentName = 'Document.pdf'
}) => {
  const [loading, setLoading] = useState(false);
  const [gapData, setGapData] = useState<{
    completeness_score: number;
    document_type: string;
    missing_clauses_count: number;
    gaps: DocumentGap[];
  } | null>(null);

  useEffect(() => {
    if (isOpen && documentId) {
      setLoading(true);
      fetch(`/api/documents/${documentId}/gaps`)
        .then((res) => res.json())
        .then((data) => {
          setGapData(data);
        })
        .catch((err) => console.error('Failed to load gaps:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-800 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Document Gaps & Compliance Analysis</span>
                {gapData && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                    {gapData.completeness_score}% Complete
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-md">
                Analyzing missing clauses, risk factors, and disclosures for: <strong>{documentName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0d5c4d]" />
            <p className="text-xs font-medium">Scanning document structure against industry compliance templates...</p>
          </div>
        ) : !gapData ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Unable to analyze gaps for this document.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {/* Score banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700">Identified Document Standard:</span>
                <p className="text-xs font-bold text-[#0d5c4d]">{gapData.document_type}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 font-medium">Missing Clauses:</span>
                <p className="text-xs font-bold text-amber-700">{gapData.missing_clauses_count} flagged</p>
              </div>
            </div>

            {/* Gaps List */}
            <div className="space-y-2.5">
              {gapData.gaps.map((gap) => {
                const isPresent = gap.status === 'Present';
                const isPartial = gap.status === 'Partial';

                return (
                  <div
                    key={gap.id}
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isPresent 
                        ? 'bg-emerald-50/40 border-emerald-200/80' 
                        : isPartial 
                        ? 'bg-amber-50/40 border-amber-200/80'
                        : 'bg-rose-50/40 border-rose-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        {isPresent ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isPartial ? (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span>{gap.clause_name}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isPresent 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : isPartial 
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {gap.status}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {gap.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600">{gap.description}</p>
                    <p className="text-[11px] text-slate-700 font-medium">
                      <strong>Recommendation:</strong> {gap.recommendation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0d5c4d] hover:bg-emerald-900 text-white shadow-xs cursor-pointer"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
