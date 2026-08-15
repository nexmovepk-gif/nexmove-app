'use client'
// src/app/architects/dashboard/page.tsx
// Architect Portal Project Management & Portfolio Upload Dashboard

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VerifiedBadge from '@/components/VerifiedBadge'

interface Project {
  id: string
  title: string
  description?: string | null
  category?: string | null
  software: string[]
  imageUrl?: string | null
  imageUrls: string[]
  completedYear?: number | null
  createdAt: string
}

interface ArchitectProfile {
  id: string
  name: string
  title?: string | null
  specialization: string
  companyName?: string | null
  pcatpNo?: string | null
  isVerified: boolean
  verificationStatus: string
  location?: string | null
  experienceYears?: number | null
  software: string[]
  projectTypes: string[]
  avatarInitials?: string | null
  avatarGradient?: string | null
}

const CATEGORY_OPTIONS = [
  'Residential',
  'Commercial',
  'High-Rise',
  'Mixed-Use',
  'Luxury Villas',
  'Interior Design',
  'Landscape Architecture',
  'Hospitality',
  'Urban Planning',
]

const SOFTWARE_OPTIONS = [
  'Revit',
  'AutoCAD',
  '3ds Max',
  'Lumion',
  'SketchUp',
  'Enscape',
  'Navisworks',
  'Rhino',
  'V-Ray',
  'Photoshop',
]

export default function ArchitectDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [profile, setProfile] = useState<ArchitectProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Residential')
  const [completedYear, setCompletedYear] = useState(new Date().getFullYear().toString())
  const [description, setDescription] = useState('')
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [galleryUrls, setGalleryUrls] = useState('')

  const toggleSoftware = (sw: string) => {
    setSelectedSoftware((prev) =>
      prev.includes(sw) ? prev.filter((s) => s !== sw) : [...prev, sw]
    )
  }

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Fetch current architect profile
      const profRes = await fetch('/api/architects/register')
      if (profRes.ok) {
        const profData = await profRes.json()
        if (profData.pending && profData.pending.length > 0) {
          setProfile(profData.pending[0])
        }
      }

      // 2. Fetch architect projects
      const projRes = await fetch('/api/architects/projects')
      if (projRes.ok) {
        const projData = await projRes.json()
        setProjects(projData.projects || [])
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?role=architect&callbackUrl=/architects/dashboard')
    } else if (status === 'authenticated') {
      loadDashboardData()
    }
  }, [status, router, loadDashboardData])

  const handleUploadProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setMessage({ text: 'Project Title is required.', type: 'error' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/architects/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          architectId: profile?.id,
          title,
          category,
          completedYear,
          description,
          software: selectedSoftware,
          imageUrl,
          imageUrls: galleryUrls,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload project')
      }

      setMessage({ text: '🎉 Project uploaded successfully!', type: 'success' })
      setTitle('')
      setDescription('')
      setImageUrl('')
      setGalleryUrls('')
      setSelectedSoftware([])
      loadDashboardData()
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : 'An error occurred',
        type: 'error',
      })
    } finally {
      setUploading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading Architect Portal...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Dashboard Header ────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-teal-950/50">
              {profile?.avatarInitials || session?.user?.name?.substring(0, 2).toUpperCase() || 'AR'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-slate-50">
                  {profile?.name || session?.user?.name || 'Architect Dashboard'}
                </h1>
                {profile && (
                  <VerifiedBadge type="ARCHITECT" verified={profile.isVerified || profile.verificationStatus === 'VERIFIED'} />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {profile?.companyName ? `${profile.companyName} · ` : ''}
                {profile?.specialization || 'Architect Portal'}
                {profile?.location ? ` · ${profile.location}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {profile?.id && (
              <Link
                href={`/architects/${profile.id}`}
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-1.5"
              >
                <span>👁️</span>
                <span>View Public Profile</span>
              </Link>
            )}
            <Link
              href="/architects"
              className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow shadow-teal-950/50"
            >
              <span>🏛️</span>
              <span>Architects Directory</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Column: Upload Project Form ────────────────────────── */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-xl">
            <div>
              <span className="text-[10px] font-bold bg-teal-500/15 border border-teal-500/30 text-teal-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Portfolio Upload
              </span>
              <h2 className="text-base font-black text-slate-100 mt-2">Upload New Project</h2>
              <p className="text-xs text-slate-400 mt-1">Add projects to showcase on your public verified profile.</p>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleUploadProject} className="flex flex-col gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Project Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Modern Eco Villa 2026"
                  required
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Category & Year */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Year</label>
                  <input
                    type="number"
                    value={completedYear}
                    onChange={(e) => setCompletedYear(e.target.value)}
                    min="2000"
                    max="2030"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              {/* Software Stack */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Software Used</label>
                <div className="flex flex-wrap gap-1.5">
                  {SOFTWARE_OPTIONS.map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => toggleSoftware(sw)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-medium ${
                        selectedSoftware.includes(sw)
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {sw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Primary Cover Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Additional Gallery URLs */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Gallery Image URLs (comma separated)</label>
                <input
                  type="text"
                  value={galleryUrls}
                  onChange={(e) => setGalleryUrls(e.target.value)}
                  placeholder="https://img1.com, https://img2.com"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Project Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the architectural concept, plot area, structural design, or client requirements..."
                  rows={3}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-teal-950/50 disabled:opacity-50 mt-1"
              >
                {uploading ? 'Uploading Project...' : '🚀 Publish Project to Portfolio'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right Column: Project Gallery Grid ──────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-100">Uploaded Projects & Portfolio</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {projects.length} project{projects.length !== 1 ? 's' : ''} published on your public profile
              </p>
            </div>
            <button
              onClick={loadDashboardData}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl transition font-medium"
            >
              🔄 Refresh List
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">📐</span>
              <h3 className="text-sm font-bold text-slate-200">No Projects Uploaded Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Use the form on the left to upload your first architectural project, 3D render, or BIM design.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-slate-900 border border-slate-800 hover:border-teal-500/30 rounded-2xl overflow-hidden transition flex flex-col group"
                >
                  {proj.imageUrl ? (
                    <div className="relative h-40 overflow-hidden bg-slate-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proj.imageUrl}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {proj.category && (
                        <span className="absolute top-2.5 left-2.5 text-[10px] font-bold bg-slate-950/80 backdrop-blur-sm border border-slate-700 text-teal-400 px-2.5 py-0.5 rounded-full">
                          {proj.category}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="h-28 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-2xl">
                      🏢
                    </div>
                  )}

                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-300 transition">
                        {proj.title}
                      </h3>
                      {proj.completedYear && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {proj.completedYear}
                        </span>
                      )}
                    </div>

                    {proj.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {proj.description}
                      </p>
                    )}

                    {proj.software && proj.software.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-2">
                        {proj.software.map((sw) => (
                          <span
                            key={sw}
                            className="text-[10px] bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full"
                          >
                            {sw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
