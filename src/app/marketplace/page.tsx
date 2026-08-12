'use client';
// src/app/marketplace/page.tsx

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import VerifiedBadge, { VerificationTier } from '@/components/VerifiedBadge';
import { useCurrency } from '@/components/CurrencyContext';

interface Listing {
  id: string;
  title: string;
  propertyType: string;
  price: number;
  address: string;
  city: string;
  areaSqFt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  verifiedProperty: boolean;
  aiExtracted: boolean;
  agencyName: string | null;
  agencyVerified: boolean;
  agencyTier?: VerificationTier;
  contactPhoneMasked: string;
  createdAt: string;
}

const PROPERTY_TYPES = ['', 'HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL', 'VILLA'];
const TYPE_ICONS: Record<string, string> = {
  HOUSE: '🏠', APARTMENT: '🏢', PLOT: 'MAP', COMMERCIAL: '🏪', VILLA: '🏯',
};

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const { formatPrice } = useCurrency();

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterCity) params.set('city', filterCity);
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      const res = await fetch(`/api/public/listings?${params.toString()}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCity, verifiedOnly]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white px-4 py-8 border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Verified Marketplace
            </span>
            <h1 className="text-3xl font-black text-white mt-2">Property Marketplace</h1>
            <p className="text-xs text-slate-300 mt-1">Verified properties from trusted owners & partner agencies</p>
          </div>
          <Link
            href="/agency/submit-listing"
            className="self-start sm:self-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
          >
            + List Property
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Filters Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Marketplace Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="">All Property Types</option>
              {PROPERTY_TYPES.filter(Boolean).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <input
              id="filter-city"
              type="text"
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              placeholder="Filter by city (e.g. Dubai, Lahore)..."
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <button
              id="verified-toggle"
              type="button"
              onClick={() => setVerifiedOnly((v) => !v)}
              className={`w-9 h-5 rounded-full relative transition-colors duration-200 focus:outline-none ${verifiedOnly ? 'bg-emerald-600' : 'bg-slate-300'}`}
              role="switch"
              aria-checked={verifiedOnly}
            >
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${verifiedOnly ? 'left-4' : 'left-0.5'}`} />
            </button>
            <span className="text-xs text-slate-700 font-medium">Verified properties only</span>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-3">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            Loading marketplace listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm flex flex-col gap-2 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <span className="text-4xl">🔍</span>
            <p className="font-bold text-slate-800">No properties match your current filters.</p>
            <p className="text-xs text-slate-500">Try broadening your city search or property type filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{listings.length} Properties Available</p>
              <span className="text-xs text-emerald-700 font-bold">✓ Live Escrow Protection Active</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {listings.map((lst) => (
                <Link
                  key={lst.id}
                  href={`/marketplace/${lst.id}`}
                  className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-200 group"
                >
                  {/* Left Column: Title & Location */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                      {TYPE_ICONS[lst.propertyType] ?? '🏠'}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {lst.propertyType}
                        </span>
                        {lst.aiExtracted && (
                          <span className="text-[10px] bg-emerald-100 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            AI Extracted
                          </span>
                        )}
                      </div>
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                        {lst.title}
                      </h2>
                      <span className="text-xs text-slate-500 font-medium">
                        {lst.address}{lst.city ? `, ${lst.city}` : ''}
                      </span>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-2 items-center mt-1">
                        <VerifiedBadge type="PROPERTY" verified={lst.verifiedProperty} />
                        {lst.agencyName && (
                          <span className="text-[11px] flex items-center gap-1 text-slate-600 font-semibold">
                            via {lst.agencyName}
                            {lst.agencyVerified && (
                              <VerifiedBadge type="AGENCY" verified={true} tier={lst.agencyTier ?? 'GOLD'} />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Price & Action */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-2 flex-shrink-0">
                    <span className="text-xl font-black text-emerald-700">{formatPrice(lst.price)}</span>
                    <span className="text-xs bg-emerald-600 group-hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition shadow">
                      View Listing →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
