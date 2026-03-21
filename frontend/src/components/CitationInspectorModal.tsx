import React, { useState } from 'react';
import { X, BookOpen, Layers, Copy, Check, ShieldCheck, Tag, ExternalLink } from 'lucide-react';
import { RAGCitation, PolicyDocument } from '../types';

interface CitationInspectorModalProps {
  citation: RAGCitation | null;
  onClose: () => void;
  document?: PolicyDocument;
}

export const CitationInspectorModal: React.FC<CitationInspectorModalProps> = ({
  citation,
  onClose,
  document
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'chunk' | 'fullDoc'>('chunk');

  if (!citation) return null;

  const handleCopyCitation = () => {
    const text = `[Citation: ${citation.document_title} (v${citation.version_id}), Chunk ID: ${citation.chunk_id}, Section: ${citation.section_heading || 'N/A'}]\n"${citation.snippet}"`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Verified Chunk Inspection</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {citation.chunk_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher */}
        <div className="px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('chunk')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                viewMode === 'chunk'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Chunk Excerpt & Metadata
            </button>
            {document && (
              <button
                onClick={() => setViewMode('fullDoc')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  viewMode === 'fullDoc'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                Full Policy Source
              </button>
            )}
          </div>

          <button
            onClick={handleCopyCitation}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Citation</span>
              </>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-sm">
          {viewMode === 'chunk' ? (
            <>
              {/* Metadata Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Document</span>
                  <span className="font-medium text-white truncate block mt-0.5" title={citation.document_title}>
                    {citation.document_title}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Version</span>
                  <span className="font-medium text-blue-300 block mt-0.5">
                    v{citation.version_id}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Relevance Match</span>
                  <span className="font-medium text-emerald-400 block mt-0.5">
                    {(citation.similarity_score * 100).toFixed(1)}% Confidence
                  </span>
                </div>

                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Section Heading</span>
                  <span className="font-medium text-slate-200 truncate block mt-0.5">
                    {citation.section_heading || 'Primary Section'}
                  </span>
                </div>
              </div>

              {/* Verified Content Snippet */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Verified Chunk Text (Ingested Context)
                </label>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-blue-500 selection:text-white">
                  {citation.snippet}
                </div>
              </div>

              {/* RAG Guarantee Note */}
              <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-lg flex items-start space-x-2.5 text-xs text-blue-300">
                <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <p>
                  This chunk was passed directly to the Gemini 3.7 RAG synthesis engine. Strict grounding ensures the generated answer mirrors this exact text.
                </p>
              </div>
            </>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-white text-sm">{document?.title} (v{document?.version})</h4>
                <span className="text-xs text-slate-400">{document?.category}</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {document?.raw_text}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
