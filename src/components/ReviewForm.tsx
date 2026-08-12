'use client'
// src/components/ReviewForm.tsx
import { useState } from 'react'
import RatingStars from './RatingStars'

interface ReviewFormProps {
  agencyId: string
  agencyName: string
  onSuccess?: () => void
}

export default function ReviewForm({ agencyId, agencyName, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating === 0) {
      setError('Please select a star rating before submitting.')
      return
    }
    if (!name.trim()) {
      setError('Please enter your name.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/public/agencies/${agencyId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewerName: name, reviewerEmail: email || null, rating, comment }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit review')
      setSubmitted(true)
      onSuccess?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center flex flex-col items-center gap-2">
        <div className="text-2xl">⭐</div>
        <p className="text-sm font-bold text-emerald-400">Review Submitted!</p>
        <p className="text-xs text-slate-400">
          Thanks for your feedback. It will appear after moderation.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-4">
      <h3 className="text-sm font-bold text-slate-200">
        Rate <span className="text-teal-400">{agencyName}</span>
      </h3>

      {error && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-500/20 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* Star Picker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Your Rating *
        </label>
        <div className="flex items-center gap-2">
          <RatingStars rating={rating} interactive onChange={setRating} size="lg" />
          {rating > 0 && (
            <span className="text-xs text-amber-400 font-bold">
              {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`review-name-${agencyId}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Your Name *
        </label>
        <input
          id={`review-name-${agencyId}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Muhammad Ali"
          required
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
        />
      </div>

      {/* Email (optional) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`review-email-${agencyId}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Email (optional)
        </label>
        <input
          id={`review-email-${agencyId}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition"
        />
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`review-comment-${agencyId}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Your Review
        </label>
        <textarea
          id={`review-comment-${agencyId}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this agency..."
          rows={3}
          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-teal-500/60 transition resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition duration-300 text-sm"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
