import React, { useState, useRef } from 'react';
import { Send, Mic } from 'lucide-react';
import type { LanguageCode } from '../../types';

interface ChatInputProps {
  onSendMessage: (query: string) => void;
  isLoading?: boolean;
  language: LanguageCode;
  selectedDocName?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handleToggleMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition is supported in Chrome, Edge, and Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInputQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="p-4 bg-transparent sticky bottom-0">
      <form
        onSubmit={handleSubmit}
        className="flex items-center bg-white border border-slate-200/90 rounded-2xl px-4 py-2 shadow-xs transition-all focus-within:border-slate-300"
      >
        <input
          ref={inputRef}
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Ask anything about your documents"
          disabled={isLoading}
          className="flex-1 bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none pr-2"
        />

        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Mic Button */}
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer ${
              isListening ? 'text-rose-500 animate-pulse' : ''
            }`}
            title="Voice input"
            aria-label="Voice input"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              inputQuery.trim() && !isLoading
                ? 'bg-[#0d5c4d] text-white hover:bg-[#0a473b] cursor-pointer'
                : 'bg-[#0d5c4d]/30 text-white/70 cursor-not-allowed'
            }`}
            title="Send"
            aria-label="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
