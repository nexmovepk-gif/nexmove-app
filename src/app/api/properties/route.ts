// src/app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PropertyPurpose } from '@/generated/client/enums';

// ─── GET /api/properties ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const purpose = searchParams.get('purpose');
    const propertyType = searchParams.get('propertyType');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const isAvailable = searchParams.get('isAvailable');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    const where: Record<string, unknown> = {};

    if (purpose && Object.values(PropertyPurpose).includes(purpose.toUpperCase() as PropertyPurpose)) {
      where.purpose = purpose.toUpperCase() as PropertyPurpose;
    }
    if (propertyType) {
      where.propertyType = { contains: propertyType, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    if (isAvailable !== null && isAvailable !== undefined && isAvailable !== '') {
      where.isAvailable = isAvailable === 'true';
    }
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      };
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        agency: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      properties,
      count: properties.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching properties from Prisma:', err);
    return NextResponse.json({ success: false, properties: [], error: 'Failed to fetch properties' }, { status: 500 });
  }
}

// ─── POST /api/properties ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      title,
      description,
      purpose = 'FOR_SALE',
      propertyType,
      category,
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
      userId,
    } = body;

    // Validation
    if (!title || price === undefined || price === null || !propertyType || !contactName || !contactPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: title, propertyType, price, contactName, contactPhone' },
        { status: 400 }
      );
    }

    // Email validation if supplied
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
      return NextResponse.json(
        { error: 'Invalid contact email format' },
        { status: 400 }
      );
    }

    // Validate purpose enum
    const validPurpose = Object.values(PropertyPurpose).includes(purpose?.toUpperCase() as PropertyPurpose)
      ? (purpose.toUpperCase() as PropertyPurpose)
      : PropertyPurpose.FOR_SALE;

    const parsedAvailableDate = availableDate ? new Date(availableDate) : null;

    const property = await prisma.property.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        purpose: validPurpose,
        propertyType: propertyType.trim(),
        category: category || null,
        price: Number(price),
        address: address?.trim() || 'Pakistan',
        city: city?.trim() || null,
        areaSqFt: areaSqFt ? Number(areaSqFt) : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        isAvailable: Boolean(isAvailable),
        availableDate: parsedAvailableDate,
        images: Array.isArray(images) ? images : [],
        videoUrl: videoUrl?.trim() || null,
        panoramaUrl: panoramaUrl?.trim() || null,
        virtualTourUrl: virtualTourUrl?.trim() || null,
        features: Array.isArray(features) ? features : [],
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail?.trim() || null,
        agencyId: agencyId || null,
        userId: userId || null,
      },
    });

    return NextResponse.json({
      success: true,
      property,
      message: 'Property listing created successfully!',
    }, { status: 201 });

  } catch (err) {
    console.error('Error creating property:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error creating property' },
      { status: 500 }
    );
  }
}
