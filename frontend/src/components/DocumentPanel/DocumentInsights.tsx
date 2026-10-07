import React from 'react';
import type { DocumentInsights as InsightsType, LanguageCode } from '../../types';

interface DocumentInsightsProps {
  insights?: InsightsType;
  language: LanguageCode;
  onSelectQuestion: (question: string) => void;
}

export const DocumentInsights: React.FC<DocumentInsightsProps> = ({
  insights,
  onSelectQuestion,
}) => {
  const defaultQuestions = [
    'What changed in operating costs?',
    'List every payment deadline',
    'Do these files disagree on revenue?'
  ];

  const questions = insights?.suggestedQuestions?.length
    ? insights.suggestedQuestions
    : defaultQuestions;

  return (
    <div className="space-y-2 mt-4">
      <div className="text-xs font-semibold text-slate-500">
        Try asking
      </div>

      <div className="space-y-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            className="w-full text-left p-3 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-xs transition-all text-xs text-slate-800 leading-snug cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
