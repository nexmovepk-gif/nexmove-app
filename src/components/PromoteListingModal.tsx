// src/components/PromoteListingModal.tsx
'use client';

import React, { useState } from 'react';
import {
  Rocket,
  CheckCircle2,
  X,
  CreditCard,
  Flame,
  ShieldCheck,
  Eye,
  Search,
  Layout,
  Loader2,
} from 'lucide-react';

export interface PromoteTargetItem {
  id: string;
  title: string;
  image?: string | null;
  city?: string | null;
  price?: number | null;
  type?: 'PROPERTY' | 'AGENCY_PROFILE';
}

interface PromoteListingModalProps {
  item: PromoteTargetItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PROMOTION_PACKAGES = [
  {
    id: 'BASIC',
    label: 'Basic Boost',
    days: 7,
    pricePKR: 1000,
    dailyCost: 143,
    badge: 'Starter',
    features: ['7 Days Live', 'Standard Visibility', 'Search Boost', 'Live Analytics'],
  },
  {
    id: 'STANDARD',
    label: 'Standard Pro',
    days: 15,
    pricePKR: 1750,
    dailyCost: 116,
    badge: 'Popular 🔥',
    isPopular: true,
    features: ['15 Days Live', 'Homepage Showcase', 'Search Top Placement', '2x Impression Multiplier'],
  },
  {
    id: 'PREMIUM',
    label: 'Premium Dominance',
    days: 30,
    pricePKR: 3000,
    dailyCost: 100,
    badge: 'Best Value ⭐',
    features: ['30 Days Live', 'Top Priority Homepage', 'Search Rank #1 Badge', 'Sidebar Featured Slot', '3x More Buyer Inquiries'],
  },
];

export default function PromoteListingModal({
  item,
  isOpen,
  onClose,
  onSuccess,
}: PromoteListingModalProps) {
  const [selectedPkg, setSelectedPkg] = useState<'BASIC' | 'STANDARD' | 'PREMIUM'>('STANDARD');
  const [placements, setPlacements] = useState<string[]>(['HOMEPAGE', 'SEARCH_TOP']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const currentPkg = PROMOTION_PACKAGES.find((p) => p.id === selectedPkg) || PROMOTION_PACKAGES[1];

  const togglePlacement = (placementKey: string) => {
    if (placements.includes(placementKey)) {
      if (placements.length > 1) {
        setPlacements(placements.filter((p) => p !== placementKey));
      }
    } else {
      setPlacements([...placements, placementKey]);
    }
  };

  const handleCreateCheckout = async (autoActivateDirect: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/promotions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: item.type || 'PROPERTY',
          entityId: item.id,
          entityTitle: item.title,
          entityImage: item.image,
          entityCity: item.city,
          entityPrice: item.price,
          package: selectedPkg,
          placements,
          autoActivate: autoActivateDirect,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize ad promotion');
      }

      if (autoActivateDirect || !data.checkoutUrl) {
        if (onSuccess) onSuccess();
        onClose();
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      console.error('Promotion error:', err);
      setError(err instanceof Error ? err.message : 'Error starting promotion');
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#0b0f19] border border-emerald-500/30 rounded-3xl max-w-2xl w-full shadow-2xl shadow-emerald-950/50 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Boost Listing & Run Ad</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  50% Off Special
                </span>
              </div>
              <p className="text-xs text-slate-400">Maximize views, verified leads, and top search ranking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Target Item Preview */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3.5">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.image}
                alt={item.title}
                className="w-16 h-14 object-cover rounded-xl border border-slate-700 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-xl border border-slate-700 flex-shrink-0">
                🏢
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                Target Listing
              </span>
              <h4 className="text-sm font-bold text-slate-100 truncate">{item.title}</h4>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                {item.city && <span>📍 {item.city}</span>}
                {item.price && (
                  <span className="font-semibold text-emerald-400">
                    Rs. {item.price.toLocaleString('en-PK')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Package Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              1. Choose Ad Duration & Budget
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PROMOTION_PACKAGES.map((pkg) => {
                const isSelected = selectedPkg === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id as 'BASIC' | 'STANDARD' | 'PREMIUM')}
                    className={`relative cursor-pointer rounded-2xl p-4 border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    {pkg.badge && (
                      <span
                        className={`absolute -top-2.5 right-3 text-[9px] font-black px-2 py-0.5 rounded-full border ${
                          pkg.isPopular
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : isSelected
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {pkg.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{pkg.label}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-white">
                            Rs. {pkg.pricePKR.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {pkg.days} days (Rs. {pkg.dailyCost}/day)
                        </span>
                      </div>
                    </div>

                    <ul className="mt-3 space-y-1 border-t border-slate-800/80 pt-2.5">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="text-[10px] text-slate-300 flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Placement Customizer */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-teal-400" />
              2. Select Ad Placements
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  key: 'HOMEPAGE',
                  title: 'Homepage Featured',
                  desc: 'Top hero carousel visible to all visitors',
                  icon: <Eye className="w-3.5 h-3.5 text-emerald-400" />,
                },
                {
                  key: 'SEARCH_TOP',
                  title: 'Search Results Top',
                  desc: 'Pinned above all organic property search results',
                  icon: <Search className="w-3.5 h-3.5 text-teal-400" />,
                },
                {
                  key: 'SIDEBAR',
                  title: 'Sidebar Recommended',
                  desc: 'Shown on property details & directory pages',
                  icon: <Layout className="w-3.5 h-3.5 text-indigo-400" />,
                },
              ].map((pl) => {
                const checked = placements.includes(pl.key);
                return (
                  <div
                    key={pl.key}
                    onClick={() => togglePlacement(pl.key)}
                    className={`cursor-pointer p-3 rounded-xl border transition flex items-start gap-2.5 ${
                      checked
                        ? 'bg-slate-800/90 border-teal-500/50 text-slate-100'
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 rounded accent-emerald-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-slate-200">
                        {pl.icon}
                        <span>{pl.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{pl.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-xs">
              <span className="text-slate-400">Total Investment: </span>
              <strong className="text-sm font-black text-white">
                Rs. {currentPkg.pricePKR.toLocaleString()}
              </strong>
              <span className="text-[10px] text-emerald-400 ml-1">({currentPkg.days} Days Live)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleCreateCheckout(true)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2.5 rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5"
              title="Instant Direct Activation for Testing"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>⚡ Instant Test Launch</>}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleCreateCheckout(false)}
              className="flex-1 sm:flex-initial text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black px-5 py-2.5 rounded-xl transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Preparing Stripe Checkout...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Pay with Stripe →</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
