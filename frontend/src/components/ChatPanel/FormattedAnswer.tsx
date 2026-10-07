import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface FormattedAnswerProps {
  content: string;
  onCitationClick?: (docName: string, pageNum: number) => void;
}

export const FormattedAnswer: React.FC<FormattedAnswerProps> = ({ content }) => {
  // Pre-process LaTeX brackets \[ \] and \( \) to $$ and $ for remark-math
  const sanitizedContent = content
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');

  return (
    <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base sm:text-lg font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-3.5 mb-2 flex items-center space-x-2">
              <span className="w-1 h-3.5 rounded-full bg-[#0d5c4d] inline-block" />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mt-3 mb-1.5 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d5c4d] inline-block" />
              <span>{children}</span>
            </h3>
          ),
          p: ({ children }) => (
            <p className="my-2 leading-relaxed text-slate-700">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 list-disc list-outside pl-5 text-slate-700 marker:text-[#0d5c4d]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1.5 list-decimal list-outside pl-5 text-slate-700 marker:text-[#0d5c4d] font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-800">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 border-l-3 border-[#0d5c4d] bg-[#eaf5f2]/30 px-3 py-2 rounded-r-lg text-slate-700 italic text-xs">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isInline = !className;
            return isInline ? (
              <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[11px] text-[#0d5c4d] font-semibold">
                {children}
              </code>
            ) : (
              <code className="block p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto my-2">
                {children}
              </code>
            );
          },
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="p-2.5 border-r border-slate-200 last:border-r-0 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="p-2.5 border-t border-r border-slate-100 last:border-r-0 text-slate-700 font-mono text-[11px]">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-3 border-slate-200" />
          )
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};
