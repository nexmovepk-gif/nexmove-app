'use client'
// src/app/architects/page.tsx
// LinkedIn-Style Public Architects & Designers Directory — Off-White Light Theme + Search Highlighting

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'

interface Project {
  id: string
  title: string
  description?: string | null
  category?: string | null
  software: string[]
  imageUrl?: string | null
  imageUrls?: string[]
  videoUrl?: string | null
  tags?: string[]
  completedYear?: number | null
}

interface Architect {
  id: string
  name: string
  title: string
  specialization: string
  companyName?: string | null
  isOverseas?: boolean
  country?: string | null
  city?: string | null
  pcatpNo?: string | null
  phone?: string | null
  bio: string
  avatarInitials: string
  avatarGradient: string
  avatarUrl?: string | null
  coverImage?: string | null
  councilLicenseNo: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  verified: boolean
  experienceYears: number
  experienceLevel: string
  software: string[]
  projectTypes: string[]
  portfolioLinks: string[]
  portfolioImages: string[]
  projects?: Project[]
  avgRating: number
  reviewCount: number
  completedProjects: number
  location: string
  availableForProjects: boolean
  joinedAt: string
}

interface PageStats {
  verifiedCount: number
  specializationsCount: number
  avgRating: number
  completedProjectsCount: number
}

const STATS_DEFAULTS: PageStats = {
  verifiedCount: 0,
  specializationsCount: 0,
  avgRating: 0,
  completedProjectsCount: 0,
}

