import React from 'react';
import { 
  X, 
  FileText, 
  Scale
} from 'lucide-react';
import type { ConflictRecord, LanguageCode } from '../../types';
import { translations } from '../../translations/i18n';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictRecord[];
  onInspectCitation?: (citationId: string) => void;
  language: LanguageCode;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  language,
}) => {
  const t = translations[language];

  if (!isOpen || conflicts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto light:bg-white light:border-slate-300 light:text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 light:border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 light:text-slate-900">
                {t.crossDocConflict}
              </h3>
              <p className="text-xs text-slate-400 light:text-slate-500">
                {t.conflictWarning}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors light:hover:bg-slate-100 light:text-slate-600 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conflicts List */}
        <div className="mt-4 space-y-4">
          {conflicts.map((conf) => (
            <div
              key={conf.id}
              className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-3 light:bg-slate-50 light:border-slate-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Topic: {conf.topic}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
                  {conf.severity} Severity
                </span>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Doc A */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 light:bg-white light:border-slate-200">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-indigo-400 mb-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">{conf.claimA.documentName}</span>
                    <span className="text-slate-500 font-normal">(Page {conf.claimA.pageNumber})</span>
                  </div>
                  <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-mono bg-slate-950/40 p-2 rounded border border-slate-800/40">
                    "{conf.claimA.statement}"
                  </p>
                </div>

                {/* Doc B */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/80 light:bg-white light:border-slate-200">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-400 mb-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">{conf.claimB.documentName}</span>
                    <span className="text-slate-500 font-normal">(Page {conf.claimB.pageNumber})</span>
                  </div>
                  <p className="text-xs text-slate-300 light:text-slate-700 leading-relaxed font-mono bg-slate-950/40 p-2 rounded border border-slate-800/40">
                    "{conf.claimB.statement}"
                  </p>
                </div>
              </div>

              {/* Variance explanation */}
              <div className="text-xs text-slate-400 light:text-slate-600 bg-amber-500/5 p-2 rounded-lg border border-amber-500/15">
                <span className="font-semibold text-amber-400">Analysis: </span>
                {conf.variance}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer transition-all"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
