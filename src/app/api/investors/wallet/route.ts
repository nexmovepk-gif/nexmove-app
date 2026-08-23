// src/app/api/investors/wallet/route.ts
// GET   /api/investors/wallet        — get investor's escrow wallet balance + cashflow ledger
// PATCH /api/investors/wallet        — update balance (deposit/payout)

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── GET /api/investors/wallet ────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // Fetch or auto-create wallet
    let wallet = null;
    let cashflows: unknown[] = [];

    try {
      wallet = await prisma.investorWallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balancePKR: 0, pendingPKR: 0 },
      });

      cashflows = await prisma.investorCashflow.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      });
    } catch (prismaErr) {
      console.warn('[Investors/Wallet GET] Prisma failed, using Supabase:', prismaErr);

      const { data: wData } = await supabase
        .from('InvestorWallet')
        .select('*')
        .eq('userId', userId)
        .maybeSingle();

      if (!wData) {
        // Auto-create wallet via Supabase
        const { data: newWallet } = await supabase
          .from('InvestorWallet')
          .insert([{ userId, balancePKR: 0, pendingPKR: 0 }])
          .select()
          .single();
        wallet = newWallet;
      } else {
        wallet = wData;
      }

      const { data: cfData } = await supabase
        .from('InvestorCashflow')
        .select('*')
        .eq('userId', userId)
        .order('date', { ascending: false });
      cashflows = cfData ?? [];
    }

    // Shape cashflows to frontend interface
    const shapedCashflows = (cashflows as Record<string, unknown>[]).map((t) => ({
      id:             String(t.id),
      date:           t.date instanceof Date ? (t.date as Date).toISOString().split('T')[0] : String(t.date ?? '').split('T')[0],
      propertyTitle:  String(t.propertyTitle ?? ''),
      type:           (t.type as 'RENTAL_INCOME' | 'PROFIT_DISTRIBUTION' | 'CAPITAL_EXIT'),
      grossAmountPKR: Number(t.grossAmountPKR ?? 0),
      fbrTaxPKR:      Number(t.fbrTaxPKR ?? 0),
      netPayoutPKR:   Number(t.netPayoutPKR ?? 0),
      paymentMethod:  String(t.paymentMethod ?? 'Bank Transfer'),
      receiptId:      String(t.receiptId ?? `RCP-${String(t.id).slice(0, 8).toUpperCase()}`),
      status:         (t.status as 'COMPLETED' | 'PROCESSING') ?? 'COMPLETED',
    }));

    return NextResponse.json({
      success: true,
      wallet: {
        balancePKR: Number(wallet?.balancePKR ?? 0),
        pendingPKR: Number(wallet?.pendingPKR ?? 0),
      },
      cashflows: shapedCashflows,
    });
  } catch (err) {
    console.error('[Investors/Wallet GET]', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch wallet' }, { status: 500 });
  }
}

// ─── PATCH /api/investors/wallet ──────────────────────────────────────────────
// Body: { action: 'DEPOSIT' | 'PAYOUT', amountPKR: number, bankName?: string, iban?: string }
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const body = await req.json();
    const { action, amountPKR, bankName, iban } = body;

    if (!action || !amountPKR || Number(amountPKR) <= 0) {
      return NextResponse.json({ error: 'Invalid action or amount' }, { status: 400 });
    }

    let wallet = null;
    try {
      // Fetch current wallet
      const current = await prisma.investorWallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balancePKR: 0, pendingPKR: 0 },
      });

      if (action === 'PAYOUT' && Number(amountPKR) > current.balancePKR) {
        return NextResponse.json({ error: 'Insufficient escrow balance' }, { status: 400 });
      }

      wallet = await prisma.investorWallet.update({
        where: { userId },
        data:  {
          balancePKR: action === 'DEPOSIT'
            ? { increment: Number(amountPKR) }
            : { decrement: Number(amountPKR) },
          pendingPKR: action === 'PAYOUT'
            ? { increment: Number(amountPKR) }
            : undefined,
          updatedAt: new Date(),
        },
      });

      // Record cashflow entry for payout
      if (action === 'PAYOUT') {
        await prisma.investorCashflow.create({
          data: {
            userId,
            propertyTitle: 'Escrow Wallet Payout',
            type: 'PROFIT_DISTRIBUTION',
            grossAmountPKR: Number(amountPKR),
            fbrTaxPKR: 0,
            netPayoutPKR: Number(amountPKR),
            paymentMethod: bankName ? `${bankName}${iban ? ` (${iban})` : ''}` : 'Bank Transfer',
            receiptId: `RCP-${Date.now().toString(36).toUpperCase()}`,
            status: 'PROCESSING',
          },
        });
      }
    } catch (prismaErr) {
      console.warn('[Investors/Wallet PATCH] Prisma failed:', prismaErr);
      return NextResponse.json({ error: 'Wallet update failed — please try again' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      wallet: {
        balancePKR: wallet.balancePKR,
        pendingPKR: wallet.pendingPKR,
      },
      message: action === 'DEPOSIT'
        ? `Rs ${Number(amountPKR).toLocaleString()} deposited to escrow wallet.`
        : `Payout of Rs ${Number(amountPKR).toLocaleString()} submitted to ${bankName ?? 'bank'}.`,
    });
  } catch (err) {
    console.error('[Investors/Wallet PATCH]', err);
    return NextResponse.json({ error: 'Wallet update failed' }, { status: 500 });
  }
}
