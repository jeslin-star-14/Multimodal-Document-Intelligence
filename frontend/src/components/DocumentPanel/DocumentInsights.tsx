import React from 'react';
import { 
  Sparkles, 
  Tag, 
  HelpCircle, 
  ChevronRight, 
  FileCheck2,
  Building2,
  Calendar,
  DollarSign,
  Activity,
  MapPin
} from 'lucide-react';
import type { DocumentInsights as InsightsType, LanguageCode } from '../../types';
import { translations } from '../../translations/i18n';

interface DocumentInsightsProps {
  insights?: InsightsType;
  language: LanguageCode;
  onSelectQuestion: (question: string) => void;
}

export const DocumentInsights: React.FC<DocumentInsightsProps> = ({
  insights,
  language,
  onSelectQuestion,
}) => {
  const t = translations[language];

  if (!insights) {
    return (
      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 text-center text-slate-500 text-xs">
        Select a ready document to view extracted multimodal insights.
      </div>
    );
  }

  const getEntityIcon = (category: string) => {
    switch (category) {
      case 'Financial':
        return <DollarSign className="w-3 h-3 text-emerald-400" />;
      case 'Org':
        return <Building2 className="w-3 h-3 text-blue-400" />;
      case 'Date':
        return <Calendar className="w-3 h-3 text-amber-400" />;
      case 'Metric':
        return <Activity className="w-3 h-3 text-purple-400" />;
      case 'Location':
        return <MapPin className="w-3 h-3 text-rose-400" />;
      default:
        return <Tag className="w-3 h-3 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 light:bg-slate-50 light:border-slate-200">
      <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 light:text-slate-800 pb-2 border-b border-slate-800 light:border-slate-200">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>{t.insightsTitle}</span>
      </div>

      {/* Summary */}
      <div className="space-y-1.5">
        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 light:text-slate-600 flex items-center">
          <FileCheck2 className="w-3 h-3 mr-1 text-cyan-400" />
          {t.summary}
        </h5>
        <p className="text-xs text-slate-300 leading-relaxed light:text-slate-700 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 light:bg-white light:border-slate-200">
          {insights.summary}
        </p>
      </div>

      {/* Key Entities */}
      <div className="space-y-1.5">
        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 light:text-slate-600 flex items-center">
          <Tag className="w-3 h-3 mr-1 text-purple-400" />
          {t.entities}
        </h5>
        <div className="flex flex-wrap gap-1.5">
          {insights.keyEntities.map((entity, idx) => (
            <span
              key={idx}
              className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-800/90 text-slate-200 border border-slate-700/60 light:bg-white light:border-slate-300 light:text-slate-700"
            >
              {getEntityIcon(entity.category)}
              <span>{entity.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-1.5">
        <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 light:text-slate-600 flex items-center">
          <HelpCircle className="w-3 h-3 mr-1 text-amber-400" />
          {t.suggestedQuestions}
        </h5>
        <div className="space-y-1.5">
          {insights.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onSelectQuestion(q)}
              className="w-full text-left p-2 rounded-lg text-xs bg-slate-800/50 hover:bg-indigo-600/15 border border-slate-700/40 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 transition-all flex items-center justify-between group light:bg-white light:border-slate-200 light:hover:bg-indigo-50 light:text-slate-700 light:hover:text-indigo-700 cursor-pointer"
            >
              <span className="truncate pr-2">"{q}"</span>
              <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
