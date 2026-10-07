import React from 'react';
import { 
  X, 
  Scale,
  AlertTriangle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import type { LanguageCode } from '../../types';

export interface ConflictItem {
  id: string;
  metric_name: string;
  topic: string;
  document_a: {
    name: string;
    page: number;
    value: string;
    type: string;
  };
  document_b: {
    name: string;
    page: number;
    value: string;
    type: string;
  };
  discrepancy: string;
  severity: 'high' | 'medium' | 'low';
  resolution: string;
  status: string;
}

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts?: any[];
  language?: LanguageCode;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  conflicts = [],
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white border border-slate-200 shadow-2xl p-6 text-slate-800 max-h-[88vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Cross-Modal Discrepancy & Conflict Audit</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  {conflicts.length} Flagged
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Automated detection of conflicting claims and numerical variances between document versions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflicts List */}
        <div className="mt-4 space-y-4">
          {conflicts.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
              <CheckCircle2 className="w-8 h-8 text-[#0d5c4d] mx-auto mb-2" />
              <h4 className="font-bold text-sm">No Cross-Document Conflicts Detected</h4>
              <p className="text-xs text-emerald-700 mt-1">All verified text assertions and table cells match with 100% consistency.</p>
            </div>
          ) : (
            conflicts.map((conf: any) => {
              const docA = conf.document_a || conf.claimA || {};
              const docB = conf.document_b || conf.claimB || {};
              const metricName = conf.metric_name || conf.topic || 'Metric Variance';
              const discrepancy = conf.discrepancy || conf.variance || '';
              const resolution = conf.resolution || 'Audited certified tables take precedence.';

              return (
                <div
                  key={conf.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{metricName}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      conf.severity === 'high' 
                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {conf.severity || 'Medium'} Severity
                    </span>
                  </div>

                  {/* Side-by-side comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Doc A */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                        <span className="truncate max-w-[170px]">{docA.name || docA.documentName || 'Document A'}</span>
                        <span className="text-slate-400 font-normal">P.{docA.page || docA.pageNumber}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-[#0d5c4d] bg-emerald-50 p-2 rounded border border-emerald-200">
                        {docA.value || docA.statement}
                      </div>
                    </div>

                    {/* Doc B */}
                    <div className="p-3 rounded-lg bg-white border border-slate-200">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                        <span className="truncate max-w-[170px]">{docB.name || docB.documentName || 'Document B'}</span>
                        <span className="text-slate-400 font-normal">P.{docB.page || docB.pageNumber}</span>
                      </div>
                      <div className="text-xs font-mono font-bold text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                        {docB.value || docB.statement}
                      </div>
                    </div>
                  </div>

                  {/* Discrepancy & Resolution */}
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                    <p><strong>Discrepancy:</strong> {discrepancy}</p>
                    <p className="text-emerald-800 font-medium flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-[#0d5c4d]" />
                      <span><strong>Resolution:</strong> {resolution}</span>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0d5c4d] hover:bg-emerald-900 text-white shadow-xs cursor-pointer transition-all"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
