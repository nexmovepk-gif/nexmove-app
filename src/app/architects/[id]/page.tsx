'use client'
// src/app/architects/[id]/page.tsx

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'

interface ArchitectDetail {
  id: string
  name: string
  title: string
  specialization: string
  bio: string
  avatarInitials: string
  avatarGradient: string
  councilLicenseNo: string
  verified: boolean
  experienceYears: number
  experienceLevel: string
  degrees?: string[]
  software: string[]
  projectTypes: string[]
  portfolioLinks: string[]
  portfolioImages: string[]
  avgRating: number
  reviewCount: number
  completedProjects: number
  location: string
  phone?: string
  availableForProjects: boolean
  joinedAt: string
}

// ─── Proposal Modal ───────────────────────────────────────────────────────────
function ProposalModal({ architect, onClose }: { architect: ArchitectDetail; onClose: () => void }) {
  const [agencyName, setAgencyName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [propertyListingId, setPropertyListingId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/architects/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ architectId: architect.id, architectName: architect.name, agencyName, contactEmail, propertyListingId, message }),
      })
      if (!res.ok) throw new Error('Failed to send proposal')
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send proposal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-black text-slate-100">Request Design Proposal</h2>
            <p className="text-xs text-slate-400 mt-0.5">Sending to <span className="text-teal-400 font-bold">{architect.name}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition text-lg leading-none">✕</button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 text-2xl">✓</div>
            <p className="text-sm font-bold text-teal-400">Proposal Sent Successfully!</p>
            <p className="text-xs text-slate-400 max-w-xs">Your request has been sent to {architect.name}. They will review and respond to your inquiry directly.</p>
            <button onClick={onClose} className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-5 py-2.5 rounded-xl transition font-medium">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">{error}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Agency / Company Name *</label>
                <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} placeholder="Premier Properties Agency" required className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Contact Email *</label>
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contact@agency.com" required className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Property Listing ID <span className="text-slate-600 font-normal">(optional)</span></label>
              <input type="text" value={propertyListingId} onChange={(e) => setPropertyListingId(e.target.value)} placeholder="e.g. lst_123456 — link to an active property listing" className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition font-mono" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Proposal Message *</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your project requirements, site details, budget range, and expected deliverables..." required rows={4} className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition resize-none" />
            </div>
            <div className="flex gap-2.5 pt-1">
              <button type="button" onClick={onClose} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2.5 rounded-xl transition font-medium">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Proposal Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ArchitectProfilePage() {
  const params = useParams()
  const id = params?.id as string
  const [architect, setArchitect] = useState<ArchitectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showProposal, setShowProposal] = useState(false)
  const [lightboxImg, setLightboxImg] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/public/architects/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Architect not found')
        return r.json()
      })
      .then((d) => setArchitect(d.architect))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500">Loading profile...</span>
        </div>
      </main>
    )
  }

  if (error || !architect) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center flex flex-col gap-4 max-w-sm">
          <div className="text-5xl">🏗️</div>
          <h1 className="text-lg font-black text-slate-200">Profile Not Found</h1>
          <p className="text-xs text-slate-500">This architect profile may be pending verification or unavailable.</p>
          <Link href="/architects" className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl transition">
            ← Back to Directory
          </Link>
        </div>
      </main>
    )
  }

  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(architect.avgRating))

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Hero Banner (portfolio collage) ────────────────────────── */}
      {architect.portfolioImages.length > 0 && (
        <div className="relative h-56 md:h-72 overflow-hidden">
          <div className="flex h-full">
            {architect.portfolioImages.slice(0, 4).map((img, idx) => (
              <div key={idx} className="flex-1 overflow-hidden">
                <Image src={img} alt="" fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-transparent to-slate-950" />
          {/* Back link */}
          <div className="absolute top-4 left-4">
            <Link href="/architects" className="text-xs bg-slate-950/70 backdrop-blur-sm border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl transition font-medium">
              ← Architects
            </Link>
          </div>
          {architect.availableForProjects && (
            <div className="absolute top-4 right-4">
              <span className="text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold px-3 py-1.5 rounded-xl">
                ● Available for Projects
              </span>
            </div>
          )}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* ── Profile Header ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${architect.avatarGradient} flex items-center justify-center text-white font-black text-2xl md:text-3xl flex-shrink-0 shadow-2xl -mt-12 md:-mt-14 ring-4 ring-slate-950`}>
            {architect.avatarInitials}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-2 flex-1 mt-0 md:mt-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black text-slate-50">{architect.name}</h1>
              <VerifiedBadge type="ARCHITECT" verified={architect.verified} size="md" />
            </div>
            <p className="text-sm text-slate-400">{architect.title}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span>📍 {architect.location}</span>
              <span>•</span>
              <span>{architect.experienceYears} years experience</span>
              <span>•</span>
              <span className={`font-medium ${architect.availableForProjects ? 'text-emerald-400' : 'text-slate-500'}`}>
                {architect.availableForProjects ? 'Available' : 'Currently Busy'}
              </span>
            </div>

            {/* Rating */}
            {architect.avgRating > 0 && (
              <div className="flex items-center gap-1.5">
                {stars.map((filled, i) => (
                  <span key={i} className={`text-sm ${filled ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
                ))}
                <span className="text-sm font-black text-amber-400">{architect.avgRating.toFixed(1)}</span>
                <span className="text-xs text-slate-500">({architect.reviewCount} reviews)</span>
              </div>
            )}
          </div>

          {/* Action */}
          <div className="flex flex-col gap-2 flex-shrink-0 w-full md:w-auto">
            <button
              onClick={() => setShowProposal(true)}
              className="w-full md:w-auto text-sm bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-3 rounded-xl transition shadow shadow-teal-900/60"
            >
              Request Design Proposal
            </button>
            {architect.portfolioLinks.length > 0 && (
              <a href={architect.portfolioLinks[0]} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto text-center text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-4 py-2.5 rounded-xl transition font-medium">
                View Portfolio ↗
              </a>
            )}
          </div>
        </div>

        {/* ── Stats Strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Projects Completed', value: architect.completedProjects },
            { label: 'Reviews', value: architect.reviewCount },
            { label: 'Experience (yrs)', value: architect.experienceYears },
          ].map((s) => (
            <div key={s.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-teal-400">{s.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── Left Column ──────────────────────────────────────────── */}
          <div className="md:col-span-2 flex flex-col gap-6">
            {/* Bio */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-sm font-black text-slate-200 mb-3">About</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{architect.bio}</p>
            </div>

            {/* Portfolio Gallery */}
            {architect.portfolioImages.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-slate-200">Project Gallery</h2>
                  <span className="text-[11px] text-slate-500">{architect.portfolioImages.length} images</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {architect.portfolioImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightboxImg(img)}
                      className="relative aspect-video overflow-hidden rounded-xl group"
                    >
                      <Image src={img} alt={`Project ${idx + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-300" unoptimized />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <span className="text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Portfolio Links */}
                {architect.portfolioLinks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
                    {architect.portfolioLinks.map((link, idx) => (
                      <a key={idx} href={link} target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-400 hover:text-teal-300 px-3 py-1.5 rounded-xl transition font-medium">
                        🔗 Portfolio {idx + 1} ↗
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right Column ─────────────────────────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* Credentials */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="text-sm font-black text-slate-200">Credentials</h2>

              {architect.councilLicenseNo && (
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Council License</span>
                  <span className="text-xs font-mono text-teal-400 bg-teal-950/30 border border-teal-900/40 px-2.5 py-1.5 rounded-lg">
                    {architect.councilLicenseNo}
                  </span>
                </div>
              )}

              {architect.degrees && architect.degrees.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Education</span>
                  {architect.degrees.map((d, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-teal-500 mt-0.5 text-xs">🎓</span>
                      <span className="text-xs text-slate-300 leading-snug">{d}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Experience Level</span>
                <span className="text-xs text-slate-300 font-medium">{architect.experienceLevel} · {architect.experienceYears} years</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Member Since</span>
                <span className="text-xs text-slate-400">{new Date(architect.joinedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Software */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
              <h2 className="text-sm font-black text-slate-200">Software</h2>
              <div className="flex flex-wrap gap-1.5">
                {architect.software.map((s) => (
                  <span key={s} className="text-xs bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2.5 py-1 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Project Types */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
              <h2 className="text-sm font-black text-slate-200">Project Expertise</h2>
              <div className="flex flex-wrap gap-1.5">
                {architect.projectTypes.map((p) => (
                  <span key={p} className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-medium">
                    {p}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setShowProposal(true)}
              className="w-full text-sm bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-3.5 rounded-xl transition shadow shadow-teal-900/60"
            >
              Send Design Proposal Request
            </button>
          </div>
        </div>
      </div>

      {/* ── Proposal Modal ──────────────────────────────────────────── */}
      {showProposal && <ProposalModal architect={architect} onClose={() => setShowProposal(false)} />}

      {/* ── Image Lightbox ──────────────────────────────────────────── */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-sm px-4" onClick={() => setLightboxImg(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <Image src={lightboxImg} alt="Portfolio" width={900} height={600} className="w-full h-auto rounded-2xl shadow-2xl max-h-[80vh] object-contain" unoptimized />
            <button onClick={() => setLightboxImg(null)} className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 text-lg w-9 h-9 rounded-full flex items-center justify-center transition">
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
