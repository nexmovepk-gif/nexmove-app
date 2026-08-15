'use client'
// src/app/architects/register/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePhone,
  validateExperienceYears,
  validateURL,
} from '@/lib/validation'

const SPECIALIZATIONS = ['3D Visualizer', 'BIM Specialist', 'Revit Technician', 'Interior Designer', 'Landscape Architect']
const DEGREES_OPTIONS = ['B.Arch', 'B.Sc Architecture', 'B.Sc Interior Design', 'B.Sc Landscape Architecture', 'B.Sc Civil Technology', 'M.Arch', 'M.Sc BIM', 'M.Sc Urban Design', 'PhD Architecture', 'Diploma in Visualization']
const SOFTWARE_OPTIONS = ['Revit', 'AutoCAD', '3ds Max', 'Lumion', 'SketchUp', 'Navisworks', 'Enscape', 'V-Ray', 'ArchiCAD', 'Rhino', 'Grasshopper', 'ArcGIS', 'Dynamo', 'BIM 360', 'Adobe Suite', 'Photoshop']
const PROJECT_TYPE_OPTIONS = ['Residential', 'Commercial', 'High-Rise', 'Mixed-Use', 'Luxury Villas', 'Hospitality', 'Industrial', 'Urban Planning', 'Interior Design', 'Landscape']

type Step = 'personal' | 'credentials' | 'skills' | 'portfolio' | 'review' | 'success'

const STEPS: { key: Step; label: string; icon: string }[] = [
  { key: 'personal', label: 'Personal Info', icon: '👤' },
  { key: 'credentials', label: 'Credentials', icon: '🏛️' },
  { key: 'skills', label: 'Skills', icon: '🛠️' },
  { key: 'portfolio', label: 'Portfolio', icon: '🖼️' },
  { key: 'review', label: 'Review', icon: '✅' },
]

