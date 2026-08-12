'use client'
// src/app/architects/page.tsx

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Architect {
  id: string
  name: string
  title: string
  specialization: string
  bio: string
  avatarInitials: string
  avatarGradient: string
  verified: boolean
  verificationStatus: string
  experienceYears: number
  experienceLevel: string
  software: string[]
  projectTypes: string[]
  portfolioImages: string[]
  avgRating: number
  reviewCount: number
  completedProjects: number
  location: string
  availableForProjects: boolean
}

// ─── Filter Options ───────────────────────────────────────────────────────────
const SPECIALIZATIONS = ['All', '3D Visualizer', 'BIM Specialist', 'Revit Technician', 'Interior Designer', 'Landscape Architect']
const SOFTWARE_OPTIONS = ['Revit', 'AutoCAD', '3ds Max', 'Lumion', 'SketchUp', 'Navisworks', 'Enscape', 'V-Ray']
const EXPERIENCE_LEVELS = ['All', 'Junior', 'Mid-Level', 'Senior', 'Principal']
const PROJECT_TYPES = ['All', 'Residential', 'Commercial', 'High-Rise', 'Luxury Villas', 'Urban Planning']

// ─── Proposal Modal ───────────────────────────────────────────────────────────
function ProposalModal({ architect, onClose }: { architect: Architect; onClose: () => void }) {
  const [agencyName, setAgencyName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
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
        body: JSON.stringify({
          architectId: architect.id,
          architectName: architect.name,
          agencyName,
          contactEmail,
          message,
        }),
      })
      if (!res.ok) throw new Error('Failed to send proposal')
      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send proposal'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-slate-100">Request Design Proposal</h2>
            <p className="text-xs text-slate-400 mt-0.5">Sending to <span className="text-teal-400 font-bold">{architect.name}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition text-lg leading-none mt-0.5">✕</button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-2xl">✓</div>
            <p className="text-sm font-bold text-teal-400">Proposal Sent Successfully!</p>
            <p className="text-xs text-slate-400">Your design proposal request has been delivered to {architect.name}. They will contact you shortly.</p>
            <button onClick={onClose} className="mt-2 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2 rounded-xl transition font-medium">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
                {error}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Agency / Company Name *</label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Premier Properties Agency"
                required
                className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Contact Email *</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@agency.com"
                required
                className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Proposal Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your project requirements, timelines, and what you're looking for..."
                required
                rows={4}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition resize-none"
              />
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2.5 rounded-xl transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold py-2.5 rounded-xl transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Proposal Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Architect Card ───────────────────────────────────────────────────────────
function ArchitectCard({ architect, onPropose }: { architect: Architect; onPropose: (a: Architect) => void }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.round(architect.avgRating))
  return (
    <div className="group bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-teal-500/30 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-teal-950/40 flex flex-col">
      {/* Portfolio Thumbnail Strip */}
      {architect.portfolioImages.length > 0 && (
        <div className="relative h-32 overflow-hidden flex-shrink-0">
          <div className="flex h-full">
            {architect.portfolioImages.slice(0, 3).map((img, idx) => (
              <div key={idx} className="flex-1 overflow-hidden">
                <Image
                  src={img}
                  alt={`${architect.name} portfolio ${idx + 1}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/80" />
          {/* Availability pill */}
          <div className="absolute top-2.5 right-2.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              architect.availableForProjects
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-500'
            }`}>
              {architect.availableForProjects ? '● Available' : '○ Busy'}
            </span>
          </div>
        </div>
      )}

      {/* Card Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Avatar + Name */}
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${architect.avatarGradient} flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg`}>
            {architect.avatarInitials}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <Link href={`/architects/${architect.id}`} className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition truncate">
              {architect.name}
            </Link>
            <span className="text-[10px] text-slate-400 truncate">{architect.title}</span>
            <span className="text-[10px] text-slate-600">{architect.location}</span>
          </div>
        </div>

        {/* Verified Badge & Exp */}
        <div className="flex flex-wrap items-center gap-1.5">
          <VerifiedBadge type="ARCHITECT" verified={architect.verified} />
          <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-medium">
            {architect.experienceLevel}
          </span>
          <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-medium">
            {architect.experienceYears}y exp
          </span>
        </div>

        {/* Bio */}
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{architect.bio}</p>

        {/* Software Tags */}
        <div className="flex flex-wrap gap-1">
          {architect.software.slice(0, 4).map((s) => (
            <span key={s} className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">
              {s}
            </span>
          ))}
          {architect.software.length > 4 && (
            <span className="text-[10px] text-slate-500 px-1 py-0.5">+{architect.software.length - 4}</span>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-1">
            {stars.map((filled, i) => (
              <span key={i} className={`text-[10px] ${filled ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
            ))}
            <span className="text-[10px] font-bold text-amber-400 ml-0.5">{architect.avgRating > 0 ? architect.avgRating.toFixed(1) : '—'}</span>
            {architect.reviewCount > 0 && (
              <span className="text-[10px] text-slate-600">({architect.reviewCount})</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500">{architect.completedProjects} projects</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Link
            href={`/architects/${architect.id}`}
            className="flex-1 text-center text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-2 rounded-xl transition"
          >
            View Profile
          </Link>
          <button
            onClick={() => onPropose(architect)}
            className="flex-1 text-[11px] bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 rounded-xl transition shadow shadow-teal-900/50"
          >
            Request Proposal
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ArchitectsPage() {
  const [architects, setArchitects] = useState<Architect[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalTarget, setProposalTarget] = useState<Architect | null>(null)

  // Filters
  const [specialization, setSpecialization] = useState('All')
  const [experienceLevel, setExperienceLevel] = useState('All')
  const [projectType, setProjectType] = useState('All')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([])

  const toggleSoftware = (s: string) => {
    setSelectedSoftware((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const fetchArchitects = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (specialization !== 'All') params.set('specialization', specialization)
    if (selectedSoftware.length > 0) params.set('software', selectedSoftware[0]) // API filters by one; client can refine
    if (experienceLevel !== 'All') params.set('experienceLevel', experienceLevel)
    if (projectType !== 'All') params.set('projectType', projectType)
    if (verifiedOnly) params.set('verifiedOnly', 'true')

    const res = await fetch(`/api/public/architects?${params.toString()}`)
    const data = await res.json()
    let results: Architect[] = data.architects || []

    // Client-side multi-software filter
    if (selectedSoftware.length > 0) {
      results = results.filter((a) =>
        selectedSoftware.every((sw) => a.software.some((s) => s.toLowerCase().includes(sw.toLowerCase())))
      )
    }

    setArchitects(results)
    setLoading(false)
  }, [specialization, selectedSoftware, experienceLevel, projectType, verifiedOnly])

  useEffect(() => { fetchArchitects() }, [fetchArchitects])

  const clearFilters = () => {
    setSpecialization('All')
    setSelectedSoftware([])
    setExperienceLevel('All')
    setProjectType('All')
    setVerifiedOnly(false)
  }

  const hasActiveFilters = specialization !== 'All' || selectedSoftware.length > 0 || experienceLevel !== 'All' || projectType !== 'All' || verifiedOnly

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-800/60">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/60 via-slate-950 to-violet-950/40" />
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(20,184,166,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.3) 0%, transparent 50%)' }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-14 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold bg-teal-500/15 border border-teal-500/30 text-teal-400 px-3 py-1 rounded-full uppercase tracking-widest">
              NexMove Professional Network
            </span>
            <span className="text-[11px] text-slate-500">All architects are council-verified</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-50">
            Architects &{' '}
            <span className="bg-gradient-to-r from-teal-400 to-violet-400 bg-clip-text text-transparent">
              Designers
            </span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Connect with verified architecture and design professionals — from BIM specialists and 3D visualizers to interior designers and landscape architects.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link
              href="/architects/register"
              className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl transition shadow shadow-teal-900/60"
            >
              + Join as Architect
            </Link>
            <a
              href="#directory"
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium px-4 py-2.5 rounded-xl transition"
            >
              Browse Directory ↓
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ──────────────────────────────────────────────── */}
      <div className="border-b border-slate-800/60 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap gap-6">
          {[
            { label: 'Verified Professionals', value: '6+' },
            { label: 'Specializations', value: '5' },
            { label: 'Avg. Rating', value: '4.8★' },
            { label: 'Completed Projects', value: '333+' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2">
              <span className="text-sm font-black text-teal-400">{stat.value}</span>
              <span className="text-xs text-slate-500">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div id="directory" className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* ── Filters ────────────────────────────────────────────────── */}
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200">Filter Professionals</h2>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[11px] text-slate-500 hover:text-slate-300 transition underline underline-offset-2">
                  Clear all
                </button>
              )}
              {/* Verified Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => setVerifiedOnly((v) => !v)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${verifiedOnly ? 'bg-teal-600' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${verifiedOnly ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-xs font-medium text-slate-300">Verified Only</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Specialization */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role / Specialization</label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition"
              >
                {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Experience Level */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition"
              >
                {EXPERIENCE_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            {/* Project Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Project Type</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition"
              >
                {PROJECT_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* Software Multi-Select */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Software Stack</label>
            <div className="flex flex-wrap gap-2">
              {SOFTWARE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSoftware(s)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${
                    selectedSoftware.includes(s)
                      ? 'bg-violet-600 border-violet-500 text-white shadow shadow-violet-900/50'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Results Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-200">
              {loading ? 'Loading...' : `${architects.length} Professional${architects.length !== 1 ? 's' : ''} Found`}
            </h2>
            {hasActiveFilters && !loading && (
              <p className="text-[11px] text-slate-500 mt-0.5">Filtered results — <button onClick={clearFilters} className="text-teal-500 hover:text-teal-400 underline underline-offset-2">clear filters</button></p>
            )}
          </div>
        </div>

        {/* ── Grid ───────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-32 bg-slate-800" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 bg-slate-800 rounded-xl" />
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="h-3.5 bg-slate-800 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-800/60 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-2.5 bg-slate-800/40 rounded w-full" />
                  <div className="h-2.5 bg-slate-800/40 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : architects.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-3xl">🔍</div>
            <h3 className="text-base font-bold text-slate-300">No professionals found</h3>
            <p className="text-xs text-slate-500 max-w-xs">Try adjusting your filters or removing some criteria to see more results.</p>
            <button onClick={clearFilters} className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2 rounded-xl transition">
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {architects.map((architect) => (
              <ArchitectCard key={architect.id} architect={architect} onPropose={setProposalTarget} />
            ))}
          </div>
        )}

        {/* ── CTA Footer ──────────────────────────────────────────────── */}
        <div className="mt-4 rounded-2xl border border-teal-500/20 bg-gradient-to-r from-teal-950/40 to-violet-950/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-100">Are you an architect or designer?</h3>
            <p className="text-xs text-slate-400 mt-1">Join NexMove&apos;s verified professional network and connect with top real estate agencies.</p>
          </div>
          <Link
            href="/architects/register"
            className="flex-shrink-0 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-3 rounded-xl transition shadow shadow-teal-900/60 whitespace-nowrap"
          >
            Apply for Verification →
          </Link>
        </div>
      </div>

      {/* ── Proposal Modal ──────────────────────────────────────────── */}
      {proposalTarget && (
        <ProposalModal architect={proposalTarget} onClose={() => setProposalTarget(null)} />
      )}
    </main>
  )
}
