// src/app/api/public/listings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { extractFromMetadata } from '@/lib/aiExtraction'

// ─── Mock In-Memory Store (replace with Prisma queries once DB is connected) ──

export interface MockPublicListing {
  id: string
  title: string
  description: string
  propertyType: string
  price: number
  address: string
  city: string
  areaSqFt: number | null
  bedrooms: number | null
  bathrooms: number | null
  contactName: string
  contactPhone: string
  contactEmail: string | null
  verifiedProperty: boolean
  aiExtracted: boolean
  aiConfidence: number | null
  isActive: boolean
  agencyId: string | null
  agencyName: string | null
  agencyVerified: boolean
  createdAt: string
}

// Seeded demo data — kept outside the function so it persists across requests in dev
const mockStore: MockPublicListing[] = [
  {
    id: 'pub-1',
    title: '5 Marla House in Bahria Town Phase 4',
    description: 'Well-maintained 5 marla house with gas, electricity, and broadband. Near masjid and commercial market.',
    propertyType: 'HOUSE',
    price: 17500000,
    address: 'Street 12, Bahria Town Phase 4',
    city: 'Rawalpindi',
    areaSqFt: 1360,
    bedrooms: 3,
    bathrooms: 2,
    contactName: 'Muhammad Tariq',
    contactPhone: '+92-300-0000001',
    contactEmail: null,
    verifiedProperty: true,
    aiExtracted: true,
    aiConfidence: 0.75,
    isActive: true,
    agencyId: 'agency-1',
    agencyName: 'Elite Properties',
    agencyVerified: true,
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'pub-2',
    title: '10 Marla Corner Plot — DHA Phase 6 Lahore',
    description: 'Ideal investment plot. All dues clear, possession available immediately.',
    propertyType: 'PLOT',
    price: 42000000,
    address: 'Block M, DHA Phase 6',
    city: 'Lahore',
    areaSqFt: 2720,
    bedrooms: null,
    bathrooms: null,
    contactName: 'Asif Khan',
    contactPhone: '+92-321-0000002',
    contactEmail: 'asif@example.com',
    verifiedProperty: false,
    aiExtracted: true,
    aiConfidence: 0.55,
    isActive: true,
    agencyId: null,
    agencyName: null,
    agencyVerified: false,
    createdAt: '2026-08-03T14:00:00Z',
  },
  {
    id: 'pub-3',
    title: 'Modern 2-Bed Apartment — Gulberg III',
    description: 'High-rise apartment with gym, rooftop access, and 24/7 security.',
    propertyType: 'APARTMENT',
    price: 22000000,
    address: 'Liberty Towers, Gulberg III',
    city: 'Lahore',
    areaSqFt: 950,
    bedrooms: 2,
    bathrooms: 2,
    contactName: 'Sana Ahmed',
    contactPhone: '+92-333-0000003',
    contactEmail: 'sana@example.com',
    verifiedProperty: true,
    aiExtracted: false,
    aiConfidence: null,
    isActive: true,
    agencyId: 'agency-2',
    agencyName: 'Prime Realty Group',
    agencyVerified: true,
    createdAt: '2026-08-05T09:00:00Z',
  },
]

// ─── GET /api/public/listings ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city')
  const type = searchParams.get('type')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const minBeds = searchParams.get('minBeds')
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true'

  let listings = mockStore.filter((l) => l.isActive)

  if (city) listings = listings.filter((l) => l.city.toLowerCase().includes(city.toLowerCase()))
  if (type) listings = listings.filter((l) => l.propertyType === type.toUpperCase())
  if (minPrice) listings = listings.filter((l) => l.price >= Number(minPrice))
  if (maxPrice) listings = listings.filter((l) => l.price <= Number(maxPrice))
  if (minBeds) listings = listings.filter((l) => l.bedrooms != null && l.bedrooms >= Number(minBeds))
  if (verifiedOnly) listings = listings.filter((l) => l.verifiedProperty)

  // Strip sensitive contact data from list view
  const safeListings = listings.map((l) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contactPhone, contactEmail: _ce, ...rest } = l
    return {
      ...rest,
      contactPhoneMasked: contactPhone.slice(0, -4) + '****',
    }
  })

  return NextResponse.json({
    listings: safeListings,
    total: safeListings.length,
    timestamp: new Date().toISOString(),
  })
}

// ─── POST /api/public/listings ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      title,
      description,
      propertyType = 'HOUSE',
      price,
      address,
      city,
      areaSqFt,
      bedrooms,
      bathrooms,
      contactName,
      contactPhone,
      contactEmail,
      // AI extraction inputs
      uploadedFileName,
      uploadedFileType,
      uploadedFileSizeBytes,
    } = body

    // Basic validation
    if (!title || !price || !address || !contactName || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: title, price, address, contactName, contactPhone' },
        { status: 400 }
      )
    }

    // Run AI extraction if a file was uploaded
    let aiResult = null
    let resolvedBedrooms = bedrooms ?? null
    let resolvedArea = areaSqFt ?? null
    let resolvedBathrooms = bathrooms ?? null
    let aiExtracted = false
    let aiConfidence = null

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

    const newListing: MockPublicListing = {
      id: `pub-${Date.now()}`,
      title,
      description: description ?? '',
      propertyType,
      price: Number(price),
      address,
      city: city ?? '',
      areaSqFt: resolvedArea ? Number(resolvedArea) : null,
      bedrooms: resolvedBedrooms ? Number(resolvedBedrooms) : null,
      bathrooms: resolvedBathrooms ? Number(resolvedBathrooms) : null,
      contactName,
      contactPhone,
      contactEmail: contactEmail ?? null,
      verifiedProperty: false,   // Starts unverified; admin sets this
      aiExtracted,
      aiConfidence,
      isActive: true,
      agencyId: null,
      agencyName: null,
      agencyVerified: false,
      createdAt: new Date().toISOString(),
    }

    mockStore.push(newListing)

    return NextResponse.json({
      success: true,
      listing: newListing,
      aiExtraction: aiResult,
      message: 'Listing submitted successfully! It will appear on the marketplace shortly.',
    }, { status: 201 })

  } catch (err) {
    console.error('Error creating public listing:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/public/listings ───────────────────────────────────────────────
// Body: { id: string; isActive: boolean }
// Used by the agency dashboard "Mark as Sold / Restore" toggle.
// When isActive=false, the listing is archived and automatically excluded from
// the GET handler above (which already filters l.isActive === true).

export async function PATCH(req: NextRequest) {
  try {
    const { id, isActive } = await req.json()
    if (!id || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'id and isActive (boolean) are required' }, { status: 400 })
    }

    const idx = mockStore.findIndex((l) => l.id === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    mockStore[idx] = { ...mockStore[idx], isActive }

    return NextResponse.json({
      success: true,
      listing: mockStore[idx],
      message: isActive
        ? 'Listing restored to marketplace.'
        : 'Listing archived. It is no longer visible on the public marketplace.',
    })
  } catch (err) {
    console.error('Error updating listing status:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
