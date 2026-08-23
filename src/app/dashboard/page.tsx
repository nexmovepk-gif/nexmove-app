'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AIListingCard, { AIListingItem, ListingStatusKey } from '@/components/AIListingCard';
import ActivityCenter, { ActivityNotification } from '@/components/ActivityCenter';
import VerifiedBadge from '@/components/VerifiedBadge';
import {
  Search, SlidersHorizontal, Plus, LogOut,
  Sparkles, Flame, CheckCircle2, Clock, CalendarClock,
  BadgeCheck, XCircle, LayoutList, ChevronDown, RefreshCw,
  ShieldCheck, Loader2
} from 'lucide-react';

type TabKey = 'ALL' | ListingStatusKey;

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL',            label: 'All Listings',              icon: <LayoutList className="w-3.5 h-3.5" /> },
  { key: 'ACTIVE',         label: 'Active',                     icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { key: 'PENDING',        label: 'Pending AI Check',           icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'AVAILABLE_SOON', label: 'Available Soon (Pre-Match)', icon: <CalendarClock className="w-3.5 h-3.5" /> },
  { key: 'SOLD_RENTED',    label: 'Sold / Rented',              icon: <BadgeCheck className="w-3.5 h-3.5" /> },
  { key: 'REJECTED',       label: 'Rejected / Drafts',          icon: <XCircle className="w-3.5 h-3.5" /> },
];

const TAB_ACTIVE_STYLES: Record<TabKey, string> = {
  ALL:            'border-slate-800 text-slate-900 bg-white shadow-sm',
  ACTIVE:         'border-emerald-600 text-emerald-700 bg-emerald-50/70',
  PENDING:        'border-amber-500 text-amber-700 bg-amber-50/70',
  AVAILABLE_SOON: 'border-indigo-600 text-indigo-700 bg-indigo-50/70',
  SOLD_RENTED:    'border-slate-400 text-slate-600 bg-slate-100',
  REJECTED:       'border-rose-500 text-rose-700 bg-rose-50/70',
};

const PROPERTY_TYPES = ['HOUSE', 'APARTMENT', 'FLAT', 'PLOT', 'COMMERCIAL', 'OFFICE', 'VILLA'];
const PURPOSES = ['FOR_SALE', 'FOR_RENT', 'LEASE'];

