'use client';
// src/app/marketplace/page.tsx

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import VerifiedBadge, { VerificationTier } from '@/components/VerifiedBadge';
import { useCurrency } from '@/components/CurrencyContext';
import FeaturedSponsoredSection from '@/components/FeaturedSponsoredSection';
import {
  Heart,
  SlidersHorizontal,
  RotateCcw,
  Building2,
  Home,
  Search,
  ShieldCheck,
  BedDouble,
  MapPin,
  X,
  ArrowUpDown,
  Tag,
} from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description?: string;
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

const PURPOSE_OPTIONS = [
  { label: 'All Listings', value: '' },
  { label: 'For Sale (Buy)', value: 'FOR_SALE' },
  { label: 'For Rent', value: 'FOR_RENT' },
  { label: 'Lease', value: 'LEASE' },
  { label: 'Investment', value: 'INVESTMENT' },
];

const PROPERTY_TYPE_GROUPS = [
  {
    group: 'Homes & Living',
    types: [
      'House',
      'Flat / Apartment',
      'Upper Portion',
      'Lower Portion',
      'Penthouse',
      'Farm House',
      'Room',
      'Studio Apartment',
      'Villa',
    ],
  },
  {
    group: 'Plots & Land',
    types: [
      'Residential Plot',
      'Commercial Plot',
      'Agricultural Land',
      'Industrial Land',
      'Plot File',
      'Plot Form',
    ],
  },
  {
    group: 'Commercial & Industrial',
    types: [
      'Office',
      'Running Office',
      'Shop',
      'Commercial Building',
      'Warehouse / Godown',
      'Factory',
      'Plaza',
    ],
  },
  {
    group: 'Other',
    types: ['Other'],
  },
];

const BEDROOM_OPTIONS = [
  { label: 'Any Beds', value: '' },
  { label: 'Studio', value: '0' },
  { label: '1 Bed', value: '1' },
  { label: '2 Beds', value: '2' },
  { label: '3 Beds', value: '3' },
  { label: '4 Beds', value: '4' },
  { label: '5 Beds', value: '5' },
  { label: '6+ Beds', value: '6' },
];

const POPULAR_CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Multan', 'Faisalabad'];

const PRICE_PRESETS_PKR = [
  { label: 'All Budgets', min: '', max: '' },
  { label: '< 50 Lac', min: '', max: '5000000' },
  { label: '50 Lac - 1 Cr', min: '5000000', max: '10000000' },
  { label: '1 Cr - 3 Cr', min: '10000000', max: '30000000' },
  { label: '3 Cr - 10 Cr', min: '30000000', max: '100000000' },
  { label: '10 Cr+', min: '100000000', max: '' },
];

