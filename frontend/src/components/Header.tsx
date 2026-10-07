import React from 'react';
import { 
  Globe, 
  Sun, 
  Moon, 
  UploadCloud, 
  AlertTriangle, 
  Sparkles,
  Layers
} from 'lucide-react';
import type { LanguageCode, ConflictRecord } from '../types';
import { translations } from '../translations/i18n';

interface HeaderProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenUpload: () => void;
  conflicts: ConflictRecord[];
  onOpenConflicts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  isDarkMode,
  onToggleTheme,
  onOpenUpload,
  conflicts,
  onOpenConflicts,
}) => {
  const t = translations[language];

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors dark:border-slate-800 light:bg-white light:border-slate-200">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center light:bg-white">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-slate-100 via-indigo-200 to-cyan-300 bg-clip-text text-transparent light:text-slate-900 light:bg-none">
              {t.appName}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-3 h-3 mr-1" />
              Multimodal RAG
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block light:text-slate-500">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Conflict Detection Notification Button */}
        {conflicts.length > 0 && (
          <button
            onClick={onOpenConflicts}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-sm animate-pulse cursor-pointer"
            title="Cross-Document Conflict Detected"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.crossDocConflict}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
              {conflicts.length}
            </span>
          </button>
        )}

        {/* Language Selector */}
        <div className="relative flex items-center bg-slate-900 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 light:bg-slate-100 light:border-slate-300 light:text-slate-700">
          <Globe className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          <select
            aria-label="Language selection"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
            className="bg-transparent border-none outline-none cursor-pointer pr-1 font-medium"
          >
            <option value="en" className="bg-slate-900 text-slate-200">English (EN)</option>
            <option value="ta" className="bg-slate-900 text-slate-200">தமிழ் (TA)</option>
            <option value="hi" className="bg-slate-900 text-slate-200">हिन्दी (HI)</option>
          </select>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition-colors light:border-slate-200 light:hover:bg-slate-200 light:text-slate-600 cursor-pointer"
          title={isDarkMode ? t.lightMode : t.darkMode}
          aria-label="Toggle dark/light theme"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Quick Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span className="hidden sm:inline">{t.uploadButton}</span>
        </button>
      </div>
    </header>
  );
};
