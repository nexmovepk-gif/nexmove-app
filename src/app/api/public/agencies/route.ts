// src/app/api/public/agencies/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const agencies = await prisma.agency.findMany({
      include: {
        listings: {
          where: {
            status: 'ACTIVE',
          },
        },
        publicListings: {
          where: {
            isActive: true,
          },
        },
        agencyReviews: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const transformed = agencies.map((agency) => {
      const reviews = agency.agencyReviews || []
      const reviewCount = reviews.length
      const avgRating =
        reviewCount > 0
          ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) * 10) / 10
          : 0

      const activeListings = (agency.listings?.length || 0) + (agency.publicListings?.length || 0)

      return {
        id: agency.id,
        name: agency.name,
        verified: agency.verified,
        verifiedLicense: agency.verifiedLicense,
        tier: agency.verified ? ('GOLD' as const) : ('SILVER' as const),
        ntn: agency.ntn || undefined,
        logo: agency.logo,
        storefrontPhoto: agency.storefrontPhoto,
        ownerPhoto: agency.ownerPhoto,
        phone: agency.phone || '',
        address: agency.address || 'Location Not Specified',
        latitude: agency.latitude || undefined,
        longitude: agency.longitude || undefined,
        description: agency.description || 'Verified real estate agency on NexMove.',
        avgRating,
        reviewCount,
        activeListings,
      }
    })

    return NextResponse.json({
      agencies: transformed,
      total: transformed.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Error in GET /api/public/agencies:', err)
    return NextResponse.json({ agencies: [], total: 0, error: 'Failed to fetch agencies' }, { status: 500 })
  }
}
