'use client'
// src/components/PublicListingForm.tsx

import { useState, useRef } from 'react'
import AIEscrowGuard from '@/components/AIEscrowGuard'

interface FormData {
  title: string
  description: string
  propertyType: string
  price: string
  address: string
  city: string
  areaSqFt: string
  bedrooms: string
  bathrooms: string
  contactName: string
  contactPhone: string
  contactEmail: string
}

interface AIPreview {
  bedrooms: number | null
  bathrooms: number | null
  areaSqFt: number | null
  locationHint: string | null
  propertyType: string | null
  confidence: number
  message: string
}

const INITIAL_FORM: FormData = {
  title: '', description: '', propertyType: 'HOUSE',
  price: '', address: '', city: '', areaSqFt: '',
  bedrooms: '', bathrooms: '', contactName: '', contactPhone: '', contactEmail: '',
}

const PROPERTY_TYPES = ['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'VILLA']
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Multan', 'Quetta']

export default function PublicListingForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [uploading, setUploading] = useState(false)
  const [aiPreview, setAiPreview] = useState<AIPreview | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const update = (key: keyof FormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  // ─── AI Extraction Preview ──────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFile(file)
    setUploading(true)
    setAiPreview(null)

    try {
      const res = await fetch('/api/public/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Minimal payload just to trigger AI extraction preview
          title: form.title || 'Preview',
          price: form.price || '1',
          address: form.address || 'Preview',
          contactName: form.contactName || 'Preview',
          contactPhone: form.contactPhone || '0000000000',
          uploadedFileName: file.name,
          uploadedFileType: file.type,
          uploadedFileSizeBytes: file.size,
          _previewOnly: true,
        }),
      })
      const data = await res.json()
      if (data.aiExtraction) {
        const ai = data.aiExtraction
        setAiPreview({
          bedrooms: ai.bedrooms,
          bathrooms: ai.bathrooms,
          areaSqFt: ai.areaSqFt,
          locationHint: ai.locationHint,
          propertyType: ai.propertyType,
          confidence: ai.confidence,
          message: ai.message,
        })
        // Auto-fill form with extracted values
        if (ai.bedrooms) update('bedrooms', String(ai.bedrooms))
        if (ai.bathrooms) update('bathrooms', String(ai.bathrooms))
        if (ai.areaSqFt) update('areaSqFt', String(ai.areaSqFt))
        if (ai.locationHint) update('city', ai.locationHint)
        if (ai.propertyType) update('propertyType', ai.propertyType)
      }
    } catch {
      // Silent fail — user can fill manually
    } finally {
      setUploading(false)
    }
  }

  // ─── Final Submit ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setError(null)
    if (!form.contactPhone || !form.contactName) {
      setError('Contact name and phone are required.')
      return
    }

    setLoading(true)
    try {
      let imageDataUrl: string | null = null;
      if (uploadedFile && uploadedFile.type.startsWith('image/')) {
        imageDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(uploadedFile);
        });
      }

      const res = await fetch('/api/public/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          areaSqFt: form.areaSqFt ? Number(form.areaSqFt) : undefined,
          bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
          bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
          images: imageDataUrl ? [imageDataUrl] : [],
          uploadedFileName: uploadedFile?.name,
          uploadedFileType: uploadedFile?.type,
          uploadedFileSizeBytes: uploadedFile?.size,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSubmitted(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Success Screen ─────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          🏠
        </div>
        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
          Listing Submitted!
        </h2>
        <p className="text-sm text-slate-400 max-w-xs">
          Your property has been submitted for review. It will appear on the public marketplace shortly.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm(INITIAL_FORM); setStep(1); setAiPreview(null) }}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-xl transition"
        >
          Submit Another Listing
        </button>
      </div>
    )
  }

  // ─── Step Indicator ─────────────────────────────────────────────────────────

  const steps = ['Property Info', 'Upload & AI', 'Contact & Submit']

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {steps.map((label, i) => {
          const num = i + 1
          const active = num === step
          const done = num < step
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${done ? 'bg-emerald-500 text-white' : active ? 'bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)]' : 'bg-slate-800 text-slate-500'}`}>
                  {done ? '✓' : num}
                </div>
                <span className={`text-[9px] font-semibold uppercase tracking-wider ${active ? 'text-teal-400' : done ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px flex-1 mx-1 transition-colors duration-300 ${done ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Step 1 — Property Details */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Listing Title *</label>
            <input
              id="listing-title"
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. 5 Marla House in DHA Phase 5"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Property Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update('propertyType', type)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition duration-200
                    ${form.propertyType === type
                      ? 'bg-teal-500/20 border-teal-500/50 text-teal-400'
                      : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:border-slate-700'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price (PKR) *</label>
              <input
                id="listing-price"
                type="number"
                value={form.price}
                onChange={(e) => update('price', e.target.value)}
                placeholder="17500000"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Area (Sq. Ft)</label>
              <input
                id="listing-area"
                type="number"
                value={form.areaSqFt}
                onChange={(e) => update('areaSqFt', e.target.value)}
                placeholder="1360"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bedrooms</label>
              <input
                id="listing-bedrooms"
                type="number"
                value={form.bedrooms}
                onChange={(e) => update('bedrooms', e.target.value)}
                placeholder="3"
                min={0}
                max={20}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bathrooms</label>
              <input
                id="listing-bathrooms"
                type="number"
                value={form.bathrooms}
                onChange={(e) => update('bathrooms', e.target.value)}
                placeholder="2"
                min={0}
                max={20}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Address / Location *</label>
            <input
              id="listing-address"
              type="text"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Street 12, Bahria Town Phase 4"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">City</label>
            <select
              id="listing-city"
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-teal-500/60 transition"
            >
              <option value="">Select city...</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              id="listing-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Describe the property, features, nearby landmarks..."
              rows={3}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (!form.title || !form.price || !form.address) {
                setError('Title, price, and address are required.')
                return
              }
              setError(null)
              setStep(2)
            }}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition duration-300 text-sm"
          >
            Next: Upload Documents →
          </button>
          {error && <p className="text-xs text-red-400 text-center">{error}</p>}
        </div>
      )}

      {/* Step 2 — Upload & AI Extraction */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <AIEscrowGuard mode="property_title" className="mb-2" />
          <div
            className="border-2 border-dashed border-slate-700 hover:border-teal-500/50 rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition duration-200 text-center group"
            onClick={() => fileRef.current?.click()}
          >
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/20 transition">
              <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">
                {uploadedFile ? uploadedFile.name : 'Upload Property Document or Image'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">PDF, JPEG, PNG — AI will auto-extract details</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-xs text-slate-400">AI is analyzing your document...</p>
            </div>
          )}

          {/* AI Extraction Preview Panel */}
          {aiPreview && (
            <div className="bg-gradient-to-br from-teal-950/30 to-slate-950 border border-teal-500/20 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse"></span>
                  AI Extraction Results
                </span>
                <span className="text-[10px] bg-teal-500/10 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/20 font-bold">
                  {Math.round(aiPreview.confidence * 100)}% confidence
                </span>
              </div>

              <p className="text-[10px] text-slate-400">{aiPreview.message}</p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Bedrooms', value: aiPreview.bedrooms },
                  { label: 'Bathrooms', value: aiPreview.bathrooms },
                  { label: 'Area (Sq. Ft)', value: aiPreview.areaSqFt },
                  { label: 'Location', value: aiPreview.locationHint },
                  { label: 'Property Type', value: aiPreview.propertyType },
                ].map(({ label, value }) => value != null && (
                  <div key={label} className="bg-slate-950/40 rounded-xl p-2.5 border border-slate-800/40">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{label}</span>
                    <div className="text-xs font-bold text-teal-300 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>

              <p className="text-[9px] text-slate-500 italic">
                These values have been auto-filled in Step 1. Review and correct if needed.
              </p>
            </div>
          )}

          {!uploadedFile && (
            <p className="text-xs text-center text-slate-500">
              You can skip the upload and enter details manually.
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition text-sm"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition duration-300 text-sm"
            >
              Next: Contact →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Contact & Submit */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-1.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Listing Summary</h3>
            <div className="text-sm font-bold text-slate-200">{form.title}</div>
            <div className="text-xs text-slate-400">{form.address}{form.city ? `, ${form.city}` : ''}</div>
            <div className="text-sm font-black text-emerald-400 mt-1">
              PKR {Number(form.price || 0).toLocaleString()}
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {form.bedrooms && <span className="text-[10px] bg-slate-950/60 border border-slate-800/60 text-slate-400 px-2 py-0.5 rounded-lg">{form.bedrooms} Beds</span>}
              {form.bathrooms && <span className="text-[10px] bg-slate-950/60 border border-slate-800/60 text-slate-400 px-2 py-0.5 rounded-lg">{form.bathrooms} Baths</span>}
              {form.areaSqFt && <span className="text-[10px] bg-slate-950/60 border border-slate-800/60 text-slate-400 px-2 py-0.5 rounded-lg">{form.areaSqFt} Sq. Ft</span>}
              <span className="text-[10px] bg-slate-950/60 border border-slate-800/60 text-slate-400 px-2 py-0.5 rounded-lg">{form.propertyType}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Full Name *</label>
            <input
              id="contact-name"
              type="text"
              value={form.contactName}
              onChange={(e) => update('contactName', e.target.value)}
              placeholder="Muhammad Tariq"
              required
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">WhatsApp / Phone *</label>
            <input
              id="contact-phone"
              type="tel"
              value={form.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
              placeholder="+92-300-0000000"
              required
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email (optional)</label>
            <input
              id="contact-email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => update('contactEmail', e.target.value)}
              placeholder="owner@example.com"
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
            />
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-xl p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-3 rounded-xl transition text-sm"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition duration-300 text-sm"
            >
              {loading ? 'Submitting...' : '🚀 Submit Listing'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
