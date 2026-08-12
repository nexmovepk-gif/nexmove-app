// src/app/api/public/agencies/route.ts
import { NextResponse } from 'next/server'

// Mock agency directory with public-safe fields & NTN/coordinates.
const MOCK_AGENCIES = [
  {
    id: 'agency-1',
    name: 'Elite Properties',
    verified: true,
    verifiedLicense: true,
    tier: 'PLATINUM' as const,
    ntn: 'NTN-4829103-7',
    logo: null,
    storefrontPhoto: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80',
    ownerPhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80',
    phone: '+92-51-1111111',
    address: 'Main Boulevard, Bahria Town, Rawalpindi',
    latitude: 33.5256,
    longitude: 73.0984,
    description: 'Premium real estate brokerage serving Rawalpindi & Islamabad since 2010. Specializing in luxury residential and commercial properties.',
    avgRating: 4.8,
    reviewCount: 38,
    activeListings: 12,
  },
  {
    id: 'agency-2',
    name: 'Prime Realty Group',
    verified: true,
    verifiedLicense: true,
    tier: 'GOLD' as const,
    ntn: 'NTN-9182374-2',
    logo: null,
    storefrontPhoto: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400&q=80',
    ownerPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80',
    phone: '+92-42-2222222',
    address: 'MM Alam Road, Gulberg III, Lahore',
    latitude: 31.5204,
    longitude: 74.3587,
    description: 'Lahore\'s most trusted property consultants with 15 years of market expertise. Full-service agency for buy, sell, and rent.',
    avgRating: 4.5,
    reviewCount: 24,
    activeListings: 9,
  },
  {
    id: 'agency-3',
    name: 'Skyline Estates',
    verified: false,
    verifiedLicense: false,
    tier: 'SILVER' as const,
    ntn: 'NTN-3019284-5',
    logo: null,
    storefrontPhoto: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80',
    ownerPhoto: null,
    phone: '+92-21-3333333',
    address: 'Clifton Block 5, Karachi',
    latitude: 24.827,
    longitude: 67.0322,
    description: 'Emerging boutique agency in Karachi\'s high-rise sector. Focused on apartment investments and rental management.',
    avgRating: 3.8,
    reviewCount: 11,
    activeListings: 5,
  },
]

export async function GET() {
  return NextResponse.json({
    agencies: MOCK_AGENCIES,
    total: MOCK_AGENCIES.length,
    timestamp: new Date().toISOString(),
  })
}
