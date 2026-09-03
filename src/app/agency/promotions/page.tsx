// src/app/agency/promotions/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import AdsManagerPanel from '@/components/AdsManagerPanel';
import { ArrowLeft } from 'lucide-react';

interface AgencyListingSummary {
  id: string;
  title: string;
  image: string | null;
  city?: string | null;
  price?: number | null;
}

export default function AgencyPromotionsPage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState<AgencyListingSummary[]>([]);

  useEffect(() => {
    const fetchAgencyProperties = async () => {
      try {
        const res = await fetch('/api/properties');
        const data = await res.json();
        if (data?.success && Array.isArray(data.properties)) {
          setListings(
            data.properties.map((p: Record<string, unknown>) => ({
              id: String(p.id),
              title: String(p.title),
              image: Array.isArray(p.images) && p.images.length > 0 ? (p.images[0] as string) : null,
              city: typeof p.city === 'string' ? p.city : null,
              price: typeof p.price === 'number' ? p.price : null,
            }))
          );
        }
      } catch (err) {
        console.warn('Could not fetch listings for ads manager:', err);
      }
    };

    fetchAgencyProperties();
  }, []);

  return (
    <main className="min-h-screen bg-[#070b14] text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/agency/dashboard"
            className="text-xs font-bold text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Agency Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Agency:</span>
            <strong className="text-white font-bold">{session?.user?.agencyName || 'Your Agency'}</strong>
          </div>
        </div>

        {/* Ads Manager Panel */}
        <AdsManagerPanel availableListings={listings} isAgency={true} />
      </div>
    </main>
  );
}
