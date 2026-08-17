// src/app/marketplace/[id]/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';
import ListingDetailClient, { PublicListingItem } from '@/components/ListingDetailClient';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const prop = await prisma.property.findUnique({
      where: { id: params.id },
    });
    if (prop) {
      return {
        title: `${prop.title} — NexMove`,
        description: prop.description ?? '',
      };
    }
    const listing = await prisma.publicListing.findUnique({
      where: { id: params.id },
    });
    return {
      title: listing ? `${listing.title} — NexMove` : 'Listing Not Found',
      description: listing?.description ?? '',
    };
  } catch {
    return {
      title: 'Property Listing — NexMove',
    };
  }
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  let listing: PublicListingItem | null = null;

  try {
    // 1. Check Property model
    const prop = await prisma.property.findUnique({
      where: { id: params.id },
      include: { agency: true },
    });

    if (prop && prop.isAvailable) {
      listing = {
        id: prop.id,
        title: prop.title,
        description: prop.description || '',
        propertyType: String(prop.propertyType),
        price: prop.price,
        address: prop.address,
        city: prop.city || '',
        areaSqFt: prop.areaSqFt,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        contactName: prop.contactName,
        contactPhone: prop.contactPhone,
        contactEmail: prop.contactEmail,
        verifiedProperty: prop.agency?.verified || false,
        aiExtracted: true,
        aiConfidence: 0.95,
        isActive: prop.isAvailable,
        agencyId: prop.agencyId,
        agencyName: prop.agency?.name || null,
        agencyVerified: prop.agency?.verified || false,
        createdAt: prop.createdAt.toISOString(),
      };
    } else {
      // 2. Check PublicListing model
      const dbListing = await prisma.publicListing.findUnique({
        where: { id: params.id },
        include: { agency: true },
      });

      if (dbListing && dbListing.isActive) {
        listing = {
          id: dbListing.id,
          title: dbListing.title,
          description: dbListing.description || '',
          propertyType: dbListing.propertyType,
          price: dbListing.price,
          address: dbListing.address,
          city: dbListing.city || '',
          areaSqFt: dbListing.areaSqFt,
          bedrooms: dbListing.bedrooms,
          bathrooms: dbListing.bathrooms,
          contactName: dbListing.contactName,
          contactPhone: dbListing.contactPhone,
          contactEmail: dbListing.contactEmail,
          verifiedProperty: dbListing.verifiedProperty,
          aiExtracted: dbListing.aiExtracted,
          aiConfidence: dbListing.aiConfidence,
          isActive: dbListing.isActive,
          agencyId: dbListing.agencyId,
          agencyName: dbListing.agency?.name || null,
          agencyVerified: dbListing.agency?.verified || false,
          createdAt: dbListing.createdAt.toISOString(),
        };
      }
    }
  } catch (err) {
    console.error('Error loading listing from Prisma:', err);
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="text-center flex flex-col gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md shadow-2xl">
          <span className="text-4xl">🔍</span>
          <h1 className="text-xl font-bold text-slate-100">Listing Not Found</h1>
          <p className="text-xs text-slate-400">
            This property listing does not exist or has been archived.
          </p>
          <Link
            href="/marketplace"
            className="mt-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl transition"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  return <ListingDetailClient listing={listing} />;
}
