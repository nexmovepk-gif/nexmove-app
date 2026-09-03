// src/app/api/saved-listings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// ── GET — fetch all saved listings for the logged-in user ────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const saved = await prisma.savedListing.findMany({
      where: { userId: session.user.id },
      include: {
        property: {
          include: {
            agency: { select: { id: true, name: true, phone: true, logo: true, verified: true } },
          },
        },
        publicListing: {
          include: {
            agency: { select: { id: true, name: true, phone: true, logo: true, verified: true } },
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });

    return NextResponse.json({ success: true, saved, count: saved.length });
  } catch (err) {
    console.error('[SavedListings GET Error]:', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch saved listings' }, { status: 500 });
  }
}

// ── POST — save a listing (supports propertyId, publicListingId, or generic listingId) ──
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, publicListingId, listingId, note } = body as {
      propertyId?: string;
      publicListingId?: string;
      listingId?: string;
      note?: string;
    };

    const targetId = listingId || publicListingId || propertyId;
    if (!targetId) {
      return NextResponse.json(
        { success: false, error: 'Provide listingId, propertyId, or publicListingId' },
        { status: 400 }
      );
    }

    // Determine whether this targetId belongs to PublicListing or Property table
    let resolvedPublicListingId: string | null = null;
    let resolvedPropertyId: string | null = null;

    if (publicListingId && !listingId && !propertyId) {
      // Explicit publicListingId passed
      const exists = await prisma.publicListing.findUnique({ where: { id: publicListingId }, select: { id: true } });
      if (exists) {
        resolvedPublicListingId = publicListingId;
      } else {
        const propExists = await prisma.property.findUnique({ where: { id: publicListingId }, select: { id: true } });
        if (propExists) resolvedPropertyId = publicListingId;
      }
    } else if (propertyId && !listingId && !publicListingId) {
      // Explicit propertyId passed
      const exists = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
      if (exists) {
        resolvedPropertyId = propertyId;
      } else {
        const pubExists = await prisma.publicListing.findUnique({ where: { id: propertyId }, select: { id: true } });
        if (pubExists) resolvedPublicListingId = propertyId;
      }
    } else {
      // Generic candidate ID
      const isPublic = await prisma.publicListing.findUnique({ where: { id: targetId }, select: { id: true } });
      if (isPublic) {
        resolvedPublicListingId = targetId;
      } else {
        const isProp = await prisma.property.findUnique({ where: { id: targetId }, select: { id: true } });
        if (isProp) {
          resolvedPropertyId = targetId;
        }
      }
    }

    if (!resolvedPublicListingId && !resolvedPropertyId) {
      return NextResponse.json(
        { success: false, error: 'Listing not found in database' },
        { status: 404 }
      );
    }

    // Upsert — if already saved, return existing (idempotent)
    const saved = await prisma.savedListing.upsert({
      where: resolvedPropertyId
        ? { userId_propertyId: { userId: session.user.id, propertyId: resolvedPropertyId } }
        : { userId_publicListingId: { userId: session.user.id, publicListingId: resolvedPublicListingId! } },
      update: { note: note ?? undefined },
      create: {
        userId: session.user.id,
        propertyId: resolvedPropertyId,
        publicListingId: resolvedPublicListingId,
        note: note ?? null,
      },
    });

    return NextResponse.json({ success: true, saved }, { status: 201 });
  } catch (err) {
    console.error('[SavedListings POST Error]:', err);
    return NextResponse.json({ success: false, error: 'Failed to save listing' }, { status: 500 });
  }
}

// ── DELETE — unsave a listing by id or target listing ID ─────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const listingId = searchParams.get('listingId');
    const propertyId = searchParams.get('propertyId');
    const publicListingId = searchParams.get('publicListingId');

    const targetId = listingId || propertyId || publicListingId;

    if (id) {
      await prisma.savedListing.deleteMany({
        where: { id, userId: session.user.id },
      });
    } else if (targetId) {
      await prisma.savedListing.deleteMany({
        where: {
          userId: session.user.id,
          OR: [
            { propertyId: targetId },
            { publicListingId: targetId },
          ],
        },
      });
    } else {
      return NextResponse.json({ success: false, error: 'Provide id, listingId, propertyId, or publicListingId' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Listing unsaved successfully' });
  } catch (err) {
    console.error('[SavedListings DELETE Error]:', err);
    return NextResponse.json({ success: false, error: 'Failed to unsave listing' }, { status: 500 });
  }
}
