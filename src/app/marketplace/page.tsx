'use client';
// src/app/marketplace/page.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import VerifiedBadge, { VerificationTier } from '@/components/VerifiedBadge';
import { useCurrency } from '@/components/CurrencyContext';
import FeaturedSponsoredSection from '@/components/FeaturedSponsoredSection';
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

const PRICE_PRESETS = [
  { label: 'All Budgets', min: '', max: '' },
  { label: '< 50 Lac', min: '', max: '5000000' },
  { label: '50 Lac - 1 Cr', min: '5000000', max: '10000000' },
  { label: '1 Cr - 3 Cr', min: '10000000', max: '30000000' },
  { label: '3 Cr - 10 Cr', min: '30000000', max: '100000000' },
  { label: '10 Cr+', min: '100000000', max: '' },
];

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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
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
          const ids = d.saved
            .map((s: { publicListingId?: string; propertyId?: string }) => s.publicListingId || s.propertyId)
            .filter(Boolean) as string[];
          setSavedIds(new Set(ids));
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
        const res = await fetch(`/api/saved-listings?listingId=${encodeURIComponent(listingId)}`, { method: 'DELETE' });
        if (res.ok) {
          setSavedIds(prev => { const n = new Set(prev); n.delete(listingId); return n; });
        }
      } else {
        // Save
        const res = await fetch('/api/saved-listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        });
        const d = await res.json();
        if (res.ok && d.success) {
          setSavedIds(prev => new Set(Array.from(prev).concat(listingId)));
        }
      }
    } catch (err) {
      console.error('Save listing error:', err);
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
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (sortBy) params.set('sortBy', sortBy);
      if (verifiedOnly) params.set('verifiedOnly', 'true');
      const res = await fetch(`/api/public/listings?${params.toString()}`);
      const data = await res.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterCity, minPrice, maxPrice, sortBy, verifiedOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  // Instant client-side filtering and sorting for instant responsiveness
  const filteredListings = useMemo(() => {
    return listings
      .filter((lst) => {
        if (minPrice && Number(minPrice) > 0) {
          if ((lst.price || 0) < Number(minPrice)) return false;
        }
        if (maxPrice && Number(maxPrice) > 0) {
          if ((lst.price || 0) > Number(maxPrice)) return false;
        }
        if (filterType && lst.propertyType?.toUpperCase() !== filterType.toUpperCase()) {
          return false;
        }
        if (filterCity && lst.city && !lst.city.toLowerCase().includes(filterCity.toLowerCase().trim())) {
          return false;
        }
        if (verifiedOnly && !lst.verifiedProperty) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return (a.price || 0) - (b.price || 0);
        if (sortBy === 'price-desc') return (b.price || 0) - (a.price || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [listings, minPrice, maxPrice, filterType, filterCity, verifiedOnly, sortBy]);

  const hasActiveFilters = Boolean(
    filterType || filterCity || minPrice || maxPrice || sortBy !== 'newest' || verifiedOnly
  );

  const handleResetFilters = () => {
    setFilterType('');
    setFilterCity('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setVerifiedOnly(false);
  };

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
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>🔍</span>
              <span>Filter Marketplace Listings</span>
            </h2>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 transition cursor-pointer"
              >
                ↺ Reset All Filters
              </button>
            )}
          </div>

          {/* Primary Filters: Type, City, and Sort By */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Property Type */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-type" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Property Type</label>
              <select
                id="filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                <option value="">All Property Types</option>
                {PROPERTY_TYPES.filter(Boolean).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-city" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">City / Location</label>
              <div className="relative">
                <input
                  id="filter-city"
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="Filter by city (e.g. Lahore, Karachi)..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 pr-8 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500 transition"
                />
                {filterCity && (
                  <button
                    onClick={() => setFilterCity('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Sort Order (Newest, Price Low to High, Price High to Low) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-sort" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">⚡ Sort By</label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc')}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                <option value="newest">✨ Newest Added</option>
                <option value="price-asc">💵 Price: Low to High</option>
                <option value="price-desc">💎 Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Price Range Section (Min & Max Price Inputs + Quick Presets) */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3.5 flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                <span>💰 Price Range (PKR):</span>
                {(minPrice || maxPrice) && (
                  <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    {minPrice ? `PKR ${Number(minPrice).toLocaleString()}` : '0'} — {maxPrice ? `PKR ${Number(maxPrice).toLocaleString()}` : 'Any'}
                  </span>
                )}
              </span>

              {/* Quick Budget Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {PRICE_PRESETS.map((p) => {
                  const isActive = minPrice === p.min && maxPrice === p.max;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => {
                        setMinPrice(p.min);
                        setMaxPrice(p.max);
                      }}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Min & Max Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">Min:</span>
                <input
                  type="number"
                  min="0"
                  step="50000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="e.g. 500,000"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono transition"
                />
                {minPrice && (
                  <button
                    onClick={() => setMinPrice('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">Max:</span>
                <input
                  type="number"
                  min="0"
                  step="100000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="e.g. 50,000,000"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono transition"
                />
                {maxPrice && (
                  <button
                    onClick={() => setMaxPrice('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: Verified Toggle & Results Counter */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-2">
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

            <span className="text-[11px] font-bold text-slate-500">
              Matching Results: <strong className="text-emerald-700 font-mono">{filteredListings.length}</strong> listings
            </span>
          </div>
        </div>

        {/* ── Sponsored & Featured Top Results ──────────────────────── */}
        <FeaturedSponsoredSection placement="SEARCH_TOP" city={filterCity || undefined} limit={3} />

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
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <span className="text-4xl">🔍</span>
            <div>
              <p className="font-bold text-slate-800 text-base">No properties found matching your filters</p>
              <p className="text-xs text-slate-500 mt-1">
                Try widening your price range or clearing city/type filters.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{filteredListings.length} Properties Available</p>
              <span className="text-xs text-emerald-700 font-bold">✓ Live Escrow Protection Active</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredListings.map((lst) => {
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
