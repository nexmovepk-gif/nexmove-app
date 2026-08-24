import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { agency: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const agencyId = user.agencyId || (user.agency ? user.agency.id : null)

    const collections = await prisma.rentCollection.findMany({
      where: agencyId ? { agencyId } : { collectedById: user.id },
      orderBy: { dateCollected: 'desc' },
      include: {
        collectedBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ success: true, collections })
  } catch (error) {
    console.error('Failed to fetch rent collections:', error)
    return NextResponse.json({ error: 'Failed to fetch rent collections' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { agency: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let targetAgencyId = user.agencyId || (user.agency ? user.agency.id : null)

    if (!targetAgencyId) {
      const defaultAgency = await prisma.agency.findFirst()
      if (defaultAgency) {
        targetAgencyId = defaultAgency.id
      } else {
        const createdAgency = await prisma.agency.create({
          data: {
            name: `${user.name || 'Private'} Agency`,
            verified: true,
          },
        })
        targetAgencyId = createdAgency.id
      }
    }

    const body = await request.json()
    const { tenantName, property, amount, month, year, dueDate, status, notes } = body

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Valid rent amount is required.' }, { status: 400 })
    }

    const currentYear = year ? parseInt(year, 10) : new Date().getFullYear()
    const currentMonth = month ? parseInt(month, 10) : new Date().getMonth() + 1

    // Store structured tenant & status metadata inside description
    const metaPayload = {
      tenantName: tenantName || 'Shielded Tenant',
      property: property || 'Managed Unit',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      status: status || 'Pending',
      notes: notes || '',
    }

    const collection = await prisma.rentCollection.create({
      data: {
        amount: numAmount,
        month: currentMonth,
        year: currentYear,
        description: JSON.stringify(metaPayload),
        dateCollected: new Date(),
        agencyId: targetAgencyId,
        collectedById: user.id,
      },
    })

    return NextResponse.json({ success: true, collection })
  } catch (error) {
    console.error('Failed to create rent collection:', error)
    return NextResponse.json({ error: 'Failed to create rent collection' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    const existing = await prisma.rentCollection.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    let parsedMeta = {}
    try {
      if (existing.description) {
        parsedMeta = JSON.parse(existing.description)
      }
    } catch {
      parsedMeta = { tenantName: 'Tenant', property: existing.description || 'Unit' }
    }

    const updatedMeta = {
      ...parsedMeta,
      status: status || 'Paid',
    }

    const updated = await prisma.rentCollection.update({
      where: { id },
      data: {
        description: JSON.stringify(updatedMeta),
      },
    })

    return NextResponse.json({ success: true, collection: updated })
  } catch (error) {
    console.error('Failed to update rent record:', error)
    return NextResponse.json({ error: 'Failed to update rent record' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    await prisma.rentCollection.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Rent record deleted' })
  } catch (error) {
    console.error('Failed to delete rent record:', error)
    return NextResponse.json({ error: 'Failed to delete rent record' }, { status: 500 })
  }
}
