'use client'
// src/app/architects/[id]/page.tsx
// LinkedIn-Style Architect Public Profile View — Social Actions, Star Rating, Multi-Image Gallery

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  likesCount?: number
  completedYear?: number | null
}

interface ArchitectDetail {
  id: string
  name: string
  title: string
  specialization: string
  companyName?: string | null
  isOverseas?: boolean
  country?: string | null
  city?: string | null
  bio: string
  avatarInitials: string
  avatarGradient: string
  avatarUrl?: string | null
  coverImage?: string | null
  councilLicenseNo: string
  pcatpNo?: string | null
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
  phone?: string
  availableForProjects: boolean
  joinedAt: string
}

// ── Star Rating Interactive Widget ─────────────────────────────────────────
function StarRater({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl leading-none transition-transform hover:scale-110 ${
            star <= (hovered || value) ? 'text-amber-400' : 'text-slate-200'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ── Star Display (read-only) ───────────────────────────────────────────────
function StarDisplay({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  const hasReviews = (reviewCount ?? 0) > 0 && rating > 0
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`text-sm leading-none ${
              hasReviews && i <= Math.round(rating) ? 'text-amber-400' : 'text-slate-200'
            }`}
          >
            ★
          </span>
        ))}
      </div>
      {hasReviews ? (
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-slate-800">{rating.toFixed(1)}★</span>
          <span className="text-xs text-slate-400">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
        </div>
      ) : (
        <span className="text-xs font-medium text-slate-400">0.0 (No reviews yet)</span>
      )}
    </div>
  )
}

