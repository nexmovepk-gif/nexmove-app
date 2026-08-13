'use client'
// src/components/AIAssistant.tsx
// NexMove Support AI — Autonomous, context-aware, tri-language PropTech assistant

import React, { useState, useRef, useEffect } from 'react'
import { processQuery, type Language } from '@/lib/chatEngine'

interface ChatMessage {
  sender: 'ai' | 'user'
  text: string
  timestamp: string
  lang?: Language
  intent?: string
}

const LANG_BADGE: Record<Language, { label: string; color: string }> = {
  en: { label: 'EN', color: 'bg-sky-600' },
  roman_urdu: { label: 'RU', color: 'bg-violet-600' },
  urdu_script: { label: 'UR', color: 'bg-amber-600' },
}

const QUICK_CHIPS = [
  { label: '💰 Pricing Plans', query: 'What are the subscription plans and pricing?' },
  { label: '🏦 How to Pay', query: 'How do I pay via Meezan Bank?' },
  { label: '🛡️ Deal Shielding', query: 'How does deal shielding and privacy work?' },
  { label: '🔒 Escrow Vault', query: 'Explain the smart escrow milestone system' },
  { label: '🌐 Investor Portal', query: 'Tell me about the Investor Portal for overseas Pakistanis' },
  { label: '🏢 Register Agency', query: 'How do I register my agency on NexMove?' },
  { label: '📄 AI Contracts', query: 'How does the AI Legal Contract generator work?' },
  { label: '🧮 FBR Tax', query: 'How does FBR tax integration work?' },
]