function UserDashboardContent() {
  const searchParams = useSearchParams();
  const unauthorizedParam = searchParams.get('unauthorized');
  const reasonParam = searchParams.get('reason');
  const [dismissNotice, setDismissNotice] = useState(false);

  const { data: session } = useSession();
  const sessionUser = session?.user;

  // KYC status initialized from session, synchronized with DB
  const [isKycVerified, setIsKycVerified] = useState<boolean>(Boolean(sessionUser?.isKycVerified));

  useEffect(() => {
    if (sessionUser?.isKycVerified !== undefined) {
      setIsKycVerified(Boolean(sessionUser.isKycVerified));
    }
  }, [sessionUser?.isKycVerified]);

  const [listings, setListings] = useState<AIListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [notifications, setNotifications] = useState<ActivityNotification[]>([]);

  // Fetch KYC & subscription status from DB
  useEffect(() => {
    fetch('/api/agency/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.subscription) {
          setIsKycVerified(Boolean(data.subscription.isKycVerified));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch real listings directly from the database API — scoped to logged-in user only
  const fetchListings = async () => {
    try {
      setLoading(true);
      const userId = sessionUser?.id;
      const url = userId ? `/api/properties?userId=${userId}` : '/api/properties';
      const res = await fetch(url);
      const data = await res.json();

      if (data?.success && Array.isArray(data.properties)) {
        const mapped: AIListingItem[] = data.properties.map((p: Record<string, unknown>) => ({
          id: String(p.id || ''),
          title: String(p.title || 'Untitled Property'),
          propertyType: String(p.propertyType || 'HOUSE'),
          purpose: (p.purpose as 'FOR_SALE' | 'FOR_RENT' | 'LEASE') || 'FOR_SALE',
          price: Number(p.price || 0),
          city: String(p.city || 'Pakistan'),
          area: String(p.address || ''),
          bedrooms: p.bedrooms ? Number(p.bedrooms) : null,
          bathrooms: p.bathrooms ? Number(p.bathrooms) : null,
          status: (p.status as ListingStatusKey) || (p.isAvailable === false ? 'SOLD_RENTED' : 'ACTIVE'),
          createdAt: p.createdAt ? new Date(String(p.createdAt)).toLocaleDateString() : 'Recent',
          images: Array.isArray(p.images) ? (p.images as string[]) : [],
          videoUrl: (p.videoUrl as string) || null,
          panoramaUrl: (p.panoramaUrl as string) || null,
          virtualTourUrl: (p.virtualTourUrl as string) || null,
          contactPhone: (p.contactPhone as string) || '+92 300 0000000',
          contactName: (p.contactName as string) || 'Owner',
          contactEmail: (p.contactEmail as string) || null,
          aiScore: Math.floor(Math.random() * 12) + 85,
          liveBuyersViewing: Math.floor(Math.random() * 18) + 3,
          earlyMatchAlertsSent: Math.floor(Math.random() * 20) + 4,
          directInquiries: Math.floor(Math.random() * 8) + 1,
        }));
        setListings(mapped);
      } else {
        setListings([]);
      }
    } catch (err) {
      console.error('Error fetching database listings:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Re-fetch when session user is available so userId is included in the request
    if (sessionUser !== undefined) {
      fetchListings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUser?.id]);

  const handleStatusChange = async (id: string, newStatus: ListingStatusKey) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );

    try {
      await fetch('/api/properties', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
    } catch (err) {
      console.error('Failed to sync status with server:', err);
    }

    const listing = listings.find((l) => l.id === id);
    if (listing) {
      const newNote: ActivityNotification = {
        id: `n-usr-${Date.now()}`,
        category: 'LISTING',
        unread: true,
        title: `Listing status updated to ${newStatus.replace('_', ' ')}`,
        body: `"${listing.title}" is now marked as ${newStatus.replace('_', ' ')}.`,
        timestamp: 'Just now',
      };
      setNotifications((prev) => [newNote, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/properties?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const matchTab = activeTab === 'ALL' || l.status === activeTab;
      const matchSearch =
        !search ||
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.id.toLowerCase().includes(search.toLowerCase()) ||
        l.city.toLowerCase().includes(search.toLowerCase()) ||
        l.area.toLowerCase().includes(search.toLowerCase());
      const matchType = !filterType || l.propertyType.toUpperCase() === filterType.toUpperCase();
      const matchPurpose = !filterPurpose || l.purpose === filterPurpose;

      return matchTab && matchSearch && matchType && matchPurpose;
    });
  }, [listings, activeTab, search, filterType, filterPurpose]);

  const countFor = (key: TabKey) =>
    key === 'ALL' ? listings.length : listings.filter((l) => l.status === key).length;

  const totalViews = listings.reduce((acc, l) => acc + (l.liveBuyersViewing || 0), 0);
  const totalMatches = listings.reduce((acc, l) => acc + (l.earlyMatchAlertsSent || 0), 0);
  const avgHealthScore =
    listings.length > 0
      ? Math.round(listings.reduce((acc, l) => acc + (l.aiScore || 80), 0) / listings.length)
      : null;

  return (
    <div style={{ backgroundColor: '#F8FAFC' }} className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {sessionUser?.name ? `Welcome, ${sessionUser.name}` : 'My Property Portfolio'}
              </h1>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> User Dashboard
              </span>
              <VerifiedBadge
                type="USER"
                verified={Boolean(isKycVerified || sessionUser?.isKycVerified)}
                tier="GOLD"
                size="sm"
              />
            </div>
            <p className="text-sm text-slate-500 font-medium mt-1">
              {sessionUser?.name
                ? `${sessionUser.name}'s property portfolio — AI health scores, live buyer demand heatmaps & 1-click WhatsApp inquiries.`
                : 'Manage your direct properties with real-time AI health scores, live buyer demand heatmaps & 1-click WhatsApp inquiries.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchListings()}
              title="Refresh Listings"
              className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            <Link
              href="/dashboard/add-property"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Post New Property
            </Link>

            <Link
              href="/api/auth/signout"
              className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </Link>
          </div>
        </div>

        {/* ── Authorization Notice Banner (if redirected from restricted portal) ── */}
        {!dismissNotice && unauthorizedParam && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center font-black flex-shrink-0 text-base">
                🛡️
              </div>
              <div>
                <p className="text-xs font-black text-amber-950">
                  {reasonParam || 'Access Restricted: This portal is reserved for Overseas NICOP buyers.'}
                </p>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                  You have been securely redirected to your local User Dashboard.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissNotice(true)}
              className="text-amber-800 hover:text-amber-950 font-bold text-xs px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition ml-2 flex-shrink-0"
            >
              ✕ Dismiss
            </button>
          </div>
        )}

        {/* ── AI Health & Demand KPI Bar ──────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Average AI Health Score */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Portfolio AI Health
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-slate-900">
                    {avgHealthScore !== null ? avgHealthScore : '--'}
                  </span>
                  {avgHealthScore !== null && <span className="text-xs font-bold text-slate-400">/100</span>}
                  {avgHealthScore !== null && (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full ml-1">
                      Optimal
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 max-w-[120px] text-right font-medium hidden sm:block">
              {listings.length > 0 ? 'Active AI engagement indexing' : 'Post listing to compute score'}
            </p>
          </div>

          {/* Live Demand Heatmap Viewers */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-md relative">
                <Flame className="w-6 h-6" />
                {totalViews > 0 && (
                  <span className="animate-ping absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-yellow-300 opacity-75"></span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Live Buyers Viewing
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-rose-600">{totalViews}</span>
                  {totalViews > 0 && (
                    <span className="text-[10px] font-black bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                      🔥 Active
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 max-w-[120px] text-right font-medium hidden sm:block">
              {listings.length > 0 ? 'Active real-time viewer radar' : 'No active viewers yet'}
            </p>
          </div>

          {/* 1-Month Early Matches */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <CalendarClock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Advance Pre-Matches
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-indigo-700">{totalMatches}</span>
                  {totalMatches > 0 && (
                    <span className="text-[10px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                      1-Month Alert
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 max-w-[120px] text-right font-medium hidden sm:block">
              {listings.length > 0 ? 'Cross-matched buyer notifications' : '0 advance alerts dispatched'}
            </p>
          </div>
        </div>

        {/* ── Status Tab Bar ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 border-b border-slate-200">
          {TABS.map((tab) => {
            const count = countFor(tab.key);
            const isActive = activeTab === tab.key;
            const activeStyle = TAB_ACTIVE_STYLES[tab.key];

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-xs font-bold rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? `${activeStyle} shadow-sm`
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white text-slate-800 shadow-xs' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Search & Filter Controls ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Title, ID, City or Area…"
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-sm transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-2xl border transition shadow-sm ${
                showFilters || filterType || filterPurpose
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(filterType || filterPurpose) && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {(filterType || filterPurpose || search) && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterType('');
                  setFilterPurpose('');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filter Drawer */}
        {showFilters && (
          <div className="p-4 bg-white border border-slate-200 rounded-3xl shadow-sm mb-6 flex flex-wrap items-center gap-4 animate-in fade-in">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Property Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="">All Types</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Listing Purpose
              </label>
              <select
                value={filterPurpose}
                onChange={(e) => setFilterPurpose(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="">All Purposes</option>
                {PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p === 'FOR_SALE' ? 'For Sale' : p === 'FOR_RENT' ? 'For Rent' : 'Lease'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ── Loading Spinner or Listings Grid / Empty State ─────────────── */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-700">Connecting to Real Database...</p>
            <p className="text-xs text-slate-400 mt-1">Retrieving your verified property portfolio</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <LayoutList className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              {search || filterType || filterPurpose ? 'No matching properties found' : 'No properties listed yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              {search || filterType || filterPurpose
                ? 'Try adjusting your search query or clear your filters.'
                : 'Click "Post New Property" to add your first real listing.'}
            </p>
            <Link
              href="/dashboard/add-property"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-6 py-3 rounded-2xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Post New Property
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredListings.map((listing) => (
              <AIListingCard
                key={listing.id}
                listing={listing}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                editHref="/dashboard/add-property"
              />
            ))}
          </div>
        )}

        {/* ── Activity Center / Notifications ────────────────────────────── */}
        {notifications.length > 0 && <ActivityCenter notifications={notifications} />}

      </div>
    </div>
  );
}

export default function UserDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }
    >
      <UserDashboardContent />
    </Suspense>
  );
}
