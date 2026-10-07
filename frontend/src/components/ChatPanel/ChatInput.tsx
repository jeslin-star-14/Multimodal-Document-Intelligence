import React, { useState, useRef, useEffect } from 'react';
import { Send, Filter } from 'lucide-react';
import type { LanguageCode } from '../../types';
import { VoiceRecorder } from './VoiceRecorder';
import { translations } from '../../translations/i18n';

interface ChatInputProps {
  onSendMessage: (query: string) => void;
  isLoading?: boolean;
  language: LanguageCode;
  selectedDocName?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  language,
  selectedDocName,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = translations[language];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleVoiceTranscript = (text: string) => {
    setInputQuery((prev) => (prev ? `${prev} ${text}` : text));
  };

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputQuery]);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md light:bg-white light:border-slate-200"
    >
      {/* Target scope pill */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 px-1">
        <div className="flex items-center space-x-1.5">
          <Filter className="w-3 h-3 text-indigo-400" />
          <span>Active Scope:</span>
          <span className="font-semibold text-slate-200 light:text-slate-700">
            {selectedDocName ? selectedDocName : t.filterAll}
          </span>
        </div>
        <span className="hidden sm:inline text-slate-500 text-[10px]">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[9px]">Enter ↵</kbd> to ask
        </span>
      </div>

      <div className="relative flex items-end gap-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all light:bg-slate-50 light:border-slate-300">
        {/* Voice Input Button */}
        <VoiceRecorder
          language={language}
          onTranscript={handleVoiceTranscript}
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.inputPlaceholder}
          disabled={isLoading}
          className="flex-1 bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 resize-none py-2 px-1 outline-none max-h-28 overflow-y-auto light:text-slate-800"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className={`p-2.5 rounded-xl font-semibold transition-all flex items-center justify-center ${
            inputQuery.trim() && !isLoading
              ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed light:bg-slate-200 light:text-slate-400'
          }`}
          title={t.send}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
