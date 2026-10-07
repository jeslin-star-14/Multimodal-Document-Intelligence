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
  if (!insights || !insights.suggestedQuestions || insights.suggestedQuestions.length === 0) {
    return null;
  }

  const questions = insights.suggestedQuestions;

  return (
    <div className="space-y-2 mt-4">
      <div className="text-xs font-semibold text-slate-500">
        Suggested questions
      </div>

      <div className="space-y-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            className="w-full text-left p-3 rounded-xl bg-white border border-slate-200/80 hover:border-[#0d5c4d]/50 hover:shadow-xs transition-all text-xs text-slate-800 leading-snug cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
