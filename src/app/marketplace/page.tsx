'use client';
// src/app/marketplace/page.tsx

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import VerifiedBadge, { VerificationTier } from '@/components/VerifiedBadge';
import { useCurrency } from '@/components/CurrencyContext';
import { Heart } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  propertyType: string;
  purpose?: string;
  price: number;
  address: string;
  city: string;
  areaSqFt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images?: string[];
  videoUrl?: string | null;
  panoramaUrl?: string | null;
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
  HOUSE: '🏠', APARTMENT: '🏢', PLOT: '🗺️', COMMERCIAL: '🏪', VILLA: '🏯',
};

function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/')
  );
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const { formatPrice } = useCurrency();
  const { data: session } = useSession();

  // Saved listings set (publicListingId values)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  // Check if current user can save listings (any logged-in user or investor)
  const canSave = Boolean(session?.user);

  // Fetch already-saved listings on mount
  useEffect(() => {
    if (!canSave) return;
    fetch('/api/saved-listings')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.saved)) {
          setSavedIds(new Set(d.saved.map((s: { publicListingId?: string }) => s.publicListingId).filter(Boolean)));
        }
      })
      .catch(() => {});
  }, [canSave]);

  const toggleSave = async (e: React.MouseEvent, listingId: string) => {
    e.preventDefault(); // stop Link navigation
    e.stopPropagation();
    if (!session) return;
    setSavingId(listingId);
    try {
      if (savedIds.has(listingId)) {
        // Unsave
        await fetch(`/api/saved-listings?publicListingId=${listingId}`, { method: 'DELETE' });
        setSavedIds(prev => { const n = new Set(prev); n.delete(listingId); return n; });
      } else {
        // Save
        await fetch('/api/saved-listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicListingId: listingId }),
        });
        setSavedIds(prev => new Set(Array.from(prev).concat(listingId)));
      }
    } catch {
      // silent
    } finally {
      setSavingId(null);
    }
  };

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
            <p className="text-xs text-slate-300 mt-1">Verified properties from trusted owners &amp; partner agencies</p>
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
          <div className="text-center py-16 text-slate-500 text-sm flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <span className="text-4xl">🏠</span>
            <div>
              <p className="font-bold text-slate-800 text-base">No properties registered yet</p>
              <p className="text-xs text-slate-500 mt-1">Be the first to list a verified property or broadcast an investment asset.</p>
            </div>
            <Link
              href="/agency/submit-listing"
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
            >
              + List First Property
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{listings.length} Properties Available</p>
              <span className="text-xs text-emerald-700 font-bold">✓ Live Escrow Protection Active</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {listings.map((lst) => {
                const validImages = (lst.images || []).filter(isValidImageUrl);
                return (
                  <Link
                    key={lst.id}
                    href={`/marketplace/${lst.id}`}
                    className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-200 group"
                  >
                    {/* Left Column: Image Thumbnail & Title & Location */}
                    <div className="flex items-start gap-4">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 shadow-sm">
                        {validImages.length > 0 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={validImages[0]}
                            alt={lst.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {TYPE_ICONS[lst.propertyType.toUpperCase()] ?? '🏠'}
                          </div>
                        )}
                        {validImages.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            +{validImages.length}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {lst.propertyType}
                          </span>
                          {lst.aiExtracted && (
                            <span className="text-[10px] bg-emerald-100 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              AI Extracted
                            </span>
                          )}
                          {lst.panoramaUrl && (
                            <span className="text-[10px] bg-teal-100 border border-teal-300 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                              360° Tour
                            </span>
                          )}
                          {lst.videoUrl && (
                            <span className="text-[10px] bg-purple-100 border border-purple-300 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                              Video
                            </span>
                          )}
                        </div>
                        <h2 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug truncate">
                          {lst.title}
                        </h2>
                        <span className="text-xs text-slate-500 font-medium truncate">
                          {lst.address}{lst.city ? `, ${lst.city}` : ''}
                        </span>

                        {/* Badges row */}
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                          <VerifiedBadge type="PROPERTY" verified={lst.verifiedProperty} />
                          {lst.agencyName && (
                            <span className="text-[11px] flex items-center gap-1 text-slate-600 font-semibold truncate">
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
                      <div className="flex items-center gap-2">
                        {canSave && (
                          <button
                            id={`save-listing-${lst.id}`}
                            onClick={(e) => toggleSave(e, lst.id)}
                            disabled={savingId === lst.id}
                            title={savedIds.has(lst.id) ? 'Remove from Investor Dashboard' : 'Save to Investor Dashboard'}
                            className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                              savedIds.has(lst.id)
                                ? 'bg-rose-50 border-rose-300 text-rose-500 hover:bg-rose-100'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-400'
                            } ${savingId === lst.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <Heart
                              className={`w-4 h-4 transition-all ${savedIds.has(lst.id) ? 'fill-rose-500' : ''}`}
                            />
                          </button>
                        )}
                        <span className="text-xs bg-emerald-600 group-hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition shadow">
                          View Listing →
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
