import React, { useState } from 'react';
import { Layers, Search, Hash, Cpu, Copy, Check, Filter, CheckCircle } from 'lucide-react';
import { DocumentChunk } from '../types';

interface ChunkInspectorProps {
  chunks: DocumentChunk[];
  onSelectChunkForQuery: (chunkContent: string) => void;
}

export const ChunkInspector: React.FC<ChunkInspectorProps> = ({
  chunks,
  onSelectChunkForQuery
}) => {
  const [search, setSearch] = useState('');
  const [selectedDocTitle, setSelectedDocTitle] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const docTitles = ['all', ...Array.from(new Set(chunks.map(c => c.document_title)))];

  const filteredChunks = chunks.filter(c => {
    const matchesDoc = selectedDocTitle === 'all' || c.document_title === selectedDocTitle;
    const matchesSearch = 
      c.chunk_id.toLowerCase().includes(search.toLowerCase()) ||
      c.section.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase());
    return matchesDoc && matchesSearch;
  });

  const handleCopyChunk = (chunk: DocumentChunk) => {
    navigator.clipboard.writeText(chunk.content);
    setCopiedId(chunk.chunk_id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-400" />
            <span>RAG Vector Chunk Index</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time inspection of chunk partitions, token boundaries, and metadata passed to the grounding retriever.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 text-slate-300 font-mono">
            Total Chunks: <span className="text-blue-400 font-bold">{chunks.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-emerald-950/60 rounded-lg border border-emerald-800 text-emerald-300 font-mono flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Status: 100% Ingested</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chunk ID, section title, or statutory keyword..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedDocTitle}
            onChange={(e) => setSelectedDocTitle(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="all">All Documents ({chunks.length} chunks)</option>
            {docTitles.filter(t => t !== 'all').map(title => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chunks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChunks.map((chunk) => (
          <div
            key={chunk.chunk_id}
            className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-md flex flex-col justify-between space-y-3 transition-all"
          >
            <div>
              {/* Chunk Top Badges */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold truncate max-w-[190px]">
                  {chunk.chunk_id}
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                  ~{chunk.token_count} tokens
                </span>
              </div>

              <h4 className="text-xs font-bold text-white line-clamp-1">
                {chunk.section}
              </h4>
              <p className="text-[11px] text-slate-400 truncate mb-2">
                {chunk.document_title} (v{chunk.version_id})
              </p>

              {/* Chunk Content Snippet */}
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {chunk.content}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[10px] text-emerald-400 font-mono">
                ● Status: {chunk.embedding_status}
              </span>

              <button
                onClick={() => handleCopyChunk(chunk)}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white transition px-2 py-1 bg-slate-800 rounded border border-slate-700"
              >
                {copiedId === chunk.chunk_id ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredChunks.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
          No chunks found matching your search filter.
        </div>
      )}
    </div>
  );
};
