// src/app/api/investors/portfolio/route.ts
// GET  /api/investors/portfolio        — get logged-in investor's portfolio
// POST /api/investors/portfolio        — add a new investment holding

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── GET /api/investors/portfolio ─────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    let portfolio = null;
    try {
      portfolio = await prisma.investorPortfolio.findMany({
        where: { userId },
        include: { deal: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (prismaErr) {
      console.warn('[Investors/Portfolio GET] Prisma failed, using Supabase:', prismaErr);
    }

    if (!portfolio) {
      const { data, error } = await supabase
        .from('InvestorPortfolio')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, portfolio: [], error: error.message });
      }
      portfolio = data ?? [];
    }

    // Shape the response to match the frontend InvestorPortfolio interface
    const shaped = portfolio.map((p) => ({
      id:                  p.id,
      dealId:              p.dealId,
      propertyTitle:       p.propertyTitle,
      location:            p.location,
      city:                p.city,
      propertyType:        p.propertyType,
      image:               p.image ?? '',
      status:              p.status as 'ACTIVE' | 'PENDING_RENEWAL' | 'EXITED',
      startDate:           p.startDate instanceof Date ? p.startDate.toISOString().split('T')[0] : String(p.startDate).split('T')[0],
      maturityDate:        p.maturityDate instanceof Date ? p.maturityDate.toISOString().split('T')[0] : String(p.maturityDate).split('T')[0],
      investedAmountPKR:   p.investedAmountPKR,
      currentValuePKR:     p.currentValuePKR,
      equitySharePct:      p.equitySharePct,
      fixedRoiPct:         p.fixedRoiPct,
      monthlyYieldPKR:     p.monthlyYieldPKR,
      agencyName:          p.agencyName,
      contractPdfName:     p.contractPdfName ?? `NexMove_Contract_${p.id}.pdf`,
      exitDetails: p.status === 'EXITED' && p.exitDate ? {
        exitDate:            p.exitDate instanceof Date ? p.exitDate.toISOString().split('T')[0] : String(p.exitDate).split('T')[0],
        finalSaleValuePKR:   p.finalSaleValuePKR ?? 0,
        netCapitalGainsPKR:  p.netCapitalGainsPKR ?? 0,
        totalRoiPct:         p.totalRoiPct ?? 0,
      } : undefined,
    }));

    return NextResponse.json({ success: true, portfolio: shaped });
  } catch (err) {
    console.error('[Investors/Portfolio GET]', err);
    return NextResponse.json({ success: false, portfolio: [], error: 'Failed to fetch portfolio' }, { status: 500 });
  }
}

// ─── POST /api/investors/portfolio ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const {
      dealId, propertyTitle, location, city, propertyType, image,
      maturityDate, investedAmountPKR, currentValuePKR,
      equitySharePct, fixedRoiPct, monthlyYieldPKR, agencyName, contractPdfName,
    } = body;

    if (!dealId || !propertyTitle || !investedAmountPKR || !maturityDate) {
      return NextResponse.json({ error: 'Missing required fields: dealId, propertyTitle, investedAmountPKR, maturityDate' }, { status: 400 });
    }

    let entry = null;
    try {
      entry = await prisma.investorPortfolio.create({
        data: {
          userId,
          dealId,
          propertyTitle,
          location: location ?? '',
          city: city ?? '',
          propertyType: propertyType ?? 'HOUSE',
          image: image ?? null,
          maturityDate: new Date(maturityDate),
          investedAmountPKR: Number(investedAmountPKR),
          currentValuePKR: Number(currentValuePKR ?? investedAmountPKR),
          equitySharePct: Number(equitySharePct ?? 0),
          fixedRoiPct: Number(fixedRoiPct ?? 0),
          monthlyYieldPKR: Number(monthlyYieldPKR ?? 0),
          agencyName: agencyName ?? '',
          contractPdfName: contractPdfName ?? null,
        },
      });
    } catch (prismaErr) {
      console.warn('[Investors/Portfolio POST] Prisma failed, using Supabase:', prismaErr);
      const { data, error } = await supabase.from('InvestorPortfolio').insert([{
        userId, dealId, propertyTitle,
        location: location ?? '', city: city ?? '',
        propertyType: propertyType ?? 'HOUSE', image: image ?? null,
        maturityDate, investedAmountPKR: Number(investedAmountPKR),
        currentValuePKR: Number(currentValuePKR ?? investedAmountPKR),
        equitySharePct: Number(equitySharePct ?? 0),
        fixedRoiPct: Number(fixedRoiPct ?? 0),
        monthlyYieldPKR: Number(monthlyYieldPKR ?? 0),
        agencyName: agencyName ?? '',
        contractPdfName: contractPdfName ?? null,
      }]).select().single();
      if (error) throw new Error(error.message);
      entry = data;
    }

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err) {
    console.error('[Investors/Portfolio POST]', err);
    return NextResponse.json({ error: 'Failed to add portfolio entry' }, { status: 500 });
  }
}
