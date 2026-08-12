// src/app/marketplace/[id]/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import ListingDetailClient, { PublicListingItem } from '@/components/ListingDetailClient';

const MOCK_LISTINGS: PublicListingItem[] = [
  {
    id: 'pub-1',
    title: '5 Marla House in Bahria Town Phase 4',
    description: 'Well-maintained 5 marla house with gas, electricity, and broadband. Near masjid and commercial market.',
    propertyType: 'HOUSE',
    price: 17500000,
    address: 'Street 12, Bahria Town Phase 4',
    city: 'Rawalpindi',
    areaSqFt: 1360,
    bedrooms: 3,
    bathrooms: 2,
    contactName: 'Muhammad Tariq',
    contactPhone: '+92-300-0000001',
    contactEmail: null,
    verifiedProperty: true,
    aiExtracted: true,
    aiConfidence: 0.75,
    isActive: true,
    agencyId: 'agency-1',
    agencyName: 'Elite Properties',
    agencyVerified: true,
    createdAt: '2026-08-01T10:00:00Z',
  },
  {
    id: 'pub-2',
    title: '10 Marla Corner Plot — DHA Phase 6 Lahore',
    description: 'Ideal investment plot. All dues clear, possession available immediately.',
    propertyType: 'PLOT',
    price: 42000000,
    address: 'Block M, DHA Phase 6',
    city: 'Lahore',
    areaSqFt: 2720,
    bedrooms: null,
    bathrooms: null,
    contactName: 'Asif Khan',
    contactPhone: '+92-321-0000002',
    contactEmail: 'asif@example.com',
    verifiedProperty: false,
    aiExtracted: true,
    aiConfidence: 0.55,
    isActive: true,
    agencyId: null,
    agencyName: null,
    agencyVerified: false,
    createdAt: '2026-08-03T14:00:00Z',
  },
  {
    id: 'pub-3',
    title: 'Modern 2-Bed Apartment — Gulberg III',
    description: 'High-rise apartment with gym, rooftop access, and 24/7 security.',
    propertyType: 'APARTMENT',
    price: 22000000,
    address: 'Liberty Towers, Gulberg III',
    city: 'Lahore',
    areaSqFt: 950,
    bedrooms: 2,
    bathrooms: 2,
    contactName: 'Sana Ahmed',
    contactPhone: '+92-333-0000003',
    contactEmail: 'sana@example.com',
    verifiedProperty: true,
    aiExtracted: false,
    aiConfidence: null,
    isActive: true,
    agencyId: 'agency-2',
    agencyName: 'Prime Realty Group',
    agencyVerified: true,
    createdAt: '2026-08-05T09:00:00Z',
  },
];

export function generateStaticParams() {
  return MOCK_LISTINGS.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const listing = MOCK_LISTINGS.find((l) => l.id === params.id);
  return {
    title: listing ? `${listing.title} — NexMove` : 'Listing Not Found',
    description: listing?.description ?? '',
  };
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = MOCK_LISTINGS.find((l) => l.id === params.id && l.isActive);

  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center flex flex-col gap-4">
          <span className="text-4xl">🔍</span>
          <h1 className="text-xl font-bold">Listing Not Found</h1>
          <Link href="/marketplace" className="text-teal-400 text-sm hover:underline">← Back to Marketplace</Link>
        </div>
      </main>
    );
  }

  return <ListingDetailClient listing={listing} />;
}
