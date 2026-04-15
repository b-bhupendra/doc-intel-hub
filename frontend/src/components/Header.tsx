import React from 'react';
import { ShieldCheck, Database, Sliders, FileText, Terminal, Layers, RefreshCw, Upload, BarChart3 } from 'lucide-react';
import { SystemHealth } from '../types';

interface HeaderProps {
  activeTab: 'chat' | 'documents' | 'chunks' | 'observability' | 'settings' | 'api-spec';
  setActiveTab: (tab: 'chat' | 'documents' | 'chunks' | 'observability' | 'settings' | 'api-spec') => void;
  systemHealth: SystemHealth | null;
  onOpenIngestModal: () => void;
  onRefreshHealth: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  systemHealth,
  onOpenIngestModal,
  onRefreshHealth,
  isRefreshing
}) => {
  const isOnline = systemHealth?.status === 'online';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-inner font-bold">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">OmniDoc Intelligence</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 font-mono">
                  v2.4-OpenAPI 3.1
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Universal Enterprise Document Intelligence & Grounded Multimodal RAG Platform
              </p>
            </div>
          </div>

          {/* Status & Quick Actions */}
          <div className="flex items-center space-x-3">
            {/* Live Status Indicator */}
            <div 
              onClick={onRefreshHealth}
              title="Click to check backend status"
              className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-slate-200">
                {isOnline ? 'System Online' : 'Connecting...'}
              </span>
              {systemHealth && (
                <span className="text-slate-400 text-[10px] pl-1 border-l border-slate-700 hidden md:inline">
                  {systemHealth.chunks_count} Chunks Indexed
                </span>
              )}
              <RefreshCw className={`w-3 h-3 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </div>

            {/* Ingest Document Button */}
            <button
              onClick={onOpenIngestModal}
              className="hidden sm:inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3.5 py-1.5 rounded-lg shadow transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Ingest Document</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-slate-800/60 overflow-x-auto py-1 text-sm no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition ${
              activeTab === 'chat'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Intelligence Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition ${
              activeTab === 'documents'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Document Explorer</span>
            {systemHealth && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full border border-slate-700">
                {systemHealth.documents_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('chunks')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition ${
              activeTab === 'chunks'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Chunk Inspector</span>
            {systemHealth && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full border border-slate-700">
                {systemHealth.chunks_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('observability')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition ${
              activeTab === 'observability'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Phase 9 Observability</span>
            <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-600 text-emerald-300">
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition ${
              activeTab === 'settings'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>RAG Pipeline & Endpoints</span>
          </button>

          <button
            onClick={() => setActiveTab('api-spec')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition ${
              activeTab === 'api-spec'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>FastAPI Contract Specs</span>
          </button>
        </div>
      </div>
    </header>
  );
};
