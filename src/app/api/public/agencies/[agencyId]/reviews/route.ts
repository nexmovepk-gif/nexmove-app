// src/app/api/public/agencies/[agencyId]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'

// In-memory mock store for reviews (persists across requests in dev).
// In production: prisma.agencyReview.findMany / create
interface Review {
  id: string
  agencyId: string
  reviewerName: string
  reviewerEmail: string | null
  rating: number
  comment: string | null
  isVerified: boolean
  createdAt: string
}

const reviewStore: Review[] = [
  {
    id: 'rev-1',
    agencyId: 'agency-1',
    reviewerName: 'Kamran Akhtar',
    reviewerEmail: null,
    rating: 5,
    comment: 'Excellent service! They helped us find our dream home in Bahria Town within a week. Very professional and transparent about pricing.',
    isVerified: true,
    createdAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'rev-2',
    agencyId: 'agency-1',
    reviewerName: 'Fatima Malik',
    reviewerEmail: null,
    rating: 4,
    comment: 'Good communication and decent inventory. Slightly slow on paperwork, but overall a trustworthy agency.',
    isVerified: true,
    createdAt: '2026-07-28T14:30:00Z',
  },
  {
    id: 'rev-3',
    agencyId: 'agency-2',
    reviewerName: 'Usman Riaz',
    reviewerEmail: null,
    rating: 5,
    comment: 'Prime Realty Group found us the perfect commercial space in Gulberg. Highly recommend for Lahore properties!',
    isVerified: true,
    createdAt: '2026-08-02T11:00:00Z',
  },
  {
    id: 'rev-4',
    agencyId: 'agency-2',
    reviewerName: 'Ayesha Tariq',
    reviewerEmail: null,
    rating: 3,
    comment: 'Average experience. Agent was helpful initially but became hard to reach after we made the token payment.',
    isVerified: false,
    createdAt: '2026-08-04T16:00:00Z',
  },
]

// ─── GET /api/public/agencies/[agencyId]/reviews ──────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  const { agencyId } = params
  const agencyReviews = reviewStore
    .filter((r) => r.agencyId === agencyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const avgRating =
    agencyReviews.length > 0
      ? agencyReviews.reduce((sum, r) => sum + r.rating, 0) / agencyReviews.length
      : 0

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: agencyReviews.filter((r) => r.rating === star).length,
  }))

  return NextResponse.json({
    agencyId,
    reviews: agencyReviews,
    total: agencyReviews.length,
    avgRating: Math.round(avgRating * 10) / 10,
    distribution,
    timestamp: new Date().toISOString(),
  })
}

// ─── POST /api/public/agencies/[agencyId]/reviews ─────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  try {
    const { agencyId } = params
    const body = await req.json()
    const { reviewerName, reviewerEmail, rating, comment } = body

    // Validation
    if (!reviewerName || !rating) {
      return NextResponse.json(
        { error: 'reviewerName and rating (1–5) are required.' },
        { status: 400 }
      )
    }

    const ratingNum = Number(rating)
    if (ratingNum < 1 || ratingNum > 5 || !Number.isInteger(ratingNum)) {
      return NextResponse.json(
        { error: 'rating must be an integer between 1 and 5.' },
        { status: 400 }
      )
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      agencyId,
      reviewerName: String(reviewerName).trim(),
      reviewerEmail: reviewerEmail ? String(reviewerEmail).trim() : null,
      rating: ratingNum,
      comment: comment ? String(comment).trim() : null,
      isVerified: false,   // Admin must verify manually
      createdAt: new Date().toISOString(),
    }

    reviewStore.push(newReview)

    return NextResponse.json({
      success: true,
      review: newReview,
      message: 'Thank you for your review! It will be visible after moderation.',
    }, { status: 201 })

  } catch (err) {
    console.error('Error creating review:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
