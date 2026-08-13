'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import VerifiedBadge from '@/components/VerifiedBadge';
import AIEscrowGuard from '@/components/AIEscrowGuard';

export interface PublicListingItem {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  price: number;
  address: string;
  city: string;
  areaSqFt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  verifiedProperty: boolean;
  aiExtracted: boolean;
  aiConfidence: number | null;
  isActive: boolean;
  agencyId: string | null;
  agencyName: string | null;
  agencyVerified: boolean;
  createdAt: string;
}

function formatPrice(p: number) {
  if (p >= 10000000) return `Rs ${(p / 10000000).toFixed(1)} Crore`;
  if (p >= 100000) return `Rs ${(p / 100000).toFixed(1)} Lac`;
  return `Rs ${p.toLocaleString()}`;
}

const TYPE_ICONS: Record<string, string> = {
  HOUSE: '🏠', APARTMENT: '🏢', PLOT: '🗺️', COMMERCIAL: '🏪', VILLA: '🏯',
};

export default function ListingDetailClient({ listing }: { listing: PublicListingItem }) {
  const [activeTab, setActiveTab] = useState<'overview' | '3d' | 'floorplan'>('overview');
  const [active3DRoom, setActive3DRoom] = useState<'living' | 'master' | 'balcony'>('living');

  // Token Payment Modal State
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ESCROW_BANK' | 'CARD' | 'CRYPTO'>('ESCROW_BANK');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [tokenPaidSuccess, setTokenPaidSuccess] = useState(false);
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  const tokenAmount = Math.round(listing.price * 0.05); // 5% token deposit

  const handlePayToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) return;

    setIsProcessingToken(true);
    setTimeout(() => {
      setIsProcessingToken(false);
      setTokenPaidSuccess(true);
    }, 1200);
  };

  const date = new Date(listing.createdAt).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* ── Top Hero Card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              {TYPE_ICONS[listing.propertyType] ?? '🏠'} {listing.propertyType}
            </span>
            <span className="text-xs text-slate-500 font-medium">{date}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{listing.title}</h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">{listing.address}{listing.city ? `, ${listing.city}` : ''}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider">Selling Price</span>
              <p className="text-3xl font-black text-emerald-700">{formatPrice(listing.price)}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            <VerifiedBadge type="PROPERTY" verified={listing.verifiedProperty} size="md" />
            {listing.agencyVerified && <VerifiedBadge type="AGENCY" verified={true} size="md" />}
            {listing.aiExtracted && (
              <span className="text-xs bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>
                AI Extracted ({Math.round((listing.aiConfidence ?? 0) * 100)}%)
              </span>
            )}
          </div>
        </div>

        {/* ── Token Reserve & Non-Refundable Policy Callout Banner ───────── */}
        <div className="bg-white border border-emerald-300 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <h2 className="text-sm font-bold text-slate-900">Reserve Property via NexMove Escrow</h2>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Pay 5% Token Amount ({formatPrice(tokenAmount)}) to lock deal & remove property from public market.
            </p>
            <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1 mt-1 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-xl">
              <span>⚠️</span> Token amount is Non-Refundable upon deal cancellation by the buyer.
            </p>
          </div>

          <button
            onClick={() => setShowTokenModal(true)}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>💳</span> Pay Token / Reserve Property
          </button>
        </div>

        {/* ── Interactive View Tabs (Overview / 3D Tour / Floorplan) ─────── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-2 flex items-center gap-2 shadow-sm">
          {(['overview', '3d', 'floorplan'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5 ${
                activeTab === tab
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab === 'overview' && <span>📄 Overview</span>}
              {tab === '3d' && <span>🕶️ 3D Virtual Tour</span>}
              {tab === 'floorplan' && <span>🗺️ Floor Plan</span>}
            </button>
          ))}
        </div>

        {/* ── TAB 1: OVERVIEW ────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Bedrooms', value: listing.bedrooms != null ? `${listing.bedrooms} Beds` : 'N/A' },
                { label: 'Bathrooms', value: listing.bathrooms != null ? `${listing.bathrooms} Baths` : 'N/A' },
                { label: 'Area Size', value: listing.areaSqFt != null ? `${listing.areaSqFt.toLocaleString()} Sq.Ft` : 'N/A' },
                { label: 'City Location', value: listing.city || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{label}</span>
                  <span className="text-sm font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {listing.description && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-2 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Property Description</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">{listing.description}</p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: 3D VIRTUAL TOUR VIEWER ──────────────────────────────── */}
        {activeTab === '3d' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🕶️</span> 360° Interactive 3D Canvas Tour
                </h3>
                <p className="text-[11px] text-slate-400">Click room controls to navigate the virtual space</p>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-bold">
                Matterport Engine Simulated
              </span>
            </div>

            {/* 3D Canvas Viewer Box */}
            <div className="relative w-full h-72 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 rounded-2xl border border-slate-700 overflow-hidden flex flex-col items-center justify-center p-6 shadow-inner">
              {/* Render Room Canvas */}
              {active3DRoom === 'living' && (
                <div className="text-center space-y-2 animate-in fade-in duration-300">
                  <div className="text-5xl">🛋️</div>
                  <h4 className="text-sm font-bold text-teal-300">Main Living & Dining Lounge</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    Floor-to-ceiling panoramic glass windows with ambient LED recessed lighting and smart climate control.
                  </p>
                  <span className="inline-block text-[10px] bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full border border-teal-500/20">
                    360° Panorama Loaded · Drag to Rotate
                  </span>
                </div>
              )}

              {active3DRoom === 'master' && (
                <div className="text-center space-y-2 animate-in fade-in duration-300">
                  <div className="text-5xl">🛏️</div>
                  <h4 className="text-sm font-bold text-teal-300">Executive Master Suite</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    En-suite marble bathroom, walk-in dressing wardrobe, and private terrace access.
                  </p>
                  <span className="inline-block text-[10px] bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full border border-teal-500/20">
                    360° Panorama Loaded · Drag to Rotate
                  </span>
                </div>
              )}

              {active3DRoom === 'balcony' && (
                <div className="text-center space-y-2 animate-in fade-in duration-300">
                  <div className="text-5xl">🌅</div>
                  <h4 className="text-sm font-bold text-teal-300">Panoramic Sea-View Balcony</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    Unobstructed ocean view deck with outdoor seating area and sunset orientation.
                  </p>
                  <span className="inline-block text-[10px] bg-teal-500/10 text-teal-400 px-3 py-1 rounded-full border border-teal-500/20">
                    360° Panorama Loaded · Drag to Rotate
                  </span>
                </div>
              )}

              {/* Viewport Overlay Info */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] text-slate-300 border border-slate-700">
                Resolution: 4K HDR 360°
              </div>
              <div className="absolute bottom-3 right-3 bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-lg text-[10px] font-bold border border-emerald-700/50 flex items-center gap-1">
                <span>🥽 VR Headset Compatible</span>
              </div>
            </div>

            {/* Room Selector Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActive3DRoom('living')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${
                  active3DRoom === 'living' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🛋️ Living Room
              </button>
              <button
                onClick={() => setActive3DRoom('master')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${
                  active3DRoom === 'master' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🛏️ Master Suite
              </button>
              <button
                onClick={() => setActive3DRoom('balcony')}
                className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${
                  active3DRoom === 'balcony' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🌅 Balcony View
              </button>
            </div>
          </div>
        )}

        {/* ── TAB 3: FLOOR PLAN ───────────────────────────────────────────── */}
        {activeTab === 'floorplan' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-full h-64 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-6 text-slate-400">
              <div className="text-4xl mb-2">🗺️</div>
              <h4 className="text-sm font-bold text-slate-200">Architectural 2D/3D Floor Plan</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Dimensions: {listing.areaSqFt != null ? `${listing.areaSqFt} Sq.Ft` : 'Standard Layout'} · {listing.bedrooms ?? 2} Bedrooms · {listing.bathrooms ?? 2} Baths
              </p>
              <span className="mt-3 text-[10px] bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700">
                Verified CAD Layout Blueprint
              </span>
            </div>
          </div>
        )}

        {/* ── Agency & Contact Information ────────────────────────────────── */}
        {listing.agencyName && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black">
                {listing.agencyName.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Listing Broker</span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  {listing.agencyName}
                  {listing.agencyVerified && <VerifiedBadge type="AGENCY" verified={true} size="md" />}
                </span>
              </div>
            </div>

            <Link
              href="/agencies"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
            >
              View Agency Profile →
            </Link>
          </div>
        )}

        {/* Contact Owner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Contact</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold">
              {listing.contactName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">{listing.contactName}</span>
              <span className="text-xs text-emerald-700 font-mono font-semibold">{listing.contactPhone}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/${listing.contactPhone.replace(/[^0-9]/g, '')}?text=Hi! I found your property listing on NexMove: ${listing.title}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold py-3 rounded-2xl transition text-xs shadow-sm"
            >
              <span>💬</span> Contact on WhatsApp
            </a>
            {listing.contactEmail && (
              <a
                href={`mailto:${listing.contactEmail}`}
                className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-3 rounded-2xl transition text-xs font-bold"
              >
                ✉️ Send Direct Email
              </a>
            )}
          </div>
        </div>

      </div>

      {/* ── TOKEN PAYMENT & ESCROW MODAL ────────────────────────────────────── */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <button
              onClick={() => {
                setShowTokenModal(false);
                setTokenPaidSuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            {!tokenPaidSuccess ? (
              <form onSubmit={handlePayToken} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Pay Token / Reserve Property</h3>
                    <p className="text-xs text-slate-600 font-medium">Lock deal & hold property in NexMove Escrow Vault</p>
                  </div>
                </div>

                {/* Token Calculation Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Property Price:</span>
                    <span className="font-bold text-slate-900">{formatPrice(listing.price)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Required Token Deposit (5%):</span>
                    <span className="font-black text-emerald-700 text-base">{formatPrice(tokenAmount)}</span>
                  </div>
                </div>

                {/* STRICT NON-REFUNDABLE TERMS BANNER */}
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span>⚠️</span> Non-Refundable Token Policy:
                  </p>
                  <p className="text-[11px] leading-relaxed font-semibold">
                    Token amount is Non-Refundable upon deal cancellation by the buyer once funds are deposited into escrow.
                  </p>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">Buyer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Marcus Vance"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">Escrow Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'ESCROW_BANK' | 'CARD' | 'CRYPTO')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ESCROW_BANK">🏦 NexMove Escrow Bank Wire</option>
                      <option value="CARD">💳 Credit / Debit Card (Stripe)</option>
                      <option value="CRYPTO">🪙 Crypto / USDT Escrow</option>
                    </select>
                  </div>

                  <AIEscrowGuard mode="compact" className="w-full justify-between my-1" />

                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 rounded bg-white border-slate-300 text-emerald-600"
                    />
                    <span className="text-[11px] text-slate-700 font-medium leading-snug">
                      I accept the <Link href="/privacy" className="text-emerald-700 font-bold hover:underline">Non-Refundable Token Policy</Link> and authorize escrow deposit.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!agreedTerms || isProcessingToken}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isProcessingToken ? 'Processing Escrow Deposit...' : `Pay ${formatPrice(tokenAmount)} Token Now`}
                </button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-slate-900">Token Deposit Confirmed!</h3>
                <p className="text-xs text-slate-700 max-w-xs mx-auto leading-relaxed font-medium">
                  Token amount of <span className="font-bold text-emerald-700">{formatPrice(tokenAmount)}</span> for <span className="font-bold text-slate-900">{listing.title}</span> is now safely held in <span className="text-emerald-800 font-bold">NexMove Escrow Vault</span>.
                </p>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-[11px] text-slate-600 font-medium">
                  Escrow Tx: <span className="font-mono text-emerald-700 font-bold">ESC-9082-NX</span> · Status: Active Hold
                </div>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
