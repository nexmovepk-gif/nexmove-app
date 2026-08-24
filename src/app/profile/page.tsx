'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface ProfileData {
  id: string
  name: string | null
  email: string
  phone: string | null
  address: string | null
  role: string
  accountRoleType: string | null
  profileImage: string | null
  isKycVerified: boolean
  cnicNumber: string | null
  nicopNumber: string | null
  passportNumber: string | null
  overseasCountry: string | null
  overseasCity: string | null
  bankName: string
  accountTitle: string
  accountNumber: string
  iban: string
  swiftCode: string
  bankDetailsUpdatedAt: string | null
  canEditBank: boolean
  daysRemaining: number
  unlocksAt: string | null
}

interface AgencyData {
  id: string
  name: string
  ntn: string | null
  phone: string | null
  address: string | null
  logo: string | null
  verified: boolean
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Profile Fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [agencyName, setAgencyName] = useState('')

  // Banking Fields
  const [bankName, setBankName] = useState('')
  const [accountTitle, setAccountTitle] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [iban, setIban] = useState('')
  const [swiftCode, setSwiftCode] = useState('')

  // Cooldown / Meta
  const [profileMeta, setProfileMeta] = useState<ProfileData | null>(null)
  const [agencyMeta, setAgencyMeta] = useState<AgencyData | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile')
      return
    }

    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/user/profile')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load profile')
      }

      const u: ProfileData = data.user
      setProfileMeta(u)
      setAgencyMeta(data.agency)

      setName(u.name || '')
      setPhone(u.phone || '')
      setAddress(u.address || '')
      setProfileImage(u.profileImage || '')
      setBankName(u.bankName || '')
      setAccountTitle(u.accountTitle || '')
      setAccountNumber(u.accountNumber || '')
      setIban(u.iban || '')
      setSwiftCode(u.swiftCode || '')

      if (data.agency?.name) {
        setAgencyName(data.agency.name)
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Error loading profile'
      setMessage({ text: errMsg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Image file size must be less than 5MB.', type: 'error' })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const payload: Record<string, unknown> = {
        name,
        phone,
        address,
        profileImage,
      }

      if (agencyMeta) {
        payload.agencyName = agencyName
        payload.logo = profileImage
      }

      // If user is allowed to edit bank details, send bank fields
      if (profileMeta?.canEditBank) {
        payload.bankName = bankName
        payload.accountTitle = accountTitle
        payload.accountNumber = accountNumber
        payload.iban = iban
        if (agencyMeta) payload.swiftCode = swiftCode
      }

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setMessage({ text: data.message || 'Profile successfully saved!', type: 'success' })
      await fetchProfile() // Refresh metadata and locks
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to update settings.'
      setMessage({ text: errMsg, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const maskIBAN = (val: string) => {
    if (!val || val.length < 8) return val || 'Not set'
    return `${val.substring(0, 4)} •••• •••• •••• ${val.substring(val.length - 4)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wide">Loading Profile & Security Vault...</p>
      </div>
    )
  }

  const roleBadge = profileMeta?.accountRoleType || profileMeta?.role || 'USER'
  const isAgency = Boolean(agencyMeta || roleBadge.includes('AGENCY'))

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Breadcrumb & Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link href="/" className="hover:text-emerald-400 transition">Home</Link>
            <span>/</span>
            <span className="text-white font-semibold">Profile & Banking Security</span>
          </div>
          <Link
            href={isAgency ? '/agency/dashboard' : '/investors'}
            className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5"
          >
            ← Back to Portal
          </Link>
        </div>

        {/* Alert Notifications */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              message.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{message.type === 'success' ? '✓' : '⚠️'}</span>
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100 text-sm">✕</button>
          </div>
        )}

        {/* Profile Card Header */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar / Logo Upload */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-800 shadow-inner flex items-center justify-center">
              {profileImage ? (
                <Image src={profileImage} alt="Profile Photo" fill className="object-cover" unoptimized />
              ) : (
                <span className="text-4xl text-slate-500">{isAgency ? '🏢' : '👤'}</span>
              )}
            </div>
            <label className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition text-white">
              <span className="text-lg">📷</span>
              <span className="text-[10px] font-bold mt-1">Change Photo</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          {/* User Info & Identity Badges */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white">{name || 'NexMove User'}</h1>
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {roleBadge}
              </span>
              {profileMeta?.isKycVerified && (
                <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  ✓ Verified Identity
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">{profileMeta?.email}</p>
            <p className="text-xs text-slate-300">
              {agencyMeta?.name ? `Agency: ${agencyMeta.name}` : profileMeta?.overseasCountry ? `Overseas Resident (${profileMeta.overseasCountry})` : 'NexMove Member'}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 1. Personal / Brand Information */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>👤</span> Account & Contact Details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Full Name / Account Representative</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                  required
                />
              </div>

              {isAgency && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Agency Brand Name</label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Contact Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Physical Address / City</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="DHA Phase 6, Lahore, Pakistan"
                  className="bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* 2. Banking & Escrow Payout Security Vault */}
          <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div>
                <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                  <span>🏦</span> Escrow Banking & Payout Security Vault
                </h2>
                <p className="text-[11px] text-slate-400">
                  {isAgency
                    ? 'Account where Stage 1/2/3 Escrow payouts and rent settlements are wired.'
                    : 'Account used for Escrow token returns, investment distributions, and payouts.'}
                </p>
              </div>

              {/* 6-Month Cooldown Status Badge */}
              <div>
                {profileMeta?.canEditBank ? (
                  <span className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    🔓 Unlocked for Edit (6-Mo Cooldown Ready)
                  </span>
                ) : (
                  <span className="bg-amber-500/10 border border-amber-500/40 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    🔒 Cooldown Locked ({profileMeta?.daysRemaining} days left)
                  </span>
                )}
              </div>
            </div>

            {/* Cooldown Explanation Banner */}
            {!profileMeta?.canEditBank && (
              <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-200 leading-relaxed flex items-start gap-3">
                <span className="text-xl">🛡️</span>
                <div>
                  <p className="font-bold text-amber-300">Fraud Protection Lock Active</p>
                  <p className="text-[11px] text-amber-200/80 mt-0.5">
                    For your financial safety and to prevent unauthorized bank diversion, bank details can only be changed once every 6 months. Your next allowed modification date is <strong className="text-amber-100">{profileMeta?.unlocksAt}</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Bank Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Official Bank / RDA Name</label>
                <input
                  type="text"
                  value={bankName}
                  disabled={!profileMeta?.canEditBank}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Meezan Bank / HBL RDA / Emirates NBD"
                  className="bg-slate-800/80 border border-slate-700 disabled:bg-slate-900/60 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              {/* Account Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Account Title (Holder Name)</label>
                <input
                  type="text"
                  value={accountTitle}
                  disabled={!profileMeta?.canEditBank}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  placeholder="e.g. Tariq Al-Mansoor"
                  className="bg-slate-800/80 border border-slate-700 disabled:bg-slate-900/60 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              {/* IBAN */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">
                  IBAN Number {profileMeta?.canEditBank ? '' : '(Masked for Privacy)'}
                </label>
                <input
                  type="text"
                  value={profileMeta?.canEditBank ? iban : maskIBAN(iban)}
                  disabled={!profileMeta?.canEditBank}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  placeholder="PK36MEZN0001234567890101"
                  className="bg-slate-800/80 border border-slate-700 disabled:bg-slate-900/60 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none transition"
                />
              </div>

              {/* Account Number or SWIFT */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">
                  {isAgency ? 'SWIFT / BIC Code (Optional)' : 'Account Number'}
                </label>
                <input
                  type="text"
                  value={isAgency ? swiftCode : accountNumber}
                  disabled={!profileMeta?.canEditBank}
                  onChange={(e) => {
                    if (isAgency) setSwiftCode(e.target.value.toUpperCase())
                    else setAccountNumber(e.target.value)
                  }}
                  placeholder={isAgency ? 'e.g. MEZNPKKAXXX' : 'e.g. 010100998822'}
                  className="bg-slate-800/80 border border-slate-700 disabled:bg-slate-900/60 disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-bold text-xs py-3.5 rounded-2xl transition shadow-lg flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Security Settings...</span>
              </>
            ) : (
              <span>Save Profile & Security Vault Changes ✓</span>
            )}
          </button>
        </form>

      </div>
    </div>
  )
}
