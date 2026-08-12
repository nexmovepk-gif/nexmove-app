'use client'
// src/app/agencies/[agencyId]/page.tsx

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import RatingStars from '@/components/RatingStars'
import VerifiedBadge, { VerificationTier } from '@/components/VerifiedBadge'
import ReviewCard from '@/components/ReviewCard'
import ReviewForm from '@/components/ReviewForm'

interface Review {
  id: string
  reviewerName: string
  rating: number
  comment: string | null
  isVerified: boolean
  createdAt: string
}

interface ReviewData {
  agencyId: string
  reviews: Review[]
  total: number
  avgRating: number
  distribution: { star: number; count: number }[]
}

const AGENCY_DIRECTORY: Record<string, {
  name: string; verified: boolean; verifiedLicense: boolean; tier?: VerificationTier;
  description: string; phone: string; address: string; activeListings: number;
}> = {
  'agency-1': {
    name: 'Elite Properties',
    verified: true, verifiedLicense: true, tier: 'PLATINUM',
    description: 'Premium real estate brokerage serving Rawalpindi & Islamabad since 2010. Specializing in luxury residential and commercial properties.',
    phone: '+92-51-1111111',
    address: 'Main Boulevard, Bahria Town, Rawalpindi',
    activeListings: 12,
  },
  'agency-2': {
    name: 'Prime Realty Group',
    verified: true, verifiedLicense: true, tier: 'GOLD',
    description: "Lahore's most trusted property consultants with 15 years of market expertise. Full-service agency for buy, sell, and rent.",
    phone: '+92-42-2222222',
    address: 'MM Alam Road, Gulberg III, Lahore',
    activeListings: 9,
  },
  'agency-3': {
    name: 'Skyline Estates',
    verified: false, verifiedLicense: false, tier: 'SILVER',
    description: "Emerging boutique agency in Karachi's high-rise sector. Focused on apartment investments and rental management.",
    phone: '+92-21-3333333',
    address: 'Clifton Block 5, Karachi',
    activeListings: 5,
  },
}

export default function AgencyProfilePage({ params }: { params: { agencyId: string } }) {
  const { agencyId } = params
  const agency = AGENCY_DIRECTORY[agencyId]

  const [reviewData, setReviewData] = useState<ReviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/public/agencies/${agencyId}/reviews`)
      const data = await res.json()
      setReviewData(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [agencyId])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  if (!agency) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
        <div className="text-center flex flex-col gap-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-8 max-w-sm">
          <span className="text-4xl">🏢</span>
          <h1 className="text-xl font-bold text-slate-900">Agency Not Found</h1>
          <p className="text-xs text-slate-500">The agency profile you requested does not exist or has been removed.</p>
          <Link href="/agencies" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition">
            ← Back to Agency Directory
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white px-4 py-8 border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <Link href="/agencies" className="text-xs text-emerald-400 font-bold hover:underline mb-1 inline-block">
              ← Agency Directory
            </Link>
            <h1 className="text-2xl font-black text-white">{agency.name}</h1>
            <p className="text-xs text-slate-300 mt-0.5">📍 {agency.address}</p>
          </div>
          <Link
            href="/marketplace"
            className="hidden sm:inline-block bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs px-4 py-2 rounded-xl transition"
          >
            Browse Marketplace →
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Agency Profile Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-700 font-black text-2xl flex-shrink-0 shadow-sm">
                {agency.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-bold text-slate-900">{agency.name}</h2>
                <p className="text-xs text-slate-500">📍 {agency.address}</p>
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <VerifiedBadge type="AGENCY" verified={agency.verified} tier={agency.tier ?? 'GOLD'} size="md" />
              {agency.verifiedLicense && (
                <span className="text-xs bg-indigo-100 border border-indigo-300 text-indigo-800 px-3 py-1 rounded-full font-bold">
                  ✓ Licensed Agency
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
            {agency.description}
          </p>

          {/* Rating Summary */}
          {reviewData && reviewData.total > 0 && (
            <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
              <div className="flex flex-col items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-[100px]">
                <span className="text-3xl font-black text-amber-500">{reviewData.avgRating}</span>
                <RatingStars rating={reviewData.avgRating} size="sm" />
                <span className="text-[10px] text-slate-500 font-medium">{reviewData.total} review{reviewData.total !== 1 ? 's' : ''}</span>
              </div>

              {/* Distribution bars */}
              <div className="flex-1 flex flex-col gap-1.5">
                {reviewData.distribution.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 w-4 text-right font-medium">{star}★</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: reviewData.total > 0 ? `${(count / reviewData.total) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 w-4 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          <div className="pt-2">
            <a
              href={`tel:${agency.phone}`}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl transition text-xs font-bold shadow"
            >
              📞 Contact Agency ({agency.phone})
            </a>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Client Reviews ({reviewData?.total ?? 0})
            </h2>
            <button
              id={`write-review-btn-${agencyId}`}
              onClick={() => setShowForm((s) => !s)}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition font-bold shadow"
            >
              {showForm ? 'Cancel' : '+ Write Review'}
            </button>
          </div>

          {showForm && (
            <ReviewForm
              agencyId={agencyId}
              agencyName={agency.name}
              onSuccess={() => { setShowForm(false); fetchReviews() }}
            />
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-xs gap-2">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              Loading agency reviews...
            </div>
          ) : reviewData && reviewData.reviews.length > 0 ? (
            <div className="flex flex-col gap-3">
              {reviewData.reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  reviewerName={review.reviewerName}
                  rating={review.rating}
                  comment={review.comment}
                  isVerified={review.isVerified}
                  createdAt={review.createdAt}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs flex flex-col gap-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <span className="text-3xl">💬</span>
              <p className="font-bold text-slate-800">No reviews yet.</p>
              <p className="text-xs text-slate-500">Be the first to review this agency!</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