export default function ArchitectRegisterPage() {
  const [step, setStep] = useState<Step>('personal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const liveValidate = (key: string, value: string) => {
    let msg = ''
    if (key === 'fullName') msg = validateName(value).message
    if (key === 'email') msg = validateEmail(value).message
    if (key === 'password') msg = validatePassword(value).message
    if (key === 'phone' && value.trim()) msg = validatePhone(value).message
    if (key === 'experienceYears') msg = validateExperienceYears(value).message
    setFieldErrors((prev) => ({ ...prev, [key]: msg }))
  }

  const validatePortfolioLinks = (): boolean => {
    const errors: Record<string, string> = {}
    portfolioLinks.forEach((link, idx) => {
      if (link.trim()) {
        const res = validateURL(link)
        if (!res.valid) errors[`portfolioLink_${idx}`] = res.message
      }
    })
    setFieldErrors((prev) => ({ ...prev, ...errors }))
    return Object.keys(errors).length === 0
  }

  // Form state
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [isOverseas, setIsOverseas] = useState(false)
  const [country, setCountry] = useState('Pakistan')
  const [city, setCity] = useState('')
  const [location, setLocation] = useState('')
  const [pcatpNo, setPcatpNo] = useState('')
  const [councilLicenseNo, setCouncilLicenseNo] = useState('')
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>([])
  const [customDegree, setCustomDegree] = useState('')
  const [experienceYears, setExperienceYears] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([])
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['', '', ''])

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item])
  }

  const updatePortfolioLink = (idx: number, val: string) => {
    const updated = [...portfolioLinks]
    updated[idx] = val
    setPortfolioLinks(updated)
  }

  const allDegrees = [...selectedDegrees, ...(customDegree ? [customDegree] : [])]
  const currentStepIdx = STEPS.findIndex((s) => s.key === step)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const activePortfolioUrl = portfolioUrl || portfolioLinks.filter(Boolean)[0] || ''
      const activePcatp = pcatpNo || councilLicenseNo

      const payload = {
        fullName,
        name: fullName,
        email,
        password,
        phone,
        companyName,
        pcatpNo: activePcatp,
        councilLicenseNo: activePcatp,
        isOverseas,
        country: isOverseas ? country : (country || 'Pakistan'),
        city,
        location: location || (isOverseas ? `${city}, ${country}` : (city ? `${city}, Pakistan` : 'Pakistan')),
        degrees: allDegrees,
        experienceYears: Number(experienceYears),
        specialization,
        software: selectedSoftware,
        projectTypes: selectedProjectTypes,
        bio,
        portfolioUrl: activePortfolioUrl,
        portfolioLinks: portfolioLinks.filter(Boolean),
      }

      const res = await fetch('/api/architects/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Registration submission failed. Please review highlighted fields.')
      }

      // DO NOT trigger success screen until res.ok is TRUE
      setStep('success')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during submission')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col items-center gap-6 text-center shadow-2xl">
          {/* Animated check */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-teal-500/30 to-violet-500/20 border border-teal-500/40 flex items-center justify-center">
              <svg className="w-10 h-10 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
              </svg>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full uppercase tracking-widest">
              Pending Verification
            </span>
            <h1 className="text-2xl font-black text-slate-50 mt-4">Application Submitted!</h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-sm mx-auto">
              Thank you, <span className="text-teal-400 font-bold">{fullName}</span>! Your architect profile is now under review by the NexMove verification team.
            </p>
          </div>

          <div className="w-full bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col gap-3 text-left">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">What happens next?</h3>
            {[
              { num: '1', text: 'Our team reviews your council license and credentials within 2–3 business days.' },
              { num: '2', text: 'You will receive an email confirmation once your profile is approved.' },
              { num: '3', text: 'Your Verified Architect badge will be activated and your profile becomes publicly visible.' },
              { num: '4', text: 'Agencies can then find you and send Design Proposal Requests directly.' },
            ].map((item) => (
              <div key={item.num} className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.num}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 w-full">
            <Link href="/" className="flex-1 text-center text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-medium py-3 rounded-xl transition">
              Go to Home
            </Link>
            <Link href="/architects" className="flex-1 text-center text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition">
              Browse Directory
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-4 py-5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/architects" className="text-xs text-slate-500 hover:text-slate-300 transition">← Architects Directory</Link>
          </div>
          <span className="text-[11px] font-bold bg-teal-500/15 border border-teal-500/30 text-teal-400 px-3 py-1 rounded-full uppercase tracking-widest">
            Professional Registration
          </span>
          <h1 className="text-2xl font-black text-slate-50 mt-3">Join as Verified Architect</h1>
          <p className="text-xs text-slate-400 mt-1.5">Submit your credentials for council verification. Unverified accounts are hidden from search until approved.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-8">
        {/* ── Step Progress ───────────────────────────────────────────── */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, idx) => {
            const isActive = s.key === step
            const isDone = currentStepIdx > idx
            return (
              <div key={s.key} className="flex items-center flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition ${
                  isActive ? 'bg-teal-600 text-white shadow shadow-teal-900/50'
                  : isDone ? 'bg-teal-950/60 border border-teal-800/60 text-teal-400'
                  : 'bg-slate-900 border border-slate-800 text-slate-500'
                }`}>
                  <span>{isDone ? '✓' : s.icon}</span>
                  <span>{s.label}</span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-6 h-px mx-1 ${isDone ? 'bg-teal-600' : 'bg-slate-800'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Form Card ──────────────────────────────────────────────── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl">
              {error}
            </div>
          )}

          {/* ── Step 1: Personal ──────────────────────────────────────── */}
          {step === 'personal' && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-black text-slate-100">Personal Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">Your basic contact details and account credentials.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); liveValidate('fullName', e.target.value) }}
                      placeholder="Aisha Rahman"
                      required
                      className={`bg-slate-800 border ${fieldErrors.fullName ? 'border-red-500' : 'border-slate-700'} rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition`}
                    />
                    {fieldErrors.fullName && <span className="text-[10px] text-red-400 font-semibold">{fieldErrors.fullName}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); liveValidate('email', e.target.value) }}
                      placeholder="aisha@example.com"
                      required
                      className={`bg-slate-800 border ${fieldErrors.email ? 'border-red-500' : 'border-slate-700'} rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition`}
                    />
                    {fieldErrors.email && <span className="text-[10px] text-red-400 font-semibold">{fieldErrors.email}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">Password *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); liveValidate('password', e.target.value) }}
                      placeholder="••••••••"
                      minLength={8}
                      required
                      className={`bg-slate-800 border ${fieldErrors.password ? 'border-red-500' : 'border-slate-700'} rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition`}
                    />
                    {fieldErrors.password && <span className="text-[10px] text-red-400 font-semibold">{fieldErrors.password}</span>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">Phone Number *</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); liveValidate('phone', e.target.value) }}
                      placeholder="+92-300-1234567 or +1-415-555-0199"
                      required
                      className={`bg-slate-800 border ${fieldErrors.phone ? 'border-red-500' : 'border-slate-700'} rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition`}
                    />
                    {fieldErrors.phone && <span className="text-[10px] text-red-400 font-semibold">{fieldErrors.phone}</span>}
                  </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">Company / Firm Name (Optional)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Rahman & Associates Architects"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                {/* ── Overseas Architect Toggle ─────────────────────── */}
                <div className="flex items-center gap-3 bg-slate-800/80 border border-teal-500/30 p-3.5 rounded-xl sm:col-span-2">
                  <input
                    id="isOverseas-toggle"
                    type="checkbox"
                    checked={isOverseas}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setIsOverseas(checked)
                      if (checked) {
                        if (country === 'Pakistan') setCountry('')
                      } else {
                        setCountry('Pakistan')
                      }
                    }}
                    className="w-4 h-4 text-teal-600 rounded border-slate-700 bg-slate-900 focus:ring-teal-500 cursor-pointer"
                  />
                  <label htmlFor="isOverseas-toggle" className="text-xs font-bold text-slate-200 cursor-pointer flex items-center gap-1.5">
                    <span>🌐</span>
                    <span>Overseas Architect / International Practice (Foreign Firm or Non-Pakistan Practice)</span>
                  </label>
                </div>

                {/* Country and City Inputs */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Country {isOverseas && '*'}</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder={isOverseas ? 'United Arab Emirates, UK, USA...' : 'Pakistan'}
                    required={isOverseas}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">City {isOverseas && '*'}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      setLocation(e.target.value ? `${e.target.value}, ${country || 'Pakistan'}` : '')
                    }}
                    placeholder={isOverseas ? 'Dubai, London, Toronto...' : 'Karachi, Lahore, Islamabad...'}
                    required={isOverseas}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const nameV = validateName(fullName)
                  const emailV = validateEmail(email)
                  const passV = validatePassword(password)
                  const phoneV = validatePhone(phone)
                  const errors: Record<string, string> = {}
                  if (!nameV.valid) errors.fullName = nameV.message
                  if (!emailV.valid) errors.email = emailV.message
                  if (!passV.valid) errors.password = passV.message
                  if (!phoneV.valid) errors.phone = phoneV.message
                  if (isOverseas && (!country || !country.trim())) errors.country = 'Country is required for overseas practice'
                  if (isOverseas && (!city || !city.trim())) errors.city = 'City is required for overseas practice'

                  setFieldErrors((prev) => ({ ...prev, ...errors }))
                  if (Object.keys(errors).length === 0) { setError(null); setStep('credentials') }
                  else setError('Please fill in all required fields accurately.')
                }}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-3 rounded-xl transition"
              >
                Continue to Credentials →
              </button>
            </div>
          )}

          {/* ── Step 2: Credentials ───────────────────────────────────── */}
          {step === 'credentials' && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-black text-slate-100">Professional Credentials</h2>
                <p className="text-xs text-slate-500 mt-0.5">Verification fields used by our team to confirm your professional standing.</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-xs text-amber-300 font-medium leading-relaxed">
                  🔒 <strong>PCATP / License No.</strong> is required for the Verified Architect badge. Profiles without a verified license will remain in Pending status.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">PCATP / Council License No.</label>
                  <input
                    type="text"
                    value={pcatpNo || councilLicenseNo}
                    onChange={(e) => {
                      setPcatpNo(e.target.value)
                      setCouncilLicenseNo(e.target.value)
                    }}
                    placeholder="PCATP-2020-XXXXX / RIBA-XXXX / AIA-XXXX / PEC-XXXX"
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition font-mono"
                  />
                  <p className="text-[10px] text-slate-500">Accepted: PCATP, RIBA, AIA, PEC, PILA, IAPD registration numbers</p>
                </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300">Years of Experience *</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={experienceYears}
                      onChange={(e) => { setExperienceYears(e.target.value); liveValidate('experienceYears', e.target.value) }}
                      placeholder="e.g. 8"
                      required
                      className={`bg-slate-800 border ${fieldErrors.experienceYears ? 'border-red-500' : 'border-slate-700'} rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition`}
                    />
                    {fieldErrors.experienceYears && <span className="text-[10px] text-red-400 font-semibold">{fieldErrors.experienceYears}</span>}
                  </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-300">Primary Specialization *</label>
                  <select value={specialization} onChange={(e) => setSpecialization(e.target.value)} required className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 transition">
                    <option value="">Select specialization</option>
                    {SPECIALIZATIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Degrees */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300">Educational Degrees</label>
                <div className="flex flex-wrap gap-2">
                  {DEGREES_OPTIONS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleItem(selectedDegrees, setSelectedDegrees, d)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${
                        selectedDegrees.includes(d)
                          ? 'bg-teal-600 border-teal-500 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-1">
                  <input type="text" value={customDegree} onChange={(e) => setCustomDegree(e.target.value)} placeholder="Add custom degree (e.g. M.Sc Urban Design – University of Edinburgh)" className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('personal')} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-xl transition font-medium">← Back</button>
                <button
                  onClick={() => {
                    const expV = validateExperienceYears(experienceYears)
                    const errors: Record<string, string> = {}
                    if (!expV.valid) errors.experienceYears = expV.message
                    if (!specialization) errors.specialization = 'Please select a specialization.'
                    setFieldErrors((prev) => ({ ...prev, ...errors }))
                    if (Object.keys(errors).length === 0) { setError(null); setStep('skills') }
                    else setError('Incorrect format detected. Please fix highlighted fields.')
                  }}
                  className="flex-1 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition"
                >
                  Continue to Skills →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Skills ────────────────────────────────────────── */}
          {step === 'skills' && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-black text-slate-100">Software & Project Skills</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select all software tools you use and project types you specialise in.</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300">Software Stack <span className="text-teal-400">({selectedSoftware.length} selected)</span></label>
                <div className="flex flex-wrap gap-2">
                  {SOFTWARE_OPTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleItem(selectedSoftware, setSelectedSoftware, s)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${
                        selectedSoftware.includes(s)
                          ? 'bg-violet-600 border-violet-500 text-white shadow shadow-violet-900/40'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-300">Project Types <span className="text-teal-400">({selectedProjectTypes.length} selected)</span></label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_TYPE_OPTIONS.map((p) => (
                    <button key={p} type="button" onClick={() => toggleItem(selectedProjectTypes, setSelectedProjectTypes, p)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium transition ${
                        selectedProjectTypes.includes(p)
                          ? 'bg-amber-600 border-amber-500 text-white shadow shadow-amber-900/40'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Professional Bio</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Describe your experience, expertise, notable projects, and what makes you stand out as a professional..." rows={4} className="bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition resize-none" />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('credentials')} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-xl transition font-medium">← Back</button>
                <button onClick={() => { setError(null); setStep('portfolio') }} className="flex-1 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition">
                  Continue to Portfolio →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Portfolio ─────────────────────────────────────── */}
          {step === 'portfolio' && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-black text-slate-100">Portfolio Links</h2>
                <p className="text-xs text-slate-500 mt-0.5">Add links to your portfolio, Behance, LinkedIn, or personal website. Agencies use these to evaluate your work.</p>
              </div>

              <div className="flex flex-col gap-3">
                {portfolioLinks.map((link, idx) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400">Portfolio Link {idx + 1}</label>
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => {
                        updatePortfolioLink(idx, e.target.value)
                        if (e.target.value.trim()) {
                          const res = validateURL(e.target.value)
                          setFieldErrors((prev) => ({ ...prev, [`portfolioLink_${idx}`]: res.message }))
                        } else {
                          setFieldErrors((prev) => { const u = { ...prev }; delete u[`portfolioLink_${idx}`]; return u })
                        }
                      }}
                      placeholder={idx === 0 ? 'https://behance.net/yourprofile' : idx === 1 ? 'https://linkedin.com/in/yourname' : 'https://yourwebsite.com'}
                      className={`bg-slate-800 border ${fieldErrors[`portfolioLink_${idx}`] ? 'border-red-500' : 'border-slate-700'} rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition`}
                    />
                    {fieldErrors[`portfolioLink_${idx}`] && (
                      <span className="text-[10px] text-red-400 font-semibold">{fieldErrors[`portfolioLink_${idx}`]}</span>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setPortfolioLinks([...portfolioLinks, ''])}
                  className="text-xs text-teal-500 hover:text-teal-400 transition text-left font-medium">
                  + Add another link
                </button>
              </div>

              <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  📌 <strong className="text-slate-300">Portfolio gallery uploads</strong> (2D/3D layouts, renderings, floor plans) can be added after your account is verified through your profile dashboard.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('skills')} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-xl transition font-medium">← Back</button>
                <button
                  onClick={() => {
                    const hasErrors = !validatePortfolioLinks()
                    if (hasErrors) { setError('Incorrect format detected: one or more portfolio URLs are invalid. Enter a valid https:// link.'); return }
                    setError(null)
                    setStep('review')
                  }}
                  className="flex-1 text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition"
                >
                  Review Application →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Review ────────────────────────────────────────── */}
          {step === 'review' && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-base font-black text-slate-100">Review Your Application</h2>
                <p className="text-xs text-slate-500 mt-0.5">Please review all details before submitting for verification.</p>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { label: 'Full Name', value: fullName },
                  { label: 'Email', value: email },
                  { label: 'Location', value: location || '—' },
                  { label: 'Council License No.', value: councilLicenseNo || '(Not provided — required for verification)' },
                  { label: 'Experience', value: experienceYears ? `${experienceYears} years` : '—' },
                  { label: 'Specialization', value: specialization || '—' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-800/60 last:border-0">
                    <span className="text-xs text-slate-500 font-medium flex-shrink-0">{item.label}</span>
                    <span className="text-xs text-slate-200 font-medium text-right">{item.value}</span>
                  </div>
                ))}

                {allDegrees.length > 0 && (
                  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-800/60">
                    <span className="text-xs text-slate-500 font-medium flex-shrink-0">Degrees</span>
                    <div className="flex flex-col gap-0.5 text-right">
                      {allDegrees.map((d) => <span key={d} className="text-xs text-slate-300">{d}</span>)}
                    </div>
                  </div>
                )}

                {selectedSoftware.length > 0 && (
                  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-800/60">
                    <span className="text-xs text-slate-500 font-medium flex-shrink-0">Software</span>
                    <span className="text-xs text-slate-200 text-right">{selectedSoftware.join(', ')}</span>
                  </div>
                )}

                {selectedProjectTypes.length > 0 && (
                  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-800/60">
                    <span className="text-xs text-slate-500 font-medium flex-shrink-0">Project Types</span>
                    <span className="text-xs text-slate-200 text-right">{selectedProjectTypes.join(', ')}</span>
                  </div>
                )}

                {portfolioLinks.filter(Boolean).length > 0 && (
                  <div className="flex items-start justify-between gap-4 py-2.5">
                    <span className="text-xs text-slate-500 font-medium flex-shrink-0">Portfolio Links</span>
                    <div className="flex flex-col gap-0.5 text-right">
                      {portfolioLinks.filter(Boolean).map((l, i) => (
                        <a key={i} href={l} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-400 hover:underline truncate max-w-xs">{l}</a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-teal-950/40 border border-teal-800/40 rounded-xl p-4">
                <p className="text-[11px] text-teal-300 leading-relaxed">
                  By submitting, you confirm that all information is accurate and you authorize NexMove to verify your professional credentials. Your profile will be hidden from public search until verification is complete.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('portfolio')} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-xl transition font-medium">← Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !validateName(fullName).valid || !validateEmail(email).valid || !validatePassword(password).valid || !validateExperienceYears(experienceYears).valid || !specialization}
                  className="flex-1 text-xs bg-teal-600 hover:bg-teal-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition disabled:opacity-60"
                >
                  {loading ? 'Submitting...' : 'Submit for Verification ✓'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
