'use client'
// src/app/register/page.tsx

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

// Preset coordinates helper for quick selection
const CITY_COORDINATES: { name: string; lat: number; lng: number }[] = [
  { name: 'Islamabad (F-7)', lat: 33.7215, lng: 73.0565 },
  { name: 'Rawalpindi (Bahria Town)', lat: 33.5256, lng: 73.0984 },
  { name: 'Lahore (Gulberg III)', lat: 31.5204, lng: 74.3587 },
  { name: 'Karachi (Clifton)', lat: 24.827, lng: 67.0322 },
]

export default function RegisterPage() {
  // Account & Basic Info
  const [name, setName] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('AGENCY_MANAGER')

  // Legal, Branding & Location Fields
  const [ntn, setNtn] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [passportNumber, setPassportNumber] = useState('')
  const [nicopNumber, setNicopNumber] = useState('')

  // Photos & Upload state (Data URL / Image URL storage)
  const [logo, setLogo] = useState('')
  const [storefrontPhoto, setStorefrontPhoto] = useState('')
  const [ownerPhoto, setOwnerPhoto] = useState('')

  // Error handling
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // File upload helper converts file to base64 Data URL for instant preview & persistence
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    fieldKey: string
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors((prev) => ({
          ...prev,
          [fieldKey]: 'File size must be under 5MB',
        }))
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setter(reader.result as string)
        setFieldErrors((prev) => {
          const updated = { ...prev }
          delete updated[fieldKey]
          return updated
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!name.trim()) errors.name = 'Full Name is required.'
    if (!agencyName.trim()) errors.agencyName = 'Agency Name is required.'
    if (!email.trim()) errors.email = 'Email Address is required.'
    if (!password || password.length < 6)
      errors.password = 'Password must be at least 6 characters.'

    // Mandatory Legal, Location & Photo validations
    if (!ntn.trim())
      errors.ntn = 'NTN / Tax Registration Number is required for AI legal contract generation.'
    if (!address.trim())
      errors.address = 'Complete Agency Physical Address is required.'
    if (!latitude.trim() || isNaN(Number(latitude)))
      errors.latitude = 'Exact Latitude coordinate is required for client navigation.'
    if (!longitude.trim() || isNaN(Number(longitude)))
      errors.longitude = 'Exact Longitude coordinate is required for client navigation.'

    if (!logo)
      errors.logo = 'Agency Brand Logo is required.'
    if (!storefrontPhoto)
      errors.storefrontPhoto = 'Agency Storefront / Front-Side Photo is required.'
    if (!ownerPhoto)
      errors.ownerPhoto = 'Agency Owner Passport / Identity Photo is required.'

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      setError('Please fix all highlighted errors. All legal, location, and photo fields are strictly required.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          agencyName,
          email,
          password,
          role,
          ntn,
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          logo,
          storefrontPhoto,
          ownerPhoto,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      setLoading(false)

      if (signInRes?.error) {
        router.push('/login?registered=true')
      } else {
        router.push('/agency/dashboard')
      }
    } catch (err: unknown) {
      setLoading(false)
      const message = err instanceof Error ? err.message : 'An error occurred during registration.'
      setError(message)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            NexMove Verified Partner Registration
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Register Agency Account
          </h1>
          <p className="text-xs text-slate-600 max-w-md">
            Complete legal NTN verification, location mapping, and branding details to unlock AI Legal Contracts and verified directory listing.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-2xl text-center font-semibold leading-relaxed">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-6">
          {/* Section 1: Account Credentials */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Account Credentials & Owner Info
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900" htmlFor="name-input">
                  Full Name (Owner / Manager) *
                </label>
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                  className={`bg-white border ${
                    fieldErrors.name ? 'border-red-500' : 'border-slate-300'
                  } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition`}
                />
                {fieldErrors.name && (
                  <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.name}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900" htmlFor="agency-input">
                  Agency Brand Name *
                </label>
                <input
                  id="agency-input"
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="Premier Properties Agency"
                  required
                  className={`bg-white border ${
                    fieldErrors.agencyName ? 'border-red-500' : 'border-slate-300'
                  } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition`}
                />
                {fieldErrors.agencyName && (
                  <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.agencyName}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900" htmlFor="email-input">
                  Email Address *
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@agency.com"
                  required
                  className={`bg-white border ${
                    fieldErrors.email ? 'border-red-500' : 'border-slate-300'
                  } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition`}
                />
                {fieldErrors.email && (
                  <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.email}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900" htmlFor="password-input">
                  Password *
                </label>
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={`bg-white border ${
                    fieldErrors.password ? 'border-red-500' : 'border-slate-300'
                  } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition`}
                />
                {fieldErrors.password && (
                  <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.password}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-900" htmlFor="role-select">
                  Account Role
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="AGENCY_MANAGER">Agency Admin / Owner (AGENCY_ADMIN)</option>
                  <option value="AGENCY_AGENT">Agency Agent (AGENCY_AGENT)</option>
                  <option value="PUBLIC_USER">Overseas Investor / Foreign Buyer (INVESTOR_KYC)</option>
                </select>
              </div>

              {/* Overseas Verification Fields */}
              <div className="flex flex-col gap-1.5 sm:col-span-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  🌐 Overseas Investor KYC Verification (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700">Overseas NICOP Number</label>
                    <input
                      type="text"
                      value={nicopNumber}
                      onChange={(e) => setNicopNumber(e.target.value)}
                      placeholder="e.g. 42101-9988771-3"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700">Overseas Passport Number</label>
                    <input
                      type="text"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      placeholder="e.g. A9823412 (UK / UAE / US)"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Mandatory Legal & Location Info */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Mandatory Legal & Map Location
            </h2>

            <div className="flex flex-col gap-4">
              {/* NTN Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900" htmlFor="ntn-input">
                  NTN / Tax Registration Number *
                </label>
                <input
                  id="ntn-input"
                  type="text"
                  value={ntn}
                  onChange={(e) => setNtn(e.target.value)}
                  placeholder="e.g. NTN-4829103-7"
                  required
                  className={`bg-white border ${
                    fieldErrors.ntn ? 'border-red-500' : 'border-slate-300'
                  } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition font-mono`}
                />
                <span className="text-[10px] text-slate-500">
                  Required for AI legal contract generation and regulatory compliance verification.
                </span>
                {fieldErrors.ntn && (
                  <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.ntn}</span>
                )}
              </div>

              {/* Physical Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900" htmlFor="address-input">
                  Complete Agency Physical Address *
                </label>
                <textarea
                  id="address-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Suite 402, 4th Floor, Main Boulevard, Bahria Town, Rawalpindi / Islamabad"
                  rows={2}
                  required
                  className={`bg-white border ${
                    fieldErrors.address ? 'border-red-500' : 'border-slate-300'
                  } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition resize-none`}
                />
                {fieldErrors.address && (
                  <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.address}</span>
                )}
              </div>

              {/* Coordinates & Quick Map Picker */}
              <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900">
                    Agency Map Coordinates (Latitude & Longitude) *
                  </label>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    📍 Powers Direct Google Maps Navigation
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 my-1">
                  <span className="text-[10px] text-slate-500 self-center font-medium">Quick Pin:</span>
                  {CITY_COORDINATES.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => {
                        setLatitude(city.lat.toString())
                        setLongitude(city.lng.toString())
                        setFieldErrors((prev) => {
                          const updated = { ...prev }
                          delete updated.latitude
                          delete updated.longitude
                          return updated
                        })
                      }}
                      className="text-[10px] bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded-lg transition font-semibold"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="e.g. 33.5256"
                      required
                      className={`bg-white border ${
                        fieldErrors.latitude ? 'border-red-500' : 'border-slate-300'
                      } rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 transition`}
                    />
                    {fieldErrors.latitude && (
                      <span className="text-[9px] text-red-600 font-semibold">{fieldErrors.latitude}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-700">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="e.g. 73.0984"
                      required
                      className={`bg-white border ${
                        fieldErrors.longitude ? 'border-red-500' : 'border-slate-300'
                      } rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 transition`}
                    />
                    {fieldErrors.longitude && (
                      <span className="text-[9px] text-red-600 font-semibold">{fieldErrors.longitude}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Mandatory File Uploads & Identity Photos */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              3. Branding & Physical Verification Photos
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Agency Brand Logo */}
              <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-900">
                  Agency Brand Logo *
                </label>
                {logo ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-300 bg-white flex items-center justify-center">
                    <Image src={logo} alt="Agency Logo Preview" fill className="object-contain p-2" unoptimized />
                    <button
                      type="button"
                      onClick={() => setLogo('')}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-white p-2 text-center">
                    <span className="text-xl">🖼️</span>
                    <span className="text-[10px] font-bold text-slate-700 mt-1">Upload Brand Logo</span>
                    <span className="text-[9px] text-slate-400">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setLogo, 'logo')}
                      className="hidden"
                    />
                  </label>
                )}
                {fieldErrors.logo && (
                  <span className="text-[9px] text-red-600 font-semibold">{fieldErrors.logo}</span>
                )}
              </div>

              {/* Storefront Photo */}
              <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-900">
                  Storefront Photo *
                </label>
                {storefrontPhoto ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-300 bg-white flex items-center justify-center">
                    <Image src={storefrontPhoto} alt="Storefront Preview" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setStorefrontPhoto('')}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-white p-2 text-center">
                    <span className="text-xl">🏢</span>
                    <span className="text-[10px] font-bold text-slate-700 mt-1">Upload Storefront</span>
                    <span className="text-[9px] text-slate-400">Front facade photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setStorefrontPhoto, 'storefrontPhoto')}
                      className="hidden"
                    />
                  </label>
                )}
                {fieldErrors.storefrontPhoto && (
                  <span className="text-[9px] text-red-600 font-semibold">{fieldErrors.storefrontPhoto}</span>
                )}
              </div>

              {/* Owner Identity Photo */}
              <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-900">
                  Owner Identity Photo *
                </label>
                {ownerPhoto ? (
                  <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-300 bg-white flex items-center justify-center">
                    <Image src={ownerPhoto} alt="Owner Photo Preview" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setOwnerPhoto('')}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-white p-2 text-center">
                    <span className="text-xl">👤</span>
                    <span className="text-[10px] font-bold text-slate-700 mt-1">Upload Owner Photo</span>
                    <span className="text-[9px] text-slate-400">Passport size photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setOwnerPhoto, 'ownerPhoto')}
                      className="hidden"
                    />
                  </label>
                )}
                {fieldErrors.ownerPhoto && (
                  <span className="text-[9px] text-red-600 font-semibold">{fieldErrors.ownerPhoto}</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying & Creating Agency Account...</span>
              </>
            ) : (
              <span>Register Verified Agency Account ✓</span>
            )}
          </button>
        </form>

        {/* Redirect to Login */}
        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-700 hover:underline font-bold">
              Log in here →
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
