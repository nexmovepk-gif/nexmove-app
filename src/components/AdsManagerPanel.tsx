// src/components/AdsManagerPanel.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  TrendingUp,
  Eye,
  Search,
  MousePointerClick,
  Clock,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Trash2,
  RefreshCw,
  Plus,
  Loader2,
} from 'lucide-react';
import PromoteListingModal, { PromoteTargetItem } from './PromoteListingModal';

export interface PromotionItem {
  id: string;
  type: string;
  entityId: string;
  entityTitle: string;
  entityImage?: string | null;
  entityCity?: string | null;
  entityPrice?: number | null;
  package: string;
  durationDays: number;
  budgetPKR: number;
  placements: string[];
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'REJECTED';
  startDate?: string | null;
  endDate?: string | null;
  viewsCount: number;
  clicksCount: number;
  searchImpressions: number;
  remainingDays?: number;
  remainingHours?: number;
  isExpiringSoon?: boolean;
  createdAt: string;
}

export interface PromotionMetrics {
  activeCount: number;
  pendingCount: number;
  pausedCount: number;
  expiredCount: number;
  totalViews: number;
  totalClicks: number;
  totalSearchImpressions: number;
  totalSpendPKR: number;
}

interface AdsManagerPanelProps {
  availableListings?: {
    id: string;
    title: string;
    image?: string | null;
    city?: string | null;
    price?: number | null;
  }[];
  userRole?: string;
  isAgency?: boolean;
}