const INITIAL_MESSAGE: ChatMessage = {
  sender: 'ai',
  text: `Hello! I'm your NexMove Support AI — powered by full platform knowledge. 🏙️\n\nI can answer any question about:\n• Subscription Plans (PKR 5k / 15k / 40k)\n• Meezan Bank payment process\n• Agency / Investor / Architect registration\n• Escrow Vault & KYC verification\n• Deal Shielding & data privacy\n\nYou can also ask me in Roman Urdu or Urdu script — I'll respond in your language! 🇵🇰`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  lang: 'en',
}

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 items-center px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none w-fit">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.sender === 'user'
  const badge = msg.lang && !isUser ? LANG_BADGE[msg.lang] : null

  return (
    <div className={`flex flex-col max-w-[88%] ${isUser ? 'self-end items-end' : 'self-start items-start'}`}>
      <div
        className={`relative p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-900/30'
            : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none shadow'
        }`}
      >
        {msg.text}
      </div>
      <div className="flex items-center gap-1.5 mt-1 px-1">
        {badge && (
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md text-white ${badge.color}`}>
            {badge.label}
          </span>
        )}
        <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
      </div>
    </div>
  )
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chipsCollapsed, setChipsCollapsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? input).trim()
    if (!query) return
    if (!textToSend) setInput('')

    const userMsg: ChatMessage = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    // Simulate AI thinking delay proportional to response complexity
    const thinkMs = 600 + Math.min(query.length * 6, 900)
    setTimeout(() => {
      const { response, detectedLanguage, intent } = processQuery(query)
      const aiMsg: ChatMessage = {
        sender: 'ai',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: detectedLanguage,
        intent,
      }
      setIsTyping(false)
      setMessages((prev) => [...prev, aiMsg])
    }, thinkMs)
  }

  const chatHeight = isExpanded ? 'h-[520px]' : 'h-72'
  const chatWidth = isExpanded ? 'w-[420px] sm:w-[480px]' : 'w-80 sm:w-96'

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

      {/* ── Expanded Chat Window ──────────────────────────────────────────── */}
      {isOpen && (
        <div
          className={`${chatWidth} bg-slate-950 border border-slate-700/80 shadow-2xl shadow-black/60 rounded-3xl overflow-hidden flex flex-col mb-4 transition-all duration-300`}
          style={{ animation: 'slideUpFadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 px-5 py-3.5 border-b border-slate-700/60 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-500/30 to-emerald-600/20 border border-teal-500/40 flex items-center justify-center text-lg">
                  🤖
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white leading-tight tracking-tight">NexMove Support AI</h3>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Autonomous PropTech Specialist
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Expand/Collapse toggle */}
              <button
                onClick={() => setIsExpanded((v) => !v)}
                title={isExpanded ? 'Compact view' : 'Expand view'}
                className="text-slate-500 hover:text-slate-200 w-7 h-7 rounded-lg flex items-center justify-center transition hover:bg-slate-800"
              >
                {isExpanded ? '⊡' : '⊞'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white w-7 h-7 rounded-lg flex items-center justify-center transition hover:bg-slate-800 ml-1"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Language Capability Badge */}
          <div className="bg-slate-900/80 border-b border-slate-800 px-4 py-1.5 flex items-center gap-2">
            <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Auto Language:</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-600 text-white font-bold">EN</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-600 text-white font-bold">Roman Urdu</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-600 text-white font-bold">اردو</span>
            <span className="text-[9px] text-slate-600 ml-auto">Full codebase context ✓</span>
          </div>

          {/* Quick Chip Topics */}
          {!chipsCollapsed && (
            <div className="bg-slate-950/90 px-3 py-2 border-b border-slate-800/60 flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Quick Topics</span>
                <button
                  onClick={() => setChipsCollapsed(true)}
                  className="text-[9px] text-slate-600 hover:text-slate-400 transition"
                >
                  Hide ↑
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                {QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => handleSend(chip.query)}
                    className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-600 text-slate-300 hover:text-teal-300 rounded-lg transition whitespace-nowrap font-medium"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chipsCollapsed && (
            <button
              onClick={() => setChipsCollapsed(false)}
              className="bg-slate-900/80 border-b border-slate-800 px-4 py-1 text-[9px] text-slate-600 hover:text-slate-400 transition text-center w-full"
            >
              Show quick topics ↓
            </button>
          )}

          {/* Message List */}
          <div className={`p-4 ${chatHeight} overflow-y-auto flex flex-col gap-3 bg-slate-950/60 transition-all duration-300`}>
            {messages.map((m, idx) => (
              <MessageBubble key={idx} msg={m} />
            ))}
            {isTyping && (
              <div className="self-start flex flex-col gap-1">
                <TypingIndicator />
                <span className="text-[9px] text-slate-600 px-1">NexMove AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Privacy Assurance Strip */}
          <div className="bg-slate-900/60 border-t border-slate-800/60 px-4 py-1.5 flex items-center gap-2">
            <span className="text-[9px] text-slate-600">🔐</span>
            <span className="text-[9px] text-slate-600 leading-tight">
              All deal data, client identities &amp; negotiations are 100% encrypted and isolated.
            </span>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 flex-shrink-0"
          >
            <input
              ref={inputRef}
              id="nexmove-ai-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask in English, Roman Urdu, or اردو..."
              disabled={isTyping}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow disabled:opacity-50"
            >
              {isTyping ? '...' : 'Send'}
            </button>
          </form>
        </div>
      )}

      {/* ── Floating Toggle Button ───────────────────────────────────────── */}
      <button
        id="nexmove-ai-toggle"
        onClick={() => setIsOpen((v) => !v)}
        className={`group relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-5 py-3 rounded-full shadow-2xl shadow-emerald-900/50 flex items-center gap-2.5 border border-emerald-500/30 transition-all duration-200 hover:scale-105`}
      >
        <span className="text-xl">{isOpen ? '✕' : '🤖'}</span>
        {!isOpen && (
          <>
            <div className="flex flex-col items-start">
              <span className="text-xs font-black leading-tight">NexMove AI</span>
              <span className="text-[9px] text-emerald-200 leading-tight">PropTech Specialist</span>
            </div>
            {/* Unread pulse indicator */}
            <span className="relative flex">
              <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
          </>
        )}
      </button>

      {/* CSS animation keyframe injected inline */}
      <style>{`
        @keyframes slideUpFadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
