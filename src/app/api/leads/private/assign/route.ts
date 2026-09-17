// src/app/api/leads/private/assign/route.ts
// Seller Mandate Assignment & MOU Agreement Generator

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { leadId, proposalId, sellerSignature } = await req.json()

    if (!leadId || !proposalId) {
      return NextResponse.json({ error: 'leadId and proposalId are required' }, { status: 400 })
    }

    const proposal = await prisma.agencyValuationProposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal || proposal.leadId !== leadId) {
      return NextResponse.json({ error: 'Invalid proposal or lead mismatch' }, { status: 404 })
    }

    const lead = await prisma.privateSellerLead.findUnique({
      where: { id: leadId },
    })

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // 1. Mark selected proposal as ACCEPTED and others as DECLINED
    await prisma.agencyValuationProposal.update({
      where: { id: proposalId },
      data: { status: 'ACCEPTED' },
    })

    await prisma.agencyValuationProposal.updateMany({
      where: {
        leadId,
        id: { not: proposalId },
      },
      data: { status: 'DECLINED' },
    })

    // 2. Generate Exclusive Listing Mandate MOU
    const mandate = await prisma.exclusiveListingMandate.upsert({
      where: { leadId },
      update: {
        agencyId: proposal.agencyId,
        agencyName: proposal.agencyName,
        agreedMinPrice: proposal.estimatedMinPKR,
        commissionPct: proposal.commissionRate,
        validityDays: 30,
        sellerSignatureDate: new Date(),
        mouPdfUrl: `/api/documents/mandate-mou-${leadId}.pdf`,
      },
      create: {
        leadId,
        agencyId: proposal.agencyId,
        agencyName: proposal.agencyName,
        agreedMinPrice: proposal.estimatedMinPKR,
        commissionPct: proposal.commissionRate,
        validityDays: 30,
        sellerSignatureDate: new Date(),
        mouPdfUrl: `/api/documents/mandate-mou-${leadId}.pdf`,
      },
    })

    // 3. Update Lead status to AGENCY_ASSIGNED
    const updatedLead = await prisma.privateSellerLead.update({
      where: { id: leadId },
      data: {
        status: 'AGENCY_ASSIGNED',
        assignedAgencyId: proposal.agencyId,
      },
      include: {
        exclusiveMandate: true,
        valuationProposals: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Agency ${proposal.agencyName} assigned successfully. Exclusive Mandate MOU activated.`,
      lead: updatedLead,
      mandate,
    })
  } catch (error) {
    console.error('Assign agency error:', error)
    return NextResponse.json({ error: 'Failed to assign agency' }, { status: 500 })
  }
}
