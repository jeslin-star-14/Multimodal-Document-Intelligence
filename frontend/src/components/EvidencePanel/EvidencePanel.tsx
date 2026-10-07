import React, { useState } from 'react';
import type { DocumentChunk, BoundingBox, DocumentItem, LanguageCode } from '../../types';
import { PageViewer } from './PageViewer';

interface EvidencePanelProps {
  activeDocument: DocumentItem | null;
  currentPageNumber: number;
  onPageChange: (newPage: number) => void;
  boundingBoxes: BoundingBox[];
  activeBoxId?: string;
  onBoxClick?: (box: BoundingBox) => void;
  chunks: DocumentChunk[];
  activeChunkId?: string;
  onSelectChunk: (chunk: DocumentChunk) => void;
  language: LanguageCode;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  activeDocument,
  currentPageNumber,
  onPageChange,
  boundingBoxes,
  activeBoxId,
  onBoxClick,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'page' | 'data' | 'text'>('page');

  const currentPageImage =
    activeDocument?.pageImages?.[currentPageNumber - 1] ||
    activeDocument?.pageImages?.[0] ||
    '';

  const totalPages = activeDocument?.pageCount || 48;
  const docTitle = activeDocument?.name || 'Annual Report 2025';

  return (
    <div className="h-full flex flex-col bg-white border-l border-slate-200/80 p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-start justify-between pb-4">
        <div>
          <h2 className="font-serif text-lg text-slate-800 font-normal">
            {docTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Page {currentPageNumber} of {totalPages}
          </p>
        </div>

        {/* Top Right Chunk Type Badge */}
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border border-[#0d5c4d] text-[#0d5c4d] bg-[#eaf5f2]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0d5c4d]" />
          <span>Chart</span>
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-6 border-b border-slate-200 text-xs mb-4">
        <button
          onClick={() => setActiveTab('page')}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === 'page'
              ? 'border-b-2 border-[#0d5c4d] font-semibold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Page
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === 'data'
              ? 'border-b-2 border-[#0d5c4d] font-semibold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Extracted data
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'border-b-2 border-[#0d5c4d] font-semibold text-slate-900'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Text
        </button>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col justify-start">
        {activeTab === 'page' && (
          <PageViewer
            pageImage={currentPageImage}
            currentPage={currentPageNumber}
            totalPages={totalPages}
            onPageChange={onPageChange}
            boundingBoxes={boundingBoxes}
            activeBoxId={activeBoxId}
            onBoxClick={onBoxClick}
            language={language}
          />
        )}

        {activeTab === 'data' && (
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 text-xs space-y-3">
            <h4 className="font-semibold text-slate-800">Extracted Tabular & Numeric Data</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] bg-white rounded border border-slate-200">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-2">Quarter</th>
                    <th className="p-2">Revenue</th>
                    <th className="p-2">YoY Growth</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 font-mono">Q1</td>
                    <td className="p-2">₹2.8M</td>
                    <td className="p-2 text-slate-600">+12%</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="p-2 font-mono">Q2</td>
                    <td className="p-2">₹3.1M</td>
                    <td className="p-2 text-slate-600">+16%</td>
                  </tr>
                  <tr className="border-b border-slate-100 bg-[#fef3c7]/30">
                    <td className="p-2 font-bold font-mono">Q3 (Peak)</td>
                    <td className="p-2 font-bold text-[#0d5c4d]">₹4.2M</td>
                    <td className="p-2 font-bold text-[#0d5c4d]">+24%</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-mono">Q4</td>
                    <td className="p-2">₹3.6M</td>
                    <td className="p-2 text-slate-600">+18%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50 text-xs space-y-2">
            <h4 className="font-semibold text-slate-800">Extracted Text Content</h4>
            <p className="text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-200 text-[11px]">
              "During Q3 fiscal review, strong enterprise demand propelled gross margins by 24% YoY. Overall aggregate revenue across subsidiaries reached peak performance during Q3 FY25 at ₹4.2M, up from ₹3.1M in Q2."
            </p>
          </div>
        )}
      </div>

      {/* Bottom Metadata Bar */}
      <div className="pt-4 mt-auto flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
        <div>
          Match <span className="font-semibold text-slate-700">0.89</span>
        </div>
        <div>
          Found in <span className="font-bold text-slate-900">chart + table</span>
        </div>
      </div>
    </div>
  );
};
