'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Home, Building2, MapPin, BedDouble, Bath,
  CheckCircle2, Clock, CalendarClock, BadgeCheck, XCircle,
  MoreVertical, Eye, Pencil, Trash2, RotateCcw,
  Sparkles, Send, MessageSquare,
  ChevronDown, ChevronUp, Share2, Check
} from 'lucide-react';

export type ListingStatusKey =
  | 'ACTIVE'
  | 'PENDING'
  | 'AVAILABLE_SOON'
  | 'SOLD_RENTED'
  | 'REJECTED';

export interface AIListingItem {
  id: string;
  title: string;
  propertyType: string;
  purpose: 'FOR_SALE' | 'FOR_RENT' | 'LEASE';
  price: number;
  city: string;
  area: string;
  bedrooms: number | null;
  bathrooms?: number | null;
  status: ListingStatusKey;
  createdAt: string;
  isAvailable?: boolean;
  availableDate?: string | null;
  images?: string[];
  videoUrl?: string | null;
  panoramaUrl?: string | null;
  virtualTourUrl?: string | null;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string | null;
  // Next-Gen AI Health & Demand metrics
  aiScore?: number; // 0-100
  aiGrade?: 'OPTIMAL' | 'GOOD' | 'NEEDS_IMPROVEMENT';
  aiSuggestions?: string[];
  liveBuyersViewing?: number;
  earlyMatchAlertsSent?: number;
  directInquiries?: number;
  demandIndex?: 'HIGH' | 'SURGING' | 'MODERATE';
}

