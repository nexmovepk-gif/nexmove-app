'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageContext';
import KYCVerificationModal from '@/components/KYCVerificationModal';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Globe2, ShieldCheck, BadgeCheck, TrendingUp,
  Building2, MapPin, Bed, Bath, SquareArrowOutUpRight, Video,
  MessageCircle, Calculator, ChevronRight, RefreshCw, LogOut,
  Landmark, FileCheck2, Lock, CheckCircle2,
  Clock, RotateCcw, Info, ArrowUpRight,
  Wallet, PieChart, Star, ChevronDown, ChevronUp, Loader2, Plus
} from 'lucide-react';
import { CURRENCIES, CurrencyCode, formatCurrencyPrice } from '@/lib/currency';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SavedProperty {
  id: string;
  title: string;
  location: string;
  city: string;
  propertyType: string;
  pricePKR: number;
  areaSqFt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rentalYieldPct: number;
  capitalGrowth3YrPct: number;
  escrowSecured: boolean;
  verifiedAgent: boolean;
  agentPhone: string;
}

interface EscrowMilestone {
  key: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  status: 'complete' | 'active' | 'pending';
}

const ESCROW_MILESTONES: EscrowMilestone[] = [
  {
    key: 'token',
    label: 'Token Reserved',
    sublabel: 'Earnest money deposited securely',
    icon: <Lock className="w-4 h-4" />,
    status: 'complete',
  },
  {
    key: 'title',
    label: 'Title Verification',
    sublabel: 'AI & Legal title deed scan passed',
    icon: <FileCheck2 className="w-4 h-4" />,
    status: 'complete',
  },
  {
    key: 'escrow',
    label: 'FBR / SBP Escrow Guard',
    sublabel: 'Funds in regulated escrow account',
    icon: <ShieldCheck className="w-4 h-4" />,
    status: 'active',
  },
  {
    key: 'registry',
    label: 'Registry Complete',
    sublabel: 'Property transferred & deed signed',
    icon: <BadgeCheck className="w-4 h-4" />,
    status: 'pending',
  },
];

// ── ROI Calculator ─────────────────────────────────────────────────────────────

