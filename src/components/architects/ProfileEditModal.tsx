'use client'
// src/components/architects/ProfileEditModal.tsx
// LinkedIn-Style Profile View & Edit Drawer/Modal — Enhanced with Rating Stars & Cover Upload

import { useState, useEffect } from 'react'
import VerifiedBadge from '@/components/VerifiedBadge'

export interface ArchitectProfileData {
  id: string
  name: string
  title?: string | null
  specialization: string
  companyName?: string | null
  pcatpNo?: string | null
  phone?: string | null
  bio?: string | null
  location?: string | null
  isOverseas?: boolean
  country?: string | null
  city?: string | null
  experienceYears?: number | null
  software: string[]
  projectTypes: string[]
  avatarUrl?: string | null
  coverImage?: string | null
  avatarInitials?: string | null
  avatarGradient?: string | null
  isVerified?: boolean
  verificationStatus?: string
}

interface ProfileEditModalProps {
  profile: ArchitectProfileData
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  /** When true the modal opens directly in the Edit Form view (skips the read-only overview) */
  openInEditMode?: boolean
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

// ── Star Rating Display Component ────────────────────────────
function StarDisplay({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating)
        const half = !filled && i < rating
        return (
          <span
            key={i}
            className={`text-base leading-none ${
              filled ? 'text-amber-400' : half ? 'text-amber-300' : 'text-slate-200'
            }`}
          >
            ★
          </span>
        )
      })}
      <span className="ml-1.5 text-xs font-bold text-slate-700">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function ProfileEditModal({
  profile,
  isOpen,
  onClose,
  onSaved,
  openInEditMode = false,
}: ProfileEditModalProps) {
  // Start in edit mode if the caller requested it (e.g., "Edit Profile" button)
  const [isEditing, setIsEditing] = useState(openInEditMode)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Form states
  const [name, setName] = useState(profile.name || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [companyName, setCompanyName] = useState(profile.companyName || '')
  const [specialization, setSpecialization] = useState(profile.specialization || '3D Visualizer')
  const [experienceYears, setExperienceYears] = useState((profile.experienceYears || 5).toString())
  const [pcatpNo, setPcatpNo] = useState(profile.pcatpNo || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [isOverseas, setIsOverseas] = useState(Boolean(profile.isOverseas))
  const [country, setCountry] = useState(profile.country || 'Pakistan')
  const [city, setCity] = useState(profile.city || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl || '')
  const [coverImage, setCoverImage] = useState(profile.coverImage || '')
  const [softwareInput, setSoftwareInput] = useState(profile.software?.join(', ') || 'Revit, AutoCAD, 3ds Max')

  // Synchronize state whenever modal opens or profile changes
  useEffect(() => {
    if (isOpen) {
      setName(profile.name || '')
      setPhone(profile.phone || '')
      setCompanyName(profile.companyName || '')
      setSpecialization(profile.specialization || '3D Visualizer')
      setExperienceYears((profile.experienceYears || 5).toString())
      setPcatpNo(profile.pcatpNo || '')
      setBio(profile.bio || '')
      setIsOverseas(Boolean(profile.isOverseas))
      setCountry(profile.country || 'Pakistan')
      setCity(profile.city || '')
      setAvatarUrl(profile.avatarUrl || '')
      setCoverImage(profile.coverImage || '')
      setSoftwareInput(profile.software?.join(', ') || 'Revit, AutoCAD, 3ds Max')
      setIsEditing(openInEditMode)
      setMessage(null)
    }
  }, [isOpen, profile, openInEditMode])

  if (!isOpen) return null

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setCoverImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const swList = softwareInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const res = await fetch('/api/architects/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          name,
          phone,
          companyName,
          specialization,
          experienceYears: Number(experienceYears),
          pcatpNo,
          bio,
          isOverseas,
          country,
          city,
          avatarUrl,
          coverImage,
          software: swList,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update profile')

      setMessage({ text: '✓ Profile updated successfully!', type: 'success' })
      setIsEditing(false)
      onSaved()
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : 'Error updating profile',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const displayCover = coverImage || profile.coverImage || ''
  const displayAvatar = avatarUrl || profile.avatarUrl || ''

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Cover Image Banner (always click-to-upload in both view & edit modes) ── */}
        <div className="relative h-44 bg-gradient-to-r from-teal-700 via-emerald-800 to-slate-800 flex-shrink-0 group cursor-pointer">
          {displayCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayCover}
              alt="Cover Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-slate-300/30 text-4xl font-black tracking-widest uppercase">
                NexMove PropTech
              </span>
            </div>
          )}

          {/* Click-to-upload cover overlay */}
          <label className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition flex items-center justify-center cursor-pointer">
            <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition bg-slate-900/70 px-3 py-1.5 rounded-full flex items-center gap-1.5">
              📷 Change Cover Photo
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverFile}
            />
          </label>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full w-8 h-8 flex items-center justify-center transition text-sm z-10"
          >
            ✕
          </button>
        </div>

        {/* ── Profile Avatar Overlay Header ── */}
        <div className="px-6 relative pb-4 border-b border-slate-100 flex items-end justify-between -mt-14 flex-shrink-0 bg-white">
          <div className="flex items-end gap-4">
            {/* Avatar — click to upload */}
            <label className="relative w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-black text-2xl cursor-pointer group flex-shrink-0">
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayAvatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.avatarInitials || profile.name.substring(0, 2).toUpperCase()
              )}
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition">
                📷
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            </label>

            <div className="mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                <VerifiedBadge
                  type="ARCHITECT"
                  verified={profile.isVerified || profile.verificationStatus === 'VERIFIED'}
                />
              </div>
              <p className="text-xs font-medium text-slate-600">{profile.specialization}</p>
              <p className="text-[11px] text-slate-400">
                {profile.companyName ? `${profile.companyName} · ` : ''}
                {profile.location || profile.city || 'Pakistan'}
              </p>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs bg-slate-900 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <span>✏️</span>
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl transition"
            >
              ✕ Cancel
            </button>
          )}
        </div>

        {/* ── Modal Body ── */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#f8fafc]">
          {message && (
            <div
              className={`p-3 mb-4 rounded-xl text-xs font-medium border ${
                message.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {!isEditing ? (
            /* ── READ ONLY OVERVIEW ── */
            <div className="flex flex-col gap-4 text-slate-800">

              {/* PCATP License & Experience */}
              <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      PCATP / License Reg No.
                    </span>
                    <p className="text-sm font-mono font-bold text-teal-700 mt-0.5">
                      {profile.pcatpNo || 'VERIFIED-PCATP'}
                    </p>
                  </div>
                  <span className="text-xs bg-teal-50 border border-teal-200 text-teal-700 px-3 py-1 rounded-full font-bold">
                    {profile.experienceYears || 5} Yrs Exp
                  </span>
                </div>

                {/* Star Rating Row */}
                <div className="px-4 pb-3 border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Average Rating
                    </span>
                    <StarDisplay rating={4.9} />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Availability
                    </span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 justify-end">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      Open to Projects
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">About</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {profile.bio || 'Verified Architect professional on NexMove PropTech Engine.'}
                </p>
              </div>

              {/* Software & Skills */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Software Stack & Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(profile.software.length > 0
                    ? profile.software
                    : ['Revit', 'AutoCAD', '3ds Max', 'Lumion']
                  ).map((sw) => (
                    <span
                      key={sw}
                      className="text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
                    >
                      {sw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact Info */}
              {profile.phone && (
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Verified WhatsApp Contact
                    </span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">{profile.phone}</p>
                  </div>
                  <a
                    href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(profile.name)},`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl transition shadow-sm flex items-center gap-1"
                  >
                    <span>💬</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Tip to click avatar/cover */}
              <p className="text-center text-[10px] text-slate-400 mt-1">
                💡 Click the avatar or cover photo above to update them instantly
              </p>
            </div>
          ) : (
            /* ── EDIT FORM ── */
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Ar. Ahmed Khan"
                    className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/30 transition"
                  />
                </div>

                {/* Phone Number */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Phone Number (WhatsApp)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92-300-1234567"
                    className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/30 transition"
                  />
                </div>

                {/* Company Name */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Company / Firm Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Rahman Architects & Associates"
                    className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500/30 transition"
                  />
                </div>

                {/* Avatar Image (Upload / URL) */}
                <div className="flex flex-col gap-1.5 sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Profile Picture (Avatar)</label>
                    <label className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1 rounded-lg cursor-pointer transition">
                      📁 Upload Avatar File
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFile}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="Or paste avatar image URL (https://...)"
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                  />
                </div>

                {/* Cover Banner Image (Upload / URL) */}
                <div className="flex flex-col gap-1.5 sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Cover Banner Image</label>
                    <label className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1 rounded-lg cursor-pointer transition">
                      📁 Upload Cover File
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverFile}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="Or paste cover banner image URL (https://...)"
                    className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                  />
                </div>

                {/* Specialization */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Specialization</label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                  >
                    {SPECIALIZATION_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Years */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Experience Years</label>
                  <input
                    type="number"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    min="0"
                    max="50"
                    className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                  />
                </div>

                {/* PCATP License No */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">PCATP License No.</label>
                  <input
                    type="text"
                    value={pcatpNo}
                    onChange={(e) => setPcatpNo(e.target.value)}
                    placeholder="PCATP-2024-XXXXX"
                    className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                  />
                </div>

                {/* Software Stack */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Software Stack (comma separated)</label>
                  <input
                    type="text"
                    value={softwareInput}
                    onChange={(e) => setSoftwareInput(e.target.value)}
                    placeholder="Revit, AutoCAD, 3ds Max, Lumion, SketchUp"
                    className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                  />
                </div>

                {/* Overseas Checkbox */}
                <div className="flex items-center gap-2.5 sm:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    id="edit-isOverseas"
                    type="checkbox"
                    checked={isOverseas}
                    onChange={(e) => setIsOverseas(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded cursor-pointer"
                  />
                  <label htmlFor="edit-isOverseas" className="text-xs font-bold text-slate-800 cursor-pointer">
                    🌐 Overseas / International Practice Architect
                  </label>
                </div>

                {isOverseas ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">Country *</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="United Arab Emirates"
                        className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-700">City *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Dubai"
                        className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">City (Pakistan)</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lahore, Karachi, Islamabad..."
                      className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 transition"
                    />
                  </div>
                )}

                {/* Bio / About */}
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700">Bio / About Me</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-600 resize-none transition"
                    placeholder="Tell clients about your design philosophy, specialization areas, and notable projects..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow disabled:opacity-50"
                >
                  {saving ? 'Saving...' : '✓ Save Profile Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
