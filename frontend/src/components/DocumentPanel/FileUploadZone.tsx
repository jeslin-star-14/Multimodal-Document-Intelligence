import React, { useRef, useState } from 'react';
import type { LanguageCode } from '../../types';

interface FileUploadZoneProps {
  language: LanguageCode;
  onFileUpload: (files: FileList | File[]) => void;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileUpload,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      className={`border border-dashed rounded-xl py-6 px-4 text-center cursor-pointer transition-all ${
        isDragOver
          ? 'border-[#0d5c4d] bg-[#eaf5f2]'
          : 'border-slate-300 hover:border-slate-400 bg-white'
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

      <div className="flex flex-col items-center justify-center space-y-1">
        <p className="text-xs font-bold text-slate-800">
          Drop files here
        </p>
        <p className="text-[11px] text-slate-400">
          PDF, Word, slides, scans
        </p>
      </div>
    </div>
  );
};
