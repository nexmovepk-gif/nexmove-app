'use client'
// src/app/architects/dashboard/page.tsx
// Architect Portal Dashboard: Profile Editor (Tab 1) & Portfolio Management (Tab 2)

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
  phone?: string | null
  bio?: string | null
  location?: string | null
  isOverseas?: boolean
  country?: string | null
  city?: string | null
  experienceYears?: number | null
  software: string[]
  projectTypes: string[]
  avatarInitials?: string | null
  avatarGradient?: string | null
}

const SPECIALIZATION_OPTIONS = [
  '3D Visualizer',
  'BIM Specialist',
  'Revit Technician',
  'Interior Designer',
  'Landscape Architect',
  'Architectural Designer',
  'Urban Planner',
]

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

  const [activeTab, setActiveTab] = useState<'profile' | 'projects'>('projects')

  const [profile, setProfile] = useState<ArchitectProfile | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Profile Editor Form state
  const [profName, setProfName] = useState('')
  const [profPhone, setProfPhone] = useState('')
  const [profBio, setProfBio] = useState('')
  const [profCompanyName, setProfCompanyName] = useState('')
  const [profSpecialization, setProfSpecialization] = useState('3D Visualizer')
  const [profExperienceYears, setProfExperienceYears] = useState('5')
  const [profIsOverseas, setProfIsOverseas] = useState(false)
  const [profCountry, setProfCountry] = useState('Pakistan')
  const [profCity, setProfCity] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Project Upload Form state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [projTitle, setProjTitle] = useState('')
  const [projCategory, setProjCategory] = useState('Residential')
  const [projYear, setProjYear] = useState(new Date().getFullYear().toString())
  const [projDescription, setProjDescription] = useState('')
  const [projSoftware, setProjSoftware] = useState<string[]>([])
  const [projImageUrl, setProjImageUrl] = useState('')
  const [projGalleryUrls, setProjGalleryUrls] = useState('')
  const [uploadingProj, setUploadingProj] = useState(false)
  const [deletingProjId, setDeletingProjId] = useState<string | null>(null)

  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const toggleProjSoftware = (sw: string) => {
    setProjSoftware((prev) =>
      prev.includes(sw) ? prev.filter((s) => s !== sw) : [...prev, sw]
    )
  }

  const loadDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch Profile
      const profRes = await fetch('/api/architects/profile')
      if (profRes.ok) {
        const profData = await profRes.json()
        const p = profData.profile
        if (p) {
          setProfile(p)
          setProfName(p.name || '')
          setProfPhone(p.phone || '')
          setProfBio(p.bio || '')
          setProfCompanyName(p.companyName || '')
          setProfSpecialization(p.specialization || '3D Visualizer')
          setProfExperienceYears((p.experienceYears || 5).toString())
          setProfIsOverseas(Boolean(p.isOverseas))
          setProfCountry(p.country || 'Pakistan')
          setProfCity(p.city || '')
        }
      }

      // Fetch Projects
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
      router.push('/architects/login?callbackUrl=/architects/dashboard')
    } else if (status === 'authenticated') {
      loadDashboardData()
    }
  }, [status, router, loadDashboardData])

  // Save Profile Changes Handler (PUT)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setMessage(null)

    try {
      const res = await fetch('/api/architects/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile?.id,
          name: profName,
          phone: profPhone,
          bio: profBio,
          companyName: profCompanyName,
          specialization: profSpecialization,
          experienceYears: Number(profExperienceYears),
          isOverseas: profIsOverseas,
          country: profCountry,
          city: profCity,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      setMessage({ text: '✓ Profile updated successfully!', type: 'success' })
      loadDashboardData()
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : 'Failed to update profile',
        type: 'error',
      })
    } finally {
      setSavingProfile(false)
    }
  }

  // Upload Project Handler (POST)
  const handleUploadProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projTitle.trim()) {
      setMessage({ text: 'Project Title is required.', type: 'error' })
      return
    }

    setUploadingProj(true)
    setMessage(null)

    try {
      const res = await fetch('/api/architects/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          architectId: profile?.id,
          title: projTitle,
          category: projCategory,
          completedYear: projYear,
          description: projDescription,
          software: projSoftware,
          imageUrl: projImageUrl,
          imageUrls: projGalleryUrls,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload project')

      setMessage({ text: '🎉 Project uploaded successfully to portfolio!', type: 'success' })
      setProjTitle('')
      setProjDescription('')
      setProjImageUrl('')
      setProjGalleryUrls('')
      setProjSoftware([])
      setShowUploadModal(false)
      loadDashboardData()
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : 'An error occurred',
        type: 'error',
      })
    } finally {
      setUploadingProj(false)
    }
  }

  // Delete Project Handler (DELETE)
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project from your portfolio?')) return

    setDeletingProjId(projectId)
    try {
      const res = await fetch(`/api/architects/projects?id=${projectId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete project')

      setMessage({ text: 'Project removed from portfolio.', type: 'success' })
      loadDashboardData()
    } catch (err) {
      console.error('Delete project error:', err)
      setMessage({ text: 'Failed to delete project.', type: 'error' })
    } finally {
      setDeletingProjId(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading Architect Dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Top Portal Header ───────────────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-900/70 px-4 py-6">
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
                {profile?.isOverseas && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-cyan-500/10 text-cyan-400 border-cyan-500/20">
                    🌐 OVERSEAS
                  </span>
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
                target="_blank"
                className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-1.5"
              >
                <span>👁️</span>
                <span>View Public Profile ↗</span>
              </Link>
            )}
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-xs bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-1.5 shadow shadow-teal-950/50"
            >
              <span>+</span>
              <span>Upload New Project</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Dashboard Navigation Tabs ──────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-5 py-3.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'projects'
                ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>📁</span>
            <span>Project Portfolio Management ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-5 py-3.5 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>👤</span>
            <span>Profile Editor & Credentials</span>
          </button>
        </div>
      </div>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {message && (
          <div
            className={`p-3.5 mb-6 rounded-xl text-xs font-medium border flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-300">
              ✕
            </button>
          </div>
        )}

        {/* ── TAB 1: PROFILE EDITOR ───────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-3xl">
            <div className="mb-6">
              <h2 className="text-lg font-black text-slate-100">Edit Architect Profile</h2>
              <p className="text-xs text-slate-400 mt-1">
                Update your contact information, specializations, company details, and overseas standing.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Full Name *</label>
                  <input
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    required
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Phone Number</label>
                  <input
                    type="tel"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    placeholder="+92-300-1234567"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Company / Firm Name</label>
                  <input
                    type="text"
                    value={profCompanyName}
                    onChange={(e) => setProfCompanyName(e.target.value)}
                    placeholder="Rahman Architects & Designers"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Specialization Role</label>
                  <select
                    value={profSpecialization}
                    onChange={(e) => setProfSpecialization(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  >
                    {SPECIALIZATION_OPTIONS.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Years of Experience</label>
                  <input
                    type="number"
                    value={profExperienceYears}
                    onChange={(e) => setProfExperienceYears(e.target.value)}
                    min="0"
                    max="50"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                {/* Overseas Toggle */}
                <div className="flex items-center gap-3 bg-slate-800/80 border border-teal-500/30 p-3.5 rounded-xl sm:col-span-2">
                  <input
                    id="prof-isOverseas"
                    type="checkbox"
                    checked={profIsOverseas}
                    onChange={(e) => setProfIsOverseas(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-700 bg-slate-900 cursor-pointer"
                  />
                  <label htmlFor="prof-isOverseas" className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-1.5">
                    <span>🌐</span>
                    <span>Overseas Architect / International Practice (Non-Pakistan Practice)</span>
                  </label>
                </div>

                {profIsOverseas ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300">Country *</label>
                      <input
                        type="text"
                        value={profCountry}
                        onChange={(e) => setProfCountry(e.target.value)}
                        placeholder="United Arab Emirates, UK, USA..."
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-300">City *</label>
                      <input
                        type="text"
                        value={profCity}
                        onChange={(e) => setProfCity(e.target.value)}
                        placeholder="Dubai, London, New York..."
                        className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300">City / Location (Pakistan)</label>
                    <input
                      type="text"
                      value={profCity}
                      onChange={(e) => setProfCity(e.target.value)}
                      placeholder="Lahore, Karachi, Islamabad..."
                      className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Professional Bio</label>
                  <textarea
                    value={profBio}
                    onChange={(e) => setProfBio(e.target.value)}
                    rows={4}
                    placeholder="Describe your design philosophy, past architectural achievements, software stack proficiency..."
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full sm:w-auto self-start bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow shadow-teal-950/50 disabled:opacity-50 mt-2"
              >
                {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB 2: PORTFOLIO MANAGEMENT ────────────────────────────── */}
        {activeTab === 'projects' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-black text-slate-100">Project Portfolio Management</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Published projects automatically appear on your public directory card and detail page.
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow shadow-teal-950/50"
              >
                <span>+</span>
                <span>Upload New Project</span>
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">📐</span>
                <h3 className="text-sm font-bold text-slate-200">Your Portfolio is Empty</h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  Upload your completed 3D renders, BIM models, or architectural designs to showcase your work to property developers and agency clients.
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="mt-2 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-5 py-2.5 rounded-xl transition"
                >
                  Upload First Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-slate-900 border border-slate-800 hover:border-teal-500/30 rounded-2xl overflow-hidden transition flex flex-col group shadow-lg"
                  >
                    {proj.imageUrl ? (
                      <div className="relative h-44 overflow-hidden bg-slate-950">
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
                      <div className="h-32 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-3xl">
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

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-end mt-2">
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          disabled={deletingProjId === proj.id}
                          className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded transition disabled:opacity-50"
                        >
                          {deletingProjId === proj.id ? 'Deleting...' : '🗑️ Delete Project'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── UPLOAD PROJECT MODAL ─────────────────────────────────────── */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-black text-slate-100">Upload Portfolio Project</h2>
                <p className="text-xs text-slate-400 mt-0.5">Add project specs to render on your profile.</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-500 hover:text-slate-300 transition text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadProject} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Project Title *</label>
                <input
                  type="text"
                  value={projTitle}
                  onChange={(e) => setProjTitle(e.target.value)}
                  placeholder="e.g. Modern Residential Villa"
                  required
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Category</label>
                  <select
                    value={projCategory}
                    onChange={(e) => setProjCategory(e.target.value)}
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
                    value={projYear}
                    onChange={(e) => setProjYear(e.target.value)}
                    min="2000"
                    max="2030"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Software Stack</label>
                <div className="flex flex-wrap gap-1.5">
                  {SOFTWARE_OPTIONS.map((sw) => (
                    <button
                      key={sw}
                      type="button"
                      onClick={() => toggleProjSoftware(sw)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition font-medium ${
                        projSoftware.includes(sw)
                          ? 'bg-violet-600 border-violet-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {sw}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Cover Image URL</label>
                <input
                  type="url"
                  value={projImageUrl}
                  onChange={(e) => setProjImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Gallery Image URLs (comma separated)</label>
                <input
                  type="text"
                  value={projGalleryUrls}
                  onChange={(e) => setProjGalleryUrls(e.target.value)}
                  placeholder="https://img1.com, https://img2.com"
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Description</label>
                <textarea
                  value={projDescription}
                  onChange={(e) => setProjDescription(e.target.value)}
                  rows={3}
                  placeholder="Overview of architectural design, square footage, structural highlights..."
                  className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500 transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingProj}
                  className="flex-1 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {uploadingProj ? 'Publishing...' : 'Publish Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
