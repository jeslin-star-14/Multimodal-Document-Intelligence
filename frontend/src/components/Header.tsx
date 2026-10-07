import React from 'react';
import type { LanguageCode } from '../types';

interface HeaderProps {
  language?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
}

export const Header: React.FC<HeaderProps> = () => {
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
    </header>
  );
};

