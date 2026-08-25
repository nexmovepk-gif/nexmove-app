'use client'
// src/app/architects/dashboard/page.tsx
// LinkedIn-Style Off-White Architect Portal & Dashboard — Full Refactor

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'
import ProfileEditModal, { ArchitectProfileData } from '@/components/architects/ProfileEditModal'
import LinkedInStylePostModal from '@/components/architects/LinkedInStylePostModal'

interface Project {
  id: string
  title: string
  description?: string | null
  category?: string | null
  software: string[]
  imageUrl?: string | null
  imageUrls: string[]
  videoUrl?: string | null
  tags?: string[]
  likesCount?: number
  completedYear?: number | null
  createdAt: string
}

// ── Star Rating Interactive Widget ────────────────────────────────────────────
function StarRater({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
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
          className={`text-xl leading-none transition-transform hover:scale-110 ${
            star <= (hovered || value) ? 'text-amber-400' : 'text-slate-200'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ── Image Mosaic Gallery ──────────────────────────────────────────────────────
function ImageGallery({ urls, title }: { urls: string[]; title: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  const visible = urls.slice(0, 4)
  const overflow = urls.length - 4

  if (urls.length === 0) return null

  if (urls.length === 1) {
    return (
      <>
        <div
          className="bg-slate-950 max-h-96 overflow-hidden cursor-zoom-in"
          onClick={() => setLightbox(urls[0])}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urls[0]} alt={title} className="w-full h-full object-cover" />
        </div>
        {lightbox && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4"
            onClick={() => setLightbox(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt={title} className="max-w-full max-h-full object-contain rounded-xl" />
          </div>
        )}
      </>
    )
  }

  return (
    <>
      <div
        className={`grid gap-0.5 ${
          urls.length === 2
            ? 'grid-cols-2'
            : urls.length === 3
            ? 'grid-cols-3'
            : 'grid-cols-2'
        } max-h-96 overflow-hidden`}
      >
        {visible.map((url, idx) => (
          <div
            key={idx}
            className={`relative overflow-hidden bg-slate-900 cursor-zoom-in ${
              urls.length === 3 && idx === 0 ? 'row-span-2 col-span-1' : ''
            } ${urls.length >= 4 && idx === 0 ? 'row-span-2' : ''}`}
            onClick={() => setLightbox(url)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${title} ${idx + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition duration-300"
            />
            {idx === 3 && overflow > 0 && (
              <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center">
                <span className="text-white text-xl font-black">+{overflow}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt={title} className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </>
  )
}

interface Proposal {
  id: string
  architectId: string
  architectName?: string | null
  agencyName: string
  agencyId?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  projectType?: string | null
  plotArea?: string | null
  budgetPKR?: number | null
  location?: string | null
  message: string
  status: string
  createdAt: string
}

export default function ArchitectDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<ArchitectProfileData | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [activeTab, setActiveTab] = useState<'feed' | 'leads'>('feed')
  const [loading, setLoading] = useState(true)

  // ── Modals & Dialogs State ────────────────────────────────────────────────
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)

  // ── Hidden File Input References ──────────────────────────────────────────
  const profileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [coverUrlInput, setCoverUrlInput] = useState('')

  // Social state
  const [likedProjects, setLikedProjects] = useState<Record<string, boolean>>({})
  const [likesMap, setLikesMap] = useState<Record<string, number>>({})
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [ratingMap, setRatingMap] = useState<Record<string, number>>({})

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [updatingProposalId, setUpdatingProposalId] = useState<string | null>(null)

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const [profRes, projRes, propRes] = await Promise.all([
        fetch('/api/architects/profile', { cache: 'no-store' }),
        fetch('/api/architects/projects', { cache: 'no-store' }),
        fetch('/api/architects/proposal', { cache: 'no-store' }),
      ])

      if (profRes.ok) {
        const profData = await profRes.json()
        if (profData.profile) {
          setProfile(profData.profile)
          setCoverUrlInput(profData.profile.coverImage || '')
        }
      }

      if (projRes.ok) {
        const projData = await projRes.json()
        const fetchedProjects: Project[] = projData.projects || []
        setProjects(fetchedProjects)

        const initialLikes: Record<string, number> = {}
        fetchedProjects.forEach((p) => {
          initialLikes[p.id] = p.likesCount || 0
        })
        setLikesMap(initialLikes)
      }

      if (propRes.ok) {
        const propData = await propRes.json()
        setProposals(propData.proposals || [])
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/architects/login?callbackUrl=/architects/dashboard')
    } else if (status === 'authenticated') {
      loadDashboardData()
    }
  }, [status, router, loadDashboardData])

  // ── Fast Direct Cloud Profile Picture Upload ──────────────────────────────
  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const tempUrl = URL.createObjectURL(file)
    setProfile((prev) => (prev ? { ...prev, avatarUrl: tempUrl } : null))
    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/architects/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Failed to upload image')
      const uploadData = await uploadRes.json()
      const avatarUrl = uploadData.url

      const res = await fetch('/api/architects/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          avatarUrl,
        }),
      })
      if (!res.ok) throw new Error('Failed to update avatar')
      setMessage({ text: '✓ Profile picture updated successfully!', type: 'success' })
      loadDashboardData()
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to upload profile picture', type: 'error' })
    } finally {
      setUploadingAvatar(false)
      if (profileInputRef.current) profileInputRef.current.value = ''
    }
  }

  // ── Fast Direct Cloud Cover Photo Upload ──────────────────────────────────
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    const tempUrl = URL.createObjectURL(file)
    setProfile((prev) => (prev ? { ...prev, coverImage: tempUrl } : null))
    setCoverUrlInput(tempUrl)
    setUploadingCover(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/architects/upload', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Failed to upload cover photo')
      const uploadData = await uploadRes.json()
      const coverImage = uploadData.url

      const res = await fetch('/api/architects/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          coverImage,
          coverBannerUrl: coverImage,
        }),
      })
      if (!res.ok) throw new Error('Failed to update cover photo')
      setMessage({ text: '✓ Cover photo updated successfully!', type: 'success' })
      setIsCoverModalOpen(false)
      loadDashboardData()
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to upload cover photo', type: 'error' })
    } finally {
      setUploadingCover(false)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const updateProposalStatus = async (id: string, newStatus: string) => {
    setUpdatingProposalId(id)
    try {
      const res = await fetch(`/api/architects/proposal?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      setProposals((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      )
      setMessage({ text: `✓ Proposal marked as ${newStatus}`, type: 'success' })
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to update proposal status', type: 'error' })
    } finally {
      setUpdatingProposalId(null)
    }
  }

  // ── Save Cover Photo from URL Input Modal ─────────────────────────────────
  const handleSaveCoverUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setUploadingCover(true)
    try {
      const res = await fetch('/api/architects/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          name: profile.name,
          phone: profile.phone,
          companyName: profile.companyName,
          specialization: profile.specialization,
          experienceYears: profile.experienceYears,
          pcatpNo: profile.pcatpNo,
          bio: profile.bio,
          isOverseas: profile.isOverseas,
          country: profile.country,
          city: profile.city,
          software: profile.software,
          avatarUrl: profile.avatarUrl,
          coverImage: coverUrlInput.trim(),
        }),
      })
      if (!res.ok) throw new Error('Failed to update cover photo URL')
      setMessage({ text: '✓ Cover photo URL updated successfully!', type: 'success' })
      setIsCoverModalOpen(false)
      loadDashboardData()
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to save cover photo URL', type: 'error' })
    } finally {
      setUploadingCover(false)
    }
  }

  const toggleLike = async (id: string) => {
    const isLiked = likedProjects[id]
    // Optimistic update
    setLikedProjects((prev) => ({ ...prev, [id]: !isLiked }))
    setLikesMap((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + (isLiked ? -1 : 1),
    }))
    // Persist to DB
    try {
      await fetch(`/api/architects/projects?id=${id}&action=${isLiked ? 'unlike' : 'like'}`, {
        method: 'PATCH',
      })
    } catch {
      // Revert on failure
      setLikedProjects((prev) => ({ ...prev, [id]: isLiked }))
      setLikesMap((prev) => ({
        ...prev,
        [id]: (prev[id] || 0) + (isLiked ? 1 : -1),
      }))
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post from your portfolio?')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/architects/projects?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete project')
      setMessage({ text: 'Post removed successfully', type: 'success' })
      loadDashboardData()
    } catch (err) {
      console.error(err)
      setMessage({ text: 'Failed to delete post', type: 'error' })
    } finally {
      setDeletingId(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] text-slate-800 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading Architect Portal...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] text-slate-900 pb-12 font-sans">

      {/* ── Top Header Navigation ─────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-black text-teal-700 tracking-tight">
              NexMove <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-bold">PRO</span>
            </Link>
            <span className="text-slate-300 hidden sm:block">|</span>
            <span className="text-xs font-bold text-slate-500 hidden sm:block">Architect Portal</span>
            {(profile?.name || session?.user?.name) && (
              <>
                <span className="text-slate-200 hidden md:block">·</span>
                <span className="text-xs font-semibold text-teal-700 hidden md:block">
                  Welcome, {profile?.name || session?.user?.name}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/architects"
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <span>🏛️</span>
              <span className="hidden sm:inline">Directory</span>
            </Link>

            {profile?.id && (
              <Link
                href={`/architects/${profile.id}`}
                target="_blank"
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
              >
                <span>👁️</span>
                <span className="hidden sm:inline">Public Profile ↗</span>
              </Link>
            )}

            <button
              onClick={() => setShowPostModal(true)}
              className="text-xs bg-teal-700 hover:bg-teal-600 text-white font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-1.5"
            >
              <span className="text-base leading-none">+</span>
              <span>Create Post</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main: LinkedIn-style 2-col grid ─────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── LEFT COLUMN: Profile Card (4 cols) ──────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Profile card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm flex flex-col">

            {/* ── Hidden File Inputs for Fast Direct Upload ── */}
            <input
              type="file"
              ref={profileInputRef}
              accept="image/*"
              onChange={handleProfilePicUpload}
              className="hidden"
            />
            <input
              type="file"
              ref={coverInputRef}
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />

            {/* ── Cover Banner ── */}
            <div
              className="relative h-32 bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-800 cursor-pointer group"
              onClick={() => setIsCoverModalOpen(true)}
              title="Click to edit cover photo"
            >
              {uploadingCover && (
                <div className="absolute inset-0 bg-slate-900/60 z-10 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                </div>
              )}
              {profile?.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.coverImage}
                  alt="Cover Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10 text-xs font-bold uppercase tracking-widest">
                  NexMove Engine
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsCoverModalOpen(true)
                  }}
                  className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition bg-slate-900/80 hover:bg-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow"
                >
                  <span>📷</span>
                  <span>Edit Cover</span>
                </button>
              </div>
            </div>

            {/* ── Avatar & Info ── */}
            <div className="px-5 pb-5 pt-0 relative flex flex-col items-center text-center -mt-12">
              {/* Avatar circle — click opens Profile Editor Modal */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                title="Click to view & edit profile"
                className="relative w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-black text-2xl cursor-pointer group"
              >
                {uploadingAvatar ? (
                  <div className="w-7 h-7 border-[3px] border-white/40 border-t-white rounded-full animate-spin" />
                ) : profile?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name || 'Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile?.avatarInitials || session?.user?.name?.substring(0, 2).toUpperCase() || 'AR'
                )}
                {/* Camera / Edit hover overlay */}
                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-0.5">
                  <span className="text-base leading-none">📷</span>
                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Edit</span>
                </div>
              </button>

              <div className="mt-3 flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-bold text-slate-900">
                    {profile?.name || session?.user?.name || 'Architect Name'}
                  </h2>
                  <VerifiedBadge
                    type="ARCHITECT"
                    verified={Boolean(profile?.isVerified)}
                  />
                </div>
                <p className="text-xs font-semibold text-slate-600">
                  {profile?.specialization || 'Professional Architect'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {profile?.companyName ? `${profile.companyName} · ` : ''}
                  {profile?.location || profile?.city || 'Pakistan'}
                </p>
              </div>

              {/* PCATP Badge */}
              <div className="mt-3 bg-[#f8fafc] border border-slate-200/80 px-3 py-2 rounded-xl text-center w-full">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                  PCATP Council Reg No.
                </span>
                <span className="text-xs font-mono font-bold text-teal-700">
                  {profile?.pcatpNo || 'VERIFIED-PCATP'}
                </span>
              </div>

              {/* Stats row */}
              <div className="mt-3 w-full grid grid-cols-2 gap-2">
                <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3 py-2 text-center">
                  <span className="text-lg font-black text-teal-700">{projects.length}</span>
                  <p className="text-[10px] text-slate-400 font-medium">Posts</p>
                </div>
                <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl px-3 py-2 text-center">
                  <span className="text-lg font-black text-amber-500">
                    {profile?.avgRating && profile.avgRating > 0 ? `${profile.avgRating.toFixed(1)}★` : '0.0★'}
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {profile?.reviewCount && profile.reviewCount > 0 ? `${profile.reviewCount} Review${profile.reviewCount > 1 ? 's' : ''}` : 'Rating'}
                  </p>
                </div>
              </div>

              {/* ── View / Edit Profile Button ── */}
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="mt-4 w-full bg-slate-900 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>⚙️</span>
                <span>View / Edit Profile</span>
              </button>
            </div>
          </div>

          {/* Software Stack Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Software Stack & Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.software && profile.software.length > 0
                ? profile.software
                : ['Revit', 'AutoCAD', '3ds Max', 'Lumion', 'SketchUp', 'Enscape']
              ).map((sw) => (
                <span
                  key={sw}
                  className="text-xs bg-[#f3f4f6] border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
                >
                  {sw}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Quick Links</h3>
            <Link href="/architects" className="text-xs text-teal-700 hover:underline font-medium flex items-center gap-1.5">
              <span>🏛️</span> Public Architect Directory
            </Link>
            {profile?.phone && (
              <a
                href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-700 hover:underline font-medium flex items-center gap-1.5"
              >
                <span>💬</span> Your WhatsApp Business Link
              </a>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Feed & Leads (8 cols) ─────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span>{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
          )}

          {/* ── Dashboard Tab Selector ── */}
          <div className="flex items-center gap-2 bg-white border border-slate-200/90 p-1.5 rounded-2xl shadow-sm">
            <button
              onClick={() => setActiveTab('feed')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'feed'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>📐</span>
              <span>Portfolio Feed</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === 'feed' ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {projects.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'leads'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>📬</span>
              <span>Client Proposals & Leads</span>
              {proposals.filter((p) => p.status === 'PENDING').length > 0 ? (
                <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {proposals.filter((p) => p.status === 'PENDING').length} New
                </span>
              ) : (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === 'leads' ? 'bg-teal-800 text-teal-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {proposals.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'leads' ? (
            /* ── PROPOSALS & LEADS INBOX ── */
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Direct Client Inquiries</h3>
                  <p className="text-xs text-slate-500">
                    Proposals and project requests submitted by agencies and developers via your public profile.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-xl">
                    Total: {proposals.length}
                  </span>
                </div>
              </div>

              {proposals.length === 0 ? (
                <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center flex flex-col items-center gap-3 shadow-sm">
                  <span className="text-4xl">📭</span>
                  <h3 className="text-sm font-bold text-slate-800">No Proposals Received Yet</h3>
                  <p className="text-xs text-slate-500 max-w-md">
                    When property developers or agencies request design proposals or 3D architectural services through your public profile, they will appear here in real-time.
                  </p>
                </div>
              ) : (
                proposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col gap-4 hover:border-teal-500/40 transition"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{prop.agencyName}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            prop.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : prop.status === 'CONTACTED'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : prop.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {prop.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Received {new Date(prop.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>

                      {/* Status Dropdown / Action */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={prop.status}
                          disabled={updatingProposalId === prop.id}
                          onChange={(e) => updateProposalStatus(prop.id, e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-bold focus:outline-none focus:border-teal-600 transition cursor-pointer"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="ACCEPTED">Accepted</option>
                          <option value="DECLINED">Declined</option>
                        </select>
                      </div>
                    </div>

                    {/* Requirements Message */}
                    <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-700 leading-relaxed">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Client Requirements:
                      </span>
                      {prop.message}
                    </div>

                    {/* Contact details */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {prop.contactEmail && (
                          <a
                            href={`mailto:${prop.contactEmail}?subject=Re:%20Architectural%20Design%20Proposal`}
                            className="text-xs text-teal-700 hover:text-teal-600 font-semibold flex items-center gap-1 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl transition"
                          >
                            <span>✉️</span>
                            <span>{prop.contactEmail}</span>
                          </a>
                        )}
                        {prop.contactPhone && (
                          <a
                            href={`https://wa.me/${prop.contactPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-700 hover:text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl transition"
                          >
                            <span>💬</span>
                            <span>{prop.contactPhone}</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {prop.status === 'PENDING' && (
                          <button
                            onClick={() => updateProposalStatus(prop.id, 'CONTACTED')}
                            className="text-xs bg-teal-700 hover:bg-teal-600 text-white font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm"
                          >
                            Mark as Contacted ✓
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* ── PORTFOLIO FEED VIEW ── */
            <>
              {/* Post Creator Box */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {profile?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatarUrl}
                        alt={profile.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      profile?.avatarInitials || 'AR'
                    )}
                  </div>
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="flex-1 bg-[#f3f4f6] hover:bg-slate-200/80 border border-slate-200 rounded-full px-4 py-2.5 text-xs text-slate-500 text-left font-medium transition"
                  >
                    Share 3D renders, BIM models or design projects...
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700 font-bold py-1 px-3 rounded-lg hover:bg-slate-50 transition"
                  >
                    <span>🖼️</span><span>Photos</span>
                  </button>
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700 font-bold py-1 px-3 rounded-lg hover:bg-slate-50 transition"
                  >
                    <span>🎥</span><span>Video</span>
                  </button>
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-teal-700 font-bold py-1 px-3 rounded-lg hover:bg-slate-50 transition"
                  >
                    <span>🏷️</span><span>Tags</span>
                  </button>
                </div>
              </div>

          {/* Feed */}
          {projects.length === 0 ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center flex flex-col items-center gap-3 shadow-sm">
              <span className="text-5xl">📐</span>
              <h3 className="text-sm font-bold text-slate-800">Your Portfolio Feed is Empty</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                Click &ldquo;Create Post&rdquo; to upload your first 3D render, BIM video, or design project.
              </p>
              <button
                onClick={() => setShowPostModal(true)}
                className="mt-2 text-xs bg-teal-700 hover:bg-teal-600 text-white font-bold px-5 py-2.5 rounded-xl transition shadow-md shadow-teal-500/20"
              >
                Create First Post
              </button>
            </div>
          ) : (
            projects.map((proj) => (
              <div
                key={proj.id}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm flex flex-col"
              >
                {/* Post Header */}
                <div className="p-4 flex items-center justify-between border-b border-slate-100">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setIsProfileModalOpen(true)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-600 to-emerald-700 text-white font-bold text-xs flex items-center justify-center overflow-hidden flex-shrink-0">
                      {profile?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        profile?.avatarInitials || 'AR'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 hover:text-teal-700 transition">
                          {profile?.name || 'Architect'}
                        </span>
                        <VerifiedBadge
                          type="ARCHITECT"
                          verified={profile?.isVerified || profile?.verificationStatus === 'VERIFIED'}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {profile?.specialization} · {new Date(proj.createdAt).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteProject(proj.id)}
                    disabled={deletingId === proj.id}
                    className="text-xs text-red-400 hover:text-red-600 font-bold px-2 py-1 rounded transition disabled:opacity-50"
                  >
                    {deletingId === proj.id ? '...' : '🗑️'}
                  </button>
                </div>

                {/* Post Content */}
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{proj.title}</h3>
                    {proj.category && (
                      <span className="text-[10px] font-bold bg-teal-50 border border-teal-200 text-teal-700 px-2.5 py-0.5 rounded-full flex-shrink-0">
                        {proj.category}
                      </span>
                    )}
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                      {proj.description}
                    </p>
                  )}

                  {/* Software + Tags */}
                  {((proj.software && proj.software.length > 0) || (proj.tags && proj.tags.length > 0)) && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {proj.software?.map((sw) => (
                        <span key={sw} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded font-medium">
                          #{sw}
                        </span>
                      ))}
                      {proj.tags?.map((tag) => (
                        <span key={tag} className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded font-medium">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Media: Video > Multi-Image Gallery > Single Image */}
                {proj.videoUrl ? (
                  <div className="bg-slate-950 aspect-video w-full overflow-hidden">
                    <video src={proj.videoUrl} controls className="w-full h-full object-cover" />
                  </div>
                ) : proj.imageUrls && proj.imageUrls.length > 0 ? (
                  <ImageGallery urls={proj.imageUrls} title={proj.title} />
                ) : proj.imageUrl ? (
                  <div className="bg-slate-950 max-h-96 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                  </div>
                ) : null}

                {/* Social Actions Footer */}
                <div className="px-4 py-3 bg-[#f8fafc] border-t border-slate-100 flex flex-col gap-2">
                  {/* Action bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      {/* Like */}
                      <button
                        onClick={() => toggleLike(proj.id)}
                        className={`text-xs font-bold flex items-center gap-1.5 transition px-2 py-1 rounded-lg ${
                          likedProjects[proj.id]
                            ? 'text-teal-700 bg-teal-50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm">{likedProjects[proj.id] ? '👍' : '👍'}</span>
                        <span>{likedProjects[proj.id] ? 'Liked' : 'Like'}</span>
                        <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-full font-mono ml-0.5">
                          {likesMap[proj.id] || 0}
                        </span>
                      </button>

                      {/* Comment toggle */}
                      <button
                        onClick={() =>
                          setCommentOpen((prev) => ({ ...prev, [proj.id]: !prev[proj.id] }))
                        }
                        className={`text-xs font-bold flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
                          commentOpen[proj.id]
                            ? 'text-teal-700 bg-teal-50'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <span>💬</span>
                        <span>Comment</span>
                      </button>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1">
                        <StarRater
                          value={ratingMap[proj.id] || 0}
                          onChange={(v) => setRatingMap((prev) => ({ ...prev, [proj.id]: v }))}
                        />
                        {ratingMap[proj.id] > 0 && (
                          <span className="text-[10px] text-amber-600 font-bold">{ratingMap[proj.id]}/5</span>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp Direct */}
                    {profile?.phone && (
                      <a
                        href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(profile.name || '')},%20I%20saw%20your%20project%20%22${encodeURIComponent(proj.title)}%22%20on%20NexMove.`}
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
                      <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
                        {profile?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={profile.avatarUrl} alt="me" className="w-full h-full object-cover" />
                        ) : (
                          profile?.avatarInitials?.charAt(0) || 'A'
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={commentText[proj.id] || ''}
                        onChange={(e) =>
                          setCommentText((prev) => ({ ...prev, [proj.id]: e.target.value }))
                        }
                        className="flex-1 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-400 transition"
                      />
                      <button className="text-xs bg-teal-600 text-white font-bold px-3 py-1.5 rounded-full hover:bg-teal-500 transition">
                        Post
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {profile && (
        <ProfileEditModal
          profile={profile}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onSaved={loadDashboardData}
          openInEditMode={true}
        />
      )}

      {/* ── High Z-Index Cover Banner Modal ─────────────────────────────── */}
      {isCoverModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setIsCoverModalOpen(false)}
        >
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📷</span>
                <h3 className="text-sm font-bold text-slate-900">Update Cover Banner</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCoverModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none transition"
              >
                ✕
              </button>
            </div>

            {/* Live Preview */}
            <div className="relative h-28 bg-gradient-to-r from-teal-700 to-slate-800 rounded-xl overflow-hidden border border-slate-200">
              {coverUrlInput ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrlInput}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 text-xs font-bold uppercase tracking-widest">
                  Preview
                </div>
              )}
            </div>

            {/* File Upload Option */}
            <div className="flex flex-col gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-3">
              <span className="text-xs font-bold text-slate-700">Option 1: Upload from Computer</span>
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="w-full bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {uploadingCover ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <span>📁</span>
                    <span>Choose Image File (JPG, PNG, WEBP)</span>
                  </>
                )}
              </button>
            </div>

            {/* URL Input Form */}
            <form onSubmit={handleSaveCoverUrl} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">Option 2: Paste Direct Image URL</span>
                <input
                  type="text"
                  value={coverUrlInput}
                  onChange={(e) => setCoverUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCoverModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingCover}
                  className="flex-1 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs py-2.5 rounded-xl transition shadow disabled:opacity-50"
                >
                  Save URL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <LinkedInStylePostModal
        architectId={profile?.id}
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        onSuccess={loadDashboardData}
      />
    </main>
  )
}
