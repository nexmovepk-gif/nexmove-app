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

// ── POST — save a listing ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { propertyId, publicListingId, note } = body as {
      propertyId?: string;
      publicListingId?: string;
      note?: string;
    };

    if (!propertyId && !publicListingId) {
      return NextResponse.json(
        { success: false, error: 'Provide either propertyId or publicListingId' },
        { status: 400 }
      );
    }

    // Upsert — if already saved, return existing (idempotent)
    const saved = await prisma.savedListing.upsert({
      where: propertyId
        ? { userId_propertyId: { userId: session.user.id, propertyId } }
        : { userId_publicListingId: { userId: session.user.id, publicListingId: publicListingId! } },
      update: { note: note ?? undefined },
      create: {
        userId: session.user.id,
        propertyId: propertyId ?? null,
        publicListingId: publicListingId ?? null,
        note: note ?? null,
      },
    });

    return NextResponse.json({ success: true, saved }, { status: 201 });
  } catch (err) {
    console.error('[SavedListings POST Error]:', err);
    return NextResponse.json({ success: false, error: 'Failed to save listing' }, { status: 500 });
  }
}

// ── DELETE — unsave a listing by savedListing id ─────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const propertyId = searchParams.get('propertyId');
    const publicListingId = searchParams.get('publicListingId');

    if (id) {
      await prisma.savedListing.deleteMany({
        where: { id, userId: session.user.id },
      });
    } else if (propertyId) {
      await prisma.savedListing.deleteMany({
        where: { userId: session.user.id, propertyId },
      });
    } else if (publicListingId) {
      await prisma.savedListing.deleteMany({
        where: { userId: session.user.id, publicListingId },
      });
    } else {
      return NextResponse.json({ success: false, error: 'Provide id, propertyId, or publicListingId' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Listing unsaved successfully' });
  } catch (err) {
    console.error('[SavedListings DELETE Error]:', err);
    return NextResponse.json({ success: false, error: 'Failed to unsave listing' }, { status: 500 });
  }
}
