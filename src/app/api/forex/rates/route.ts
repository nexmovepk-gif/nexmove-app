// src/app/api/forex/rates/route.ts
import { NextResponse } from 'next/server';
import { getLiveSBPForexRates } from '@/lib/forex';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache 1 hour

export async function GET() {
  try {
    const rates = await getLiveSBPForexRates();

    return NextResponse.json({
      success: true,
      base: 'PKR',
      timestamp: new Date().toISOString(),
      source: 'ExchangeRate-API Live Feed',
      rates,
    });
  } catch (error) {
    console.error('[API Forex Rates Error]:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch live forex rates' },
      { status: 500 }
    );
  }
}
