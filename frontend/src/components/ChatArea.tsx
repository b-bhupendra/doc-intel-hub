import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { ChatMessage } from '../types';

export const ChatArea: React.FC<{ messages: ChatMessage[]; onSendMessage: (msg: string) => void }> = ({
  messages,
  onSendMessage
}) => {
  const [input, setInput] = useState('');
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`p-3 rounded-lg ${m.sender === 'user' ? 'bg-blue-600' : 'bg-slate-800'}`}>
            {m.text}
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); onSendMessage(input); setInput(''); }} className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-slate-900 border p-2 rounded" placeholder="Ask a question..." />
        <button type="submit" className="bg-blue-600 px-4 py-2 rounded text-white"><Send className="w-4 h-4" /></button>
      </form>
    </div>
  );
};