// src/app/api/overseas/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
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

    // 2. Fetch User's Properties from Prisma / Supabase
    let properties: Record<string, unknown>[] = [];
    if (userId) {
      properties = await prisma.property.findMany({
        where: { userId },
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
        },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []);
    }

    // If user has no self-posted properties, fetch top verified properties for overseas portfolio preview
    if (properties.length === 0) {
      const topVerified = await prisma.property.findMany({
        where: {
          isAvailable: true,
          status: 'ACTIVE',
        },
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
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }).catch(() => []);

      if (topVerified.length > 0) {
        properties = topVerified;
      } else {
        // Fallback to Supabase direct query
        const { data: sbProps } = await supabase
          .from('properties')
          .select('*')
          .limit(6);
        properties = (sbProps as Record<string, unknown>[]) || [];
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
