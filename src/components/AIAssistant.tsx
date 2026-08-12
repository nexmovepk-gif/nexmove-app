'use client';

import React, { useState } from 'react';

interface ChatMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const KNOWLEDGE_BASE: Record<string, string> = {
  deal: 'The **Shielded Deal Engine** isolates client identities (names and phone numbers) behind alias codes like "Buyer #408". Only authorized agency admins can unmask confidential notes and identities.',
  escrow: 'When a buyer clicks **Pay Token / Reserve Property**, funds are placed in a secure **NexMove Escrow Vault**. Token payments are strictly **Non-Refundable** if the buyer cancels the deal.',
  cobroker: 'The **Co-Brokering Network** lets agencies search listings from trusted partner agencies. When a deal is closed jointly, commissions are automatically split 50/50.',
  rent: 'In **Rent Collections**, you can generate official PDF invoices and send instant payment reminders to tenants via SMS/WhatsApp.',
  verify: 'The **Verified Agency Badge** is granted once business registration and Land Department broker licenses are authenticated by NexMove admin.',
  ai: 'NexMove AI automatically parses Title Deeds, Lease Agreements, and Blueprints to auto-extract prices, bedrooms, sqft, and generate Market Valuations.',
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai',
      text: 'Hello! I am your NexMove AI Support Assistant. Ask me anything about Deal Shielding, Non-Refundable Tokens, Co-Brokering, or AI Document Extraction!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');

    // Generate intelligent AI response
    setTimeout(() => {
      let aiText = 'I can assist with NexMove features! Try asking about deal pipeline shielding, non-refundable token escrow, co-brokering splits, or PDF rent invoicing.';
      const lower = query.toLowerCase();

      if (lower.includes('deal') || lower.includes('shield') || lower.includes('privacy')) {
        aiText = KNOWLEDGE_BASE.deal;
      } else if (lower.includes('token') || lower.includes('escrow') || lower.includes('reserve') || lower.includes('refund')) {
        aiText = KNOWLEDGE_BASE.escrow;
      } else if (lower.includes('broker') || lower.includes('network') || lower.includes('partner')) {
        aiText = KNOWLEDGE_BASE.cobroker;
      } else if (lower.includes('rent') || lower.includes('invoice') || lower.includes('tenant')) {
        aiText = KNOWLEDGE_BASE.rent;
      } else if (lower.includes('verify') || lower.includes('badge')) {
        aiText = KNOWLEDGE_BASE.verify;
      } else if (lower.includes('document') || lower.includes('ocr') || lower.includes('blueprint') || lower.includes('extract')) {
        aiText = KNOWLEDGE_BASE.ai;
      }

      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 600);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expanded Widget Chat Window */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-slate-900 border border-slate-700 shadow-2xl rounded-3xl overflow-hidden flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-emerald-950 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-lg">
                🤖
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">NexMove Support AI</h3>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active PropTech Specialist
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-lg font-bold w-7 h-7 rounded-full flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="bg-slate-950/60 px-4 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] whitespace-nowrap">
            <button
              onClick={() => handleSend('How does Deal Shielding work?')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg border border-slate-700 transition"
            >
              🛡️ Deal Shielding
            </button>
            <button
              onClick={() => handleSend('Explain Token Escrow Policy')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg border border-slate-700 transition"
            >
              🔒 Token Escrow
            </button>
            <button
              onClick={() => handleSend('How to use Co-Brokering Search?')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg border border-slate-700 transition"
            >
              🤝 Co-Brokering
            </button>
          </div>

          {/* Message List */}
          <div className="p-4 h-72 overflow-y-auto flex flex-col gap-3 bg-slate-950/40">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow'
                      : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask AI Assistant..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow"
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 border border-emerald-500/40 transition transform hover:scale-105"
        >
          <span className="text-xl">🤖</span>
          <span className="text-xs font-bold">NexMove AI Assistant</span>
          <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
        </button>
      )}
    </div>
  );
}
