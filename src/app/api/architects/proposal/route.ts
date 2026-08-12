import { NextResponse } from 'next/server'

interface Proposal {
  id: string
  architectId: string
  architectName: string
  agencyId: string | null
  agencyName: string
  propertyListingId: string | null
  message: string
  contactEmail: string | null
  status: string
  createdAt: string
}

const PROPOSALS: Proposal[] = []

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { architectId, architectName, agencyId, agencyName, propertyListingId, message, contactEmail } = body

    if (!architectId || !agencyName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: architectId, agencyName, and message are required.' },
        { status: 400 }
      )
    }

    const proposal = {
      id: `prop_${Date.now()}`,
      architectId,
      architectName: architectName || 'Unknown Architect',
      agencyId: agencyId || null,
      agencyName,
      propertyListingId: propertyListingId || null,
      message,
      contactEmail: contactEmail || null,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    }

    PROPOSALS.push(proposal)

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
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ proposals: PROPOSALS, total: PROPOSALS.length })
}
