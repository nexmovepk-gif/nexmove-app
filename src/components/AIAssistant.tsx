'use client'
// src/components/AIAssistant.tsx
// NexMove Brain — Minimalist Off-White Real-Time AI Chatbot

import React, { useState, useRef, useEffect } from 'react'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Assalam o Alaikum! I am **NexMove Brain**. How can I assist you today?',
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, messages])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    const userMsg: ChatMessage = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    setInput('')
    setIsStreaming(true)

    // Add empty assistant response placeholder
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to get response')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const textChunk = decoder.decode(value, { stream: true })
        accumulated += textChunk

        setMessages((prev) => {
          const next = [...prev]
          if (next.length > 0) {
            next[next.length - 1] = {
              role: 'assistant',
              content: accumulated,
            }
          }
          return next
        })
      }
    } catch {
      setMessages((prev) => {
        const next = [...prev]
        if (next.length > 0) {
          next[next.length - 1] = {
            role: 'assistant',
            content: 'Sorry, I encountered an issue connecting to the AI engine. Please try again.',
          }
        }
        return next
      })
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Minimal Floating Launcher Button */}
      {!isOpen && (
        <button
          id="nexmove-brain-open-btn"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#FAF9F6] text-slate-800 rounded-full shadow-lg border border-stone-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-200 group"
          title="Open NexMove Brain AI"
        >
          <div className="w-7 h-7 rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center">
            <img src="/logo.png" alt="NexMove" className="w-full h-full object-cover" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-stone-700 group-hover:text-emerald-700">
            NexMove Brain
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      )}

      {/* Minimal Off-White Chat Window */}
      {isOpen && (
        <div
          id="nexmove-brain-window"
          className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] h-[580px] max-h-[85vh] bg-[#F8F9FA] rounded-2xl shadow-2xl border border-stone-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Minimal Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#FAF9F6] border-b border-stone-200/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center">
                <img src="/logo.png" alt="NexMove Brain" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-stone-800">NexMove Brain</h3>
                <p className="text-[10px] text-stone-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Online
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg hover:bg-stone-200/70 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors text-sm"
              title="Close Chat"
            >
              ✕
            </button>
          </div>

          {/* Chatplace (Conversation Area) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8F9FA]">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              return (
                <div
                  key={i}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[90%] ${
                    isUser ? 'ml-auto' : 'mr-auto'
                  }`}
                >
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-stone-900 text-white rounded-br-sm shadow-sm'
                        : 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.content ? (
                      msg.content
                    ) : (
                      <span className="inline-flex items-center gap-1 text-stone-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-bounce [animation-delay:0.4s]" />
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Enging (Input & Send Area) */}
          <div className="p-3 bg-[#FAF9F6] border-t border-stone-200/80">
            <form onSubmit={handleSend} className="relative flex items-center">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about Pakistan real estate, taxes, deals..."
                rows={1}
                disabled={isStreaming}
                className="w-full pl-3.5 pr-12 py-2.5 bg-white text-stone-900 text-xs rounded-xl border border-stone-300/80 focus:outline-none focus:border-stone-500 focus:ring-1 focus:ring-stone-400 resize-none transition-all placeholder:text-stone-400 disabled:opacity-60"
                style={{ minHeight: '40px', maxHeight: '100px' }}
              />

              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="absolute right-2 w-7 h-7 rounded-lg bg-stone-900 hover:bg-stone-800 text-white disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm"
                title="Send Message"
              >
                {isStreaming ? (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </form>
            <div className="mt-1 text-center">
              <span className="text-[10px] text-stone-400">Press Enter to send • Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
