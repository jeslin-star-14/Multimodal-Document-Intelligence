import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import type { LanguageCode, ChatAttachment } from '../../types';

interface ChatInputProps {
  onSendMessage: (query: string, attachments?: ChatAttachment[]) => void;
  onFileUpload?: (files: FileList | File[]) => void;
  stagedAttachments?: ChatAttachment[];
  onRemoveAttachment?: (id: string) => void;
  isLoading?: boolean;
  language: LanguageCode;
  selectedDocName?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onFileUpload,
  stagedAttachments = [],
  onRemoveAttachment,
  isLoading = false,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputQuery.trim() && stagedAttachments.length === 0) || isLoading) return;
    onSendMessage(inputQuery.trim(), stagedAttachments);
    setInputQuery('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onFileUpload) {
      onFileUpload(e.target.files);
      // clear input so same file can be re-selected if needed
      e.target.value = '';
    }
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

  // Focus input when an attachment is added
  useEffect(() => {
    if (stagedAttachments.length > 0) {
      inputRef.current?.focus();
    }
  }, [stagedAttachments.length]);

  return (
    <div className="px-6 pb-4 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent sticky bottom-0 z-20">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs transition-all focus-within:border-slate-300 focus-within:shadow-sm overflow-hidden"
      >
        {/* Staged Attachment Previews inside Chat Input */}
        {stagedAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-2.5 pb-1 border-b border-slate-100 bg-slate-50/60">
            {stagedAttachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-xs"
              >
                {att.isImage ? (
                  <ImageIcon className="w-3.5 h-3.5 text-[#0d5c4d]" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-[#0d5c4d]" />
                )}
                <span className="font-medium max-w-[150px] truncate">{att.name}</span>
                {onRemoveAttachment && (
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(att.id)}
                    className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer ml-1"
                    title="Remove attachment"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Input Bar Row */}
        <div className="flex items-center px-3 py-2">
          {/* Hidden File Input for In-Chat Upload */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.tiff,.webp"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Attachment Upload Button inside Chat */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer mr-1"
            title="Attach documents or images"
            aria-label="Upload documents or images"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {/* Query Input */}
          <input
            ref={inputRef}
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder={
              stagedAttachments.length > 0
                ? "Ask a question about the attached document(s)..."
                : "Ask anything about your documents"
            }
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
              disabled={(!inputQuery.trim() && stagedAttachments.length === 0) || isLoading}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                (inputQuery.trim() || stagedAttachments.length > 0) && !isLoading
                  ? 'bg-[#0d5c4d] text-white hover:bg-[#0a473b] cursor-pointer'
                  : 'bg-[#0d5c4d]/30 text-white/70 cursor-not-allowed'
              }`}
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
