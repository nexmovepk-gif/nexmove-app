// src/app/api/public/architects/stats/route.ts
// Returns aggregated stats for the Architects & Designers page stats bar.

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const [verifiedCount, specializationRows, ratingAgg, completedProjectsCount] =
      await Promise.all([
        // Count profiles where status = APPROVED or isVerified = true
        prisma.architectProfile.count({
          where: {
            OR: [
              { status: 'APPROVED' },
              { verificationStatus: 'VERIFIED' },
              { isVerified: true },
            ],
          },
        }),

        // Get distinct specialization values
        prisma.architectProfile.findMany({
          select: { specialization: true },
          distinct: ['specialization'],
        }),

        // Average rating across all architect reviews
        prisma.architectReview.aggregate({
          _avg: { rating: true },
        }),

        // Count projects with status = COMPLETED
        prisma.architectProject.count({
          where: { status: 'COMPLETED' },
        }),
      ])

    const specializationsCount = specializationRows.length

    // Default to 0 if no reviews exist; format to 1 decimal place
    const avgRating = ratingAgg._avg.rating
      ? parseFloat(ratingAgg._avg.rating.toFixed(1))
      : 0

    return NextResponse.json({
      verifiedCount,
      specializationsCount,
      avgRating,
      completedProjectsCount,
    })
  } catch (error) {
    console.error('[architects/stats] Error fetching stats:', error)
    // Return safe zero-defaults so the page always renders gracefully
    return NextResponse.json(
      {
        verifiedCount: 0,
        specializationsCount: 0,
        avgRating: 0,
        completedProjectsCount: 0,
      },
      { status: 200 },
    )
  }
}
