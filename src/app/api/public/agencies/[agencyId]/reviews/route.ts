// src/app/api/public/agencies/[agencyId]/reviews/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── GET /api/public/agencies/[agencyId]/reviews ──────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  try {
    const { agencyId } = params
    const agencyReviews = await prisma.agencyReview.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    })

    const total = agencyReviews.length
    const avgRating =
      total > 0
        ? agencyReviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: agencyReviews.filter((r) => r.rating === star).length,
    }))

    const formattedReviews = agencyReviews.map((r) => ({
      id: r.id,
      agencyId: r.agencyId,
      reviewerName: r.reviewerName,
      reviewerEmail: r.reviewerEmail,
      rating: r.rating,
      comment: r.comment,
      isVerified: r.isVerified,
      createdAt: r.createdAt.toISOString(),
    }))

    return NextResponse.json({
      agencyId,
      reviews: formattedReviews,
      total,
      avgRating: Math.round(avgRating * 10) / 10,
      distribution,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Error fetching reviews from Prisma:', err)
    return NextResponse.json({
      agencyId: params.agencyId,
      reviews: [],
      total: 0,
      avgRating: 0,
      distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: 0 })),
    })
  }
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

    const created = await prisma.agencyReview.create({
      data: {
        agencyId,
        reviewerName: String(reviewerName).trim(),
        reviewerEmail: reviewerEmail ? String(reviewerEmail).trim() : null,
        rating: ratingNum,
        comment: comment ? String(comment).trim() : null,
        isVerified: false, // Moderated by default
      },
    })

    return NextResponse.json({
      success: true,
      review: created,
      message: 'Thank you for your review! It has been recorded.',
    }, { status: 201 })

  } catch (err) {
    console.error('Error creating review in Prisma:', err)
    return NextResponse.json({ error: 'Internal server error or agency not found' }, { status: 500 })
  }
}
