// src/app/api/public/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Try finding in Property model
    const prop = await prisma.property.findUnique({
      where: { id: params.id },
      include: { agency: true },
    })

    if (prop && prop.isAvailable) {
      const safeProp = {
        id: prop.id,
        title: prop.title,
        description: prop.description || '',
        propertyType: prop.propertyType,
        price: prop.price,
        address: prop.address,
        city: prop.city || '',
        areaSqFt: prop.areaSqFt,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        contactName: prop.contactName,
        contactPhone: prop.contactPhone,
        contactEmail: prop.contactEmail,
        verifiedProperty: prop.agency?.verified || false,
        aiExtracted: true,
        aiConfidence: 0.95,
        isActive: prop.isAvailable,
        agencyId: prop.agencyId,
        agencyName: prop.agency?.name || null,
        agencyVerified: prop.agency?.verified || false,
        createdAt: prop.createdAt.toISOString(),
      }
      return NextResponse.json({ listing: safeProp })
    }

    // 2. Try finding in PublicListing model
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
