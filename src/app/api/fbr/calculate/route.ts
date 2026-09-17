// src/app/api/fbr/calculate/route.ts
// Real-Time FBR ATL & Property Advance Tax Calculation Engine (Pakistan FY 2026-27)

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { propertyPrice, buyerStatus, sellerStatus, cnic } = await req.json()

    if (!propertyPrice || isNaN(Number(propertyPrice))) {
      return NextResponse.json(
        { error: 'Valid propertyPrice is required' },
        { status: 400 }
      )
    }

    const price = Math.round(Number(propertyPrice))

    // Section 236K (Buyer Advance Tax):
    // Active Filer: 3%
    // Non-Filer: 10.5%
    const buyerIsFiler = buyerStatus === 'ACTIVE_FILER' || buyerStatus === 'FILER'
    const buyerRate = buyerIsFiler ? 0.03 : 0.105
    const buyerTax = Math.round(price * buyerRate)
    const buyerFilerTax = Math.round(price * 0.03)
    const buyerNonFilerTax = Math.round(price * 0.105)
    const buyerPotentialSavings = buyerNonFilerTax - buyerFilerTax

    // Section 236C (Seller Advance Tax on gain/gross value):
    // Active Filer: 4%
    // Non-Filer: 6%
    const sellerIsFiler = sellerStatus === 'ACTIVE_FILER' || sellerStatus === 'FILER'
    const sellerRate = sellerIsFiler ? 0.04 : 0.06
    const sellerTax = Math.round(price * sellerRate)
    const sellerFilerTax = Math.round(price * 0.04)
    const sellerNonFilerTax = Math.round(price * 0.06)
    const sellerPotentialSavings = sellerNonFilerTax - sellerFilerTax

    // Mock/Simulated 17-digit FBR PSID number
    const psidBuyer = `10026${Math.floor(100000000000 + Math.random() * 900000000000)}`
    const psidSeller = `10026${Math.floor(100000000000 + Math.random() * 900000000000)}`

    return NextResponse.json({
      success: true,
      propertyPrice: price,
      buyer: {
        status: buyerIsFiler ? 'ACTIVE_FILER' : 'NON_FILER',
        taxRatePct: buyerRate * 100,
        taxPKR: buyerTax,
        filerTaxPKR: buyerFilerTax,
        nonFilerTaxPKR: buyerNonFilerTax,
        potentialSavingsPKR: buyerPotentialSavings,
        fbrSection: 'Section 236K (Advance Tax on Purchase)',
        psidNumber: psidBuyer,
      },
      seller: {
        status: sellerIsFiler ? 'ACTIVE_FILER' : 'NON_FILER',
        taxRatePct: sellerRate * 100,
        taxPKR: sellerTax,
        filerTaxPKR: sellerFilerTax,
        nonFilerTaxPKR: sellerNonFilerTax,
        potentialSavingsPKR: sellerPotentialSavings,
        fbrSection: 'Section 236C (Advance Tax on Sale)',
        psidNumber: psidSeller,
      },
      paymentGuide: {
        portal: 'https://iris.fbr.gov.pk',
        steps: [
          'Log in to FBR IRIS or open e-Payment without login.',
          'Select Tax Year (2026) and tax head (236K / 236C).',
          'Enter CNIC and property consideration value to generate 17-digit PSID.',
          'Pay via 1BILL / online banking or National Bank of Pakistan (NBP).',
          'Collect Computerized Payment Receipt (CPR) for society/registry transfer.',
        ],
      },
    })
  } catch (error) {
    console.error('FBR calculation error:', error)
    return NextResponse.json({ error: 'Failed to calculate FBR tax' }, { status: 500 })
  }
}
