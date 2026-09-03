// src/components/FeaturedSponsoredSection.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

interface ActivePromotion {
  id: string;
  type: string;
  entityId: string;
  entityTitle: string;
  entityImage?: string | null;
  entityCity?: string | null;
  entityPrice?: number | null;
  package: string;
  budgetPKR: number;
  ownerName?: string | null;
}

interface FeaturedSponsoredSectionProps {
  placement?: 'HOMEPAGE' | 'SEARCH_TOP' | 'SIDEBAR';
  city?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
}

export default function FeaturedSponsoredSection({
  placement = 'HOMEPAGE',
  city,
  title = '⭐ Featured & Sponsored Listings',
  subtitle = 'Top verified properties with exclusive prime priority visibility',
  limit = 6,
}: FeaturedSponsoredSectionProps) {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivePromos = async () => {
      try {
        setLoading(true);
        let url = `/api/promotions/active?placement=${placement}&limit=${limit}`;
        if (city) url += `&city=${encodeURIComponent(city)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (data?.success && Array.isArray(data.promotions)) {
          setPromotions(data.promotions);

          // Track impressions / views
          if (data.promoIds && data.promoIds.length > 0) {
            fetch('/api/promotions/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                promotionIds: data.promoIds,
                type: placement === 'SEARCH_TOP' ? 'search_impression' : 'view',
              }),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Could not fetch featured promotions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePromos();
  }, [placement, city, limit]);

  const handleCardClick = (promoId: string) => {
    fetch('/api/promotions/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promotionIds: [promoId],
        type: 'click',
      }),
    }).catch(() => {});
  };

  if (loading) {
    return null; // Silent load
  }

  if (promotions.length === 0) {
    return null; // Don't render section if no active ads
  }

  if (placement === 'SEARCH_TOP') {
    return (
      <div className="mb-6 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Sponsored Results
          </span>
          <span className="text-xs text-slate-400 font-medium">Promoted by verified sellers</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promo) => {
            const targetUrl =
              promo.type === 'AGENCY_PROFILE'
                ? `/agencies/${promo.entityId}`
                : `/marketplace/${promo.entityId}`;

            return (
              <Link
                key={promo.id}
                href={targetUrl}
                onClick={() => handleCardClick(promo.id)}
                className="group bg-gradient-to-br from-slate-900 to-slate-900/90 border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-4 shadow-lg shadow-amber-950/20 transition relative flex flex-col justify-between"
              >
                <span className="absolute top-3 right-3 text-[9px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase shadow">
                  ⭐ Featured Ad
                </span>

              <div className="flex items-start gap-3">
                {promo.entityImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={promo.entityImage}
                    alt={promo.entityTitle}
                    className="w-20 h-16 object-cover rounded-xl border border-slate-700 flex-shrink-0 group-hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-20 h-16 bg-slate-800 rounded-xl flex items-center justify-center text-2xl border border-slate-700 flex-shrink-0">
                    🏢
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition truncate">
                    {promo.entityTitle}
                  </h4>
                  {promo.entityCity && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      {promo.entityCity}
                    </p>
                  )}
                  {promo.entityPrice && (
                    <p className="text-sm font-black text-emerald-400 mt-1">
                      Rs. {promo.entityPrice.toLocaleString('en-PK')}
                    </p>
                  )}
                </div>
              </div>

              {promo.ownerName && (
                <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Listed by {promo.ownerName}</span>
                  <span className="text-amber-400 font-bold flex items-center gap-0.5">
                    View <ExternalLink className="w-2.5 h-2.5" />
                  </span>
                </div>
              )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Default Homepage Showcase
  return (
    <div className="bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-950 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-8">
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full font-black uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Verified Promoted Ads
            </span>
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              🔥 Top Priority
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white mt-2">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>

        <Link
          href="/marketplace"
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1 self-start sm:self-center"
        >
          <span>Explore All Properties</span>
          <span>→</span>
        </Link>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {promotions.map((promo) => {
          const targetUrl =
            promo.type === 'AGENCY_PROFILE'
              ? `/agencies/${promo.entityId}`
              : `/marketplace/${promo.entityId}`;

          return (
            <Link
              key={promo.id}
              href={targetUrl}
              onClick={() => handleCardClick(promo.id)}
              className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/60 rounded-2xl overflow-hidden shadow-lg transition flex flex-col justify-between"
            >
              <div className="relative h-44 bg-slate-950 overflow-hidden">
              {promo.entityImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={promo.entityImage}
                  alt={promo.entityTitle}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-slate-900 to-slate-800">
                  🏢
                </div>
              )}
              <div className="absolute top-3 left-3 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow">
                ⭐ Featured
              </div>
              {promo.entityCity && (
                <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm text-slate-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-700">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{promo.entityCity}</span>
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-black text-slate-100 group-hover:text-emerald-400 transition line-clamp-1">
                  {promo.entityTitle}
                </h4>
                {promo.ownerName && (
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>{promo.ownerName}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                {promo.entityPrice ? (
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Demand</span>
                    <p className="text-sm font-black text-emerald-400">
                      Rs. {promo.entityPrice.toLocaleString('en-PK')}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs font-bold text-emerald-400">Verified Listing</span>
                )}

                <span className="text-xs font-bold bg-slate-800 group-hover:bg-emerald-600 text-slate-200 group-hover:text-white px-3 py-1.5 rounded-xl transition">
                  View Deal →
                </span>
              </div>
            </div>
          </Link>
        );
      })}
      </div>
    </div>
  );
}
