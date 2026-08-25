import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      architectId,
      architectName,
      agencyId,
      agencyName,
      propertyListingId,
      message,
      contactEmail,
      contactPhone,
      projectType,
      plotArea,
      budgetPKR,
      location,
    } = body

    if (!architectId || !agencyName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: architectId, agencyName, and message are required.' },
        { status: 400 }
      )
    }

    const proposal = await prisma.architectProposal.create({
      data: {
        architectId,
        architectName: architectName || null,
        agencyId: agencyId || null,
        agencyName: agencyName.trim(),
        contactEmail: contactEmail ? contactEmail.trim() : null,
        contactPhone: contactPhone ? contactPhone.trim() : null,
        projectType: projectType || null,
        plotArea: plotArea || null,
        budgetPKR: budgetPKR ? Number(budgetPKR) : null,
        location: location || null,
        message: message.trim(),
        propertyListingId: propertyListingId || null,
        status: 'PENDING',
      },
    })

    return NextResponse.json(
      {
        message: `Your Design Proposal Request has been sent to ${architectName || 'the architect'} successfully.`,
        proposal: {
          id: proposal.id,
          status: proposal.status,
          createdAt: proposal.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Proposal submission error:', error)
    const errMsg = error instanceof Error ? error.message : 'Failed to submit proposal request'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const queryArchitectId = searchParams.get('architectId')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { architectProfile: true },
    })

    const isSuperAdmin =
      session.user.email?.toLowerCase() === 'nexmove.pk@gmail.com' ||
      session.user.role === 'SUPER_ADMIN'

    let targetArchitectId = queryArchitectId

    if (!targetArchitectId && user?.architectProfile) {
      targetArchitectId = user.architectProfile.id
    }

    const whereClause: Record<string, unknown> = {}
    if (!isSuperAdmin) {
      if (!targetArchitectId) {
        return NextResponse.json({ proposals: [], total: 0 })
      }
      whereClause.architectId = targetArchitectId
    } else if (targetArchitectId) {
      whereClause.architectId = targetArchitectId
    }

    const proposals = await prisma.architectProposal.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ proposals, total: proposals.length })
  } catch (error) {
    console.error('Proposals fetch error:', error)
    return NextResponse.json({ proposals: [], total: 0 }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const body = await req.json()
    const { status } = body

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    const updated = await prisma.architectProposal.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true, proposal: updated })
  } catch (error) {
    console.error('Proposal update error:', error)
    return NextResponse.json({ error: 'Failed to update proposal status' }, { status: 500 })
  }
}
