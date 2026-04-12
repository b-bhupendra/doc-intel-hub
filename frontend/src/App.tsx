import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatArea } from './components/ChatArea';
import { PolicyExplorer } from './components/PolicyExplorer';
import { ChunkInspector } from './components/ChunkInspector';
import { PipelineSettings } from './components/PipelineSettings';
import { ObservabilityDashboard } from './components/ObservabilityDashboard';
import { ApiDevSpecModal } from './components/ApiDevSpecModal';
import { CitationInspectorModal } from './components/CitationInspectorModal';
import { IngestPolicyModal } from './components/IngestPolicyModal';
import { 
  ChatMessage, 
  RAGCitation, 
  PolicyDocument, 
  DocumentChunk, 
  AppSettings, 
  SystemHealth 
} from './types';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  sender: 'system',
  text: 'Welcome. I am the Document Intelligence Assistant. Ask me a question about the ingested policies.',
  timestamp: new Date().toISOString()
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'chunks' | 'observability' | 'settings' | 'api-spec'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<PolicyDocument[]>([]);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isRefreshingHealth, setIsRefreshingHealth] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<RAGCitation | null>(null);
  const [isIngestModalOpen, setIsIngestModalOpen] = useState(false);
  const [selectedDocFilter, setSelectedDocFilter] = useState('all');

  const [settings, setSettings] = useState<AppSettings>({
    backendUrl: 'http://localhost:8000/api/v1/rag/query',
    useExternalBackend: false,
    topK: 4,
    abstentionThreshold: 0.25,
    activeCategory: 'all',
    autoScroll: true,
    streamResponse: false
  });

  // Fetch initial knowledge base and status
  const fetchAllData = useCallback(async () => {
    setIsRefreshingHealth(true);
    try {
      // 1. Health
      const healthRes = await fetch('/api/v1/rag/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth({
          ...healthData,
          last_ping_ms: 24
        });
      }

      // 2. Documents
      const docsRes = await fetch('/api/v1/rag/documents');
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData.documents || []);
      }

      // 3. Chunks
      const chunksRes = await fetch('/api/v1/rag/chunks');
      if (chunksRes.ok) {
        const chunksData = await chunksRes.json();
        setChunks(chunksData.chunks || []);
      }
    } catch (err) {
      console.warn('Initial data load warning:', err);
    } finally {
      setIsRefreshingHealth(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle Query Submission
  const handleSendMessage = async (queryText: string) => {
    const userMsgId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const payload = {
        query: queryText,
        top_k: settings.topK,
        similarity_threshold: settings.abstentionThreshold,
        document_filter: selectedDocFilter !== 'all' ? selectedDocFilter : undefined,
        custom_api_url: settings.useExternalBackend ? settings.backendUrl : undefined
      };

      const res = await fetch('/api/v1/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const ragData = await res.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: ragData.answer || 'No response text received from intelligence engine.',
        timestamp: ragData.timestamp || new Date().toISOString(),
        data: ragData
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'system',
        text: `System Error: Could not connect to the document intelligence hub. (${err.message || 'Network error'})`,
        timestamp: new Date().toISOString(),
        error: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetSession = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  const handleDocumentIngested = (newDoc: PolicyDocument) => {
    setDocuments((prev) => [...prev, newDoc]);
    fetchAllData();
    setActiveTab('documents');
  };

  const handleSelectDocForQuery = (docId: string, promptExample?: string) => {
    setSelectedDocFilter(docId);
    setActiveTab('chat');
    if (promptExample) {
      handleSendMessage(promptExample);
    }
  };

  const handleSelectChunkForQuery = (chunkContent: string) => {
    setActiveTab('chat');
    handleSendMessage(`Explain the policy clause: "${chunkContent.substring(0, 120)}..."`);
  };

  // Find doc for selected citation
  const activeDocForCitation = selectedCitation
    ? documents.find((d) => d.id === selectedCitation.document_id || d.title === selectedCitation.document_title)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemHealth={systemHealth}
        onOpenIngestModal={() => setIsIngestModalOpen(true)}
        onRefreshHealth={fetchAllData}
        isRefreshing={isRefreshingHealth}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'chat' && (
          <ChatArea
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onInspectChunk={(cit) => setSelectedCitation(cit)}
            documents={documents}
            settings={settings}
            onClearChat={handleResetSession}
            selectedDocFilter={selectedDocFilter}
            setSelectedDocFilter={setSelectedDocFilter}
          />
        )}

        {activeTab === 'documents' && (
          <PolicyExplorer
            documents={documents}
            onSelectDocForQuery={handleSelectDocForQuery}
            onOpenIngestModal={() => setIsIngestModalOpen(true)}
          />
        )}

        {activeTab === 'chunks' && (
          <ChunkInspector
            chunks={chunks}
            onSelectChunkForQuery={handleSelectChunkForQuery}
          />
        )}

        {activeTab === 'observability' && (
          <ObservabilityDashboard
            documents={documents}
            onSelectDocForQuery={handleSelectDocForQuery}
          />
        )}

        {activeTab === 'settings' && (
          <PipelineSettings
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            messages={messages}
            onResetSession={handleResetSession}
          />
        )}

        {activeTab === 'api-spec' && <ApiDevSpecModal />}
      </main>

      {/* Citation Inspector Modal */}
      <CitationInspectorModal
        citation={selectedCitation}
        onClose={() => setSelectedCitation(null)}
        document={activeDocForCitation}
      />

      {/* Ingest Policy Modal */}
      <IngestPolicyModal
        isOpen={isIngestModalOpen}
        onClose={() => setIsIngestModalOpen(false)}
        onDocumentIngested={handleDocumentIngested}
      />
    </div>
  );
}
