// src/app/api/public/listings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { extractFromMetadata } from '@/lib/aiExtraction'
import { prisma } from '@/lib/prisma'
import { PropertyType } from '@/generated/client/enums'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// ─── GET /api/public/listings ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')
    const type = searchParams.get('type')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minBeds = searchParams.get('minBeds')
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true'

    const where: Record<string, unknown> = {
      isActive: true,
    }

    if (city) {
      where.city = { contains: city, mode: 'insensitive' }
    }
    if (type && Object.values(PropertyType).includes(type.toUpperCase() as PropertyType)) {
      where.propertyType = type.toUpperCase() as PropertyType
    }
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      }
    }
    if (minBeds) {
      where.bedrooms = { gte: Number(minBeds) }
    }
    if (verifiedOnly) {
      where.verifiedProperty = true
    }

    // 1. Fetch from PublicListing
    let publicListings: Awaited<ReturnType<typeof prisma.publicListing.findMany<{ include: { agency: true } }>>> = []
    try {
      publicListings = await prisma.publicListing.findMany({
        where,
        include: {
          agency: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (dbErr) {
      console.warn('Prisma publicListing fetch error:', dbErr)
      publicListings = []
    }

    // 2. Fetch from Property
    const propWhere: Record<string, unknown> = {
      isAvailable: true,
    }
    if (city) {
      propWhere.city = { contains: city, mode: 'insensitive' }
    }
    if (type) {
      propWhere.propertyType = { contains: type, mode: 'insensitive' }
    }
    if (minPrice || maxPrice) {
      propWhere.price = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      }
    }
    if (minBeds) {
      propWhere.bedrooms = { gte: Number(minBeds) }
    }

    let properties: Awaited<ReturnType<typeof prisma.property.findMany<{ include: { agency: true } }>>> = []
    try {
      properties = await prisma.property.findMany({
        where: propWhere,
        include: {
          agency: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      })
    } catch (propErr) {
      console.warn('Prisma property fetch error:', propErr)
      properties = []
    }

    // Transform public listings
    const mappedPublic = publicListings.map((l) => {
      const contactPhone = l.contactPhone || ''
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        propertyType: String(l.propertyType),
        price: l.price,
        address: l.address,
        city: l.city || '',
        areaSqFt: l.areaSqFt,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        verifiedProperty: l.verifiedProperty,
        aiExtracted: l.aiExtracted,
        aiConfidence: l.aiConfidence,
        isActive: l.isActive,
        agencyId: l.agencyId,
        agencyName: l.agency?.name || null,
        agencyVerified: l.agency?.verified || false,
        contactPhoneMasked: contactPhone ? contactPhone.slice(0, -4) + '****' : '',
        createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
      }
    })

    // Transform properties
    const mappedProperties = properties.map((p) => {
      const contactPhone = p.contactPhone || ''
      return {
        id: p.id,
        title: p.title,
        description: p.description || '',
        propertyType: p.propertyType,
        price: p.price,
        address: p.address,
        city: p.city || '',
        areaSqFt: p.areaSqFt,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        verifiedProperty: p.agency?.verified || false,
        aiExtracted: true,
        aiConfidence: 0.95,
        isActive: p.isAvailable,
        agencyId: p.agencyId,
        agencyName: p.agency?.name || null,
        agencyVerified: p.agency?.verified || false,
        contactPhoneMasked: contactPhone ? contactPhone.slice(0, -4) + '****' : '',
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      }
    })

    // Merge and sort newest first
    const unifiedListings = [...mappedProperties, ...mappedPublic].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json({
      listings: unifiedListings,
      total: unifiedListings.length,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Error in GET /api/public/listings:', err)
    return NextResponse.json({ listings: [], total: 0, error: 'Failed to fetch listings' }, { status: 500 })
  }
}

// ─── POST /api/public/listings ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      title,
      description,
      purpose = 'FOR_SALE',
      propertyType = 'HOUSE',
      price,
      address,
      city,
      areaSqFt,
      bedrooms,
      bathrooms,
      isAvailable = true,
      availableDate,
      images = [],
      videoUrl,
      panoramaUrl,
      virtualTourUrl,
      features = [],
      contactName,
      contactPhone,
      contactEmail,
      agencyId,
      // AI extraction inputs
      uploadedFileName,
      uploadedFileType,
      uploadedFileSizeBytes,
    } = body

    // Basic validation
    if (!title || price === undefined || price === null || !address || !contactName || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: title, price, address, contactName, contactPhone' },
        { status: 400 }
      )
    }

    // Run AI extraction if a file was uploaded
    let aiResult = null
    let resolvedBedrooms = bedrooms ? Number(bedrooms) : null
    let resolvedArea = areaSqFt ? Number(areaSqFt) : null
    let resolvedBathrooms = bathrooms ? Number(bathrooms) : null
    let aiExtracted = false
    let aiConfidence: number | null = null

    if (uploadedFileName && uploadedFileType) {
      aiResult = extractFromMetadata({
        fileName: uploadedFileName,
        fileType: uploadedFileType,
        fileSizeBytes: uploadedFileSizeBytes ?? 0,
      })

      if (aiResult.success) {
        resolvedBedrooms = resolvedBedrooms ?? aiResult.bedrooms
        resolvedArea = resolvedArea ?? aiResult.areaSqFt
        resolvedBathrooms = resolvedBathrooms ?? aiResult.bathrooms
        aiExtracted = aiResult.confidence > 0
        aiConfidence = aiResult.confidence
      }
    }

    const validPropertyType = Object.values(PropertyType).includes(propertyType.toUpperCase() as PropertyType)
      ? (propertyType.toUpperCase() as PropertyType)
      : PropertyType.HOUSE

    const parsedAvailableDate = availableDate ? new Date(availableDate) : null

    const created = await prisma.publicListing.create({
      data: {
        title,
        description: description ?? '',
        purpose: purpose === 'FOR_RENT' ? 'FOR_RENT' : purpose === 'LEASE' ? 'LEASE' : 'FOR_SALE',
        propertyType: validPropertyType,
        price: Number(price),
        address,
        city: city ?? '',
        areaSqFt: resolvedArea,
        bedrooms: resolvedBedrooms,
        bathrooms: resolvedBathrooms,
        isAvailable: Boolean(isAvailable),
        availableDate: parsedAvailableDate,
        images: Array.isArray(images) ? images : [],
        videoUrl: videoUrl || null,
        panoramaUrl: panoramaUrl || null,
        virtualTourUrl: virtualTourUrl || null,
        features: Array.isArray(features) ? features : [],
        contactName,
        contactPhone,
        contactEmail: contactEmail ?? null,
        verifiedProperty: false,
        aiExtracted,
        aiConfidence,
        isActive: true,
        agencyId: agencyId ?? null,
      },
    })

    return NextResponse.json({
      success: true,
      listing: created,
      aiExtraction: aiResult,
      message: 'Listing submitted successfully! It will appear on the marketplace shortly.',
    }, { status: 201 })

  } catch (err) {
    console.error('Error creating public listing in Prisma:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/public/listings ───────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const { id, isActive } = await req.json()
    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'id and isActive (boolean) are required' }, { status: 400 })
    }

    const updated = await prisma.publicListing.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({
      success: true,
      listing: updated,
      message: isActive
        ? 'Listing restored to marketplace.'
        : 'Listing archived. It is no longer visible on the public marketplace.',
    })
  } catch (err) {
    console.error('Error updating listing status:', err)
    return NextResponse.json({ error: 'Internal server error or listing not found' }, { status: 500 })
  }
}