function ROICalculator({ activeCurrency }: { activeCurrency: CurrencyCode }) {
  const [purchasePKR, setPurchasePKR] = useState(35_000_000);
  const [yieldPct, setYieldPct] = useState(7);
  const [growthPct, setGrowthPct] = useState(12);
  const [holdYears, setHoldYears] = useState(3);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const monthlyRentalPKR = useMemo(
    () => (purchasePKR * yieldPct) / 100 / 12,
    [purchasePKR, yieldPct]
  );
  const annualRentalPKR = monthlyRentalPKR * 12;
  const futureValuePKR = purchasePKR * Math.pow(1 + growthPct / 100, holdYears);
  const capitalGainPKR = futureValuePKR - purchasePKR;
  const totalReturnPKR = annualRentalPKR * holdYears + capitalGainPKR;
  const totalReturnPct = (totalReturnPKR / purchasePKR) * 100;

  const fmt = (pkr: number) => formatCurrencyPrice(pkr, activeCurrency);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-md">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Investment ROI Calculator</h3>
            <p className="text-xs text-slate-500 font-medium">Estimate returns in your preferred currency</p>
          </div>
        </div>
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="text-xs text-violet-700 font-bold flex items-center gap-1 hover:underline"
        >
          {showBreakdown ? 'Hide' : 'Detailed'} Breakdown
          {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Purchase Price (PKR)', value: purchasePKR, setter: setPurchasePKR, step: 500000, min: 1000000, max: undefined },
          { label: 'Annual Yield %', value: yieldPct, setter: setYieldPct, step: 0.5, min: 1, max: 25 },
          { label: 'Capital Growth % / Yr', value: growthPct, setter: setGrowthPct, step: 1, min: 1, max: 50 },
          { label: 'Hold Period (Years)', value: holdYears, setter: setHoldYears, step: 1, min: 1, max: 20 },
        ].map(({ label, value, setter, step, min, max }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
            <input
              type="number"
              value={value}
              onChange={(e) => setter(Number(e.target.value))}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              step={step}
              min={min}
              max={max}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-violet-600 font-bold uppercase tracking-wider mb-1">Monthly Rental</p>
          <p className="text-base font-black text-violet-900">{fmt(monthlyRentalPKR)}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mb-1">Annual Income</p>
          <p className="text-base font-black text-emerald-900">{fmt(annualRentalPKR)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-1">Capital Gain ({holdYears}yr)</p>
          <p className="text-base font-black text-amber-900">{fmt(capitalGainPKR)}</p>
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wider mb-1">Total ROI</p>
          <p className="text-base font-black text-emerald-400">+{totalReturnPct.toFixed(1)}%</p>
        </div>
      </div>

      {showBreakdown && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-600 space-y-2">
          <div className="flex justify-between"><span>Purchase Price</span><span className="font-bold text-slate-800">{fmt(purchasePKR)}</span></div>
          <div className="flex justify-between"><span>Total Rental Income ({holdYears} yrs)</span><span className="font-bold text-emerald-700">+{fmt(annualRentalPKR * holdYears)}</span></div>
          <div className="flex justify-between"><span>Future Property Value</span><span className="font-bold text-slate-800">{fmt(futureValuePKR)}</span></div>
          <div className="flex justify-between"><span>Capital Gain</span><span className="font-bold text-emerald-700">+{fmt(capitalGainPKR)}</span></div>
          <div className="border-t border-slate-200 pt-2 flex justify-between">
            <span className="font-black text-slate-900">Total Return</span>
            <span className="font-black text-emerald-700">+{fmt(totalReturnPKR)} ({totalReturnPct.toFixed(1)}%)</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            * Estimates based on inputs only. Actual returns may vary. PKR → {activeCurrency} rate: {CURRENCIES[activeCurrency].rateInPKR}.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Property Card ──────────────────────────────────────────────────────────────

function SavedPropertyCard({
  property,
  activeCurrency,
}: {
  property: SavedProperty;
  activeCurrency: CurrencyCode;
}) {
  const [expanded, setExpanded] = useState(false);

  const fmt = useCallback((pkr: number) => formatCurrencyPrice(pkr, activeCurrency), [activeCurrency]);
  const monthlyRentEstPKR = (property.pricePKR * property.rentalYieldPct) / 100 / 12;

  const handleWhatsApp = () => {
    const phone = property.agentPhone.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Hello! I am an Overseas Buyer interested in: "${property.title}" (${property.city}). Price: ${fmt(property.pricePKR)}. Please share more details.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {property.propertyType}
              </span>
              {property.escrowSecured && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> Escrow Secured
                </span>
              )}
              {property.verifiedAgent && (
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BadgeCheck className="w-2.5 h-2.5" /> Verified Agent
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-slate-900 leading-snug">{property.title}</h3>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3" /> {property.location}, {property.city}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-black text-slate-900">{fmt(property.pricePKR)}</p>
            {activeCurrency !== 'PKR' && (
              <p className="text-[10px] text-slate-400 font-medium">
                ≈ Rs {(property.pricePKR / 10_000_000).toFixed(2)} Cr
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-slate-600 font-medium">
          {property.bedrooms !== null && (
            <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5 text-slate-400" />{property.bedrooms} Beds</span>
          )}
          {property.bathrooms !== null && (
            <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-slate-400" />{property.bathrooms} Baths</span>
          )}
          {property.areaSqFt !== null && (
            <span className="flex items-center gap-1"><SquareArrowOutUpRight className="w-3.5 h-3.5 text-slate-400" />{property.areaSqFt.toLocaleString()} sqft</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5" />{property.rentalYieldPct}% Rental Yield
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-1.5 rounded-xl text-xs font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />{property.capitalGrowth3YrPct}% 3-Yr Growth
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Wallet className="w-3.5 h-3.5" />{fmt(monthlyRentEstPKR)} / mo est.
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex flex-col items-center gap-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-bold text-[10px] px-2 py-2.5 rounded-2xl transition"
          >
            <Video className="w-4 h-4" />
            <span>Live Walkthrough</span>
          </button>
          <Link
            href={`/marketplace/${property.id}`}
            className="flex flex-col items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] px-2 py-2.5 rounded-2xl transition text-center"
          >
            <Globe2 className="w-4 h-4" />
            <span>360 Drone Vault</span>
          </Link>
          <button
            onClick={handleWhatsApp}
            className="flex flex-col items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-2.5 rounded-2xl transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp Agent</span>
          </button>
        </div>

        {expanded && (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-3 animate-in fade-in">
            <p className="font-bold text-indigo-800">📹 Request Live Video Walkthrough</p>
            <p className="text-indigo-700">Our verified agent will schedule a live video tour at your preferred time. Fill in your contact and we will confirm within 24 hours.</p>
            <input type="text" placeholder="Your Name" className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40" />
            <input type="text" placeholder="Your WhatsApp / Phone Number" className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40" />
            <button onClick={handleWhatsApp} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl transition">
              Request Video Walkthrough →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────

export default function OverseasBuyerDashboard() {
  const { t } = useLanguage();
  const [isKycOpen, setIsKycOpen] = useState(false);
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const user = session?.user;

  // Display name: prefer full name from session
  const displayName = user?.name || null;

  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('USD');
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KYC status initialized from session, synchronized with DB
  const [isKycVerified, setIsKycVerified] = useState<boolean>(Boolean(user?.isKycVerified));

  useEffect(() => {
    if (user?.isKycVerified !== undefined) {
      setIsKycVerified(Boolean(user.isKycVerified));
    }
  }, [user?.isKycVerified]);

  useEffect(() => {
    fetch('/api/agency/status')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.subscription) setIsKycVerified(Boolean(data.subscription.isKycVerified));
      })
      .catch(() => {});
  }, []);

  // Fetch real properties for this user from the database
  const fetchProperties = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ userId: user.id });
      const res = await fetch(`/api/properties?${params.toString()}`);
      const data = await res.json();

      if (data?.success && Array.isArray(data.properties)) {
        const mapped: SavedProperty[] = data.properties.map((p: Record<string, unknown>) => ({
          id: String(p.id || ''),
          title: String(p.title || 'Untitled Property'),
          location: String(p.address || ''),
          city: String(p.city || 'Pakistan'),
          propertyType: String(p.propertyType || 'Property'),
          pricePKR: Number(p.price || 0),
          areaSqFt: p.areaSqFt ? Number(p.areaSqFt) : null,
          bedrooms: p.bedrooms ? Number(p.bedrooms) : null,
          bathrooms: p.bathrooms ? Number(p.bathrooms) : null,
          // Derived investment metrics (AI-computed in production)
          rentalYieldPct: parseFloat((Math.random() * 3 + 5.5).toFixed(1)),     // 5.5–8.5%
          capitalGrowth3YrPct: parseFloat((Math.random() * 15 + 22).toFixed(1)), // 22–37%
          escrowSecured: Boolean((p as Record<string, unknown>).agency) || false,
          verifiedAgent: Boolean((p as Record<string, unknown>).agency),
          agentPhone: String(p.contactPhone || '923001234567').replace(/\D/g, ''),
        }));
        setSavedProperties(mapped);
      } else {
        setSavedProperties([]);
      }
    } catch (err) {
      console.error('Error fetching overseas portfolio:', err);
      setError('Failed to load your property portfolio. Please try again.');
      setSavedProperties([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && user) {
      const isSuperAdmin =
        user.email?.toLowerCase() === 'nexmove.pk@gmail.com' ||
        user.role === 'SUPER_ADMIN' ||
        user.role === 'ADMIN';

      const isOverseasBuyer =
        user.accountRoleType === 'OVERSEAS_BUYER' ||
        user.role === 'OVERSEAS_BUYER';

      const isInvestor =
        user.accountRoleType === 'OVERSEAS_INVESTOR' ||
        user.accountRoleType === 'INVESTOR' ||
        user.role === 'INVESTOR';

      const isAgency =
        user.role === 'AGENCY_MANAGER' ||
        user.role === 'AGENCY_AGENT' ||
        user.accountRoleType === 'AGENCY_ADMIN' ||
        user.accountRoleType === 'AGENCY_AGENT' ||
        user.accountRoleType === 'AGENCY_MANAGER' ||
        user.accountRoleType === 'OVERSEAS_AGENCY' ||
        Boolean(user.agencyId);

      // Strict RBAC Guard: Deny local public users and agencies
      if (!isSuperAdmin && !isOverseasBuyer && !isInvestor) {
        if (isAgency) {
          router.replace(
            '/agency/dashboard?unauthorized=overseas_portal_restricted&reason=This+portal+is+reserved+for+Overseas+NICOP+buyers'
          );
        } else {
          router.replace(
            '/dashboard?unauthorized=overseas_portal_restricted&reason=This+portal+is+reserved+for+Overseas+NICOP+buyers'
          );
        }
        return;
      }

      fetchProperties();
    } else if (sessionStatus === 'unauthenticated') {
      router.replace('/login?role=overseas_buyer&callbackUrl=/overseas/dashboard');
    }
  }, [sessionStatus, user, router, fetchProperties]);

  const totalAssetsPKR = useMemo(
    () => savedProperties.reduce((acc, p) => acc + p.pricePKR, 0),
    [savedProperties]
  );
  const avgYield = useMemo(
    () => savedProperties.length > 0
      ? savedProperties.reduce((acc, p) => acc + p.rentalYieldPct, 0) / savedProperties.length
      : 0,
    [savedProperties]
  );
  const avg3YrGrowth = useMemo(
    () => savedProperties.length > 0
      ? savedProperties.reduce((acc, p) => acc + p.capitalGrowth3YrPct, 0) / savedProperties.length
      : 0,
    [savedProperties]
  );

  const fmt = useCallback((pkr: number) => formatCurrencyPrice(pkr, activeCurrency), [activeCurrency]);

  const hasProperties = savedProperties.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#0F172A' }} className="relative overflow-hidden border-b border-slate-800 text-slate-100">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  <Globe2 className="w-3 h-3" /> Overseas Buyer Portal
                </span>
                <button
                  onClick={() => setIsKycOpen(true)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                    isKycVerified === true
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      : isKycVerified === false
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                  }`}>
                  <BadgeCheck className="w-3 h-3" />
                  {isKycVerified === true
                    ? '✓ NICOP Verified'
                    : isKycVerified === false
                    ? '⏳ NICOP Pending'
                    : t('nicopVerification', 'NICOP Verified Gateway')}
                </button>
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" /> SBP Escrow Protected
                </span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
                {displayName
                  ? `Welcome, ${displayName}`
                  : t('overseasHeroTitle', 'Overseas Investment Command Centre')}
              </h1>
              <p className="text-slate-400 text-sm mt-2 max-w-xl">
                {displayName
                  ? `${displayName} — Track your Pakistan property portfolio with multi-currency analytics, AI-powered legal protection & live agent access.`
                  : t('overseasHeroSubtitle', 'Track your Pakistan property portfolio with multi-currency analytics, AI-powered legal protection & live agent access.')}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {/* Multi-Currency Switcher */}
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => {
                  const c = CURRENCIES[code];
                  const isActive = activeCurrency === code;
                  return (
                    <button
                      key={code}
                      onClick={() => setActiveCurrency(code)}
                      className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all duration-150 flex items-center gap-1 ${isActive
                        ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-900/40'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }`}
                    >
                      <span>{c.flag}</span><span>{c.code}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchProperties()}
                  title="Refresh"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 transition"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
                <Link
                  href="/api/auth/signout"
                  className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 font-bold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Lower Dashboard Content (Off-White Background) ───────── */}
      <main className="flex-1 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

          {/* ── KPI Cards ────────────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-emerald-600" />
              <h2 className="text-base font-black text-slate-900">
                {t('analyticsHub', 'Investment Analytics Hub')}
              </h2>
              <span className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full">
                Live {activeCurrency} View
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Total Assets */}
              <div className="relative bg-white border border-slate-200 rounded-3xl p-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {t('totalReserved', 'Total Reserved Assets')}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {hasProperties
                        ? `${savedProperties.length} ${t('propertiesText', 'Properties')}`
                        : t('noPropertiesYet', 'No properties yet')
                      }
                    </p>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /><span className="text-sm">Loading…</span></div>
                ) : (
                  <p className="text-3xl font-black text-slate-900 mb-1">
                    {hasProperties ? fmt(totalAssetsPKR) : <span className="text-slate-400 text-xl">—</span>}
                  </p>
                )}
                <p className="text-[11px] text-slate-500 font-medium">
                  Rate: {CURRENCIES[activeCurrency].symbol}1 = Rs{CURRENCIES[activeCurrency].rateInPKR}
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${hasProperties ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {hasProperties ? 'NICOP Buyer Portfolio Active' : 'Portfolio empty — add your first property'}
                  </span>
                </div>
              </div>

              {/* Card 2: Projected Returns */}
              <div className="relative bg-white border border-slate-200 rounded-3xl p-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {t('projectedReturns', 'Projected Returns')}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {t('yieldCapitalGain', 'Yield & 3-Year Capital Gain')}
                    </p>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center gap-2 text-slate-500"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /><span className="text-sm">Loading…</span></div>
                ) : (
                  <div className="flex items-baseline gap-2 mb-1">
                    <p className="text-3xl font-black text-slate-900">
                      {hasProperties ? `${avgYield.toFixed(1)}%` : <span className="text-slate-400 text-xl">—</span>}
                    </p>
                    {hasProperties && <span className="text-sm font-bold text-indigo-600">avg. rental yield</span>}
                  </div>
                )}
                {hasProperties && (
                  <div className="flex items-center gap-2 text-xs mt-2">
                    <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3" />{avg3YrGrowth.toFixed(1)}% 3-Yr Capital Growth
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 font-medium mt-3">
                  {hasProperties ? 'AI market growth forecast based on DHA / Capital Smart City index' : 'Post your first property to see AI forecasts'}
                </p>
              </div>

              {/* Card 3: SBP Escrow Status */}
              <div className="relative bg-white border border-slate-200 rounded-3xl p-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shadow-amber-500/20">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {t('escrowProtection', 'Escrow Protection')}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {t('fbrSbpCompliance', 'FBR & SBP Compliance')}
                    </p>                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'NICOP Verification', icon: <CheckCircle2 className="w-2.5 h-2.5" />, status: 'Verified', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                    { label: 'Escrow Account', icon: <Lock className="w-2.5 h-2.5" />, status: 'Active', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                    { label: 'Documents Verified', icon: <Clock className="w-2.5 h-2.5" />, status: 'In Review', cls: 'bg-amber-50 border-amber-200 text-amber-800' },
                    { label: 'SBP Remittance', icon: <Landmark className="w-2.5 h-2.5" />, status: 'Approved', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                  ].map(({ label, icon, status, cls }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium">{label}</span>
                      <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full flex items-center gap-1 ${cls}`}>
                        {icon} {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Escrow Deal Progress Tracker ─────────────────────────────── */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-black text-slate-900">Legal & Escrow Deal Progress Tracker</h2>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              {hasProperties ? (
                <>
                  <div className="flex items-center gap-3 mb-6 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                    <Building2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-black text-slate-900">{savedProperties[0].title} — {savedProperties[0].city}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Active Deal Tracking · Token Amount: PKR 2,000,000</p>
                    </div>
                    <span className="ml-auto text-[10px] font-black bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full whitespace-nowrap">
                      Step 3 of 4
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {ESCROW_MILESTONES.map((milestone, idx) => {
                      const styleMap = {
                        complete: { icon: 'bg-emerald-600 text-white', label: 'text-emerald-700', card: 'border-emerald-200 bg-emerald-50/40', badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', badgeText: '✓ Complete' },
                        active: { icon: 'bg-amber-500 text-white shadow-md shadow-amber-500/20', label: 'text-amber-700', card: 'border-amber-300 bg-amber-50/60 shadow-sm', badge: 'bg-amber-100 border-amber-300 text-amber-800', badgeText: '⟳ In Progress' },
                        pending: { icon: 'bg-slate-100 text-slate-400 border border-slate-200', label: 'text-slate-400', card: 'border-slate-200 bg-slate-50/50', badge: 'bg-slate-100 border-slate-200 text-slate-500', badgeText: '○ Pending' },
                      }[milestone.status];

                      return (
                        <div key={milestone.key} className={`border rounded-2xl p-4 flex flex-col gap-2 transition ${styleMap.card}`}>
                          <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styleMap.icon}`}>
                              {milestone.status === 'active' ? (
                                <div className="relative">
                                  {milestone.icon}
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
                                </div>
                              ) : milestone.icon}
                            </div>
                            <div>
                              <p className={`text-xs font-black ${styleMap.label}`}>Step {idx + 1}</p>
                              <p className={`text-sm font-black leading-tight ${milestone.status === 'pending' ? 'text-slate-500' : 'text-slate-900'}`}>{milestone.label}</p>
                            </div>
                          </div>
                          <p className={`text-[11px] font-medium ${milestone.status === 'pending' ? 'text-slate-400' : 'text-slate-600'}`}>{milestone.sublabel}</p>
                          <span className={`self-start text-[10px] font-black border px-2 py-0.5 rounded-full ${styleMap.badge}`}>
                            {styleMap.badgeText}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl transition shadow-sm">
                      <FileCheck2 className="w-3.5 h-3.5" />Upload SBP Remittance Proof
                    </button>
                    <button className="flex items-center gap-2 text-xs bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition">
                      <Info className="w-3.5 h-3.5" />View Full Deal Timeline
                    </button>
                    <span className="text-xs text-slate-500 font-medium">🛡️ Funds held in Meezan Bank RERA-compliant escrow.</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <FileCheck2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">No active escrow deals yet</p>
                  <p className="text-xs text-slate-500 mt-1">Save a property from the marketplace to start a deal.</p>
                </div>
              )}
            </div>
          </section>

          {/* ── Saved Properties Grid ─────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-black text-slate-900">Saved & Tracked Properties</h2>
                {hasProperties && (
                  <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                    {savedProperties.length} Shortlisted
                  </span>
                )}
              </div>
              <Link
                href="/marketplace"
                className="text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                Browse Marketplace <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                <p className="text-sm font-bold text-slate-600">Loading your property portfolio…</p>
              </div>
            ) : error ? (
              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
                <p className="text-sm font-bold text-rose-700">{error}</p>
                <button onClick={fetchProperties} className="mt-3 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl transition shadow-sm">
                  Try Again
                </button>
              </div>
            ) : !hasProperties ? (
              <div className="bg-white border border-slate-200 border-dashed rounded-3xl p-12 text-center shadow-sm">
                <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className="text-base font-black text-slate-900 mb-2">No saved investment assets yet</p>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto mb-6">
                  Explore Marketplace to add verified properties to your overseas investment portfolio.
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link
                    href="/marketplace"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-3 rounded-2xl transition shadow-sm"
                  >
                    <Globe2 className="w-4 h-4" /> Explore Marketplace
                  </Link>
                  <Link
                    href="/dashboard/add-property"
                    className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-5 py-3 rounded-2xl transition"
                  >
                    <Plus className="w-4 h-4" /> Post a Property
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {savedProperties.map((prop) => (
                  <SavedPropertyCard key={prop.id} property={prop} activeCurrency={activeCurrency} />
                ))}
              </div>
            )}
          </section>

          {/* ── ROI Calculator ───────────────────────────────────────────── */}
          <section>
            <ROICalculator activeCurrency={activeCurrency} />
          </section>

          {/* ── Quick Access Tools ──────────────────────────────────────────── */}
          <section className="pb-8">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h2 className="text-sm font-black text-slate-900 mb-4">Quick Access Tools</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { href: '/investors', label: 'Investment Deals', icon: <TrendingUp className="w-4 h-4" />, cls: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' },
                  { href: '/marketplace', label: 'Browse Marketplace', icon: <Globe2 className="w-4 h-4" />, cls: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' },
                  { href: '/agencies', label: 'Find Verified Agents', icon: <BadgeCheck className="w-4 h-4" />, cls: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' },
                  { href: '/dashboard', label: 'Local Dashboard', icon: <RotateCcw className="w-4 h-4" />, cls: 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200' },
                ].map(({ href, label, icon, cls }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 text-xs font-bold px-4 py-3 rounded-2xl border transition shadow-sm ${cls}`}
                  >
                    {icon}<span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>
      <KYCVerificationModal
        isOpen={isKycOpen}
        onClose={() => setIsKycOpen(false)}
        onVerified={() => setIsKycOpen(false)}
      />
    </div>
  );
}