export default function AdsManagerPanel({
  availableListings = [],
  isAgency = false,
}: AdsManagerPanelProps) {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [metrics, setMetrics] = useState<PromotionMetrics>({
    activeCount: 0,
    pendingCount: 0,
    pausedCount: 0,
    expiredCount: 0,
    totalViews: 0,
    totalClicks: 0,
    totalSearchImpressions: 0,
    totalSpendPKR: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Promote Modal state
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [selectedListingForPromo, setSelectedListingForPromo] = useState<PromoteTargetItem | null>(null);

  const fetchMyPromotions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/promotions/my');
      const data = await res.json();
      if (data?.success) {
        setPromotions(data.promotions || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.warn('Error fetching promotions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyPromotions();
  }, [fetchMyPromotions]);

  const handleTogglePause = async (promoId: string) => {
    try {
      setActionLoading(`pause-${promoId}`);
      const res = await fetch('/api/promotions/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionId: promoId,
          action: 'TOGGLE_PAUSE',
        }),
      });
      if (res.ok) {
        await fetchMyPromotions();
      }
    } catch (err) {
      console.error('Error toggling ad status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtendPromo = async (promoId: string, days: number = 7) => {
    try {
      setActionLoading(`extend-${promoId}`);
      const res = await fetch('/api/promotions/manage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promotionId: promoId,
          action: 'EXTEND',
          extendDays: days,
        }),
      });
      if (res.ok) {
        await fetchMyPromotions();
      }
    } catch (err) {
      console.error('Error extending ad:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePromo = async (promoId: string) => {
    if (!confirm('Are you sure you want to remove this promotion campaign?')) return;
    try {
      setActionLoading(`delete-${promoId}`);
      const res = await fetch(`/api/promotions/manage?id=${promoId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchMyPromotions();
      }
    } catch (err) {
      console.error('Error deleting ad:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenPromote = (listing?: PromoteTargetItem) => {
    if (listing) {
      setSelectedListingForPromo(listing);
    } else if (availableListings.length > 0) {
      const first = availableListings[0];
      setSelectedListingForPromo({
        id: first.id,
        title: first.title,
        image: first.image,
        city: first.city,
        price: first.price,
      });
    } else {
      setSelectedListingForPromo({
        id: 'direct-promo',
        title: isAgency ? 'Agency Featured Profile' : 'Featured Listing Showcase',
        type: isAgency ? 'AGENCY_PROFILE' : 'PROPERTY',
      });
    }
    setPromoteModalOpen(true);
  };

  const filteredPromotions = promotions.filter((p) => {
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* ── Top Header & Stats Cards ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">Ads & Campaigns Manager</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  Self-Serve Ad Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Track views, search clicks, manage live campaigns, and boost platform visibility
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={fetchMyPromotions}
              disabled={loading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={() => handleOpenPromote()}
              className="flex-1 sm:flex-initial bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-5 py-3 rounded-xl transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Launch New Campaign</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 pt-6">
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Active Ads</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-white">{metrics.activeCount}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">Live now</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Views</span>
              <Eye className="w-4 h-4 text-teal-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-white">{metrics.totalViews.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">Impressions</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Search Appearances</span>
              <Search className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-white">{metrics.totalSearchImpressions.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">Search matches</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Clicks</span>
              <MousePointerClick className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-white">{metrics.totalClicks.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 ml-1.5">Buyer clicks</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Ad Spend</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-white">Rs. {metrics.totalSpendPKR.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-400 ml-1.5">PKR</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Filter Tabs ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl overflow-x-auto">
          {[
            { key: 'ALL', label: `All Ads (${promotions.length})` },
            { key: 'ACTIVE', label: `Active (${metrics.activeCount})`, color: 'text-emerald-400' },
            { key: 'PENDING', label: `Pending (${metrics.pendingCount})`, color: 'text-amber-400' },
            { key: 'PAUSED', label: `Paused (${metrics.pausedCount})`, color: 'text-slate-400' },
            { key: 'EXPIRED', label: `Expired (${metrics.expiredCount})`, color: 'text-rose-400' },
          ].map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition ${
                  isActive
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span className={tab.color}>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {availableListings.length > 0 && (
          <span className="text-xs text-slate-400">
            {availableListings.length} properties available to boost
          </span>
        )}
      </div>

      {/* ── Promotions List / Cards ─────────────────────────────────────── */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-xs font-bold">Loading your active campaigns & real-time analytics...</p>
        </div>
      ) : filteredPromotions.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center text-3xl">
            🚀
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-black text-slate-200">No Ads Found in this filter</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Boost your properties to the top of search results and homepage to reach 5x more verified buyers.
            </p>
          </div>
          <button
            onClick={() => handleOpenPromote()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition shadow-lg shadow-emerald-950 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Your First Ad Campaign</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPromotions.map((promo) => {
            const isActive = promo.status === 'ACTIVE';
            const isPaused = promo.status === 'PAUSED';
            const isPending = promo.status === 'PENDING';
            const isExpired = promo.status === 'EXPIRED';

            const isCurrentAction = actionLoading?.includes(promo.id);

            return (
              <div
                key={promo.id}
                className={`bg-slate-900 border rounded-3xl p-5 shadow-lg flex flex-col justify-between gap-4 transition ${
                  isActive
                    ? 'border-emerald-500/40 hover:border-emerald-500'
                    : isPaused
                    ? 'border-amber-500/30'
                    : isExpired
                    ? 'border-slate-800 opacity-80'
                    : 'border-slate-800'
                }`}
              >
                <div>
                  {/* Top Row: Status Badge + Expiry Timer */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isPaused
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : isPending
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive
                              ? 'bg-emerald-400 animate-pulse'
                              : isPaused
                              ? 'bg-amber-400'
                              : isPending
                              ? 'bg-blue-400'
                              : 'bg-slate-500'
                          }`}
                        />
                        {promo.status}
                      </span>

                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                        {promo.package} ({promo.durationDays}D)
                      </span>
                    </div>

                    {isActive && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {promo.remainingDays !== undefined && promo.remainingDays > 0
                            ? `${promo.remainingDays}d ${promo.remainingHours || 0}h left`
                            : 'Expires today'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Target Info */}
                  <div className="flex items-start gap-3 mt-3.5">
                    {promo.entityImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={promo.entityImage}
                        alt={promo.entityTitle}
                        className="w-16 h-16 object-cover rounded-2xl border border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 flex-shrink-0">
                        🏢
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-slate-100 truncate">{promo.entityTitle}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                        {promo.entityCity && <span>📍 {promo.entityCity}</span>}
                        {promo.entityPrice && (
                          <span className="font-bold text-emerald-400">
                            Rs. {promo.entityPrice.toLocaleString('en-PK')}
                          </span>
                        )}
                      </div>

                      {/* Placements Badges */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {promo.placements.map((pl) => (
                          <span
                            key={pl}
                            className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-800/80 text-teal-300 border border-teal-500/20"
                          >
                            {pl === 'HOMEPAGE'
                              ? '🏠 Homepage'
                              : pl === 'SEARCH_TOP'
                              ? '🔍 Search #1'
                              : '📌 Sidebar'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Performance Analytics Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-3 mt-4">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Views</span>
                      <span className="text-sm font-black text-white flex items-center gap-1 mt-0.5">
                        <Eye className="w-3.5 h-3.5 text-teal-400" />
                        {promo.viewsCount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col border-x border-slate-800/80 px-2">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Searches</span>
                      <span className="text-sm font-black text-white flex items-center gap-1 mt-0.5">
                        <Search className="w-3.5 h-3.5 text-indigo-400" />
                        {promo.searchImpressions.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-col pl-2">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Clicks</span>
                      <span className="text-sm font-black text-emerald-400 flex items-center gap-1 mt-0.5">
                        <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                        {promo.clicksCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 font-semibold">
                    Budget: <strong className="text-slate-200">Rs. {promo.budgetPKR.toLocaleString()}</strong>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Pause/Resume */}
                    {(isActive || isPaused) && (
                      <button
                        disabled={Boolean(isCurrentAction)}
                        onClick={() => handleTogglePause(promo.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                        title={isActive ? 'Temporarily Pause Ad' : 'Resume Live Ad'}
                      >
                        {isCurrentAction && actionLoading === `pause-${promo.id}` ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isActive ? (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Pause</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Resume</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Extend / Renew Button */}
                    <button
                      disabled={Boolean(isCurrentAction)}
                      onClick={() => handleExtendPromo(promo.id, 7)}
                      className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                      title="Extend campaign duration by 7 days"
                    >
                      {isCurrentAction && actionLoading === `extend-${promo.id}` ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3 text-emerald-400" />
                          <span>+7 Days</span>
                        </>
                      )}
                    </button>

                    {/* Delete / Remove */}
                    <button
                      disabled={Boolean(isCurrentAction)}
                      onClick={() => handleDeletePromo(promo.id)}
                      className="p-2 bg-slate-800/80 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700/80 hover:border-red-500/30 transition"
                      title="Delete Campaign"
                    >
                      {isCurrentAction && actionLoading === `delete-${promo.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Promote Modal ───────────────────────────────────────────────── */}
      <PromoteListingModal
        item={selectedListingForPromo}
        isOpen={promoteModalOpen}
        onClose={() => setPromoteModalOpen(false)}
        onSuccess={() => {
          fetchMyPromotions();
        }}
      />
    </div>
  );
}
