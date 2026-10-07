import React from 'react';
import { PanelLeft, PanelRight } from 'lucide-react';
import type { LanguageCode } from '../types';

interface HeaderProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isLeftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  isRightPanelOpen: boolean;
  onToggleRightPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isLeftPanelOpen,
  onToggleLeftPanel,
  isRightPanelOpen,
  onToggleRightPanel,
}) => {
  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Left Panel Toggle */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleLeftPanel}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isLeftPanelOpen
              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              : 'bg-white text-slate-400 border-slate-200 hover:text-slate-800'
          }`}
          title={isLeftPanelOpen ? 'Hide Documents Panel' : 'Show Documents Panel'}
          aria-label="Toggle Documents Panel"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2.5">
          <div className="w-6 h-6 rounded bg-[#0d5c4d] flex items-center justify-center text-white shadow-xs">
            <div className="w-3.5 h-3.5 border-2 border-amber-300 rounded-[2px]" />
          </div>
          <span className="text-xl font-serif tracking-tight text-slate-900 font-semibold">
            Verity
          </span>
        </div>
      </div>

      {/* Right Controls: Language Segmented Button & Right Panel Toggle */}
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

        {/* Right Panel Toggle Button */}
        <button
          onClick={onToggleRightPanel}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            isRightPanelOpen
              ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              : 'bg-white text-slate-400 border-slate-200 hover:text-slate-800'
          }`}
          title={isRightPanelOpen ? 'Hide Evidence Panel' : 'Show Evidence Panel'}
          aria-label="Toggle Evidence Panel"
        >
          <PanelRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
