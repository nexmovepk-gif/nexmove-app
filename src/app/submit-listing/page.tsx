// src/app/submit-listing/page.tsx
import PublicListingForm from '@/components/PublicListingForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'List Your Property — NexMove Development',
  description: 'Submit your property directly to the NexMove public marketplace. Our AI automatically extracts details from your uploaded documents.',
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
          <Link href="/marketplace" className="text-xs text-slate-400 hover:text-slate-200 transition">Marketplace</Link>
          <Link href="/agencies" className="text-xs text-slate-400 hover:text-slate-200 transition">Agencies</Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Hero */}
        <div className="flex flex-col gap-3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-3 py-1 rounded-full w-fit">
            Free Listing
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100">
            List Your Property
          </h1>
          <p className="text-sm text-slate-400">
            Reach thousands of verified buyers and tenants. Upload your property documents — our AI will auto-extract details in seconds.
          </p>
          {/* Key USPs */}
          <div className="flex flex-wrap gap-2 mt-1">
            {['AI Auto-Fill', 'Free Forever', 'Verified Buyers', 'WhatsApp Inquiries'].map((tag) => (
              <span key={tag} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg font-medium">
                ✓ {tag}
              </span>
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