// ── Highlight matching text in a string ──────────────────────────────────────
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5 not-italic font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// ── Direct Proposal Modal ─────────────────────────────────────────────────────
function RequestProposalModal({ architect, onClose }: { architect: Architect; onClose: () => void }) {
  const [agencyName, setAgencyName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [messageText, setMessageText] = useState('')
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
          message: messageText,
        }),
      })
      if (!res.ok) throw new Error('Failed to send proposal request')
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Request Design Proposal</h3>
            <p className="text-xs text-slate-500">
              Sending request to{' '}
              <span className="text-teal-700 font-bold">{architect.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition text-lg">✕</button>
        </div>

        {success ? (
          <div className="py-6 text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center font-bold">✓</div>
            <p className="text-xs font-bold text-emerald-700">Proposal Request Sent!</p>
            <p className="text-xs text-slate-500">The architect will be in touch directly.</p>
            <button onClick={onClose} className="mt-2 text-xs bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-xl">{error}</div>}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Your Name / Agency *</label>
              <input type="text" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} required placeholder="Premier Developers" className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Email Address *</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required placeholder="contact@firm.com" className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Project Requirements</label>
              <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={3} placeholder="Describe plot area, architectural style, 3D render requirements..." className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 resize-none" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl transition shadow disabled:opacity-50">
              {loading ? 'Sending...' : 'Submit Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ArchitectsPage() {
  const [architects, setArchitects] = useState<Architect[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalTarget, setProposalTarget] = useState<Architect | null>(null)
  const [stats, setStats] = useState<PageStats>(STATS_DEFAULTS)

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [specialization, setSpecialization] = useState('All')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const fetchArchitects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (specialization !== 'All') params.set('specialization', specialization)
      if (verifiedOnly) params.set('verifiedOnly', 'true')

      const res = await fetch(`/api/public/architects?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      setArchitects(data.architects || [])
      if (data.stats) {
        setStats(data.stats)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [specialization, verifiedOnly])

  useEffect(() => {
    fetchArchitects()
  }, [fetchArchitects])

  // Search relevance filter — also checks tags and project titles
  const filteredArchitects = architects.filter((arch) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      arch.name.toLowerCase().includes(q) ||
      arch.specialization.toLowerCase().includes(q) ||
      (arch.city || '').toLowerCase().includes(q) ||
      arch.location.toLowerCase().includes(q) ||
      (arch.companyName || '').toLowerCase().includes(q) ||
      arch.software.some((s) => s.toLowerCase().includes(q)) ||
      arch.projects?.some(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.software.some((s) => s.toLowerCase().includes(q))
      )
    )
  })

  // Sort: verified first, then by rating
  const sortedArchitects = [...filteredArchitects].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1
    return b.avgRating - a.avgRating
  })

  const q = searchQuery.trim()

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-slate-900 pb-16 font-sans">

      {/* ── Off-White Hero with Teal Accents ─────────────────────────── */}
      <section className="bg-white border-b border-slate-200 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Top row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-3 max-w-xl">
              {/* Breadcrumb pill */}
              <div className="flex items-center gap-2">
                <Link href="/" className="text-xs text-slate-500 hover:text-teal-700 font-medium transition">Home</Link>
                <span className="text-slate-300 text-xs">›</span>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  Architect Directory
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏛️</span>
                  <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    Architects & Designers
                  </h1>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Discover top-rated 3D visualizers, BIM specialists, Revit experts, and{' '}
                  <span className="text-teal-700 font-semibold">PCATP licensed</span> architects for
                  residential & commercial property developments in Pakistan.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 mt-1">
                <Link
                  href="/architects/register"
                  className="text-xs bg-teal-700 hover:bg-teal-600 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-md shadow-teal-500/20 flex items-center gap-1.5"
                >
                  <span>+</span>
                  <span>Join as Verified Architect</span>
                </Link>
                <Link
                  href="/architects/login"
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
                >
                  <span>📐</span>
                  <span>Architect Login</span>
                </Link>
              </div>
            </div>

            {/* Aggregate Stats — light card */}
            <div className="bg-[#f8fafc] border border-slate-200 p-5 rounded-2xl flex flex-col gap-3 min-w-[220px] shadow-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Platform Stats</h3>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Verified Pros</span>
                <span className="text-lg font-black text-teal-700">{stats.verifiedCount}+</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-2">
                <span className="text-xs text-slate-500">Specializations</span>
                <span className="text-lg font-black text-teal-700">{stats.specializationsCount}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/80 pt-2">
                <span className="text-xs text-slate-500">Avg. Rating</span>
                <span className="text-lg font-black text-amber-500">
                  {stats.avgRating > 0 ? `${stats.avgRating.toFixed(1)}★` : '0.0★'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Search & Filters ─────────────────────────────────────── */}
          <div className="mt-6 bg-[#f8fafc] border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-3">
            {/* Keyword Search */}
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search: '3D Render', 'Residential', 'AutoCAD', 'Lahore'..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 font-medium transition shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Specialization Filter */}
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-500 transition shadow-sm"
            >
              <option value="All">All Specializations</option>
              <option value="3D Visualizer">3D Visualizer</option>
              <option value="BIM Specialist">BIM Specialist</option>
              <option value="Revit Technician">Revit Technician</option>
              <option value="Interior Designer">Interior Designer</option>
              <option value="Landscape Architect">Landscape Architect</option>
              <option value="Urban Planner">Urban Planner</option>
            </select>

            {/* Verified Only */}
            <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700">Verified Only</span>
            </label>
          </div>
        </div>
      </section>

      {/* ── Directory Grid ────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Result count row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-700">
              {loading ? 'Loading...' : `${sortedArchitects.length} Architect${sortedArchitects.length !== 1 ? 's' : ''} found`}
            </h2>
            {searchQuery && !loading && (
              <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 font-bold px-2.5 py-0.5 rounded-full">
                Matching &ldquo;{searchQuery}&rdquo;
              </span>
            )}
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-teal-700 font-bold hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="w-10 h-10 border-[3px] border-teal-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Fetching verified architect profiles...</p>
          </div>
        ) : sortedArchitects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center gap-2 shadow-sm">
            <span className="text-4xl">📐</span>
            <h3 className="text-sm font-bold text-slate-800">No Architects Matched</h3>
            <p className="text-xs text-slate-500">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedArchitects.map((arch) => {
              // Collect recent project thumbnails
              const recentThumbs = (arch.projects || [])
                .filter((p) => p.imageUrl)
                .slice(0, 3)
                .map((p) => p.imageUrl as string)

              return (
                <div
                  key={arch.id}
                  className="bg-white border border-slate-200 hover:border-teal-400/60 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg flex flex-col group"
                >
                  {/* Cover Banner */}
                  <div className="relative h-28 bg-gradient-to-r from-teal-700 to-slate-700">
                    {arch.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={arch.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white/10 text-xs font-black uppercase tracking-widest">NexMove</span>
                      </div>
                    )}
                    {arch.availableForProjects && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold bg-white border border-emerald-300 text-emerald-700 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                        Available
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 pt-0 relative flex flex-col gap-3 flex-1 -mt-10">
                    {/* Avatar + Verified */}
                    <div className="flex items-end justify-between">
                      <Link
                        href={`/architects/${arch.id}`}
                        className="relative w-16 h-16 rounded-full border-[3px] border-white shadow-md overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0 hover:ring-2 hover:ring-teal-400 transition"
                      >
                        {arch.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={arch.avatarUrl} alt={arch.name} className="w-full h-full object-cover" />
                        ) : (
                          arch.avatarInitials
                        )}
                      </Link>
                      <VerifiedBadge type="ARCHITECT" verified={arch.verified} />
                    </div>

                    {/* Name & Role */}
                    <div>
                      <Link
                        href={`/architects/${arch.id}`}
                        className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition block leading-tight"
                      >
                        <HighlightedText text={arch.name} query={q} />
                      </Link>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        <HighlightedText text={arch.specialization} query={q} />
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {arch.companyName ? `${arch.companyName} · ` : ''}
                        <HighlightedText text={arch.location} query={q} />
                      </p>
                    </div>

                    {/* Bio snippet */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{arch.bio}</p>

                    {/* Software Tags — highlighted */}
                    <div className="flex flex-wrap gap-1">
                      {arch.software.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className={`text-[10px] px-2 py-0.5 rounded font-medium border transition ${
                            q && s.toLowerCase().includes(q.toLowerCase())
                              ? 'bg-amber-50 border-amber-300 text-amber-800'
                              : 'bg-slate-100 border-slate-200 text-slate-600'
                          }`}
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Recent Project Thumbnails Strip */}
                    {recentThumbs.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {recentThumbs.map((thumb, i) => (
                          <div
                            key={i}
                            className="flex-1 h-14 rounded-lg overflow-hidden bg-slate-100"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={thumb}
                              alt="Project"
                              className="w-full h-full object-cover hover:scale-105 transition duration-300"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Stats Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
                      <div className="flex items-center gap-1 text-xs">
                        {arch.reviewCount > 0 && arch.avgRating > 0 ? (
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <span>★</span>
                            <span>{arch.avgRating.toFixed(1)}</span>
                            <span className="text-slate-400 font-normal text-[11px]">({arch.reviewCount})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-slate-400 font-medium">
                            <span>★</span>
                            <span>0.0</span>
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-normal">New</span>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-slate-500">
                        {arch.experienceYears}y · {arch.completedProjects} project{arch.completedProjects !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/architects/${arch.id}`}
                        className="flex-1 text-center text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 rounded-xl transition"
                      >
                        View Profile
                      </Link>

                      {arch.phone && (
                        <a
                          href={`https://wa.me/${arch.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(arch.name)},%20I%20found%20your%20profile%20on%20NexMove.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl transition flex items-center gap-1 shadow-sm"
                        >
                          <span>💬</span>
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {proposalTarget && (
        <RequestProposalModal
          architect={proposalTarget}
          onClose={() => setProposalTarget(null)}
        />
      )}
    </main>
  )
}
