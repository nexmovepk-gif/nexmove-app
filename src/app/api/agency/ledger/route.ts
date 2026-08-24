import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LedgerType, LedgerCategory } from '@/generated/client/enums'

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

    const entries = await prisma.financialLedger.findMany({
      where: agencyId ? { agencyId } : { createdById: user.id },
      orderBy: { date: 'desc' },
      include: {
        createdBy: {
          select: { name: true, email: true },
        },
      },
    })

    return NextResponse.json({ success: true, entries })
  } catch (error) {
    console.error('Failed to fetch agency ledger:', error)
    return NextResponse.json({ error: 'Failed to fetch ledger entries' }, { status: 500 })
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

    // Fallback: If user is an independent agent without an agency yet, link or auto-assign
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
    const { type, amount, description, category, date } = body

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required.' }, { status: 400 })
    }

    const ledgerType = type === 'EXPENSE' ? LedgerType.EXPENSE : LedgerType.INCOME

    const validCategories = Object.values(LedgerCategory)
    const upperCategory = (category || 'COMMISSION').toUpperCase() as LedgerCategory
    const ledgerCategory = validCategories.includes(upperCategory) ? upperCategory : LedgerCategory.OTHER

    const entry = await prisma.financialLedger.create({
      data: {
        type: ledgerType,
        category: ledgerCategory,
        amount: numAmount,
        description: description || (ledgerType === 'INCOME' ? 'Income Transaction' : 'Expense Transaction'),
        date: date ? new Date(date) : new Date(),
        agencyId: targetAgencyId,
        createdById: user.id,
      },
    })

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Failed to create ledger entry:', error)
    return NextResponse.json({ error: 'Failed to create ledger entry' }, { status: 500 })
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
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 })
    }

    await prisma.financialLedger.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Transaction removed' })
  } catch (error) {
    console.error('Failed to delete ledger entry:', error)
    return NextResponse.json({ error: 'Failed to delete ledger entry' }, { status: 500 })
  }
}
