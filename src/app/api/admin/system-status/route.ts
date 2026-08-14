import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const activeTenantsCount = await prisma.agency.count()

    return NextResponse.json({
      status: 'Operational',
      systemName: 'NexMove Core Engine',
      databaseConnection: 'Connected',
      activeTenantsCount,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('System status DB error:', err)
    return NextResponse.json({
      status: 'Degraded',
      systemName: 'NexMove Core Engine',
      databaseConnection: 'Disconnected / Offline',
      activeTenantsCount: 0,
      timestamp: new Date().toISOString(),
    })
  }
}
