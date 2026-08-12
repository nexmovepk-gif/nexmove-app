import { NextResponse } from 'next/server'

interface MockListing {
  id: string
  title: string
  price: number
  address: string
  rooms: number
}

const MOCK_LISTINGS: Record<string, MockListing[]> = {
  'agency-1': [
    { id: 'lst-1', title: 'Luxury Bahria Town Villa', price: 45000000, address: 'Bahria Town Phase 8, Rawalpindi', rooms: 5 },
    { id: 'lst-2', title: 'Executive Studio Apartment', price: 12000000, address: 'DHA Phase 6, Lahore', rooms: 1 },
  ],
  'agency-2': [
    { id: 'lst-3', title: 'Commercial Plot 10 Marla', price: 65000000, address: 'Gulberg III, Lahore', rooms: 0 },
    { id: 'lst-4', title: 'Modern Penthouse with View', price: 95000000, address: 'E-11, Islamabad', rooms: 3 },
  ],
}

export async function GET(
  req: Request,
  { params }: { params: { agencyId: string } }
) {
  const { agencyId } = params

  const listings = MOCK_LISTINGS[agencyId] || []
  
  return NextResponse.json({
    agencyId,
    listings,
    count: listings.length,
    timestamp: new Date().toISOString()
  })
}
