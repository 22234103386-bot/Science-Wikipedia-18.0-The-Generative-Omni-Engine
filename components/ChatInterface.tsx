import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  botName: string;
  isTyping: boolean;
  suggestions: string[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  botName, 
  isTyping,
  suggestions 
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-l border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center gap-2 bg-zinc-950">
        <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center border border-cyan-500/30">
          <Bot size={18} className="text-cyan-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">{botName}</h3>
          <p className="text-xs text-zinc-400">Omni-Engine Assistant</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 rounded-2xl px-4 py-3 rounded-bl-none border border-zinc-700 flex gap-1">
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-75" />
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-150" />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && messages.length < 3 && (
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
            {suggestions.map((s, i) => (
                <button 
                    key={i}
                    onClick={() => onSendMessage(s)}
                    className="whitespace-nowrap px-3 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-full text-xs text-cyan-400 transition-colors"
                >
                    {s}
                </button>
            ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about the simulation..."
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-600"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
