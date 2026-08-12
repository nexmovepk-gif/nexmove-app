'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ActivityCenter, { ActivityNotification } from '@/components/ActivityCenter';
import VerifiedBadge, { VerificationTier } from '@/components/VerifiedBadge';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Listing {
  id: string;
  title: string;
  propertyType: string;
  price: number;
  city: string;
  bedrooms: number | null;
  isActive: boolean; // false = sold/archived
  createdAt: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_LISTINGS: Listing[] = [
  { id: 'lst-1', title: '5 Marla House – Bahria Town Phase 4', propertyType: 'HOUSE',     price: 17500000, city: 'Rawalpindi', bedrooms: 3, isActive: true, createdAt: '2026-08-01' },
  { id: 'lst-2', title: 'Marina Tower Penthouse',               propertyType: 'APARTMENT', price: 52000000, city: 'Dubai',      bedrooms: 4, isActive: true, createdAt: '2026-08-03' },
  { id: 'lst-3', title: 'Business Bay Office Suite',            propertyType: 'COMMERCIAL',price: 38000000, city: 'Dubai',      bedrooms: null, isActive: true, createdAt: '2026-08-05' },
  { id: 'lst-4', title: 'DHA Phase 6 – 10 Marla Corner Plot',  propertyType: 'PLOT',      price: 42000000, city: 'Lahore',     bedrooms: null, isActive: true, createdAt: '2026-08-07' },
];

const INITIAL_NOTIFICATIONS: ActivityNotification[] = [
  { id: 'n-1', category: 'DEAL',    unread: true,  title: 'Deal #102 updated privately',         body: 'Stage moved from Negotiation → Escrow. Client identity remains fully shielded.',   timestamp: '2 min ago' },
  { id: 'n-2', category: 'RENT',    unread: true,  title: 'Rent reminder sent',                  body: 'Automated reminder dispatched to Tenant #3 (Unit 12A). $1,850 due Aug 10.',        timestamp: '14 min ago' },
  { id: 'n-3', category: 'LISTING', unread: false, title: 'Listing archived automatically',      body: '"Marina Tower Penthouse" marked as Sold and removed from public marketplace.',       timestamp: '1 hr ago' },
  { id: 'n-4', category: 'DEAL',    unread: false, title: 'AI Matcher found a new lead match',   body: 'Buyer Requirement #408 matched 98% with inventory item LST-002. No PII shared.',   timestamp: '3 hrs ago' },
  { id: 'n-5', category: 'SYSTEM',  unread: false, title: 'Data shield integrity check passed',  body: 'Multi-tenant privacy shield verified. 0 cross-agency data leaks detected.',          timestamp: '6 hrs ago' },
];

// ─── KPI cards ────────────────────────────────────────────────────────────────

const MOCK_INCOME   = 120000;
const MOCK_EXPENSE  = 80000;
const MOCK_NET      = MOCK_INCOME - MOCK_EXPENSE;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(p: number) {
  if (p >= 10000000) return `$${(p / 1000000).toFixed(1)}M`;
  if (p >= 1000)     return `$${(p / 1000).toFixed(0)}K`;
  return `$${p.toLocaleString()}`;
}

const TYPE_ICONS: Record<string, string> = {
  HOUSE: '🏠', APARTMENT: '🏢', PLOT: '🗺️', COMMERCIAL: '🏪', VILLA: '🏯',
};

// ─── Dashboard Component ──────────────────────────────────────────────────────

export default function DashboardClient() {
  const [listings, setListings]           = useState<Listing[]>(INITIAL_LISTINGS);
  const [notifications, setNotifications]  = useState<ActivityNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab]          = useState<'active' | 'archived'>('active');
  const [agencyTier, setAgencyTier]        = useState<VerificationTier>('GOLD');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const activeListings   = listings.filter((l) => l.isActive);
  const archivedListings = listings.filter((l) => !l.isActive);

  // ── Mark listing as Sold / restore ───────────────────────────────────────
  const toggleSold = (id: string, markSold: boolean) => {
    setListings((prev) =>
      prev.map((l) => l.id === id ? { ...l, isActive: !markSold } : l)
    );

    const listing = listings.find((l) => l.id === id)!;
    const newNote: ActivityNotification = {
      id: `n-auto-${Date.now()}`,
      category: 'LISTING',
      unread: true,
      title: markSold ? 'Listing archived (Sold / Closed)' : 'Listing restored to Marketplace',
      body: markSold
        ? `"${listing.title}" has been marked as Sold and removed from the public marketplace. Moved to Archived tab.`
        : `"${listing.title}" has been restored to active status and is now visible on the marketplace.`,
      timestamp: 'Just now',
    };
    setNotifications((prev) => [newNote, ...prev]);
  };

  return (
    <>
      <section className="p-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-bold text-gray-900">Agency Dashboard</h1>
              <VerifiedBadge type="AGENCY" verified={true} tier={agencyTier} size="md" />
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="text-[11px] font-bold text-purple-700 border border-purple-300 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-full transition"
              >
                ⬆ Upgrade Tier
              </button>
            </div>
            <p className="text-sm text-gray-700 font-medium mt-1">
              Welcome back — your private agency portal with multi-tenant data shielding.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const now = 'Just now';
                const p1: ActivityNotification = {
                  id: `p-${Date.now()}-1`,
                  category: 'RENT',
                  unread: true,
                  title: '⏳ Lease Expiring in 18 Days',
                  body: 'Unit 12A – Horizon Towers lease ending on Aug 28. Auto-renewal prompt dispatched to tenant.',
                  timestamp: now,
                };
                const p2: ActivityNotification = {
                  id: `p-${Date.now()}-2`,
                  category: 'LISTING',
                  unread: true,
                  title: '✨ New Co-Brokering Inventory',
                  body: 'Partner agency "Apex Real Estate" listed 5-Bed Palm Jumeirah Villa ($3.2M). 50/50 split available.',
                  timestamp: now,
                };
                setNotifications((prev) => [p1, p2, ...prev]);
              }}
              className="text-xs bg-teal-800 hover:bg-teal-700 text-teal-100 font-bold px-3.5 py-2 rounded-lg shadow transition flex items-center gap-1.5"
            >
              <span>🔔</span> Trigger Push Alerts
            </button>
            <Link
              href="/agency/submit-listing"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg shadow transition"
            >
              + Add Property Listing
            </Link>
            <Link
              href="/api/auth/signout"
              className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg transition"
            >
              Sign Out
            </Link>
          </div>
        </div>

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="p-6 bg-white rounded-2xl shadow border border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Total Income</h2>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              ${MOCK_INCOME.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow border border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Total Expenses</h2>
            <p className="mt-2 text-3xl font-black text-red-700">
              ${MOCK_EXPENSE.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-6 bg-white rounded-2xl shadow border border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Net Cash Flow</h2>
            <p className={`mt-2 text-3xl font-black ${MOCK_NET >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              ${MOCK_NET.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ── Quick Nav Links ────────────────────────────────────────────── */}
        <nav className="flex flex-wrap gap-4 mb-10">
          {[
            { href: '/agency/submit-listing',  label: '+ Add Property', cls: 'text-emerald-700 font-bold' },
            { href: '/agency/ledger',          label: 'View Ledger',    cls: 'text-blue-600 font-medium' },
            { href: '/agency/leaderboard',     label: 'Leaderboard',    cls: 'text-blue-600 font-medium' },
            { href: '/agency/rent-collection', label: 'Rent Collections', cls: 'text-blue-600 font-medium' },
            { href: '/agency/deals',           label: '🛡️ Deal Pipeline', cls: 'text-purple-700 font-bold' },
          ].map(({ href, label, cls }) => (
            <Link key={href} href={href} className={`hover:underline text-sm ${cls}`}>
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Listings Section ────────────────────────────────────────────── */}
        <div className="mb-10">
          {/* Tab headers */}
          <div className="flex items-center gap-1 mb-4 border-b border-gray-200">
            {(['active', 'archived'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-bold rounded-t-lg transition border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-emerald-600 text-emerald-700 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {tab === 'active' ? (
                  <>Active Listings <span className="ml-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">{activeListings.length}</span></>
                ) : (
                  <>Archived / Sold <span className="ml-1.5 bg-gray-200 text-gray-700 text-[10px] font-black px-2 py-0.5 rounded-full">{archivedListings.length}</span></>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
            {activeTab === 'active' && (
              <>
                {activeListings.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500 text-sm">
                    No active listings. <Link href="/agency/submit-listing" className="text-emerald-600 font-bold hover:underline">Add a new property →</Link>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Property', 'Type', 'Price', 'City', 'Beds', 'Listed', 'Actions'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeListings.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{TYPE_ICONS[l.propertyType] ?? '🏠'}</span>
                              <p className="text-sm font-bold text-gray-900 leading-snug">{l.title}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-gray-700">{l.propertyType}</td>
                          <td className="px-5 py-4 text-sm font-bold text-emerald-700 whitespace-nowrap">{formatPrice(l.price)}</td>
                          <td className="px-5 py-4 text-sm text-gray-800">{l.city}</td>
                          <td className="px-5 py-4 text-sm text-gray-800">{l.bedrooms ?? '—'}</td>
                          <td className="px-5 py-4 text-xs text-gray-500">{l.createdAt}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleSold(l.id, true)}
                              className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              🔒 Mark as Sold
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}

            {activeTab === 'archived' && (
              <>
                {archivedListings.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500 text-sm">
                    No archived listings yet. Mark a listing as Sold to archive it.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Property', 'Type', 'Price', 'City', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {archivedListings.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50 transition-colors opacity-70">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg grayscale">{TYPE_ICONS[l.propertyType] ?? '🏠'}</span>
                              <p className="text-sm font-bold text-gray-700 line-through">{l.title}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs font-semibold text-gray-500">{l.propertyType}</td>
                          <td className="px-5 py-4 text-sm font-bold text-gray-500 whitespace-nowrap">{formatPrice(l.price)}</td>
                          <td className="px-5 py-4 text-sm text-gray-500">{l.city}</td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">Sold / Closed</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <button
                              onClick={() => toggleSold(l.id, false)}
                              className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              ↩ Restore to Active
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>

          {activeTab === 'archived' && archivedListings.length > 0 && (
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <span>🛡️</span>
              Archived listings are automatically hidden from the public marketplace and only visible here.
            </p>
          )}
        </div>

        {/* ── Notifications & Activity Center ────────────────────────────── */}
        <ActivityCenter notifications={notifications} />

      </div>
    </section>

    {/* ── Upgrade Verification Tier Modal ────────────────────────────────── */}
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
            {/* Silver Plan */}
            <div className={`border-2 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition ${
              agencyTier === 'SILVER'
                ? 'border-slate-500 bg-slate-50'
                : 'border-slate-200 hover:border-slate-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">🥈</span>
                {agencyTier === 'SILVER' && (
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <div>
                <p className="font-black text-slate-900 text-base">Silver Verified</p>
                <p className="text-2xl font-black text-slate-700 mt-0.5">$99<span className="text-xs font-semibold text-slate-500">/mo</span></p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Trade License Verified Badge</li>
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Basic Listing Indexing</li>
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Standard Marketplace Visibility</li>
                <li className="flex items-center gap-2"><span className="text-slate-300 font-bold">✗</span> Priority Search Placement</li>
                <li className="flex items-center gap-2"><span className="text-slate-300 font-bold">✗</span> AI Cross-Matching</li>
              </ul>
              <button
                onClick={() => { setAgencyTier('SILVER'); setShowUpgradeModal(false); }}
                className="mt-auto text-xs bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition"
              >
                {agencyTier === 'SILVER' ? 'Current Plan' : 'Select Silver'}
              </button>
            </div>

            {/* Gold Plan */}
            <div className={`border-2 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition relative ${
              agencyTier === 'GOLD'
                ? 'border-amber-500 bg-amber-50'
                : 'border-amber-200 hover:border-amber-400'
            }`}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="text-[10px] bg-amber-500 text-white font-black px-3 py-1 rounded-full shadow">MOST POPULAR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl">🥇</span>
                {agencyTier === 'GOLD' && (
                  <span className="text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <div>
                <p className="font-black text-amber-900 text-base">Gold Elite</p>
                <p className="text-2xl font-black text-amber-700 mt-0.5">$299<span className="text-xs font-semibold text-amber-600">/mo</span></p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> RERA / DLD Verified Badge</li>
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Priority Marketplace Search</li>
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> 50% Co-Brokering Match Priority</li>
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Monthly Analytics Report</li>
                <li className="flex items-center gap-2"><span className="text-slate-300 font-bold">✗</span> Zero Commission Cap</li>
              </ul>
              <button
                onClick={() => { setAgencyTier('GOLD'); setShowUpgradeModal(false); }}
                className="mt-auto text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition"
              >
                {agencyTier === 'GOLD' ? 'Current Plan' : 'Select Gold Elite'}
              </button>
            </div>

            {/* Platinum Plan */}
            <div className={`border-2 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition ${
              agencyTier === 'PLATINUM'
                ? 'border-purple-500 bg-purple-50'
                : 'border-purple-200 hover:border-purple-400'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">💎</span>
                {agencyTier === 'PLATINUM' && (
                  <span className="text-[10px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">Current</span>
                )}
              </div>
              <div>
                <p className="font-black text-purple-900 text-base">Platinum Enterprise</p>
                <p className="text-2xl font-black text-purple-700 mt-0.5">$599<span className="text-xs font-semibold text-purple-500">/mo</span></p>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 flex-1">
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Full Audit Verified Badge</li>
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Priority AI Cross-Matching</li>
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Zero Commission Cap</li>
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Top Search Indexing</li>
                <li className="flex items-center gap-2"><span className="text-emerald-600 font-bold">✓</span> Dedicated Account Manager</li>
              </ul>
              <button
                onClick={() => { setAgencyTier('PLATINUM'); setShowUpgradeModal(false); }}
                className="mt-auto text-xs bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl transition"
              >
                {agencyTier === 'PLATINUM' ? 'Current Plan' : 'Upgrade to Platinum'}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 text-center mt-5">
            All plans are billed monthly. Tier badges are activated instantly upon subscription confirmation.
          </p>
        </div>
      </div>
    )}
    </>
  );
}
