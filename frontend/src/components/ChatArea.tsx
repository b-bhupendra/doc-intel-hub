import React, { useState } from 'react';
import { Send, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '../types';

export const ChatArea: React.FC<{ messages: ChatMessage[]; onSendMessage: (msg: string) => void }> = ({
  messages,
  onSendMessage
}) => {
  const [input, setInput] = useState('');
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`p-4 rounded-xl ${m.sender === 'user' ? 'bg-blue-600 text-white ml-auto max-w-xl' : 'bg-slate-900 border border-slate-800 max-w-3xl'}`}>
            <ReactMarkdown className="prose prose-invert text-sm">{m.text}</ReactMarkdown>
            <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-2">
              <Clock className="w-3 h-3" />
              <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSendMessage(input); setInput(''); }} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 p-3 rounded-lg text-sm" placeholder="Ask a question..." />
        <button type="submit" className="bg-blue-600 px-5 py-3 rounded-lg text-white font-medium flex items-center space-x-1"><Send className="w-4 h-4" /><span>Send</span></button>
      </form>
    </div>
  );
};