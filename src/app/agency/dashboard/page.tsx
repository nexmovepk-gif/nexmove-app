'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import ActivityCenter, { ActivityNotification } from '@/components/ActivityCenter';
import VerifiedBadge, { VerificationTier } from '@/components/VerifiedBadge';
import AIEscrowGuard from '@/components/AIEscrowGuard';
import BankTransferCheckoutModal from '@/components/BankTransferCheckoutModal';
import {
  Search, SlidersHorizontal, Home, Building2, MapPin, BedDouble,
  BadgeCheck, Clock, CalendarClock, CheckCircle2, XCircle, Archive,
  MoreVertical, Eye, Pencil, Trash2, RotateCcw, TrendingUp,
  DollarSign, LayoutList, Plus, LogOut, Bell, ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ListingStatus =
  | 'ACTIVE'
  | 'PENDING'
  | 'AVAILABLE_SOON'
  | 'SOLD_RENTED'
  | 'REJECTED'
  | 'INACTIVE';

interface Listing {
  id: string;
  title: string;
  propertyType: string;
  purpose: 'FOR_SALE' | 'FOR_RENT' | 'LEASE';
  price: number;
  city: string;
  area: string;
  bedrooms: number | null;
  status: ListingStatus;
  createdAt: string;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; bg: string; text: string; dot: string; icon: React.ReactNode }
> = {
  ACTIVE: {
    label: 'Active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  PENDING: {
    label: 'Pending Approval',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  AVAILABLE_SOON: {
    label: 'Available Soon',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
    icon: <CalendarClock className="w-3.5 h-3.5" />,
  },
  SOLD_RENTED: {
    label: 'Sold / Rented',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    icon: <BadgeCheck className="w-3.5 h-3.5" />,
  },
  REJECTED: {
    label: 'Rejected',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  INACTIVE: {
    label: 'Archived',
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    dot: 'bg-slate-300',
    icon: <Archive className="w-3.5 h-3.5" />,
  },
};

const PURPOSE_LABELS: Record<string, string> = {
  FOR_SALE: 'For Sale',
  FOR_RENT: 'For Rent',
  LEASE: 'Lease',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  HOUSE: <Home className="w-4 h-4" />,
  APARTMENT: <Building2 className="w-4 h-4" />,
  FLAT: <Building2 className="w-4 h-4" />,
  PLOT: <MapPin className="w-4 h-4" />,
  COMMERCIAL: <Building2 className="w-4 h-4" />,
  OFFICE: <Building2 className="w-4 h-4" />,
  VILLA: <Home className="w-4 h-4" />,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(p: number) {
  if (p >= 10000000) return `PKR ${(p / 1000000).toFixed(1)}M`;
  if (p >= 100000)   return `PKR ${(p / 100000).toFixed(1)}L`;
  if (p >= 1000)     return `PKR ${(p / 1000).toFixed(0)}K`;
  return `PKR ${p.toLocaleString()}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ListingStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Listing Card ─────────────────────────────────────────────────────────────

function ListingCard({
  listing,
  onStatusChange,
}: {
  listing: Listing;
  onStatusChange: (id: string, status: ListingStatus) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cfg = STATUS_CONFIG[listing.status];
  const isFaded = listing.status === 'SOLD_RENTED' || listing.status === 'INACTIVE';

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        isFaded ? 'opacity-70' : ''
      }`}
    >
      {/* Colored top accent bar */}
      <div className={`h-1 w-full ${cfg.dot}`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              {TYPE_ICONS[listing.propertyType] ?? <Home className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate leading-snug">{listing.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {listing.city}
                {listing.area && <><span className="text-slate-300 mx-0.5">·</span><span>{listing.area}</span></>}
              </p>
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <button
              id={`listing-menu-${listing.id}`}
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition">
                  <Eye className="w-3.5 h-3.5" /> View Listing
                </button>
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                {listing.status === 'INACTIVE' || listing.status === 'SOLD_RENTED' ? (
                  <button
                    onClick={() => { onStatusChange(listing.id, 'ACTIVE'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-emerald-700 hover:bg-emerald-50 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore Active
                  </button>
                ) : (
                  <button
                    onClick={() => { onStatusChange(listing.id, 'INACTIVE'); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition"
                  >
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </button>
                )}
                <button className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition border-t border-slate-100">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Meta pills */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <StatusBadge status={listing.status} />
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {PURPOSE_LABELS[listing.purpose]}
          </span>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full capitalize">
            {listing.propertyType.replace('_', ' ')}
          </span>
        </div>

        {/* Price + beds */}
        <div className="flex items-center justify-between">
          <p className="text-base font-black text-slate-800">{formatPrice(listing.price)}</p>
          {listing.bedrooms != null && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <BedDouble className="w-3.5 h-3.5" /> {listing.bedrooms} Beds
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Listed {listing.createdAt}</span>
          <div className="flex items-center gap-1.5">
            <button className="text-[11px] text-slate-600 border border-slate-200 hover:border-slate-400 font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1">
              <Eye className="w-3 h-3" /> Preview
            </button>
            <button className="text-[11px] text-emerald-700 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab Definition ───────────────────────────────────────────────────────────

type TabKey = 'ALL' | ListingStatus;

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL',            label: 'All Listings',    icon: <LayoutList className="w-3.5 h-3.5" /> },
  { key: 'ACTIVE',         label: 'Active',           icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  { key: 'PENDING',        label: 'Pending Approval', icon: <Clock className="w-3.5 h-3.5" /> },
  { key: 'AVAILABLE_SOON', label: 'Available Soon',   icon: <CalendarClock className="w-3.5 h-3.5" /> },
  { key: 'SOLD_RENTED',    label: 'Sold / Rented',    icon: <BadgeCheck className="w-3.5 h-3.5" /> },
  { key: 'REJECTED',       label: 'Rejected',         icon: <XCircle className="w-3.5 h-3.5" /> },
  { key: 'INACTIVE',       label: 'Archived',         icon: <Archive className="w-3.5 h-3.5" /> },
];

const TAB_ACTIVE_STYLES: Record<TabKey, string> = {
  ALL:            'border-slate-700 text-slate-800 bg-slate-50',
  ACTIVE:         'border-emerald-600 text-emerald-700 bg-emerald-50',
  PENDING:        'border-amber-500 text-amber-700 bg-amber-50',
  AVAILABLE_SOON: 'border-indigo-500 text-indigo-700 bg-indigo-50',
  SOLD_RENTED:    'border-slate-400 text-slate-600 bg-slate-100',
  REJECTED:       'border-red-500 text-red-700 bg-red-50',
  INACTIVE:       'border-slate-300 text-slate-500 bg-slate-100',
};

const PROPERTY_TYPES = ['HOUSE', 'APARTMENT', 'FLAT', 'PLOT', 'COMMERCIAL', 'OFFICE', 'VILLA'];
const PURPOSES       = ['FOR_SALE', 'FOR_RENT', 'LEASE'];

// ─── Dashboard Component ──────────────────────────────────────────────────────

export default function DashboardClient() {
  const [listings, setListings]             = useState<Listing[]>([]);
  const [notifications, setNotifications]   = useState<ActivityNotification[]>([]);
  const [income]                            = useState<number>(0);
  const [expense]                           = useState<number>(0);
  const [agencyTier, setAgencyTier]         = useState<VerificationTier>('GOLD');
  const [showUpgradeModal, setShowUpgradeModal]   = useState(false);
  const [showBankCheckout, setShowBankCheckout]   = useState(false);
  const [checkoutPlanTitle, setCheckoutPlanTitle] = useState('Professional Plan');
  const [checkoutPlanPrice, setCheckoutPlanPrice] = useState(15000);

  const [activeTab, setActiveTab]       = useState<TabKey>('ALL');
  const [search, setSearch]             = useState('');
  const [filterType, setFilterType]     = useState('');
  const [filterPurpose, setFilterPurpose] = useState('');
  const [showFilters, setShowFilters]   = useState(false);

  const netCashFlow = income - expense;

  const countFor = (key: TabKey) =>
    key === 'ALL' ? listings.length : listings.filter((l) => l.status === key).length;

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      const matchTab     = activeTab === 'ALL' || l.status === activeTab;
      const matchSearch  = !search || l.title.toLowerCase().includes(search.toLowerCase()) || l.id.includes(search);
      const matchType    = !filterType || l.propertyType === filterType;
      const matchPurpose = !filterPurpose || l.purpose === filterPurpose;
      return matchTab && matchSearch && matchType && matchPurpose;
    });
  }, [listings, activeTab, search, filterType, filterPurpose]);

  const handleStatusChange = (id: string, newStatus: ListingStatus) => {
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    const listing = listings.find((l) => l.id === id);
    if (!listing) return;
    const newNote: ActivityNotification = {
      id: `n-auto-${Date.now()}`,
      category: 'LISTING',
      unread: true,
      title: `Listing updated to ${STATUS_CONFIG[newStatus].label}`,
      body: `"${listing.title}" has been updated to ${STATUS_CONFIG[newStatus].label}.`,
      timestamp: 'Just now',
    };
    setNotifications((prev) => [newNote, ...prev]);
  };

  return (
    <>
      <section style={{ background: '#F8FAFC' }} className="min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* ── Page Header ──────────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-slate-900">Agency Dashboard</h1>
                <VerifiedBadge type="AGENCY" verified={true} tier={agencyTier} size="md" />
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="text-[11px] font-bold text-purple-700 border border-purple-300 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-full transition"
                >
                  ⬆ Upgrade Tier
                </button>
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Welcome back — your private agency portal with multi-tenant data shielding.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  const now = 'Just now';
                  setNotifications((prev) => [
                    {
                      id: `p-${Date.now()}-1`, category: 'RENT', unread: true,
                      title: '⏳ Lease Expiring in 18 Days',
                      body: 'Unit 12A – Horizon Towers lease ending on Aug 28. Auto-renewal prompt dispatched.',
                      timestamp: now,
                    },
                    {
                      id: `p-${Date.now()}-2`, category: 'LISTING', unread: true,
                      title: '✨ New Co-Brokering Inventory',
                      body: 'Partner agency "Apex Real Estate" listed 5-Bed Villa. 50/50 split available.',
                      timestamp: now,
                    },
                    ...prev,
                  ]);
                }}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-3.5 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" /> Alerts
              </button>
              <Link
                href="/agency/submit-listing"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Property
              </Link>
              <Link
                href="/api/auth/signout"
                className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </Link>
            </div>
          </div>

          {/* ── KYC Banner ───────────────────────────────────────────────── */}
          <AIEscrowGuard mode="agency_kyc" className="mb-8" />

          {/* ── KPI Cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            {[
              {
                label: 'Total Income',
                value: `PKR ${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                color: 'text-emerald-700',
                bg: 'bg-emerald-50',
                border: 'border-emerald-100',
                icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
              },
              {
                label: 'Total Expenses',
                value: `PKR ${expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                color: 'text-red-600',
                bg: 'bg-red-50',
                border: 'border-red-100',
                icon: <DollarSign className="w-5 h-5 text-red-500" />,
              },
              {
                label: 'Net Cash Flow',
                value: `PKR ${Math.abs(netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                color: netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700',
                bg: netCashFlow >= 0 ? 'bg-emerald-50' : 'bg-red-50',
                border: netCashFlow >= 0 ? 'border-emerald-100' : 'border-red-100',
                icon: <TrendingUp className={`w-5 h-5 ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-500'}`} />,
              },
            ].map(({ label, value, color, bg, border, icon }) => (
              <div key={label} className={`${bg} border ${border} rounded-2xl p-5 flex items-center gap-4`}>
                <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
                  {icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</p>
                  <p className={`text-xl font-black ${color} mt-0.5`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Quick Nav ────────────────────────────────────────────────── */}
          <nav className="flex flex-wrap gap-3 mb-8">
            {[
              { href: '/agency/submit-listing',  label: '+ Add Property',   cls: 'text-emerald-700 font-bold' },
              { href: '/agency/ledger',          label: 'View Ledger',       cls: 'text-blue-600 font-medium' },
              { href: '/agency/leaderboard',     label: 'Leaderboard',       cls: 'text-blue-600 font-medium' },
              { href: '/agency/rent-collection', label: 'Rent Collections',  cls: 'text-blue-600 font-medium' },
              { href: '/agency/deals',           label: '🛡️ Deal Pipeline',  cls: 'text-purple-700 font-bold' },
            ].map(({ href, label, cls }) => (
              <Link key={href} href={href} className={`hover:underline text-sm ${cls}`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/*  MY LISTINGS SECTION                                          */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="mb-10">

            {/* Section heading */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">My Listings</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {listings.length === 0
                    ? 'No properties listed yet.'
                    : `${listings.length} propert${listings.length === 1 ? 'y' : 'ies'} — ${filtered.length} shown`}
                </p>
              </div>
              <Link
                href="/agency/submit-listing"
                className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" /> New Listing
              </Link>
            </div>

            {/* ── Status Tab Bar ────────────────────────────────────────── */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-4 border-b border-slate-200">
              {TABS.map((tab) => {
                const count = countFor(tab.key);
                const isActive = activeTab === tab.key;
                const activeStyle = TAB_ACTIVE_STYLES[tab.key];
                return (
                  <button
                    key={tab.key}
                    id={`tab-${tab.key}`}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-xs font-bold rounded-t-lg border-b-2 -mb-px transition-all duration-150 ${
                      isActive
                        ? `${activeStyle} border-b-2`
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    <span
                      className={`ml-0.5 min-w-[18px] text-center text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white/80 text-slate-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ── Search & Filter Bar ───────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="listing-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by title or ID…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                />
              </div>

              <button
                id="filter-toggle"
                onClick={() => setShowFilters((v) => !v)}
                className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition ${
                  showFilters
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {(filterType || filterPurpose) && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {(filterType || filterPurpose || search) && (
                <button
                  onClick={() => { setSearch(''); setFilterType(''); setFilterPurpose(''); }}
                  className="text-xs text-red-600 font-semibold hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-4 mb-5 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Property Type</label>
                  <select
                    id="filter-type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  >
                    <option value="">All Types</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>{t.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Purpose</label>
                  <select
                    id="filter-purpose"
                    value={filterPurpose}
                    onChange={(e) => setFilterPurpose(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                  >
                    <option value="">All Purposes</option>
                    {PURPOSES.map((p) => (
                      <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* ── Listing Grid / Empty State ────────────────────────────── */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <LayoutList className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-base font-bold text-slate-700 mb-1">No listings found</p>
                <p className="text-sm text-slate-500 mb-5 text-center max-w-xs">
                  {listings.length === 0
                    ? 'Start building your portfolio by adding your first property listing.'
                    : 'Try adjusting your filters or search query.'}
                </p>
                {listings.length === 0 && (
                  <Link
                    href="/agency/submit-listing"
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Your First Property
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((l) => (
                  <ListingCard key={l.id} listing={l} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </div>

          {/* ── Activity Center ──────────────────────────────────────────── */}
          <ActivityCenter notifications={notifications} />

        </div>
      </section>

      {/* ── Upgrade Modal ────────────────────────────────────────────────── */}
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
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Trade License Verified Badge</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Basic Listing Indexing</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Standard Marketplace Visibility</li>
                  <li className="flex items-center gap-2"><span className="text-slate-300 font-bold">✗</span> Priority Search Placement</li>
                  <li className="flex items-center gap-2"><span className="text-slate-300 font-bold">✗</span> AI Cross-Matching</li>
                </ul>
                <button
                  onClick={() => { setAgencyTier('SILVER'); setShowUpgradeModal(false); setCheckoutPlanTitle('Starter Plan'); setCheckoutPlanPrice(5000); setShowBankCheckout(true); }}
                  className="mt-auto text-xs bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition"
                >
                  Pay PKR 5,000 via Meezan Bank
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
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> 50% Co-Brokering Match Priority</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> AI Legal SPA Generator (PDF)</li>
                  <li className="flex items-center gap-2"><span className="text-slate-300 font-bold">✗</span> Zero Commission Cap</li>
                </ul>
                <button
                  onClick={() => { setAgencyTier('GOLD'); setShowUpgradeModal(false); setCheckoutPlanTitle('Professional Plan'); setCheckoutPlanPrice(15000); setShowBankCheckout(true); }}
                  className="mt-auto text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition"
                >
                  Pay PKR 15,000 via Meezan Bank
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
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Zero Commission Cap</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Unlimited Developer Access</li>
                  <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Dedicated Account Manager</li>
                </ul>
                <button
                  onClick={() => { setAgencyTier('PLATINUM'); setShowUpgradeModal(false); setCheckoutPlanTitle('Enterprise Plan'); setCheckoutPlanPrice(40000); setShowBankCheckout(true); }}
                  className="mt-auto text-xs bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl transition"
                >
                  Pay PKR 40,000 via Meezan Bank
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center mt-5">
              All plans support direct bank transfer into Meezan Bank. Receipts are verified manually by admin.
            </p>
          </div>
        </div>
      )}

      <BankTransferCheckoutModal
        isOpen={showBankCheckout}
        onClose={() => setShowBankCheckout(false)}
        selectedPlanTitle={checkoutPlanTitle}
        selectedPlanPricePKR={checkoutPlanPrice}
      />
    </>
  );
}
