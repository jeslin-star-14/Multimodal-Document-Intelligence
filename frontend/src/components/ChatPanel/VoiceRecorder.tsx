import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import type { LanguageCode } from '../../types';

interface VoiceRecorderProps {
  language: LanguageCode;
  onTranscript: (text: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  language,
  onTranscript,
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check SpeechRecognition support in browser
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Language code mapping
      const langMap: Record<LanguageCode, string> = {
        en: 'en-US',
        ta: 'ta-IN',
        hi: 'hi-IN',
      };
      recognition.lang = langMap[language] || 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language, onTranscript]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
          isListening
            ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/40 animate-pulse'
            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white light:bg-slate-100 light:text-slate-700 light:border-slate-300 light:hover:bg-slate-200'
        }`}
        title={isListening ? 'Stop recording voice' : 'Voice Input (Microphone)'}
        aria-label="Voice input button"
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {isListening && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-rose-500 text-white text-[10px] font-bold whitespace-nowrap animate-bounce shadow-md">
          Listening...
        </span>
      )}
    </div>
  );
};