// ── Image Gallery (inline mosaic) ──────────────────────────────────────────
function ProjectImageGallery({ urls, title }: { urls: string[]; title: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (urls.length === 0) return null

  if (urls.length === 1) {
    return (
      <>
        <div
          className="bg-slate-950 h-56 overflow-hidden cursor-zoom-in"
          onClick={() => setLightbox(urls[0])}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[0]} alt={title} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
        </div>
        {lightbox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4" onClick={() => setLightbox(null)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt={title} className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
        )}
      </>
    )
  }

  const visible = urls.slice(0, 4)
  const overflow = urls.length - 4

  return (
    <>
      <div className={`grid gap-0.5 ${urls.length === 2 ? 'grid-cols-2' : 'grid-cols-2'} h-56 overflow-hidden`}>
        {visible.map((url, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-slate-900 cursor-zoom-in"
            onClick={() => setLightbox(url)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
            {idx === 3 && overflow > 0 && (
              <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                <span className="text-white text-xl font-black">+{overflow}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt={title} className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </>
  )
}

// ── Review Submit Modal ────────────────────────────────────────────────────
function ReviewModal({ architectId, architectName, onClose, onReviewSubmitted }: {
  architectId: string
  architectName: string
  onClose: () => void
  onReviewSubmitted?: () => void
}) {
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError('Please select a star rating.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/architects/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ architectId, reviewerName: name, reviewerEmail: email, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit review')
      setSuccess(true)
      onReviewSubmitted?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error submitting review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Leave a Review</h3>
            <p className="text-xs text-slate-500">Rate <span className="font-bold text-teal-700">{architectName}</span></p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
        </div>

        {success ? (
          <div className="py-4 text-center flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center">✓</div>
            <p className="text-sm font-bold text-emerald-700">Review Submitted!</p>
            <p className="text-xs text-slate-500">Thank you for your feedback.</p>
            <button onClick={onClose} className="mt-1 text-xs bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-xl">{error}</div>}

            <div className="flex flex-col items-center gap-1 py-2">
              <p className="text-xs text-slate-500 font-medium">Your Rating</p>
              <StarRater value={rating} onChange={setRating} />
              {rating > 0 && (
                <p className="text-xs text-amber-600 font-bold">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Your Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ahmed Khan" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Email (optional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">Review Comment</label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Describe your experience working with this architect..." className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 resize-none focus:outline-none focus:border-teal-500 transition" />
            </div>
            <button type="submit" disabled={submitting} className="w-full bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl transition disabled:opacity-50">
              {submitting ? 'Submitting...' : '★ Submit Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ArchitectPublicProfilePage() {
  const params = useParams()
  const id = params?.id as string

  const [architect, setArchitect] = useState<ArchitectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Social state per post
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})
  const [likesMap, setLikesMap] = useState<Record<string, number>>({})
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({})
  const [ratingMap, setRatingMap] = useState<Record<string, number>>({})
  const [reviewModalOpen, setReviewModalOpen] = useState(false)

  const fetchArchitect = () => {
    if (!id) return
    fetch(`/api/public/architects/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Architect profile not found')
        return res.json()
      })
      .then((data) => {
        setArchitect(data.architect)
        // Set initial likes from DB
        const initialLikes: Record<string, number> = {}
        data.architect?.projects?.forEach((p: Project) => {
          initialLikes[p.id] = p.likesCount || 0
        })
        setLikesMap(initialLikes)
        // SEO
        if (data.architect) {
          document.title = `${data.architect.name} — ${data.architect.specialization} | NexMove`
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchArchitect()
  }, [id])
  /* eslint-enable react-hooks/exhaustive-deps */

  const toggleLike = async (postId: string) => {
    const isLiked = likedPosts[postId]
    setLikedPosts((prev) => ({ ...prev, [postId]: !isLiked }))
    setLikesMap((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + (isLiked ? -1 : 1) }))
    try {
      await fetch(`/api/architects/projects?id=${postId}&action=${isLiked ? 'unlike' : 'like'}`, {
        method: 'PATCH',
      })
    } catch {
      // revert
      setLikedPosts((prev) => ({ ...prev, [postId]: isLiked }))
      setLikesMap((prev) => ({ ...prev, [postId]: (prev[postId] || 0) + (isLiked ? 1 : -1) }))
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] text-slate-900 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Architect Profile...</p>
        </div>
      </main>
    )
  }

  if (error || !architect) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] text-slate-900 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-md shadow-sm flex flex-col items-center gap-3">
          <span className="text-4xl">⚠️</span>
          <h1 className="text-base font-bold text-slate-900">{error || 'Profile Not Found'}</h1>
          <p className="text-xs text-slate-500">The requested profile is unavailable or non-existent.</p>
          <Link href="/architects" className="mt-2 text-xs bg-slate-900 text-white font-bold px-4 py-2 rounded-xl">
            ← Back to Directory
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-slate-900 pb-16 font-sans">

      {/* ── Top Navigation Bar ─────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link
            href="/architects"
            className="text-xs font-bold text-slate-600 hover:text-teal-700 transition flex items-center gap-1"
          >
            <span>←</span>
            <span>Architects Directory</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReviewModalOpen(true)}
              className="text-xs bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <span>★</span>
              <span className="hidden sm:inline">Leave a Review</span>
            </button>

            {architect.phone && (
              <a
                href={`https://wa.me/${architect.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(architect.name)},%20I%20saw%20your%20profile%20on%20NexMove.`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
              >
                <span>💬</span>
                <span>Direct WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* ── LinkedIn Profile Header Card ────────────────────────── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          {/* Cover Banner */}
          <div className="relative h-52 bg-gradient-to-r from-teal-800 via-emerald-900 to-slate-900">
            {architect.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={architect.coverImage} alt="Cover" className="w-full h-full object-cover" />
            ) : null}
            {architect.availableForProjects && (
              <span className="absolute top-4 right-4 text-xs font-bold bg-white border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full shadow flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Available for Projects
              </span>
            )}
          </div>

          {/* Avatar + Details */}
          <div className="px-6 pb-5 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-black text-3xl flex-shrink-0">
                {architect.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={architect.avatarUrl} alt={architect.name} className="w-full h-full object-cover" />
                ) : (
                  architect.avatarInitials
                )}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-black text-slate-900">{architect.name}</h1>
                  <VerifiedBadge type="ARCHITECT" verified={architect.verified} />
                </div>
                <p className="text-sm font-bold text-slate-600">{architect.specialization}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {architect.companyName ? `${architect.companyName} · ` : ''}
                  {architect.location}
                </p>
                <div className="mt-1.5">
                  <StarDisplay rating={architect.avgRating} reviewCount={architect.reviewCount} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setReviewModalOpen(true)}
                className="text-xs bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 font-bold px-3 py-2 rounded-xl transition"
              >
                ★ Review
              </button>
              {architect.phone && (
                <a
                  href={`https://wa.me/${architect.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          {/* Stats Bar */}
          <div className="border-t border-slate-100 px-6 py-3 bg-[#f8fafc] flex flex-wrap gap-6 text-xs font-bold text-slate-700">
            <div>
              <span className="text-slate-400 block text-[10px] font-normal uppercase mb-0.5">PCATP License</span>
              <span className="font-mono text-teal-700">{architect.pcatpNo || architect.councilLicenseNo || 'VERIFIED'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-normal uppercase mb-0.5">Experience</span>
              <span>{architect.experienceYears} Years</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-normal uppercase mb-0.5">Projects</span>
              <span>{architect.completedProjects}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-normal uppercase mb-0.5">Rating</span>
              {architect.reviewCount > 0 && architect.avgRating > 0 ? (
                <span className="text-amber-500">★ {architect.avgRating.toFixed(1)}</span>
              ) : (
                <span className="text-slate-400">★ 0.0</span>
              )}
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-normal uppercase mb-0.5">Reviews</span>
              <span>{architect.reviewCount > 0 ? architect.reviewCount : '0 (New)'}</span>
            </div>
          </div>
        </div>

        {/* ── About Section ───────────────────────────────────────── */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col gap-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">About</h2>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{architect.bio}</p>
          <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
            <span className="text-xs font-bold text-slate-400 mr-1">Software Stack:</span>
            {architect.software.map((sw) => (
              <span key={sw} className="text-xs bg-[#f3f4f6] border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg font-medium">
                {sw}
              </span>
            ))}
          </div>
        </div>

        {/* ── Portfolio Feed ───────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Portfolio & Published Designs ({architect.projects?.length || 0})
            </h2>
          </div>

          {!architect.projects || architect.projects.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500 shadow-sm">
              No portfolio projects published yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {architect.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm flex flex-col"
                >
                  {/* Project Header: mini architect attribution */}
                  <div className="p-3 flex items-center gap-2.5 border-b border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white text-[10px] font-black overflow-hidden flex-shrink-0">
                      {architect.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={architect.avatarUrl} alt={architect.name} className="w-full h-full object-cover" />
                      ) : (
                        architect.avatarInitials
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-bold text-slate-900 truncate">{architect.name}</span>
                        <VerifiedBadge type="ARCHITECT" verified={architect.verified} />
                      </div>
                      <p className="text-[10px] text-slate-400">{architect.specialization}</p>
                    </div>
                    {proj.category && (
                      <span className="text-[10px] font-bold bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full flex-shrink-0">
                        {proj.category}
                      </span>
                    )}
                  </div>

                  {/* Media */}
                  {proj.videoUrl ? (
                    <div className="bg-slate-950 aspect-video overflow-hidden">
                      <video src={proj.videoUrl} controls className="w-full h-full object-cover" />
                    </div>
                  ) : proj.imageUrls && proj.imageUrls.length > 0 ? (
                    <ProjectImageGallery urls={proj.imageUrls} title={proj.title} />
                  ) : proj.imageUrl ? (
                    <div className="bg-slate-950 h-52 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                    </div>
                  ) : null}

                  {/* Project Info */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{proj.title}</h3>
                      {proj.completedYear && (
                        <span className="text-xs font-mono text-slate-400 flex-shrink-0">{proj.completedYear}</span>
                      )}
                    </div>

                    {proj.description && (
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{proj.description}</p>
                    )}

                    {/* Software + Tags */}
                    {((proj.software && proj.software.length > 0) || (proj.tags && proj.tags.length > 0)) && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-1">
                        {proj.software?.map((sw) => (
                          <span key={sw} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium">
                            #{sw}
                          </span>
                        ))}
                        {proj.tags?.map((tag) => (
                          <span key={tag} className="text-[10px] bg-teal-50 border border-teal-200 text-teal-600 px-2 py-0.5 rounded font-medium">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Social Engagements Footer ── */}
                  <div className="px-4 py-3 bg-[#f8fafc] border-t border-slate-100 flex flex-col gap-2">
                    {/* Action row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {/* Like */}
                        <button
                          onClick={() => toggleLike(proj.id)}
                          className={`text-xs font-bold flex items-center gap-1 px-2 py-1.5 rounded-lg transition ${
                            likedPosts[proj.id]
                              ? 'text-teal-700 bg-teal-50 border border-teal-200'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-sm">👍</span>
                          <span>{likedPosts[proj.id] ? 'Liked' : 'Like'}</span>
                          <span className="text-[10px] bg-white border border-slate-200 px-1 py-0.5 rounded-full font-mono ml-0.5">
                            {likesMap[proj.id] || 0}
                          </span>
                        </button>

                        {/* Comment */}
                        <button
                          onClick={() => setCommentOpen((prev) => ({ ...prev, [proj.id]: !prev[proj.id] }))}
                          className={`text-xs font-bold flex items-center gap-1 px-2 py-1.5 rounded-lg transition ${
                            commentOpen[proj.id] ? 'text-teal-700 bg-teal-50' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span>💬</span>
                          <span>Comment</span>
                        </button>

                        {/* Star Rating */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRatingMap((prev) => ({ ...prev, [proj.id]: star }))}
                              className={`text-base leading-none transition hover:scale-110 ${
                                star <= (ratingMap[proj.id] || 0) ? 'text-amber-400' : 'text-slate-200 hover:text-amber-300'
                              }`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* WhatsApp Direct */}
                      {architect.phone && (
                        <a
                          href={`https://wa.me/${architect.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(architect.name)},%20I%20saw%20your%20project%20%22${encodeURIComponent(proj.title)}%22%20on%20NexMove.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
                        >
                          <span>💬</span>
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {/* Inline Comment Box */}
                    {commentOpen[proj.id] && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-[10px] font-bold flex-shrink-0">
                          Y
                        </div>
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 transition"
                        />
                        <button className="text-xs bg-teal-600 text-white font-bold px-3 py-1.5 rounded-full hover:bg-teal-500 transition">
                          Post
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Review Modal ─────────────────────────────────────────── */}
      {reviewModalOpen && (
        <ReviewModal
          architectId={architect.id}
          architectName={architect.name}
          onClose={() => setReviewModalOpen(false)}
          onReviewSubmitted={fetchArchitect}
        />
      )}
    </main>
  )
}