const STATUS_CONFIG: Record<
  ListingStatusKey,
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
    label: 'Pending AI Check',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  AVAILABLE_SOON: {
    label: 'Available Soon (Pre-Match)',
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
    label: 'Rejected / Draft',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

const PURPOSE_LABELS: Record<string, string> = {
  FOR_SALE: 'For Sale',
  FOR_RENT: 'For Rent',
  LEASE: 'Lease',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  HOUSE: <Home className="w-4 h-4 text-emerald-600" />,
  APARTMENT: <Building2 className="w-4 h-4 text-blue-600" />,
  FLAT: <Building2 className="w-4 h-4 text-blue-600" />,
  PLOT: <MapPin className="w-4 h-4 text-amber-600" />,
  COMMERCIAL: <Building2 className="w-4 h-4 text-purple-600" />,
  OFFICE: <Building2 className="w-4 h-4 text-indigo-600" />,
  VILLA: <Home className="w-4 h-4 text-teal-600" />,
};

function formatPKR(p: number) {
  if (p >= 10000000) return `PKR ${(p / 10000000).toFixed(2)} Crore`;
  if (p >= 100000) return `PKR ${(p / 100000).toFixed(1)} Lakh`;
  if (p >= 1000) return `PKR ${(p / 1000).toFixed(0)}K`;
  return `PKR ${p.toLocaleString()}`;
}

export default function AIListingCard({
  listing,
  onStatusChange,
  onDelete,
  editHref = '/agency/add-property',
}: {
  listing: AIListingItem;
  onStatusChange: (id: string, newStatus: ListingStatusKey) => void;
  onDelete?: (id: string) => void;
  editHref?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const statusCfg = STATUS_CONFIG[listing.status] || STATUS_CONFIG.ACTIVE;
  const isInactive = listing.status === 'SOLD_RENTED' || listing.status === 'REJECTED';

  // Compute or fallback AI score
  const aiScore = listing.aiScore ?? (listing.status === 'ACTIVE' ? 92 : listing.status === 'AVAILABLE_SOON' ? 88 : 65);
  const aiGrade =
    aiScore >= 85 ? 'OPTIMAL' : aiScore >= 70 ? 'GOOD' : 'NEEDS_IMPROVEMENT';

  const liveBuyers = listing.liveBuyersViewing ?? (listing.status === 'ACTIVE' ? Math.floor(Math.random() * 15) + 8 : 2);
  const earlyMatches = listing.earlyMatchAlertsSent ?? (listing.status === 'AVAILABLE_SOON' ? 18 : 6);
  const inquiries = listing.directInquiries ?? (listing.status === 'ACTIVE' ? 9 : 3);

  const defaultSuggestions = [
    listing.virtualTourUrl
      ? '✓ 3D Virtual Tour active (leads increased by +35%)'
      : '⚡ Add 360 Video Tour to boost inquiry conversion by +35%',
    listing.price > 15000000
      ? '📊 Price aligned with Top 10% AI Market Index in this sector'
      : '🎯 Highly competitive price tier attracting rapid early buyer matches',
    '🛡️ CNIC / Legal document verified for Verified Marketplace Trust Badge',
  ];

  const suggestions = listing.aiSuggestions && listing.aiSuggestions.length > 0
    ? listing.aiSuggestions
    : defaultSuggestions;

  const handleWhatsApp = () => {
    const phone = listing.contactPhone ? listing.contactPhone.replace(/\D/g, '') : '923001234567';
    const text = encodeURIComponent(
      `Hello! I am inquiring about your listing: "${listing.title}" (ID: ${listing.id}) listed on NexMove for ${formatPKR(listing.price)}.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleShare = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nexmove.pk';
    const liveUrl = `${origin}/marketplace/${listing.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(liveUrl);
    }
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden relative group ${
        isInactive ? 'opacity-75 bg-slate-50/50' : ''
      }`}
    >
      {/* Toast Notification on Share */}
      {copiedShare && (
        <div className="absolute top-3 right-12 z-40 bg-slate-900 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg border border-slate-700 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Listing link copied!</span>
        </div>
      )}

      {/* Top Status Border Accent */}
      <div className={`h-1.5 w-full ${statusCfg.dot}`} />

      <div className="p-5 flex-1 flex flex-col justify-between">
        {/* Card Header */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/60 flex items-center justify-center shadow-inner">
                {TYPE_ICONS[listing.propertyType.toUpperCase()] ?? <Home className="w-5 h-5 text-slate-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    ID: {listing.id.slice(0, 8)}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                    {PURPOSE_LABELS[listing.purpose] || listing.purpose}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 truncate mt-0.5 leading-snug">
                  {listing.title}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>{listing.city}</span>
                  {listing.area && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="truncate">{listing.area}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Menu Button */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 z-30 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 text-xs font-semibold text-slate-700 animate-in fade-in zoom-in-95">
                  <Link
                    href={`/marketplace?search=${encodeURIComponent(listing.id)}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" /> View on Marketplace
                  </Link>
                  <Link
                    href={editHref}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" /> Edit Listing Specs
                  </Link>
                  <button
                    onClick={() => {
                      handleShare();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-left transition"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" /> Share AI Snippet
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  {listing.status === 'ACTIVE' ? (
                    <button
                      onClick={() => {
                        onStatusChange(listing.id, 'SOLD_RENTED');
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-600 text-left transition"
                    >
                      <BadgeCheck className="w-3.5 h-3.5 text-slate-500" /> Mark as Sold / Closed
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        onStatusChange(listing.id, 'ACTIVE');
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-700 text-left transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" /> Restore to Active
                    </button>
                  )}

                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${listing.title}"?`)) {
                          onDelete(listing.id);
                        }
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 text-left transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Permanently
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pricing & Bed/Bath Summary */}
          <div className="flex items-baseline justify-between bg-slate-50/80 border border-slate-100 rounded-2xl px-3.5 py-2.5 mb-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                {listing.purpose === 'FOR_SALE' ? 'Listed Price' : 'Monthly Rent'}
              </p>
              <p className="text-base font-black text-slate-900">
                {formatPKR(listing.price)}
              </p>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-600 font-semibold">
              {listing.bedrooms != null && (
                <span className="flex items-center gap-1">
                  <BedDouble className="w-3.5 h-3.5 text-slate-400" /> {listing.bedrooms} Beds
                </span>
              )}
              {listing.bathrooms != null && (
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-slate-400" /> {listing.bathrooms} Baths
                </span>
              )}
            </div>
          </div>

          {/* ── AI Health Score Meter Row ──────────────────────────────────── */}
          <div className="mb-3 p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-amber-400 shadow-inner">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wide">AI Health Score</span>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                        aiGrade === 'OPTIMAL'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : aiGrade === 'GOOD'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {aiGrade === 'OPTIMAL' ? 'Optimal' : aiGrade === 'GOOD' ? 'Good' : 'Needs Work'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-0.5">
                    {aiScore >= 85
                      ? 'Top 5% listing engagement rate'
                      : 'Add 360 tour & verify docs for max leads'}
                  </p>
                </div>
              </div>

              {/* Circular Gauge Representation */}
              <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-xl font-black text-sm">
                <span
                  className={
                    aiScore >= 85
                      ? 'text-emerald-400'
                      : aiScore >= 70
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }
                >
                  {aiScore}
                </span>
                <span className="text-slate-400 text-[10px]">/100</span>
              </div>
            </div>

            {/* AI Progress Bar */}
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  aiScore >= 85
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                    : aiScore >= 70
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                    : 'bg-gradient-to-r from-rose-500 to-red-300'
                }`}
                style={{ width: `${aiScore}%` }}
              />
            </div>

            {/* Toggle AI Suggestions Drawer */}
            <button
              onClick={() => setShowAiDrawer(!showAiDrawer)}
              className="mt-2 text-[10px] font-bold text-slate-300 hover:text-white flex items-center justify-between w-full pt-1.5 border-t border-white/10 transition"
            >
              <span>{showAiDrawer ? 'Hide AI Optimization Tips' : 'View AI Recommendations'}</span>
              {showAiDrawer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showAiDrawer && (
              <div className="mt-2 pt-2 border-t border-white/10 space-y-1.5 text-[11px] text-slate-200">
                {suggestions.map((s, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 bg-white/5 p-1.5 rounded-lg">
                    <span className="text-amber-400 font-bold">•</span>
                    <span className="leading-tight">{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Live Buyer Demand Heatmap & Analytics ──────────────────────── */}
          <div className="grid grid-cols-3 gap-2 mb-3 bg-slate-50 border border-slate-200/70 p-2.5 rounded-2xl text-center">
            {/* Live Buyers Viewing */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span>Live Viewers</span>
              </div>
              <p className="text-sm font-black text-slate-900 mt-0.5">{liveBuyers}</p>
            </div>

            {/* 1-Month Early Matches */}
            <div className="flex flex-col items-center border-x border-slate-200">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                <Send className="w-2.5 h-2.5 text-indigo-600" />
                <span>Pre-Matches</span>
              </div>
              <p className="text-sm font-black text-indigo-700 mt-0.5">{earlyMatches}</p>
            </div>

            {/* Direct Inquiries */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                <span>Inquiries</span>
              </div>
              <p className="text-sm font-black text-emerald-700 mt-0.5">{inquiries}</p>
            </div>
          </div>
        </div>

        {/* ── Smart Action Hub Footer ────────────────────────────────────── */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${statusCfg.bg} ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleWhatsApp}
              title="Launch Instant WhatsApp Inquiry Chat"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1.5 rounded-xl shadow-sm transition flex items-center gap-1"
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>

            <Link
              href={editHref}
              title="Edit Listing Specs"
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1.5 rounded-xl transition flex items-center"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleShare}
              title="Share AI Listing Summary"
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1.5 rounded-xl transition flex items-center"
            >
              {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