const PRICE_PRESETS_USD = [
  { label: 'All Budgets', min: '', max: '' },
  { label: '< $25k', min: '', max: '25000' },
  { label: '$25k - $50k', min: '25000', max: '50000' },
  { label: '$50k - $100k', min: '50000', max: '100000' },
  { label: '$100k - $250k', min: '100000', max: '250000' },
  { label: '$250k+', min: '250000', max: '' },
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

  // Filters State
  const [filterPurpose, setFilterPurpose] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterBeds, setFilterBeds] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { formatPrice, liveRates } = useCurrency();
  const { data: session } = useSession();

  const usdRate = liveRates?.USD && liveRates.USD > 0 ? liveRates.USD : 276.3;

  // Saved listings set
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const canSave = Boolean(session?.user);

  useEffect(() => {
    if (!canSave) return;
    fetch('/api/saved-listings')
      .then((r) => r.json())
      .then((d) => {
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
    e.preventDefault();
    e.stopPropagation();
    if (!session) return;
    setSavingId(listingId);
    try {
      if (savedIds.has(listingId)) {
        const res = await fetch(`/api/saved-listings?listingId=${encodeURIComponent(listingId)}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setSavedIds((prev) => {
            const n = new Set(prev);
            n.delete(listingId);
            return n;
          });
        }
      } else {
        const res = await fetch('/api/saved-listings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId }),
        });
        const d = await res.json();
        if (res.ok && d.success) {
          setSavedIds((prev) => new Set(Array.from(prev).concat(listingId)));
        }
      }
    } catch (err) {
      console.error('Save listing error:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Convert inputs to PKR for database API
  const minPriceInPKR = useMemo(() => {
    if (!minPrice || Number(minPrice) <= 0) return '';
    return filterCurrency === 'USD' ? Math.round(Number(minPrice) * usdRate).toString() : minPrice;
  }, [minPrice, filterCurrency, usdRate]);

  const maxPriceInPKR = useMemo(() => {
    if (!maxPrice || Number(maxPrice) <= 0) return '';
    return filterCurrency === 'USD' ? Math.round(Number(maxPrice) * usdRate).toString() : maxPrice;
  }, [maxPrice, filterCurrency, usdRate]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPurpose && filterPurpose !== 'INVESTMENT') params.set('purpose', filterPurpose);
      if (filterType) params.set('type', filterType);
      if (searchQuery) params.set('search', searchQuery);
      if (filterCity) params.set('city', filterCity);
      if (minPriceInPKR) params.set('minPrice', minPriceInPKR);
      if (maxPriceInPKR) params.set('maxPrice', maxPriceInPKR);
      if (filterBeds && filterBeds !== '0') params.set('minBeds', filterBeds);
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
  }, [filterPurpose, filterType, searchQuery, filterCity, minPriceInPKR, maxPriceInPKR, filterBeds, sortBy, verifiedOnly]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  // Client-side filtering & sorting for instant responsiveness
  const filteredListings = useMemo(() => {
    const minP = minPriceInPKR ? Number(minPriceInPKR) : 0;
    const maxP = maxPriceInPKR ? Number(maxPriceInPKR) : Infinity;

    return listings
      .filter((lst) => {
        // Purpose
        if (filterPurpose === 'INVESTMENT') {
          // Highlight properties flagged for investment or general inventory
          const isInvest = (lst.purpose || '').toUpperCase() === 'INVESTMENT' || (lst.price && lst.price > 20000000);
          if (!isInvest && lst.purpose && lst.purpose !== 'FOR_SALE') return false;
        } else if (filterPurpose) {
          if ((lst.purpose || 'FOR_SALE').toUpperCase() !== filterPurpose.toUpperCase()) {
            return false;
          }
        }

        // Price
        const price = lst.price || 0;
        if (minP > 0 && price < minP) return false;
        if (maxP < Infinity && price > maxP) return false;

        // Property Type
        if (filterType) {
          const pType = (lst.propertyType || '').toLowerCase();
          const target = filterType.toLowerCase();
          if (!pType.includes(target) && !target.includes(pType)) {
            return false;
          }
        }

        // Custom Keyword / Manual Search (title, description, address, type)
        if (searchQuery) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            (lst.title || '').toLowerCase().includes(q) ||
            (lst.propertyType || '').toLowerCase().includes(q) ||
            (lst.address || '').toLowerCase().includes(q) ||
            (lst.city || '').toLowerCase().includes(q) ||
            (lst.description || '').toLowerCase().includes(q);
          if (!matches) return false;
        }

        // City
        if (filterCity) {
          const targetCity = filterCity.toLowerCase().trim();
          if (!lst.city || !lst.city.toLowerCase().includes(targetCity)) {
            return false;
          }
        }

        // Bedrooms
        if (filterBeds) {
          if (filterBeds === '0') {
            const isStudio =
              lst.bedrooms === 0 ||
              (lst.propertyType || '').toLowerCase().includes('studio') ||
              (lst.title || '').toLowerCase().includes('studio');
            if (!isStudio) return false;
          } else if (filterBeds === '6') {
            if ((lst.bedrooms || 0) < 6) return false;
          } else {
            if (lst.bedrooms !== Number(filterBeds)) return false;
          }
        }

        // Verified Only
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
  }, [listings, filterPurpose, filterType, searchQuery, filterCity, filterBeds, minPriceInPKR, maxPriceInPKR, verifiedOnly, sortBy]);

  const hasActiveFilters = Boolean(
    filterPurpose ||
      filterType ||
      searchQuery ||
      filterCity ||
      filterBeds ||
      minPrice ||
      maxPrice ||
      sortBy !== 'newest' ||
      verifiedOnly
  );

  const handleResetFilters = () => {
    setFilterPurpose('');
    setFilterType('');
    setSearchQuery('');
    setFilterCity('');
    setFilterBeds('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setVerifiedOnly(false);
  };

  const currentPresets = filterCurrency === 'USD' ? PRICE_PRESETS_USD : PRICE_PRESETS_PKR;

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
        {/* Comprehensive Filters Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 sm:p-6 flex flex-col gap-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Filter Marketplace Listings</span>
            </h2>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline flex items-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Reset All Filters
              </button>
            )}
          </div>

          {/* 1. Purpose Segmented Filter (Buy, Rent, Lease, Investment) */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Property Purpose</span>
            <div className="flex flex-wrap gap-1.5">
              {PURPOSE_OPTIONS.map((opt) => {
                const isActive = filterPurpose === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterPurpose(opt.value)}
                    className={`text-xs px-3.5 py-1.5 rounded-xl font-bold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Primary Inputs: Type, Custom Keyword, City, and Sort By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Property Type Dropdown */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-type" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Property Type
              </label>
              <select
                id="filter-type"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                <option value="">All Property Types</option>
                {PROPERTY_TYPE_GROUPS.map((grp) => (
                  <optgroup key={grp.group} label={grp.group}>
                    {grp.types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Custom Manual / Keyword Search */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-custom-type" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Custom Keyword / Type
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="filter-custom-type"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Running office, shop..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* City / Location */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-city" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                City / Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="filter-city"
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="e.g. Lahore, Karachi..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500 transition"
                />
                {filterCity && (
                  <button
                    type="button"
                    onClick={() => setFilterCity('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Order (Newest, Low to High, High to Low) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="filter-sort" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3 text-slate-400" /> Sort By
              </label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc')}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer"
              >
                <option value="newest">Newest Added</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Quick Popular Cities Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <span className="text-slate-400 font-semibold whitespace-nowrap">Popular Cities:</span>
            <button
              type="button"
              onClick={() => setFilterCity('')}
              className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                filterCity === ''
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              All Cities
            </button>
            {POPULAR_CITIES.map((c) => {
              const isSelected = filterCity.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterCity(isSelected ? '' : c)}
                  className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* 3. Bedrooms Selector */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5 text-slate-400" /> Bedrooms / Rooms
              </span>
              {filterBeds && (
                <button
                  type="button"
                  onClick={() => setFilterBeds('')}
                  className="text-[10px] text-emerald-700 hover:underline font-bold cursor-pointer"
                >
                  Clear Beds
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BEDROOM_OPTIONS.map((opt) => {
                const isActive = filterBeds === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterBeds(opt.value)}
                    className={`text-xs px-3 py-1 rounded-xl font-bold border transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Price Range Section (PKR or USD with Dynamic Chips) */}
          <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Price Range ({filterCurrency}):
                </span>
                {(minPrice || maxPrice) && (
                  <span className="text-[10px] text-emerald-800 font-mono font-bold bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    {filterCurrency === 'USD' ? '$' : 'Rs'}{' '}
                    {minPrice ? Number(minPrice).toLocaleString() : '0'} —{' '}
                    {maxPrice ? `${filterCurrency === 'USD' ? '$' : 'Rs'} ${Number(maxPrice).toLocaleString()}` : 'Any'}
                  </span>
                )}
              </div>

              {/* Currency Toggle Switcher (PKR vs USD) */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                <span className="text-[10px] text-slate-400 font-bold px-1.5">Currency:</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCurrency('PKR');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg transition cursor-pointer ${
                    filterCurrency === 'PKR'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PKR (Rs)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCurrency('USD');
                    setMinPrice('');
                    setMaxPrice('');
                  }}
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg transition cursor-pointer ${
                    filterCurrency === 'USD'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>

            {/* Quick Budget Chips for Selected Currency */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {currentPresets.map((p) => {
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

            {/* Custom Min & Max Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                  {filterCurrency === 'USD' ? '$' : 'Rs'} Min:
                </span>
                <input
                  type="number"
                  min="0"
                  step={filterCurrency === 'USD' ? '500' : '50000'}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder={filterCurrency === 'USD' ? 'e.g. 25,000' : 'e.g. 500,000'}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-16 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono transition"
                />
                {minPrice && (
                  <button
                    type="button"
                    onClick={() => setMinPrice('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                    title="Clear min price"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                  {filterCurrency === 'USD' ? '$' : 'Rs'} Max:
                </span>
                <input
                  type="number"
                  min="0"
                  step={filterCurrency === 'USD' ? '500' : '50000'}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder={filterCurrency === 'USD' ? 'e.g. 100,000' : 'e.g. 50,000,000'}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-16 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono transition"
                />
                {maxPrice && (
                  <button
                    type="button"
                    onClick={() => setMaxPrice('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
                    title="Clear max price"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 5. Bottom Controls: Verified Only Toggle & Results Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={verifiedOnly}
                onClick={() => setVerifiedOnly(!verifiedOnly)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  verifiedOnly ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    verifiedOnly ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-xs text-slate-700 font-medium cursor-pointer" onClick={() => setVerifiedOnly(!verifiedOnly)}>
                Verified properties only
              </span>
            </div>

            <span className="text-[11px] font-bold text-slate-500">
              Matching Results: <strong className="text-emerald-700 font-mono">{filteredListings.length}</strong> listings
            </span>
          </div>
        </div>

        {/* Sponsored & Featured Top Results */}
        <FeaturedSponsoredSection placement="SEARCH_TOP" city={filterCity || undefined} limit={3} />

        {/* Results Stream */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-3">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            Loading marketplace listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Home className="w-7 h-7 text-slate-400" />
            </div>
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
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Search className="w-7 h-7 text-slate-400" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">No properties found matching your filters</p>
              <p className="text-xs text-slate-500 mt-1">Try widening your price range or clearing city, type, or bedroom filters.</p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{filteredListings.length} Properties Available</p>
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Live Escrow Protection Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredListings.map((lst) => {
                const validImages = (lst.images || []).filter(isValidImageUrl);
                const purposeLabel =
                  lst.purpose === 'FOR_RENT'
                    ? 'For Rent'
                    : lst.purpose === 'LEASE'
                    ? 'Lease'
                    : lst.purpose === 'INVESTMENT'
                    ? 'Investment'
                    : 'For Sale';

                return (
                  <Link
                    key={lst.id}
                    href={`/marketplace/${lst.id}`}
                    className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-200 group"
                  >
                    {/* Left Column: Image Thumbnail & Specs */}
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
                          <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <Building2 className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                        {validImages.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            +{validImages.length}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${
                              lst.purpose === 'FOR_RENT'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : lst.purpose === 'LEASE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {purposeLabel}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            {lst.propertyType}
                          </span>
                          {lst.bedrooms != null && lst.bedrooms > 0 && (
                            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                              <BedDouble className="w-3 h-3" /> {lst.bedrooms} {lst.bedrooms === 1 ? 'Bed' : 'Beds'}
                            </span>
                          )}
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
                        <span className="text-xs text-slate-500 font-medium truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 flex-shrink-0 text-slate-400" />
                          {lst.address}
                          {lst.city ? `, ${lst.city}` : ''}
                        </span>

                        {/* Verification & Agency details */}
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
                            type="button"
                            onClick={(e) => toggleSave(e, lst.id)}
                            disabled={savingId === lst.id}
                            title={savedIds.has(lst.id) ? 'Remove from Investor Dashboard' : 'Save to Investor Dashboard'}
                            className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                              savedIds.has(lst.id)
                                ? 'bg-rose-50 border-rose-300 text-rose-500 hover:bg-rose-100'
                                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-400'
                            } ${savingId === lst.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <Heart className={`w-4 h-4 transition-all ${savedIds.has(lst.id) ? 'fill-rose-500' : ''}`} />
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
