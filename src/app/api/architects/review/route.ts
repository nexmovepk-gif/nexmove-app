// src/app/api/architects/review/route.ts
// Handles public star rating & review submissions for architect profiles

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { architectId, reviewerName, reviewerEmail, rating, comment } = body

    if (!architectId) {
      return NextResponse.json({ error: 'Architect ID is required' }, { status: 400 })
    }

    if (!reviewerName || !reviewerName.trim()) {
      return NextResponse.json({ error: 'Reviewer name is required' }, { status: 400 })
    }

    const ratingNum = Number(rating)
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Check architect exists
    const architect = await prisma.architectProfile.findUnique({
      where: { id: architectId },
      select: { id: true, name: true },
    })

    if (!architect) {
      return NextResponse.json({ error: 'Architect profile not found' }, { status: 404 })
    }

    const review = await prisma.architectReview.create({
      data: {
        architectId,
        reviewerName: reviewerName.trim(),
        reviewerEmail: reviewerEmail?.trim() || null,
        rating: ratingNum,
        comment: comment?.trim() || null,
        isVerified: false,
      },
    })

    return NextResponse.json({ success: true, review }, { status: 201 })
  } catch (error) {
    console.error('[Architect Review POST] Error:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const architectId = searchParams.get('architectId')

    if (!architectId) {
      return NextResponse.json({ reviews: [] })
    }

    const reviews = await prisma.architectReview.findMany({
      where: { architectId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
        : 0

    return NextResponse.json({ reviews, avgRating, total: reviews.length })
  } catch (error) {
    console.error('[Architect Review GET] Error:', error)
    return NextResponse.json({ reviews: [], avgRating: 0, total: 0 }, { status: 500 })
  }
}
