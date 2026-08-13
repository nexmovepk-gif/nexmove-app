'use client'
// src/app/register/page.tsx

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  validateName,
  validateEmail,
  validatePassword,
  validateNTN,
  validateLatitude,
  validateLongitude,
  validateRequired,
  validateCNIC,
  validateImageFile,
} from '@/lib/validation'

// Preset coordinates helper for quick selection
const CITY_COORDINATES: { name: string; lat: number; lng: number }[] = [
  { name: 'Islamabad (F-7)', lat: 33.7215, lng: 73.0565 },
  { name: 'Rawalpindi (Bahria Town)', lat: 33.5256, lng: 73.0984 },
  { name: 'Lahore (Gulberg III)', lat: 31.5204, lng: 74.3587 },
  { name: 'Karachi (Clifton)', lat: 24.827, lng: 67.0322 },
]

const OVERSEAS_COUNTRIES = [
  'United Kingdom (UK)',
  'United Arab Emirates (UAE)',
  'United States (USA)',
  'Saudi Arabia (KSA)',
  'Canada',
  'Qatar',
  'Australia',
  'Oman',
  'Bahrain',
  'Kuwait',
  'Germany',
  'Other International',
]

export default function RegisterPage() {
  // Base Account & Credentials
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('BUYER')

  // Local Role State (Buyer / Local Public)
  const [cnicNumber, setCnicNumber] = useState('')
  const [cnicFrontPhoto, setCnicFrontPhoto] = useState('')
  const [cnicBackPhoto, setCnicBackPhoto] = useState('')

  // Overseas Role State
  const [overseasCountry, setOverseasCountry] = useState('')
  const [overseasCity, setOverseasCity] = useState('')
  const [overseasPostalCode, setOverseasPostalCode] = useState('')
  const [overseasDocNumber, setOverseasDocNumber] = useState('')
  const [overseasDocPhoto, setOverseasDocPhoto] = useState('')

  // Agency Role State
  const [agencyName, setAgencyName] = useState('')
  const [ntn, setNtn] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [logo, setLogo] = useState('')
  const [storefrontPhoto, setStorefrontPhoto] = useState('')
  const [ownerPhoto, setOwnerPhoto] = useState('')

  // UI & Validation State
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Role Category Helper Flags
  const isOverseasRole = [
    'OVERSEAS_BUYER',
    'OVERSEAS_INVESTOR',
    'OVERSEAS_AGENCY',
    'OVERSEAS_LOCAL_PUBLIC',
  ].includes(role)

  const isAgencyRole = [
    'AGENCY_ADMIN',
    'AGENCY_AGENT',
    'OVERSEAS_AGENCY',
  ].includes(role)

  const isLocalRole = [
    'BUYER',
    'LOCAL_PUBLIC',
  ].includes(role)

  // Live field validation — runs on every change and updates fieldErrors immediately
  const liveValidate = (key: string, value: string) => {
    let msg = ''
    if (key === 'name') msg = validateName(value).message
    if (key === 'email') msg = validateEmail(value).message
    if (key === 'password') msg = validatePassword(value).message

    // Local fields
    if (key === 'cnicNumber') msg = validateCNIC(value).message

    // Overseas fields
    if (key === 'overseasCountry') msg = validateRequired(value, 'Country').message
    if (key === 'overseasCity') msg = validateRequired(value, 'City').message
    if (key === 'overseasPostalCode') msg = validateRequired(value, 'Postal Code').message
    if (key === 'overseasDocNumber') msg = validateRequired(value, 'NICOP / Passport Number').message

    // Agency fields
    if (key === 'agencyName') msg = validateRequired(value, 'Agency Brand Name').message
    if (key === 'ntn') msg = validateNTN(value).message
    if (key === 'address') msg = validateRequired(value, 'Physical Address').message
    if (key === 'latitude') msg = validateLatitude(value).message
    if (key === 'longitude') msg = validateLongitude(value).message

    setFieldErrors((prev) => ({
      ...prev,
      [key]: msg,
    }))
  }

  // File upload helper — validates image file type, MIME, and size before preview
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    fieldKey: string
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = validateImageFile(file, 5)
    if (!result.valid) {
      setFieldErrors((prev) => ({ ...prev, [fieldKey]: result.message }))
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

  // Computed Form Validity — strictly checks active relevant fields for the selected role
  const isBaseValid =
    validateName(name).valid &&
    validateEmail(email).valid &&
    validatePassword(password).valid &&
    !!role

  const isLocalValid =
    !isLocalRole ||
    (validateCNIC(cnicNumber).valid && !!cnicFrontPhoto && !!cnicBackPhoto)

  const isOverseasValid =
    !isOverseasRole ||
    (validateRequired(overseasCountry, 'Country').valid &&
      validateRequired(overseasCity, 'City').valid &&
      validateRequired(overseasPostalCode, 'Postal Code').valid &&
      validateRequired(overseasDocNumber, 'NICOP / Passport Number').valid &&
      !!overseasDocPhoto)

  const isAgencyValid =
    !isAgencyRole ||
    (validateRequired(agencyName, 'Agency Brand Name').valid &&
      validateNTN(ntn).valid &&
      validateRequired(address, 'Physical Address').valid &&
      validateLatitude(latitude).valid &&
      validateLongitude(longitude).valid &&
      !!logo &&
      !!storefrontPhoto &&
      !!ownerPhoto)

  const isFormValid = isBaseValid && isLocalValid && isOverseasValid && isAgencyValid

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const checks: [string, string][] = [
      ['name', validateName(name).message],
      ['email', validateEmail(email).message],
      ['password', validatePassword(password).message],
    ]

    if (isLocalRole) {
      checks.push(['cnicNumber', validateCNIC(cnicNumber).message])
      if (!cnicFrontPhoto) errors.cnicFrontPhoto = 'CNIC Front Photo is required.'
      if (!cnicBackPhoto) errors.cnicBackPhoto = 'CNIC Back Photo is required.'
    }

    if (isOverseasRole) {
      checks.push(['overseasCountry', validateRequired(overseasCountry, 'Country').message])
      checks.push(['overseasCity', validateRequired(overseasCity, 'City').message])
      checks.push(['overseasPostalCode', validateRequired(overseasPostalCode, 'Postal Code').message])
      checks.push(['overseasDocNumber', validateRequired(overseasDocNumber, 'NICOP / Passport Number').message])
      if (!overseasDocPhoto) errors.overseasDocPhoto = 'Overseas Passport / Document Photo is required.'
    }

    if (isAgencyRole) {
      checks.push(['agencyName', validateRequired(agencyName, 'Agency Brand Name').message])
      checks.push(['ntn', validateNTN(ntn).message])
      checks.push(['address', validateRequired(address, 'Physical Address').message])
      checks.push(['latitude', validateLatitude(latitude).message])
      checks.push(['longitude', validateLongitude(longitude).message])
      if (!logo) errors.logo = 'Agency Brand Logo is required.'
      if (!storefrontPhoto) errors.storefrontPhoto = 'Agency Storefront Photo is required.'
      if (!ownerPhoto) errors.ownerPhoto = 'Agency Owner Photo is required.'
    }

    checks.forEach(([key, msg]) => {
      if (msg) errors[key] = msg
    })

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validateForm()) {
      setError('Please fix all highlighted format errors before proceeding.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          cnicNumber: isLocalRole ? cnicNumber : undefined,
          cnicFrontPhoto: isLocalRole ? cnicFrontPhoto : undefined,
          cnicBackPhoto: isLocalRole ? cnicBackPhoto : undefined,
          overseasCountry: isOverseasRole ? overseasCountry : undefined,
          overseasCity: isOverseasRole ? overseasCity : undefined,
          overseasPostalCode: isOverseasRole ? overseasPostalCode : undefined,
          overseasDocNumber: isOverseasRole ? overseasDocNumber : undefined,
          overseasDocPhoto: isOverseasRole ? overseasDocPhoto : undefined,
          agencyName: isAgencyRole ? agencyName : undefined,
          ntn: isAgencyRole ? ntn : undefined,
          address: isAgencyRole ? address : undefined,
          latitude: isAgencyRole ? parseFloat(latitude) : undefined,
          longitude: isAgencyRole ? parseFloat(longitude) : undefined,
          logo: isAgencyRole ? logo : undefined,
          storefrontPhoto: isAgencyRole ? storefrontPhoto : undefined,
          ownerPhoto: isAgencyRole ? ownerPhoto : undefined,
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
        if (isAgencyRole) {
          router.push('/agency/dashboard')
        } else if (isOverseasRole) {
          router.push('/investors')
        } else {
          router.push('/marketplace')
        }
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
            NexMove Verified Registration Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Register Now
          </h1>
          <p className="text-xs text-slate-600 max-w-md">
            Select your account role below. The verification form adapts dynamically to your profile.
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
          {/* Section 1: Account Credentials & Role */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Account Credentials &amp; Role Selection
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900" htmlFor="name-input">
                  Full Name *
                </label>
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    liveValidate('name', e.target.value)
                  }}
                  placeholder="e.g. Tariq Mehmood"
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
                <label className="text-xs font-bold text-slate-900" htmlFor="email-input">
                  Email Address *
                </label>
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    liveValidate('email', e.target.value)
                  }}
                  placeholder="user@example.com"
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
                  onChange={(e) => {
                    setPassword(e.target.value)
                    liveValidate('password', e.target.value)
                  }}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className={`bg-white border ${
                    fieldErrors.password ? 'border-red-500' : 'border-slate-300'
                  } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition`}
                />
                {fieldErrors.password && (
                  <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.password}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-900" htmlFor="role-select">
                  Account Role *
                </label>
                <select
                  id="role-select"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value)
                    setFieldErrors({})
                  }}
                  className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500 transition shadow-sm"
                >
                  <option value="BUYER">Buyer</option>
                  <option value="AGENCY_ADMIN">Agency Admin</option>
                  <option value="AGENCY_AGENT">Agency Agent</option>
                  <option value="OVERSEAS_BUYER">Overseas Buyer</option>
                  <option value="OVERSEAS_INVESTOR">Overseas Investor</option>
                  <option value="OVERSEAS_AGENCY">Overseas Agency</option>
                  <option value="LOCAL_PUBLIC">Local Public</option>
                  <option value="OVERSEAS_LOCAL_PUBLIC">Overseas Local Public</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Local Verification Fields (For Buyer / Local Public) */}
          {isLocalRole && (
            <div className="flex flex-col gap-4 bg-emerald-50/50 p-4.5 rounded-2xl border border-emerald-100">
              <h2 className="text-xs font-bold text-emerald-900 uppercase tracking-wider border-b border-emerald-200/60 pb-2 flex items-center justify-between">
                <span>2. Local Identity &amp; CNIC Verification</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Local Resident Profile
                </span>
              </h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900" htmlFor="cnic-input">
                    Pakistani CNIC Number *
                  </label>
                  <input
                    id="cnic-input"
                    type="text"
                    value={cnicNumber}
                    onChange={(e) => {
                      setCnicNumber(e.target.value)
                      liveValidate('cnicNumber', e.target.value)
                    }}
                    placeholder="e.g. 35201-1234567-1"
                    required
                    className={`bg-white border ${
                      fieldErrors.cnicNumber ? 'border-red-500' : 'border-slate-300'
                    } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 transition`}
                  />
                  {fieldErrors.cnicNumber && (
                    <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.cnicNumber}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* CNIC Front Photo */}
                  <div className="flex flex-col gap-2 bg-white p-3.5 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-900">
                      CNIC Front Photo *
                    </label>
                    {cnicFrontPhoto ? (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-300 bg-slate-100 flex items-center justify-center">
                        <Image src={cnicFrontPhoto} alt="CNIC Front Preview" fill className="object-cover" unoptimized />
                        <button
                          type="button"
                          onClick={() => setCnicFrontPhoto('')}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-28 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 p-2 text-center">
                        <span className="text-xl">🪪</span>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">Upload CNIC Front</span>
                        <span className="text-[9px] text-slate-400">JPG/PNG up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setCnicFrontPhoto, 'cnicFrontPhoto')}
                          className="hidden"
                        />
                      </label>
                    )}
                    {fieldErrors.cnicFrontPhoto && (
                      <span className="text-[9px] text-red-600 font-semibold">{fieldErrors.cnicFrontPhoto}</span>
                    )}
                  </div>

                  {/* CNIC Back Photo */}
                  <div className="flex flex-col gap-2 bg-white p-3.5 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-900">
                      CNIC Back Photo *
                    </label>
                    {cnicBackPhoto ? (
                      <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-300 bg-slate-100 flex items-center justify-center">
                        <Image src={cnicBackPhoto} alt="CNIC Back Preview" fill className="object-cover" unoptimized />
                        <button
                          type="button"
                          onClick={() => setCnicBackPhoto('')}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-28 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 p-2 text-center">
                        <span className="text-xl">💳</span>
                        <span className="text-[10px] font-bold text-slate-700 mt-1">Upload CNIC Back</span>
                        <span className="text-[9px] text-slate-400">JPG/PNG up to 5MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, setCnicBackPhoto, 'cnicBackPhoto')}
                          className="hidden"
                        />
                      </label>
                    )}
                    {fieldErrors.cnicBackPhoto && (
                      <span className="text-[9px] text-red-600 font-semibold">{fieldErrors.cnicBackPhoto}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Overseas Specific Verification Fields */}
          {isOverseasRole && (
            <div className="flex flex-col gap-4 bg-sky-50/60 p-4.5 rounded-2xl border border-sky-100">
              <h2 className="text-xs font-bold text-sky-900 uppercase tracking-wider border-b border-sky-200/60 pb-2 flex items-center justify-between">
                <span>🌐 Overseas Investor &amp; Identity Verification</span>
                <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                  Diaspora Profile
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900" htmlFor="country-select">
                    Country of Residence *
                  </label>
                  <select
                    id="country-select"
                    value={overseasCountry}
                    onChange={(e) => {
                      setOverseasCountry(e.target.value)
                      liveValidate('overseasCountry', e.target.value)
                    }}
                    className={`bg-white border ${
                      fieldErrors.overseasCountry ? 'border-red-500' : 'border-slate-300'
                    } rounded-xl px-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition`}
                  >
                    <option value="">Select Country</option>
                    {OVERSEAS_COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {fieldErrors.overseasCountry && (
                    <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.overseasCountry}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900" htmlFor="overseas-city">
                    Overseas City *
                  </label>
                  <input
                    id="overseas-city"
                    type="text"
                    value={overseasCity}
                    onChange={(e) => {
                      setOverseasCity(e.target.value)
                      liveValidate('overseasCity', e.target.value)
                    }}
                    placeholder="e.g. London / Dubai"
                    required
                    className={`bg-white border ${
                      fieldErrors.overseasCity ? 'border-red-500' : 'border-slate-300'
                    } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition`}
                  />
                  {fieldErrors.overseasCity && (
                    <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.overseasCity}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900" htmlFor="postal-input">
                    Postal / Zip Code *
                  </label>
                  <input
                    id="postal-input"
                    type="text"
                    value={overseasPostalCode}
                    onChange={(e) => {
                      setOverseasPostalCode(e.target.value)
                      liveValidate('overseasPostalCode', e.target.value)
                    }}
                    placeholder="e.g. SW1A 1AA / 90210"
                    required
                    className={`bg-white border ${
                      fieldErrors.overseasPostalCode ? 'border-red-500' : 'border-slate-300'
                    } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 transition`}
                  />
                  {fieldErrors.overseasPostalCode && (
                    <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.overseasPostalCode}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-900" htmlFor="overseas-doc-num">
                    Overseas NICOP / Foreign Passport Number *
                  </label>
                  <input
                    id="overseas-doc-num"
                    type="text"
                    value={overseasDocNumber}
                    onChange={(e) => {
                      setOverseasDocNumber(e.target.value)
                      liveValidate('overseasDocNumber', e.target.value)
                    }}
                    placeholder="e.g. 42101-9988771-3 (NICOP) or A9823412 (Passport)"
                    required
                    className={`bg-white border ${
                      fieldErrors.overseasDocNumber ? 'border-red-500' : 'border-slate-300'
                    } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 transition`}
                  />
                  {fieldErrors.overseasDocNumber && (
                    <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.overseasDocNumber}</span>
                  )}
                </div>

                {/* Overseas Document Photo Upload */}
                <div className="flex flex-col gap-2 bg-white p-3 rounded-2xl border border-slate-200 sm:col-span-1">
                  <label className="text-xs font-bold text-slate-900">
                    Document / Passport Photo *
                  </label>
                  {overseasDocPhoto ? (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-300 bg-slate-100 flex items-center justify-center">
                      <Image src={overseasDocPhoto} alt="Overseas Document Preview" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => setOverseasDocPhoto('')}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-24 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 p-2 text-center">
                      <span className="text-xl">✈️</span>
                      <span className="text-[10px] font-bold text-slate-700 mt-1">Upload Passport / NICOP</span>
                      <span className="text-[9px] text-slate-400">JPG/PNG up to 5MB</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setOverseasDocPhoto, 'overseasDocPhoto')}
                        className="hidden"
                      />
                    </label>
                  )}
                  {fieldErrors.overseasDocPhoto && (
                    <span className="text-[9px] text-red-600 font-semibold">{fieldErrors.overseasDocPhoto}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section: Agency Specific Fields */}
          {isAgencyRole && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Agency Legal, Location &amp; Branding Setup</span>
                <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                  Corporate Agency
                </span>
              </h2>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-900" htmlFor="agency-input">
                      Agency Brand Name *
                    </label>
                    <input
                      id="agency-input"
                      type="text"
                      value={agencyName}
                      onChange={(e) => {
                        setAgencyName(e.target.value)
                        liveValidate('agencyName', e.target.value)
                      }}
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
                    <label className="text-xs font-bold text-slate-900" htmlFor="ntn-input">
                      NTN / Tax Registration Number *
                    </label>
                    <input
                      id="ntn-input"
                      type="text"
                      value={ntn}
                      onChange={(e) => {
                        setNtn(e.target.value)
                        liveValidate('ntn', e.target.value)
                      }}
                      placeholder="e.g. NTN-4829103-7"
                      required
                      className={`bg-white border ${
                        fieldErrors.ntn ? 'border-red-500' : 'border-slate-300'
                      } rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 transition`}
                    />
                    {fieldErrors.ntn && (
                      <span className="text-[10px] text-red-600 font-semibold">{fieldErrors.ntn}</span>
                    )}
                  </div>
                </div>

                {/* Physical Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900" htmlFor="address-input">
                    Complete Agency Physical Address *
                  </label>
                  <textarea
                    id="address-input"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      liveValidate('address', e.target.value)
                    }}
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
                      Agency Map Coordinates (Latitude &amp; Longitude) *
                    </label>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      📍 Direct Google Maps Navigation
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
                        onChange={(e) => {
                          setLatitude(e.target.value)
                          liveValidate('latitude', e.target.value)
                        }}
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
                        onChange={(e) => {
                          setLongitude(e.target.value)
                          liveValidate('longitude', e.target.value)
                        }}
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

                {/* Agency Photo Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Logo */}
                  <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-900">Brand Logo *</label>
                    {logo ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-300 bg-white flex items-center justify-center">
                        <Image src={logo} alt="Logo Preview" fill className="object-contain p-2" unoptimized />
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
                        <span className="text-[9px] text-slate-400">PNG/JPG up to 5MB</span>
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

                  {/* Storefront */}
                  <div className="flex flex-col gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-900">Storefront Photo *</label>
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
                    <label className="text-xs font-bold text-slate-900">Owner Identity Photo *</label>
                    {ownerPhoto ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-300 bg-white flex items-center justify-center">
                        <Image src={ownerPhoto} alt="Owner Preview" fill className="object-cover" unoptimized />
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
            </div>
          )}

          {!isFormValid && (
            <div className="bg-amber-50 border border-amber-300 text-amber-800 text-[10px] p-3 rounded-xl font-semibold text-center leading-relaxed">
              ⚠️ Please complete all required format checks for your selected role ({role}) before submitting.
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md disabled:opacity-60 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating Your Verified NexMove Account...</span>
              </>
            ) : (
              <span>Register Account ✓</span>
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
