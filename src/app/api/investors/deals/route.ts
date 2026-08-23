// src/app/api/investors/deals/route.ts
// GET  /api/investors/deals   — list active investment deals (public)
// POST /api/investors/deals   — create a new deal (admin/agency only)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── GET /api/investors/deals ─────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get('status'); // ACTIVE | RESERVED | FUNDED
    const filterType   = searchParams.get('type');   // OFF_MARKET | DISTRESS | HIGH_YIELD

    // Build Prisma where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    if (filterStatus) {
      where.status = filterStatus.toUpperCase();
    } else {
      where.status = 'ACTIVE'; // Default: only show active deals
    }

    if (filterType === 'OFF_MARKET')  where.isOffMarket = true;
    if (filterType === 'DISTRESS')    where.isDistress  = true;
    if (filterType === 'HIGH_YIELD')  where.rentalYieldPct = { gte: 9.0 };

    let deals = null;
    try {
      deals = await prisma.investmentDeal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (prismaErr) {
      console.warn('[Investors/Deals] Prisma read failed, falling back to Supabase:', prismaErr);
    }

    // Supabase fallback
    if (!deals) {
      const query = supabase
        .from('InvestmentDeal')
        .select('*')
        .eq('status', filterStatus?.toUpperCase() ?? 'ACTIVE')
        .order('createdAt', { ascending: false });

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ success: false, deals: [], error: error.message });
      }
      deals = data ?? [];
    }

    return NextResponse.json({ success: true, deals });
  } catch (err) {
    console.error('[Investors/Deals GET]', err);
    return NextResponse.json({ success: false, deals: [], error: 'Failed to fetch deals' }, { status: 500 });
  }
}

// ─── POST /api/investors/deals ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title, location, city, propertyType,
      pricePKR, marketValuationPKR, discountPct = 0,
      rentalYieldPct = 0, capitalGrowth3YrPct = 0, roiScore = 75,
      isDistress = false, isOffMarket = false, escrowSecured = true,
      image, agencyName, agencyId,
    } = body;

    if (!title || !location || !city || !propertyType || !pricePKR || !marketValuationPKR || !agencyName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let deal = null;
    try {
      deal = await prisma.investmentDeal.create({
        data: {
          title, location, city, propertyType,
          pricePKR: Number(pricePKR),
          marketValuationPKR: Number(marketValuationPKR),
          discountPct: Number(discountPct),
          rentalYieldPct: Number(rentalYieldPct),
          capitalGrowth3YrPct: Number(capitalGrowth3YrPct),
          roiScore: Number(roiScore),
          isDistress: Boolean(isDistress),
          isOffMarket: Boolean(isOffMarket),
          escrowSecured: Boolean(escrowSecured),
          image: image ?? null,
          agencyName,
          agencyId: agencyId ?? null,
        },
      });
    } catch (prismaErr) {
      console.warn('[Investors/Deals POST] Prisma failed, using Supabase:', prismaErr);
      const { data, error } = await supabase.from('InvestmentDeal').insert([{
        title, location, city, property_type: propertyType,
        price_pkr: Number(pricePKR), market_valuation_pkr: Number(marketValuationPKR),
        discount_pct: Number(discountPct), rental_yield_pct: Number(rentalYieldPct),
        capital_growth_3yr_pct: Number(capitalGrowth3YrPct), roi_score: Number(roiScore),
        is_distress: Boolean(isDistress), is_off_market: Boolean(isOffMarket),
        escrow_secured: Boolean(escrowSecured), image: image ?? null,
        agency_name: agencyName, agency_id: agencyId ?? null,
      }]).select().single();
      if (error) throw new Error(error.message);
      deal = data;
    }

    return NextResponse.json({ success: true, deal }, { status: 201 });
  } catch (err) {
    console.error('[Investors/Deals POST]', err);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
