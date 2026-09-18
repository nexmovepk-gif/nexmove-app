'use client'
// src/app/deal-room/[id]/page.tsx
// Specific Deal Room Closing Desk

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import DealRoomView from '@/components/deal-room/DealRoomView'
import {
  ChevronLeft,
  Share2,
  Copy,
  Check,
  Building2,
  Lock,
  ExternalLink
} from 'lucide-react'

export default function SingleDealRoomPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string
  const [copied, setCopied] = useState(false)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 pb-24 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Link
              href="/deal-room"
              className="inline-flex items-center gap-1 text-xs font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              All Deal Rooms
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-xs font-mono font-bold text-stone-800 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200">
              Deal #{id?.slice(0, 10)}...
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-700 rounded-xl text-xs font-bold border border-stone-200 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Share Room Link</span>
                </>
              )}
            </button>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Live Deal Room Component */}
        <DealRoomView dealRoomId={id} />
      </div>
    </div>
  )
}
