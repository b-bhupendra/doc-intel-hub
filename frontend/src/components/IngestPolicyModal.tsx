import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Layers, FileCode, ArrowRight } from 'lucide-react';
import { PolicyDocument } from '../types';

interface IngestPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentIngested: (doc: PolicyDocument) => void;
}

const TEMPLATE_POLICY = `# DIAV Remote Work & Travel Expense Reimbursement Policy (v2.0)
## Section 1: Scope & Eligibility
This policy governs per-diem allowances, hotel lodging caps, and home-office equipment stipends for all remote and traveling personnel.

## Section 2: Daily Meal Per-Diem Caps
Under Section 2.1, standard domestic per-diem for meals is set at $85 USD/day ($20 breakfast, $25 lunch, $40 dinner). International business travel per-diem is capped at $130 USD/day. No individual alcohol receipts are eligible for reimbursement.

## Section 3: Home Office Equipment Stipend
Section 3.2 provides all approved permanent remote workers with a one-time setup reimbursement grant of up to $1,500 USD for ergonomic furniture and dual monitors, with a recurring $75 USD/month internet subsidy.

## Section 4: Flight Class & Advance Booking Rules
All commercial flights under 6 hours must be booked in Standard Economy class at least 14 calendar days in advance. Transoceanic flights exceeding 8 continuous hours qualify for Premium Economy.`;

export const IngestPolicyModal: React.FC<IngestPolicyModalProps> = ({
  isOpen,
  onClose,
  onDocumentIngested
}) => {
  const [ingestMode, setIngestMode] = useState<'upload' | 'manual'>('upload');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [version, setVersion] = useState('1.0');
  const [category, setCategory] = useState('Operations & Finance');
  const [summary, setSummary] = useState('');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoadTemplate = () => {
    setIngestMode('manual');
    setTitle('DIAV Remote Work & Travel Expense Policy');
    setCode('POL-DIAV-EXP-2026');
    setVersion('2.0');
    setCategory('Operations & Finance');
    setSummary('Guidelines on domestic/international travel per-diems, flight booking thresholds, and remote home-office stipends.');
    setRawText(TEMPLATE_POLICY);
  };

  // Direct FormData Upload Handler (Strictly follows React FormData upload contract)
  const handleDirectFileUpload = async (file: File) => {
    setIsSubmitting(true);
    setError(null);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      // The key "file" matches the backend FastAPI parameter name:
      // async def ingest_document(file: UploadFile = File(...))
      formData.append('file', file);

      // CRITICAL: Do NOT manually set 'Content-Type': 'multipart/form-data'.
      // The browser's fetch API sets it automatically with the correct boundary hash.
      const response = await fetch('/api/v1/ingest/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Direct file upload failed');
      }

      const result = await response.json();
      const docTitle = result.filename || result.document_title || file.name;
      const chunksCount = result.telemetry?.total_chunks_generated ?? result.chunks_created ?? 0;
      setUploadSuccess(`Ingested "${docTitle}" (${chunksCount} chunks partitioned).`);
      
      onDocumentIngested({
        id: result.document_id || `DOC-${Date.now()}`,
        title: docTitle,
        code: result.document_id || 'POL-LIVE-001',
        version: '1.0',
        category: 'Ingested Documents',
        last_updated: new Date().toISOString().split('T')[0],
        chunks_count: chunksCount,
        summary: `Live Ingested PDF: ${docTitle} (${chunksCount} chunks partitioned).`,
        raw_text: ''
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    
    // Also parse text preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    };
    reader.readAsText(file);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ingestMode === 'upload' && selectedFile) {
      await handleDirectFileUpload(selectedFile);
      return;
    }

    if (!title.trim() || !rawText.trim()) {
      setError('Title and Policy Clauses text are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/v1/rag/documents', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title,
          code: code || `POL-DIAV-${Math.floor(1000 + Math.random() * 9000)}`,
          version: version || '1.0',
          category: category || 'General Policy',
          summary: summary || `Ingested policy covering ${title}`,
          raw_text: rawText
        })
      });

      if (!res.ok) {
        throw new Error('Failed to ingest document');
      }

      const data = await res.json();
      onDocumentIngested(data.document);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error ingesting policy document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const estimatedChunks = rawText.split(/##\s+/).filter(Boolean).length || (rawText ? 1 : 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Ingest Enterprise Document</h3>
              <p className="text-xs text-slate-400">Extract, OCR, chunk, vectorize, and index into the RAG vector engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-5 pt-3">
          <button
            onClick={() => setIngestMode('upload')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              ingestMode === 'upload'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>FormData File Upload</span>
          </button>
          <button
            onClick={() => setIngestMode('manual')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 flex items-center space-x-1.5 transition ${
              ingestMode === 'manual'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Structured Markdown Form</span>
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleManualSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-lg flex items-center space-x-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg flex items-center space-x-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {ingestMode === 'upload' ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 text-center bg-slate-950/40 transition">
                <input
                  type="file"
                  id="direct-file-input"
                  accept=".md,.txt,.json,.csv,.pdf"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <label htmlFor="direct-file-input" className="cursor-pointer block space-y-2">
                  <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/30 rounded-xl flex items-center justify-center mx-auto text-blue-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {selectedFile ? selectedFile.name : 'Click to select or drag & drop policy file'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Supports .md, .txt, .json, .pdf (Native or Escalated OCR Triage)
                  </p>
                  {selectedFile && (
                    <div className="text-xs text-emerald-400 font-mono pt-1">
                      Ready: {(selectedFile.size / 1024).toFixed(1)} KB • {estimatedChunks} chunk sections detected
                    </div>
                  )}
                </label>
              </div>

              {selectedFile && rawText && (
                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Parsed Content Preview</span>
                    <span className="font-mono text-blue-400">{rawText.length} chars</span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-300 max-h-28 overflow-y-auto p-2 bg-slate-900 rounded border border-slate-800/80 whitespace-pre-wrap">
                    {rawText.slice(0, 400)}...
                  </pre>
                </div>
              )}

              <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Or load pre-configured statutory sample:</span>
                <button
                  type="button"
                  onClick={handleLoadTemplate}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Travel Policy Sample</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Need a quick sample to test?</span>
                <button
                  type="button"
                  onClick={handleLoadTemplate}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Travel Policy Sample</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., DIAV Remote Work & Travel Expense Policy"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required={ingestMode === 'manual'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Policy Code Identifier
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g., POL-DIAV-EXP-2026"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Version Tag
                  </label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g., 2.0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Operations & Finance"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Executive Summary
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary of what this policy regulates..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Policy Document Text (Markdown with ## Section Headers) *
                  </label>
                  <label className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer font-medium">
                    <span>Upload .txt/.md</span>
                    <input type="file" accept=".txt,.md" onChange={handleFileSelected} className="hidden" />
                  </label>
                </div>
                <textarea
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste markdown content with ## Section headers for automatic chunk partitioning..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                  required={ingestMode === 'manual'}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700 text-xs">
            <span className="text-slate-400 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>Estimated Chunk Partitions:</span>
            </span>
            <span className="font-mono font-bold text-blue-300">
              {estimatedChunks > 0 ? `${estimatedChunks} Chunks` : '0 Chunks'}
            </span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (ingestMode === 'upload' ? !selectedFile : (!title.trim() || !rawText.trim()))}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Indexing Chunks...' : ingestMode === 'upload' ? 'Upload & Ingest' : 'Ingest & Index'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
