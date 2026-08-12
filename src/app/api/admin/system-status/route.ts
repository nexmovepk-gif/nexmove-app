import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'Operational',
    systemName: 'NexMove Core Engine',
    databaseConnection: 'Connected',
    activeTenantsCount: 42,
    timestamp: new Date().toISOString()
  })
}
