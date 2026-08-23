// src/app/api/overseas/portfolio/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email?.toLowerCase();

    // 1. Fetch User details from Database / Supabase
    let dbUser: Record<string, unknown> | null = null;
    if (userId || userEmail) {
      dbUser = await prisma.user.findFirst({
        where: {
          OR: [
            ...(userId ? [{ id: userId }] : []),
            ...(userEmail ? [{ email: userEmail }] : []),
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          isKycVerified: true,
          isOverseasVerified: true,
          nicopNumber: true,
          passportNumber: true,
          overseasCountry: true,
          overseasCity: true,
          phone: true,
          accountRoleType: true,
          role: true,
        },
      }).catch(() => null);
    }

    // 2. Fetch User's Saved Listings (bookmarked from marketplace)
    let properties: Record<string, unknown>[] = [];
    if (userId) {
      // First: get properties saved to dashboard via SavedListing table
      const saved = await prisma.savedListing.findMany({
        where: { userId },
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
      }).catch(() => []);

      // Normalize saved listings to a unified property shape
      properties = saved.map((s) => {
        const src = s.property || s.publicListing;
        return {
          savedListingId: s.id,
          id: src?.id || '',
          title: (src as Record<string, unknown>)?.title || 'Saved Property',
          address: (src as Record<string, unknown>)?.address || '',
          city: (src as Record<string, unknown>)?.city || '',
          propertyType: (src as Record<string, unknown>)?.propertyType || 'Property',
          price: (src as Record<string, unknown>)?.price || 0,
          areaSqFt: (src as Record<string, unknown>)?.areaSqFt || null,
          bedrooms: (src as Record<string, unknown>)?.bedrooms || null,
          bathrooms: (src as Record<string, unknown>)?.bathrooms || null,
          contactPhone: (src as Record<string, unknown>)?.contactPhone || '',
          agency: (src as Record<string, unknown>)?.agency || null,
          savedAt: s.savedAt,
          isFromSavedListing: true,
        };
      });

      // Also include self-posted properties (user is lister/seller)
      if (properties.length === 0) {
        properties = await prisma.property.findMany({
          where: { userId },
          include: {
            agency: { select: { id: true, name: true, phone: true, logo: true, verified: true } },
          },
          orderBy: { createdAt: 'desc' },
        }).catch(() => []);
      }
    }

    // 3. Fetch User's Active Escrow Deals from Deals Table
    let deals: Record<string, unknown>[] = [];
    try {
      deals = await prisma.deal.findMany({
        where: {
          OR: [
            ...(userId ? [{ buyerAgentId: userId }] : []),
            ...(userEmail ? [{ buyerClient: { email: userEmail } }] : []),
          ],
        },
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              price: true,
              address: true,
            },
          },
          agency: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch {
      // Fallback query all recent escrow deals from Supabase
      const { data: sbDeals } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      deals = (sbDeals as Record<string, unknown>[]) || [];
    }

    return NextResponse.json({
      success: true,
      user: dbUser || {
        id: userId || 'overseas-user',
        name: session?.user?.name || 'Overseas Buyer',
        email: userEmail,
        isKycVerified: Boolean((session?.user as unknown as Record<string, unknown>)?.isKycVerified),
        isOverseasVerified: Boolean((session?.user as unknown as Record<string, unknown>)?.isOverseasVerified),
      },
      properties,
      deals,
      count: properties.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Overseas Portfolio API Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to load overseas portfolio data', properties: [], deals: [] },
      { status: 500 }
    );
  }
}
