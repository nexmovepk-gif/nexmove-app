'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ActivityCenter, { ActivityNotification } from '@/components/ActivityCenter';
import VerifiedBadge, { VerificationTier } from '@/components/VerifiedBadge';
import AIEscrowGuard from '@/components/AIEscrowGuard';
import BankTransferCheckoutModal from '@/components/BankTransferCheckoutModal';
import AIListingCard, { AIListingItem, ListingStatusKey } from '@/components/AIListingCard';
import {
  Search, SlidersHorizontal, Plus, LogOut,
  Sparkles, Flame, CheckCircle2, Clock, CalendarClock,
  BadgeCheck, XCircle, LayoutList, ChevronDown, RefreshCw,
  TrendingUp
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

const SEED_AGENCY_LISTINGS: AIListingItem[] = [
  {
    id: 'prop-agy-201',
    title: '2 Kanal Designer Mansion with Pool & Home Cinema',
    propertyType: 'HOUSE',
    purpose: 'FOR_SALE',
    price: 185000000,
    city: 'Lahore',
    area: 'DHA Phase 5, Block K',
    bedrooms: 6,
    bathrooms: 7,
    status: 'ACTIVE',
    createdAt: '1 day ago',
    contactPhone: '+92 300 1234567',
    contactName: 'Apex Realty Management',
    aiScore: 96,
    aiGrade: 'OPTIMAL',
    liveBuyersViewing: 34,
    earlyMatchAlertsSent: 42,
    directInquiries: 18,
    demandIndex: 'HIGH',
    aiSuggestions: [
      '✓ Matterport 3D Tour & 4K Aerial Drone footage indexed',
      '✓ Verified RERA Agency escrow compliance score: 100%',
      '⚡ 42 Overseas Pakistani investors notified in UK & UAE',
    ],
  },
  {
    id: 'prop-agy-202',
    title: 'Commercial Plaza Floor (5,000 Sq Ft Corporate Hub)',
    propertyType: 'COMMERCIAL',
    purpose: 'LEASE',
    price: 1200000,
    city: 'Islamabad',
    area: 'Blue Area, Jinnah Avenue',
    bedrooms: null,
    bathrooms: 4,
    status: 'AVAILABLE_SOON',
    createdAt: '3 days ago',
    availableDate: '2026-09-15',
    contactPhone: '+92 321 8899001',
    contactName: 'Apex Commercial Desk',
    aiScore: 91,
    aiGrade: 'OPTIMAL',
    liveBuyersViewing: 28,
    earlyMatchAlertsSent: 31,
    directInquiries: 11,
    demandIndex: 'HIGH',
    aiSuggestions: [
      '⚡ 1-Month advance corporate match running: 31 MNC tenants notified',
      '📊 Yield index indicates 9.8% annual commercial ROI',
      '🛡️ Automated rent collection ready on Meezan Bank direct debit',
    ],
  },
  {
    id: 'prop-agy-203',
    title: '4-Bed Seafront Luxury Penthouse with Private Jacuzzi',
    propertyType: 'APARTMENT',
    purpose: 'FOR_SALE',
    price: 95000000,
    city: 'Karachi',
    area: 'Clifton Block 4, Waterfront Towers',
    bedrooms: 4,
    bathrooms: 5,
    status: 'PENDING',
    createdAt: 'Just now',
    contactPhone: '+92 333 4455667',
    contactName: 'Apex Karachi Hub',
    aiScore: 74,
    aiGrade: 'GOOD',
    liveBuyersViewing: 12,
    earlyMatchAlertsSent: 15,
    directInquiries: 5,
    demandIndex: 'SURGING',
    aiSuggestions: [
      '⏳ AI Legal SPA Contract draft generated (Ready for review)',
      '⚡ Add high-res rooftop terrace photos to boost AI score to 95+',
      '🛡️ Sub-agent commission split contract locked at 50/50',
    ],
  },
  {
    id: 'prop-agy-204',
    title: '1 Kanal Corner Residential Plot near Main Boulevard',
    propertyType: 'PLOT',
    purpose: 'FOR_SALE',
    price: 42000000,
    city: 'Lahore',
    area: 'DHA Phase 7, Sector T',
    bedrooms: null,
    status: 'SOLD_RENTED',
    createdAt: '2 weeks ago',
    contactPhone: '+92 300 1234567',
    contactName: 'Apex Realty Management',
    aiScore: 88,
    aiGrade: 'OPTIMAL',
    liveBuyersViewing: 0,
    earlyMatchAlertsSent: 19,
    directInquiries: 14,
    demandIndex: 'MODERATE',
    aiSuggestions: [
      '🔒 Deal closed via NexMove Escrow Guard',
      '💼 PKR 840,000 commission credited to agency ledger',
    ],
  },
];

export default function AgencyDashboardPage() {
  const [listings, setListings] = useState<AIListingItem[]>(SEED_AGENCY_LISTINGS);
  const [loading, setLoading] = useState(false);
  const [agencyTier, setAgencyTier] = useState<VerificationTier>('GOLD');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showBankCheckout, setShowBankCheckout] = useState(false);
  const [checkoutPlanTitle, setCheckoutPlanTitle] = useState('Professional Plan');
  const [checkoutPlanPrice, setCheckoutPlanPrice] = useState(15000);

  const [income] = useState<number>(3450000);
  const [expense] = useState<number>(680000);
  const netCashFlow = income - expense;

  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [notifications, setNotifications] = useState<ActivityNotification[]>([
    {
      id: 'agy-n1',
      category: 'LISTING',
      unread: true,
      title: '✨ 42 Overseas Pre-Matches Dispatched',
      body: 'Your 2 Kanal Designer Mansion in DHA Phase 5 has been cross-matched with 42 overseas buyers in London and Dubai.',
      timestamp: '15 mins ago',
    },
    {
      id: 'agy-n2',
      category: 'RENT',
      unread: true,
      title: '⏳ Commercial Lease Pre-Match Active',
      body: 'Blue Area 5,000 Sq Ft Corporate Hub alerted 31 MNC tenants searching for Sep 15 availability.',
      timestamp: '1 hour ago',
    },
  ]);

  const fetchAgencyListings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/properties');
      const data = await res.json();
      if (data?.success && Array.isArray(data.properties) && data.properties.length > 0) {
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
          contactPhone: (p.contactPhone as string) || '+92 300 1234567',
          contactName: (p.contactName as string) || 'Agency Agent',
          contactEmail: (p.contactEmail as string) || null,
          aiScore: Math.floor(Math.random() * 12) + 86,
          liveBuyersViewing: Math.floor(Math.random() * 30) + 10,
          earlyMatchAlertsSent: Math.floor(Math.random() * 35) + 12,
          directInquiries: Math.floor(Math.random() * 15) + 5,
        }));
        setListings(mapped);
      }
    } catch (err) {
      console.warn('Using seeded agency listings fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencyListings();
  }, []);

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
      console.error('Status sync error:', err);
    }

    const listing = listings.find((l) => l.id === id);
    if (listing) {
      const newNote: ActivityNotification = {
        id: `n-agy-${Date.now()}`,
        category: 'LISTING',
        unread: true,
        title: `Agency listing updated to ${newStatus.replace('_', ' ')}`,
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

  const totalAgencyLiveViewers = listings.reduce((acc, l) => acc + (l.liveBuyersViewing || 0), 0);
  const totalEarlyMatches = listings.reduce((acc, l) => acc + (l.earlyMatchAlertsSent || 0), 0);

  return (
    <>
      <section style={{ backgroundColor: '#F8FAFC' }} className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Page Header ──────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Agency Command Center
                </h1>
                <VerifiedBadge type="AGENCY" verified={true} tier={agencyTier} size="md" />
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-[11px] font-bold text-purple-700 border border-purple-300 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-full transition"
                >
                  ⬆ Upgrade Tier
                </button>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Multi-tenant agency portal with Next-Gen AI health analytics, live buyer demand heatmaps & escrow protection.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchAgencyListings()}
                title="Refresh listings"
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
              </button>

              <Link
                href="/agency/submit-listing"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Property Listing
              </Link>

              <Link
                href="/api/auth/signout"
                className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </Link>
            </div>
          </div>

          {/* ── KYC & Escrow Shield Banner ─────────────────────────────────── */}
          <AIEscrowGuard mode="agency_kyc" className="mb-8" />

          {/* ── Financial & AI Heatmap KPI Cards ───────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Income */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Agency Commissions
                </p>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-700 mt-2">
                PKR {(income / 100000).toFixed(1)} Lakh
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                Net cash flow: PKR {(netCashFlow / 100000).toFixed(1)} Lakh
              </p>
            </div>

            {/* Live Buyers Heatmap */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Live Active Viewers
                </p>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold relative">
                  <Flame className="w-4 h-4" />
                  <span className="animate-ping absolute top-0 right-0 h-2 w-2 rounded-full bg-rose-500"></span>
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600 mt-2">
                {totalAgencyLiveViewers} <span className="text-xs text-slate-400 font-bold">Buyers</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Across {listings.length} inventory units</span>
              </p>
            </div>

            {/* 1-Month Pre-Matches */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  1-Mo Pre-Matches
                </p>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <CalendarClock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-indigo-700 mt-2">
                {totalEarlyMatches} <span className="text-xs text-slate-400 font-bold">Alerts</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                High-intent corporate tenant matches
              </p>
            </div>

            {/* AI Optimization Health */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Portfolio Health Score
                </p>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-black text-slate-900">93</span>
                <span className="text-xs font-bold text-slate-400">/100</span>
                <span className="text-[10px] font-black bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full ml-1.5">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                4K Virtual Tour & OCR deeds verified
              </p>
            </div>
          </div>

          {/* ── Quick Nav Hub ──────────────────────────────────────────────── */}
          <nav className="flex flex-wrap items-center gap-2.5 mb-8">
            {[
              { href: '/agency/submit-listing',  label: '+ Add Listing',       cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
              { href: '/agency/properties',      label: 'Inventory Grid',      cls: 'bg-white text-slate-700 border-slate-200' },
              { href: '/agency/deals',           label: '🛡️ Deal Pipeline',   cls: 'bg-purple-50 text-purple-800 border-purple-200' },
              { href: '/agency/rent-collection', label: 'Rent Collection',     cls: 'bg-white text-slate-700 border-slate-200' },
              { href: '/agency/ledger',          label: 'Financial Ledger',    cls: 'bg-white text-slate-700 border-slate-200' },
              { href: '/agency/leaderboard',     label: 'Agent Leaderboard',   cls: 'bg-white text-slate-700 border-slate-200' },
            ].map(({ href, label, cls }) => (
              <Link
                key={href}
                href={href}
                className={`text-xs font-bold px-4 py-2 rounded-2xl border shadow-xs hover:shadow-sm transition ${cls}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* ── Agency Listings with Next-Gen AI Health & Live Heatmaps ────── */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Managed Property Inventory
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Profolio-style status tabs, AI health scoring meters & 1-click WhatsApp customer conversions.
                </p>
              </div>

              <Link
                href="/agency/submit-listing"
                className="self-start sm:self-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> New Agency Property
              </Link>
            </div>

            {/* ── Status Tab Bar ──────────────────────────────────────────── */}
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

            {/* ── Search & Filter Controls ────────────────────────────────── */}
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

            {/* ── Cards Grid ────────────────────────────────────────────── */}
            {filteredListings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <LayoutList className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-1">No agency listings found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                  {search || filterType || filterPurpose
                    ? 'No properties match the selected criteria.'
                    : 'Your agency inventory is currently empty.'}
                </p>
                <Link
                  href="/agency/submit-listing"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-sm transition"
                >
                  <Plus className="w-4 h-4" /> Add New Listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <AIListingCard
                    key={listing.id}
                    listing={listing}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    editHref="/agency/add-property"
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Notifications & Activity Center ──────────────────────────── */}
          <ActivityCenter notifications={notifications} />

        </div>
      </section>

      {/* ── Upgrade Tier Modal ──────────────────────────────────────────── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="mb-5">
              <h3 className="text-xl font-black text-slate-900">Upgrade Verification Badge</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Unlock premium agency trust signals. Current tier: <strong>{agencyTier}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Starter */}
              <div className={`border-2 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition ${
                agencyTier === 'SILVER' ? 'border-slate-500 bg-slate-50' : 'border-slate-200 hover:border-slate-400'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🥈</span>
                  {agencyTier === 'SILVER' && <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <div>
                  <p className="font-black text-slate-900 text-base">Starter Plan</p>
                  <p className="text-xl font-black text-slate-700 mt-0.5">PKR 5,000<span className="text-xs font-semibold text-slate-500">/mo</span></p>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Trade License Verified</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Basic Listing Indexing</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Standard Visibility</li>
                </ul>
                <button
                  onClick={() => { setAgencyTier('SILVER'); setShowUpgradeModal(false); setCheckoutPlanTitle('Starter Plan'); setCheckoutPlanPrice(5000); setShowBankCheckout(true); }}
                  className="mt-auto text-xs bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition"
                >
                  Pay PKR 5,000
                </button>
              </div>

              {/* Professional */}
              <div className={`border-2 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition relative ${
                agencyTier === 'GOLD' ? 'border-amber-500 bg-amber-50' : 'border-amber-200 hover:border-amber-400'
              }`}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] bg-amber-500 text-white font-black px-3 py-1 rounded-full shadow">MOST POPULAR</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">🥇</span>
                  {agencyTier === 'GOLD' && <span className="text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <div>
                  <p className="font-black text-amber-900 text-base">Professional Plan</p>
                  <p className="text-xl font-black text-amber-700 mt-0.5">PKR 15,000<span className="text-xs font-semibold text-amber-600">/mo</span></p>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> RERA / DLD Verified Badge</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Full AIEscrowGuard Suite</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> 50% Co-Broker Priority</li>
                </ul>
                <button
                  onClick={() => { setAgencyTier('GOLD'); setShowUpgradeModal(false); setCheckoutPlanTitle('Professional Plan'); setCheckoutPlanPrice(15000); setShowBankCheckout(true); }}
                  className="mt-auto text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition"
                >
                  Pay PKR 15,000
                </button>
              </div>

              {/* Enterprise */}
              <div className={`border-2 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition ${
                agencyTier === 'PLATINUM' ? 'border-purple-500 bg-purple-50' : 'border-purple-200 hover:border-purple-400'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-2xl">💎</span>
                  {agencyTier === 'PLATINUM' && <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <div>
                  <p className="font-black text-purple-900 text-base">Enterprise Plan</p>
                  <p className="text-xl font-black text-purple-700 mt-0.5">PKR 40,000<span className="text-xs font-semibold text-purple-500">/mo</span></p>
                </div>
                <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Full Audit Verified Badge</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Priority AI Cross-Matching</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Unlimited Team Access</li>
                </ul>
                <button
                  onClick={() => { setAgencyTier('PLATINUM'); setShowUpgradeModal(false); setCheckoutPlanTitle('Enterprise Plan'); setCheckoutPlanPrice(40000); setShowBankCheckout(true); }}
                  className="mt-auto text-xs bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl transition"
                >
                  Pay PKR 40,000
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-5">
              All plans support direct bank transfer into Meezan Bank. Receipts are verified manually by admin.
            </p>
          </div>
        </div>
      )}

      {/* Bank Transfer Checkout Modal */}
      <BankTransferCheckoutModal
        isOpen={showBankCheckout}
        onClose={() => setShowBankCheckout(false)}
        selectedPlanTitle={checkoutPlanTitle}
        selectedPlanPricePKR={checkoutPlanPrice}
      />
    </>
  );
}
