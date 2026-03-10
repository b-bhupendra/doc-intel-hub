export interface RAGCitation {
  document_id?: string;
  document_title: string;
  version_id: string;
  chunk_id: string;
  chunk_index?: number;
  content?: string;
  snippet: string;
  similarity_score: number | null;
  section_heading?: string;
  page_number?: number;
}

export interface DocumentSummary {
  id: string;
  title: string;
  document_type: string;
  version: number | string;
  page_count: number;
}

export interface RAGQueryRequest {
  query: string;
  top_k?: number;
  similarity_threshold?: number;
  document_filter?: string;
  custom_api_url?: string;
}

export interface RAGQueryResponse {
  query?: string;
  answer: string;
  abstained: boolean;
  is_grounded?: boolean;
  citations: RAGCitation[];
  confidence_score?: number;
  retrieved_chunks_count?: number;
  latency_seconds?: number;
  latency_ms?: number;
  engine?: 'gemini-3.7-rag' | 'fastapi-backend' | 'local-retriever' | string;
  timestamp?: string;
  reasoning_summary?: string;
}

export interface PolicyDocument {
  id: string;
  title: string;
  code: string;
  version: string;
  category: string;
  last_updated: string;
  chunks_count: number;
  summary: string;
  raw_text: string;
}

export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  document_title: string;
  version_id: string;
  content: string;
  section: string;
  token_count: number;
  embedding_status: 'indexed' | 'pending' | 'error';
  page_number?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'system' | 'assistant';
  text: string;
  timestamp: string;
  data?: RAGQueryResponse;
  error?: boolean;
  isLoading?: boolean;
}

export interface AppSettings {
  backendUrl: string;
  useExternalBackend: boolean;
  topK: number;
  abstentionThreshold: number;
  activeCategory: string;
  autoScroll: boolean;
  streamResponse: boolean;
}

export interface SystemHealth {
  status: 'online' | 'degraded' | 'offline';
  model: string;
  documents_count: number;
  chunks_count: number;
  uptime_seconds: number;
  active_backend: string;
  last_ping_ms: number;
}

export interface PageTelemetry {
  id: string;
  document_id: string;
  document_title: string;
  page_number: number;
  extraction_method: 'NATIVE' | 'OCR' | 'MIXED';
  quality_score: number;
  word_count: number;
  ocr_confidence?: number;
  processing_time_ms: number;
}

export interface DocumentVersionRecord {
  id: string;
  document_id: string;
  version_number: string;
  checksum_sha256: string;
  is_current: boolean;
  ingested_at: string;
  change_summary: string;
}

export interface QueryLogRecord {
  id: string;
  user_query: string;
  timestamp: string;
  abstained: boolean;
  latency_seconds: number;
  confidence_score: number;
  retrieved_chunks_count: number;
  engine: string;
  client_ip?: string;
}

export interface MethodDistribution {
  method: string;
  count: number;
  percentage: number;
}

export interface QualitySummaryItem {
  method: string;
  count: number;
  meanQuality: number;
  minQuality: number;
  maxQuality: number;
}

export interface ObservabilityTelemetry {
  metrics: {
    total_docs: number;
    total_pages: number;
    total_chunks: number;
    avg_quality: number;
    min_quality_threshold: number;
    total_queries: number;
    grounded_queries: number;
    abstained_queries: number;
    abstention_rate: number;
    avg_latency_seconds: number;
  };
  method_distribution: MethodDistribution[];
  doc_types: Array<{ type: string; count: number }>;
  domains: Array<{ domain: string; count: number }>;
  quality_summary: QualitySummaryItem[];
  pages: PageTelemetry[];
  versions: DocumentVersionRecord[];
  query_logs: QueryLogRecord[];
}
