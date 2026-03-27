import React, { useState } from 'react';
import { 
  Sliders, 
  Server, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  RotateCcw, 
  Zap, 
  Radio,
  FileCode,
  Shield,
  Activity
} from 'lucide-react';
import { AppSettings, ChatMessage } from '../types';

interface PipelineSettingsProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  messages: ChatMessage[];
  onResetSession: () => void;
}

export const PipelineSettings: React.FC<PipelineSettingsProps> = ({
  settings,
  onUpdateSettings,
  messages,
  onResetSession
}) => {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testLatency, setTestLatency] = useState<number | null>(null);

  const handleTestConnection = async () => {
    setTestStatus('testing');
    const start = Date.now();

    try {
      if (settings.useExternalBackend) {
        // Test custom endpoint
        const res = await fetch(settings.backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: 'health-check-ping' })
        });
        if (res.ok) {
          setTestLatency(Date.now() - start);
          setTestStatus('success');
        } else {
          setTestStatus('failed');
        }
      } else {
        // Test built-in endpoint
        const res = await fetch('/api/v1/rag/health');
        if (res.ok) {
          setTestLatency(Date.now() - start);
          setTestStatus('success');
        } else {
          setTestStatus('failed');
        }
      }
    } catch {
      setTestStatus('failed');
    }
  };

  const handleExportChatJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `diav-rag-session-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportChatMarkdown = () => {
    let md = `# DIAV Policy Intelligence - Audit Session Export\n`;
    md += `Exported: ${new Date().toISOString()}\n\n`;
    
    messages.forEach((m, idx) => {
      md += `### ${m.sender === 'user' ? 'User Question' : 'DIAV Assistant'} [${new Date(m.timestamp).toLocaleTimeString()}]\n`;
      md += `${m.text}\n\n`;
      if (m.data?.citations && m.data.citations.length > 0) {
        md += `**Verified Sources:**\n`;
        m.data.citations.forEach(c => {
          md += `- **${c.document_title} (v${c.version_id})** - Chunk: \`${c.chunk_id}\` (Score: ${(c.similarity_score * 100).toFixed(1)}%)\n`;
          md += `  > "${c.snippet}"\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `diav-rag-audit-${Date.now()}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          <span>RAG Pipeline & Backend Engine Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure the active retrieval pipeline, abstention thresholds, Top-K chunk depth, and connect external FastAPI RAG microservices.
        </p>
      </div>

      {/* Backend Mode Selection */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-md space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Server className="w-4 h-4 text-blue-400" />
          <span>Active RAG Generation Engine</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Internal Gemini RAG Engine */}
          <div
            onClick={() => onUpdateSettings({ useExternalBackend: false })}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              !settings.useExternalBackend
                ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span>Integrated Gemini 3.7 RAG</span>
              </span>
              {!settings.useExternalBackend && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time grounded synthesis powered by Gemini 3.7 Flash server-side agent with strict policy citation constraints.
            </p>
            <div className="mt-3 text-[11px] text-blue-300 font-mono">
              Endpoint: <code className="bg-slate-900 px-1 py-0.5 rounded">/api/v1/rag/query</code>
            </div>
          </div>

          {/* External FastAPI Backend */}
          <div
            onClick={() => onUpdateSettings({ useExternalBackend: true })}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              settings.useExternalBackend
                ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/40'
                : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Custom FastAPI Backend (Phase 7)</span>
              </span>
              {settings.useExternalBackend && (
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Proxies queries to your local or remote FastAPI Python backend running on port 8000.
            </p>
            <div className="mt-3 text-[11px] text-emerald-300 font-mono">
              Default: <code className="bg-slate-900 px-1 py-0.5 rounded">http://localhost:8000/api/v1/rag/query</code>
            </div>
          </div>
        </div>

        {/* Custom URL Input (if external selected) */}
        {settings.useExternalBackend && (
          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">
              FastAPI Endpoint URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.backendUrl}
                onChange={(e) => onUpdateSettings({ backendUrl: e.target.value })}
                placeholder="http://localhost:8000/api/v1/rag/query"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition flex items-center space-x-1.5"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{testStatus === 'testing' ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {testStatus === 'success' && (
              <div className="flex items-center space-x-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Backend reachable! Latency: {testLatency}ms</span>
              </div>
            )}

            {testStatus === 'failed' && (
              <div className="flex items-center space-x-2 text-xs text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <span>Unable to reach endpoint. The app will automatically fallback to the built-in Gemini RAG engine.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RAG Retrieval Hyperparameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-md space-y-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Retrieval & Grounding Parameters</span>
        </h3>

        <div className="space-y-5">
          {/* Top-K Chunks Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="font-semibold text-slate-200">Top-K Retrieved Context Chunks</span>
              <span className="font-mono text-blue-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                {settings.topK} Chunks
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={settings.topK}
              onChange={(e) => onUpdateSettings({ topK: Number(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Number of most relevant policy passages injected into the generation prompt. Higher values provide broader context.
            </p>
          </div>

          {/* Abstention Threshold Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5 text-xs">
              <span className="font-semibold text-slate-200">Strict Abstention Threshold (Anti-Hallucination)</span>
              <span className="font-mono text-emerald-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                {(settings.abstentionThreshold * 100).toFixed(0)}% Min Score
              </span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={settings.abstentionThreshold}
              onChange={(e) => onUpdateSettings({ abstentionThreshold: Number(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              If the maximum chunk relevance score falls below this threshold, the model abstains from answering to prevent misinformation.
            </p>
          </div>
        </div>
      </div>

      {/* Session Export & Reset */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-white text-sm">Session Management & Audit Export</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Download verified Q&A interactions and citation records for corporate compliance logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportChatMarkdown}
            disabled={messages.length === 0}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown Audit</span>
          </button>

          <button
            onClick={handleExportChatJSON}
            disabled={messages.length === 0}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            onClick={onResetSession}
            className="flex items-center space-x-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 text-xs font-medium px-3 py-2 rounded-lg border border-red-800 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Chat</span>
          </button>
        </div>
      </div>
    </div>
  );
};
