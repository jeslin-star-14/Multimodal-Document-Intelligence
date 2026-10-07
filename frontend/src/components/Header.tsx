import React from 'react';
import type { LanguageCode } from '../types';

interface HeaderProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand */}
      <div className="flex items-center space-x-2.5">
        <div className="w-6 h-6 rounded bg-[#0d5c4d] flex items-center justify-center text-white shadow-xs">
          <div className="w-3.5 h-3.5 border-2 border-amber-300 rounded-[2px]" />
        </div>
        <span className="text-xl font-serif tracking-tight text-slate-900 font-semibold">
          Verity
        </span>
      </div>

      {/* Right Controls: Language Selector */}
      <div className="flex items-center space-x-3">
        {/* Language Tabs */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-xs text-slate-600">
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              language === 'en'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'hover:text-slate-900'
            }`}
          >
            English
          </button>
          <button
            onClick={() => onLanguageChange('ta')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              language === 'ta'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'hover:text-slate-900'
            }`}
          >
            தமிழ்
          </button>
          <button
            onClick={() => onLanguageChange('hi')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              language === 'hi'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'hover:text-slate-900'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>
    </header>
  );
};

