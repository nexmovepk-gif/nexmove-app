// src/app/api/public/listings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { extractFromMetadata } from '@/lib/aiExtraction'
import { prisma } from '@/lib/prisma'
import { PropertyType } from '@/generated/client/enums'

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

    let listings: Awaited<ReturnType<typeof prisma.publicListing.findMany<{ include: { agency: true } }>>> = []
    try {
      listings = await prisma.publicListing.findMany({
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
      listings = []
    }

    // Strip sensitive contact data from public list view
    const safeListings = listings.map((l) => {
      const contactPhone = l.contactPhone || ''
      return {
        id: l.id,
        title: l.title,
        description: l.description,
        propertyType: l.propertyType,
        price: l.price,
        address: l.address,
        city: l.city,
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

    return NextResponse.json({
      listings: safeListings,
      total: safeListings.length,
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

      // Use AI-extracted values where user didn't supply them
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
        verifiedProperty: false, // Starts unverified; admin sets this
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
