// src/app/api/agency/[agencyId]/listings/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: Request,
  { params }: { params: { agencyId: string } }
) {
  try {
    const { agencyId } = params

    const listings = await prisma.listing.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    })

    const formattedListings = listings.map((l) => ({
      id: l.id,
      title: l.title,
      price: l.price,
      address: l.address,
      rooms: l.roomCount ?? 0,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    }))

    return NextResponse.json({
      agencyId,
      listings: formattedListings,
      count: formattedListings.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Error fetching agency listings in Prisma:', err)
    return NextResponse.json({
      agencyId: params.agencyId,
      listings: [],
      count: 0,
      timestamp: new Date().toISOString(),
    })
  }
}
