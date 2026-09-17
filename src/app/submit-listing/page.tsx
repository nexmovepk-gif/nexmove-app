// src/app/submit-listing/page.tsx
import PublicListingForm from '@/components/PublicListingForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List Your Property Privately — NexMove',
  description: 'Submit your property privately to top 3 verified agencies in your area. Your listing stays off the public marketplace until an agency publishes it.',
}

export default function SubmitListingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-base font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          NexMove
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-slate-200 transition">My Dashboard</Link>
          <Link href="/agencies" className="text-xs text-slate-400 hover:text-slate-200 transition">Agencies</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Hero */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit">
            🔒 Private & Secure
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            List Your Property Privately
          </h1>
          <p className="text-sm text-slate-400">
            Your listing goes directly to the <span className="text-emerald-400 font-medium">top 3 verified agencies</span> in your area — not the public marketplace. Agencies review, value, and handle the sale for you.
          </p>
          {/* Key USPs */}
          <div className="flex flex-wrap gap-2 mt-1">
            {['AI Auto-Fill', 'Free to List', 'Top 3 Agencies Notified', 'Not on Marketplace'].map((tag) => (
              <span key={tag} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg font-medium">
                ✓ {tag}
              </span>
            ))}
          </div>

          {/* How it works */}
          <div className="flex flex-col gap-2 mt-1">
            {[
              { step: '1', text: 'Fill in your property details below' },
              { step: '2', text: 'Top 3 agencies in your city are notified instantly' },
              { step: '3', text: 'Agencies contact you with valuations & offers' },
              { step: '4', text: 'You choose the agency — they handle everything' },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <p className="text-xs text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 backdrop-blur-sm shadow-2xl">
          <PublicListingForm />
        </div>
      </div>
    </main>
  )
}

