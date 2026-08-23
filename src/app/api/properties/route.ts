// src/app/api/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { PropertyPurpose, ListingStatus } from '@/generated/client/enums';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    const userId = searchParams.get('userId');
    const agencyId = searchParams.get('agencyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (userId) {
      where.userId = userId;
    }
    if (agencyId) {
      where.agencyId = agencyId;
    }
    if (status && Object.values(ListingStatus).includes(status.toUpperCase() as ListingStatus)) {
      where.status = status.toUpperCase() as ListingStatus;
    }
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
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        agency: {
          select: {
            id: true,
            name: true,
            phone: true,
            logo: true,
            verified: true,
          },
        },
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
      userId: bodyUserId,
      status = 'ACTIVE',
    } = body;

    // Auto-attach userId from the authenticated session if not provided in body
    const session = await getServerSession(authOptions);
    const userId = bodyUserId || session?.user?.id || null;

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

    // Validate status enum
    const validStatus = Object.values(ListingStatus).includes(status?.toUpperCase() as ListingStatus)
      ? (status.toUpperCase() as ListingStatus)
      : ListingStatus.ACTIVE;

    const parsedAvailableDate = availableDate ? new Date(availableDate) : null;

    const propertyData = {
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
      status: validStatus,
    };

    // 1. Insert via Prisma (connected directly to Supabase Postgres)
    let property = null;
    try {
      property = await prisma.property.create({
        data: propertyData,
      });
    } catch (prismaErr) {
      console.warn('[Properties API] Prisma create note, attempting Supabase direct insert:', prismaErr);
    }

    // 2. Insert into Supabase table ('properties' / 'Property')
    try {
      const supabasePayload = {
        ...(property ? { id: property.id } : {}),
        title: propertyData.title,
        description: propertyData.description,
        purpose: propertyData.purpose,
        property_type: propertyData.propertyType,
        category: propertyData.category,
        price: propertyData.price,
        address: propertyData.address,
        city: propertyData.city,
        area_sqft: propertyData.areaSqFt,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        is_available: propertyData.isAvailable,
        available_date: propertyData.availableDate?.toISOString() || null,
        images: propertyData.images,
        video_url: propertyData.videoUrl,
        panorama_url: propertyData.panoramaUrl,
        virtual_tour_url: propertyData.virtualTourUrl,
        features: propertyData.features,
        contact_name: propertyData.contactName,
        contact_phone: propertyData.contactPhone,
        contact_email: propertyData.contactEmail,
        agency_id: propertyData.agencyId,
        user_id: propertyData.userId,
        status: propertyData.status,
      };

      // Try inserting into 'properties' table
      const { data: sbData, error: sbErr } = await supabase
        .from('properties')
        .insert([supabasePayload])
        .select()
        .maybeSingle();

      if (sbErr) {
        // Also try capitalized table name if exists
        try {
          await supabase.from('Property').insert([propertyData]);
        } catch {
          // ignore
        }
      } else if (!property && sbData) {
        property = sbData;
      }
    } catch (sbInsertErr) {
      console.warn('[Properties API] Supabase client insert note:', sbInsertErr);
    }

    if (!property) {
      return NextResponse.json(
        { error: 'Failed to record property in database.' },
        { status: 500 }
      );
    }

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

// ─── PATCH /api/properties ─────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, isAvailable, price, title, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    if (status && Object.values(ListingStatus).includes(status.toUpperCase() as ListingStatus)) {
      data.status = status.toUpperCase() as ListingStatus;
    }
    if (typeof isAvailable === 'boolean') {
      data.isAvailable = isAvailable;
    }
    if (price !== undefined && price !== null) {
      data.price = Number(price);
    }
    if (title) {
      data.title = String(title).trim();
    }
    if (description !== undefined) {
      data.description = description ? String(description).trim() : null;
    }

    const updated = await prisma.property.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      property: updated,
      message: 'Property updated successfully',
    });
  } catch (err) {
    console.error('Error updating property:', err);
    return NextResponse.json({ error: 'Failed to update property or record not found' }, { status: 500 });
  }
}

// ─── DELETE /api/properties ────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    await prisma.property.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Property listing deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting property:', err);
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 });
  }
}
