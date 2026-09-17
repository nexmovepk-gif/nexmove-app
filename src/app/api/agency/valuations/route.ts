// src/app/api/agency/valuations/route.ts
// Agency Valuation Bidding & Proposal Submission

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const {
      leadId,
      agencyId,
      agencyName,
      estimatedMinPKR,
      estimatedMaxPKR,
      sellingDaysEstimate,
      marketingStrategy,
      commissionRate,
      notes,
    } = await req.json()

    if (!leadId || !estimatedMinPKR || !estimatedMaxPKR) {
      return NextResponse.json(
        { error: 'leadId, estimatedMinPKR, and estimatedMaxPKR are required' },
        { status: 400 }
      )
    }

    const proposal = await prisma.agencyValuationProposal.create({
      data: {
        leadId,
        agencyId: agencyId || 'agency_default',
        agencyName: agencyName || 'Verified Partner Agency',
        estimatedMinPKR: parseFloat(estimatedMinPKR),
        estimatedMaxPKR: parseFloat(estimatedMaxPKR),
        sellingDaysEstimate: sellingDaysEstimate ? parseInt(sellingDaysEstimate, 10) : 30,
        marketingStrategy: marketingStrategy || null,
        commissionRate: commissionRate ? parseFloat(commissionRate) : 1.0,
        notes: notes || null,
        status: 'SUBMITTED',
      },
    })

    // Update lead status
    await prisma.privateSellerLead.update({
      where: { id: leadId },
      data: { status: 'VALUATIONS_RECEIVED' },
    })

    return NextResponse.json({
      success: true,
      proposal,
      message: 'Valuation proposal submitted successfully',
    })
  } catch (error) {
    console.error('Agency valuation submit error:', error)
    return NextResponse.json({ error: 'Failed to submit valuation proposal' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')

    if (leadId) {
      const proposals = await prisma.agencyValuationProposal.findMany({
        where: { leadId },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ success: true, proposals })
    }

    const allProposals = await prisma.agencyValuationProposal.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, proposals: allProposals })
  } catch (error) {
    console.error('Fetch valuation proposals error:', error)
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
  }
}
