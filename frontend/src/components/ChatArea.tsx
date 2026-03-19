import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  ExternalLink, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  Filter, 
  Trash2, 
  HelpCircle,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, RAGCitation, PolicyDocument, AppSettings } from '../types';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  onInspectChunk: (citation: RAGCitation) => void;
  documents: PolicyDocument[];
  settings: AppSettings;
  onClearChat: () => void;
  selectedDocFilter: string;
  setSelectedDocFilter: (docId: string) => void;
}

const SUGGESTED_QUERIES = [
  "What is the maximum limit for the disability pension?",
  "What is the mandatory cooling-off period for contract terminations?",
  "What are the data retention requirements for biometric logs?",
  "What are the emergency bereavement leave provisions?",
  "What is the gift acceptance monetary cap under Code of Conduct?",
  "Can overtime exceed 16 hours in a workweek?"
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onInspectChunk,
  documents,
  settings,
  onClearChat,
  selectedDocFilter,
  setSelectedDocFilter
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings.autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, settings.autoScroll]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;
    onSendMessage(inputQuery.trim());
    setInputQuery('');
  };

  const handlePromptClick = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSpeech = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/\[.*?\]/g, '').replace(/[*#]/g, ''));
      utterance.rate = 1.0;
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-w-5xl mx-auto w-full bg-slate-900/60 rounded-xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
      {/* Top Filter & Toolbar Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-medium">Scope Target:</span>
          <select
            value={selectedDocFilter}
            onChange={(e) => setSelectedDocFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">All Ingested Policies ({documents.length})</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title} (v{doc.version})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <div className="flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] text-slate-300">
              {settings.useExternalBackend ? 'Custom FastAPI Backend' : 'Integrated Gemini 3.7 RAG'}
            </span>
          </div>
          <button
            onClick={onClearChat}
            title="Reset conversation history"
            className="flex items-center space-x-1 hover:text-slate-200 transition p-1 hover:bg-slate-800 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Session</span>
          </button>
        </div>
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 && (
          <div className="py-8 px-4 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto text-blue-400 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Enterprise Document Intelligence Hub
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Ask policy questions with instant mathematical citation verification, statutory limits lookup, and strict anti-hallucination abstention safeguards.
            </p>

            {/* Quick Prompt Grid */}
            <div className="pt-4 text-left">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                <span>Verified Ingested Policy Inquiries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_QUERIES.map((query, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePromptClick(query)}
                    className="p-2.5 text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-lg text-xs text-slate-200 transition-all flex items-start justify-between group"
                  >
                    <span className="line-clamp-2 pr-2">{query}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 flex-shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isUser = message.sender === 'user';
          const data = message.data;

          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Message Header info */}
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1 px-1">
                <span className="font-semibold text-slate-300">
                  {isUser ? 'You' : 'OmniDoc Intelligence Assistant'}
                </span>
                <span>•</span>
                <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {!isUser && data?.is_grounded !== undefined && (
                  <>
                    <span>•</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${data.is_grounded ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50' : 'bg-amber-950/80 text-amber-300 border border-amber-700/50'}`}>
                      {data.is_grounded ? 'Grounded Fact' : 'Abstained'}
                    </span>
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`rounded-xl p-4 sm:p-5 max-w-[90%] sm:max-w-[85%] shadow-md ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 border border-slate-700 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Text Content */}
                <div className="prose prose-invert prose-sm max-w-none break-words text-sm leading-relaxed">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>

                {/* Abstention Banner if AI abstained */}
                {!isUser && data?.abstained && (
                  <div className="mt-3.5 p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg flex items-start space-x-2.5 text-amber-200 text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300">Policy Abstention Notice:</span>
                      <p className="mt-0.5 text-amber-200/90 text-[11px]">
                        The retrieval engine detected no policy chunks meeting the confidence threshold ({settings.abstentionThreshold.toFixed(2)}). Per anti-hallucination rules, ungrounded speculation has been suppressed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Citations Box (Priority RAG Component) */}
                {!isUser && data && !data.abstained && data.citations && data.citations.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-slate-700/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified Ingested Sources ({data.citations.length})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Avg. Match: {((data.confidence_score || 0.85) * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="space-y-2">
                      {data.citations.map((cit, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-2.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/70 hover:border-blue-500/40 rounded-lg text-xs transition-colors"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                            <div className="flex items-center space-x-1.5 font-medium text-slate-200">
                              <BookOpen className="w-3 h-3 text-blue-400 flex-shrink-0" />
                              <span className="font-semibold text-white truncate max-w-[240px] sm:max-w-md">
                                {cit.document_title}
                              </span>
                              <span className="bg-blue-900/60 text-blue-300 px-1.5 py-0.2 rounded text-[10px] border border-blue-700/50">
                                v{cit.version_id}
                              </span>
                            </div>

                            <button
                              onClick={() => onInspectChunk(cit)}
                              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 hover:underline"
                            >
                              <span>Inspect Chunk</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mb-1.5">
                            <span className="text-slate-300">ID: {cit.chunk_id}</span>
                            {cit.chunk_index !== undefined && (
                              <>
                                <span>•</span>
                                <span className="text-slate-300">Idx: {cit.chunk_index}</span>
                              </>
                            )}
                            {cit.section_heading && (
                              <>
                                <span>•</span>
                                <span className="text-slate-300">Sec: {cit.section_heading}</span>
                              </>
                            )}
                            {cit.similarity_score !== null && cit.similarity_score !== undefined && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400">Score: {(cit.similarity_score * 100).toFixed(1)}%</span>
                              </>
                            )}
                          </div>

                          <p className="text-[11px] text-slate-300 italic bg-slate-950/40 p-1.5 rounded border border-slate-800 line-clamp-2">
                            "{cit.content || cit.snippet}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response Telemetry & Actions */}
                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                    <div className="flex items-center space-x-3">
                      {data && (
                        <>
                          <span className="flex items-center space-x-1" title="Response Latency">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>
                              {data.latency_ms 
                                ? `${data.latency_ms}ms` 
                                : data.latency_seconds 
                                ? `${(data.latency_seconds * 1000).toFixed(0)}ms` 
                                : '< 50ms'}
                            </span>
                          </span>
                          <span className="hidden sm:inline-flex items-center space-x-1">
                            <Cpu className="w-3 h-3 text-slate-500" />
                            <span>{data.engine || 'FastAPI / RAG Engine'}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopy(message.text, message.id)}
                        className="p-1 hover:text-white rounded hover:bg-slate-700/50 transition flex items-center space-x-1"
                        title="Copy Answer"
                      >
                        {copiedId === message.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[10px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleToggleSpeech(message.text, message.id)}
                        className="p-1 hover:text-white rounded hover:bg-slate-700/50 transition flex items-center space-x-1"
                        title={speakingId === message.id ? "Stop Speech" : "Listen to Answer"}
                      >
                        {speakingId === message.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-3"
          >
            <div className="rounded-xl p-4 bg-slate-800/80 border border-slate-700 text-slate-200 text-xs flex items-center space-x-3 shadow-lg">
              <div className="flex space-x-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
              </div>
              <span className="text-slate-300 italic">
                Scanning ingested policy vectors & evaluating citations...
              </span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Query Input Area */}
      <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="e.g., What is the maximum limit for the disability pension?"
              disabled={isLoading}
              className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-sm rounded-lg px-4 py-3 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-60 pr-12"
            />
            {inputQuery && (
              <button
                type="button"
                onClick={() => setInputQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium px-5 py-3 rounded-lg text-sm transition flex items-center space-x-1.5 shadow-md flex-shrink-0"
          >
            <span>Ask</span>
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>Enterprise RAG mode: Answers strictly grounded in DIAV ingested chunks.</span>
          <span className="hidden sm:inline">Press Enter ↵ to submit</span>
        </div>
      </div>
    </div>
  );
};
