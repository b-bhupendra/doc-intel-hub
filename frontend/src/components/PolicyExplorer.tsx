import React, { useState } from 'react';
import { 
  Search, 
  FileText, 
  Layers, 
  Calendar, 
  Tag, 
  ChevronRight, 
  Upload, 
  MessageSquareQuote, 
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { PolicyDocument } from '../types';

interface PolicyExplorerProps {
  documents: PolicyDocument[];
  onSelectDocForQuery: (docId: string, promptExample?: string) => void;
  onOpenIngestModal: () => void;
}

export const PolicyExplorer: React.FC<PolicyExplorerProps> = ({
  documents,
  onSelectDocForQuery,
  onOpenIngestModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeDoc, setActiveDoc] = useState<PolicyDocument | null>(documents[0] || null);

  const categories = ['all', ...Array.from(new Set(documents.map(d => d.category)))];

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Top Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>Ingested Policy Repository</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse corporate standards, active bylaws, and compliance documentation loaded into the RAG vector index.
          </p>
        </div>

        <button
          onClick={onOpenIngestModal}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow transition flex-shrink-0"
        >
          <Upload className="w-4 h-4" />
          <span>Ingest New Policy Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by title, code, or keyword..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-2 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Policies' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Master Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredDocs.map((doc) => {
            const isSelected = activeDoc?.id === doc.id;

            return (
              <div
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
                    : 'bg-slate-900/80 hover:bg-slate-800/60 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      {doc.code}
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      v{doc.version}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{doc.last_updated}</span>
                  </span>
                </div>

                <h3 className="font-semibold text-white text-sm mt-2 line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {doc.summary}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center space-x-1">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span>{doc.category}</span>
                  </span>
                  <div className="flex items-center space-x-1 text-blue-400 hover:text-blue-300">
                    <span>View Clauses</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDocs.length === 0 && (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
              No policy documents match your filter. Try adjusting your search.
            </div>
          )}
        </div>

        {/* Selected Document Full Preview (7 cols) */}
        <div className="lg:col-span-7">
          {activeDoc ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-xl space-y-4">
              {/* Header Info */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      {activeDoc.code}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                      Version {activeDoc.version}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectDocForQuery(activeDoc.id, `What are the key provisions of ${activeDoc.title}?`)}
                    className="inline-flex items-center space-x-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                  >
                    <MessageSquareQuote className="w-3.5 h-3.5" />
                    <span>Query in RAG Chat</span>
                  </button>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {activeDoc.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Category: {activeDoc.category} • Last Revision: {activeDoc.last_updated}
                </p>
              </div>

              {/* Summary Box */}
              <div className="p-3.5 bg-slate-800/60 rounded-lg border border-slate-700/60 text-xs text-slate-300">
                <span className="font-semibold text-white block mb-1">Executive Summary:</span>
                {activeDoc.summary}
              </div>

              {/* Full Text View */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Complete Statutory Clauses & Markdown Content
                </label>
                <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed max-h-[480px] overflow-y-auto whitespace-pre-wrap">
                  {activeDoc.raw_text}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
              Select a policy document on the left to inspect clauses.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
