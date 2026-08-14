// src/app/api/public/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const listing = await prisma.publicListing.findUnique({
      where: { id: params.id },
      include: { agency: true },
    })

    if (!listing || !listing.isActive) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const safeListing = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      propertyType: listing.propertyType,
      price: listing.price,
      address: listing.address,
      city: listing.city,
      areaSqFt: listing.areaSqFt,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      contactName: listing.contactName,
      contactPhone: listing.contactPhone,
      contactEmail: listing.contactEmail,
      verifiedProperty: listing.verifiedProperty,
      aiExtracted: listing.aiExtracted,
      aiConfidence: listing.aiConfidence,
      isActive: listing.isActive,
      agencyId: listing.agencyId,
      agencyName: listing.agency?.name || null,
      agencyVerified: listing.agency?.verified || false,
      createdAt: listing.createdAt.toISOString(),
    }

    return NextResponse.json({ listing: safeListing })
  } catch (err) {
    console.error('Error fetching listing by ID:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
