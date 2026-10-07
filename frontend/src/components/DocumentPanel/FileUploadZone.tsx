import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import type { LanguageCode } from '../../types';
import { translations } from '../../translations/i18n';

interface FileUploadZoneProps {
  language: LanguageCode;
  onFileUpload: (files: FileList | File[]) => void;
  isUploading?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  language,
  onFileUpload,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200 group ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-500/10 scale-[0.99]'
          : 'border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/80 light:bg-slate-50 light:border-slate-300 light:hover:border-indigo-400'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.tiff,.webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-200 light:text-slate-800">
            {t.dragDropText}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 light:text-slate-500">
            PDF, DOCX, PPTX, Images (OCR auto-enabled)
          </p>
        </div>
      </div>
    </div>
  );
};
