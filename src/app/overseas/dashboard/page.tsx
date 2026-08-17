'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Globe2, ShieldCheck, BadgeCheck, TrendingUp, DollarSign,
  Building2, MapPin, Bed, Bath, SquareArrowOutUpRight, Video,
  MessageCircle, Calculator, ChevronRight, RefreshCw, LogOut,
  Landmark, FileCheck2, Lock, CheckCircle2,
  Clock, RotateCcw, Info, ArrowUpRight,
  Wallet, PieChart, Star, ChevronDown, ChevronUp
} from 'lucide-react';
import { CURRENCIES, CurrencyCode, formatCurrencyPrice } from '@/lib/currency';

// ── Types ─────────────────────────────────────────────────────────────────────

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
  image: string;
}

interface EscrowMilestone {
  key: string;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  status: 'complete' | 'active' | 'pending';
}

// ── Demo saved properties (real data from DB would replace) ───────────────────
const DEMO_SAVED: SavedProperty[] = [
  {
    id: 'ovs-prop-001',
    title: '1 Kanal Luxury Mansion — DHA Phase 6',
    location: 'DHA Phase 6, Sector C',
    city: 'Lahore',
    propertyType: 'House',
    pricePKR: 68_000_000,
    areaSqFt: 9_000,
    bedrooms: 5,
    bathrooms: 6,
    rentalYieldPct: 6.2,
    capitalGrowth3YrPct: 34.5,
    escrowSecured: true,
    verifiedAgent: true,
    agentPhone: '923008472910',
    image: '/placeholder-property.jpg',
  },
  {
    id: 'ovs-prop-002',
    title: '3-Bed Corner Apartment — F-11 Markaz',
    location: 'F-11 Markaz, Silver Oaks',
    city: 'Islamabad',
    propertyType: 'Apartment',
    pricePKR: 38_500_000,
    areaSqFt: 2_400,
    bedrooms: 3,
    bathrooms: 3,
    rentalYieldPct: 7.8,
    capitalGrowth3YrPct: 28.1,
    escrowSecured: true,
    verifiedAgent: true,
    agentPhone: '923214455667',
    image: '/placeholder-property.jpg',
  },
];

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

// ── ROI Calculator component ────────────────────────────────────────────────
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
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Purchase Price (PKR)
          </label>
          <input
            type="number"
            value={purchasePKR}
            onChange={(e) => setPurchasePKR(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            step={500000}
            min={1000000}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Annual Yield %
          </label>
          <input
            type="number"
            value={yieldPct}
            onChange={(e) => setYieldPct(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            step={0.5}
            min={1}
            max={25}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Capital Growth % / Yr
          </label>
          <input
            type="number"
            value={growthPct}
            onChange={(e) => setGrowthPct(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            step={1}
            min={1}
            max={50}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Hold Period (Years)
          </label>
          <input
            type="number"
            value={holdYears}
            onChange={(e) => setHoldYears(Number(e.target.value))}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            step={1}
            min={1}
            max={20}
          />
        </div>
      </div>

      {/* Results strip */}
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
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total ROI</p>
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
          <p className="text-[10px] text-slate-400 mt-1">
            * Estimates based on inputs only. Actual returns may vary. PKR to {activeCurrency} rate: {CURRENCIES[activeCurrency].rateInPKR}.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Saved Property Card ───────────────────────────────────────────────────────
function SavedPropertyCard({
  property,
  activeCurrency,
}: {
  property: SavedProperty;
  activeCurrency: CurrencyCode;
}) {
  const [expanded, setExpanded] = useState(false);

  const fmt = (pkr: number) => formatCurrencyPrice(pkr, activeCurrency);
  const monthlyRentEstPKR = (property.pricePKR * property.rentalYieldPct) / 100 / 12;

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello! I am an Overseas Buyer interested in: "${property.title}" (${property.city}). Price: ${fmt(property.pricePKR)}. Please share more details.`
    );
    window.open(`https://wa.me/${property.agentPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Accent top bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {property.propertyType}
              </span>
              {property.escrowSecured && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Escrow Secured
                </span>
              )}
              {property.verifiedAgent && (
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <BadgeCheck className="w-2.5 h-2.5" />
                  Verified Agent
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
            <p className="text-[10px] text-slate-400 font-medium">
              {activeCurrency !== 'PKR' && `≈ Rs ${(property.pricePKR / 10000000).toFixed(2)} Cr`}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {property.bedrooms && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Bed className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bedrooms} Beds</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Bath className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.bathrooms} Baths</span>
            </div>
          )}
          {property.areaSqFt && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <SquareArrowOutUpRight className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.areaSqFt.toLocaleString()} sqft</span>
            </div>
          )}
        </div>

        {/* Yield & Growth Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            {property.rentalYieldPct}% Rental Yield
          </div>
          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 px-3 py-1.5 rounded-xl text-xs font-bold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            {property.capitalGrowth3YrPct}% 3-Yr Growth
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-bold">
            <Wallet className="w-3.5 h-3.5" />
            {fmt(monthlyRentEstPKR)} / mo est.
          </div>
        </div>

        {/* Action Buttons */}
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

        {/* Expanded Request Walkthrough Form */}
        {expanded && (
          <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs space-y-3 animate-in fade-in">
            <p className="font-bold text-indigo-800">📹 Request Live Video Walkthrough</p>
            <p className="text-indigo-700">Our verified agent will schedule a live video tour at your preferred time. Fill in your contact and we will confirm within 24 hours.</p>
            <input
              type="text"
              placeholder="Your Name"
              className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            <input
              type="text"
              placeholder="Your WhatsApp / Phone Number"
              className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            />
            <button
              onClick={handleWhatsApp}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl transition"
            >
              Request Video Walkthrough →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function OverseasBuyerDashboard() {
  const { data: session } = useSession();
  const user = session?.user;

  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('USD');

  const totalAssetsPKR = useMemo(
    () => DEMO_SAVED.reduce((acc, p) => acc + p.pricePKR, 0),
    []
  );
  const avgYield = useMemo(
    () => DEMO_SAVED.reduce((acc, p) => acc + p.rentalYieldPct, 0) / DEMO_SAVED.length,
    []
  );
  const avg3YrGrowth = useMemo(
    () => DEMO_SAVED.reduce((acc, p) => acc + p.capitalGrowth3YrPct, 0) / DEMO_SAVED.length,
    []
  );

  const fmt = useCallback(
    (pkr: number) => formatCurrencyPrice(pkr, activeCurrency),
    [activeCurrency]
  );

  return (
    <div style={{ backgroundColor: '#0F172A' }} className="min-h-screen text-slate-100">

      {/* ── Hero Header ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-slate-800">
        {/* Decorative gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Portal identity */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  <Globe2 className="w-3 h-3" /> Overseas Buyer Portal
                </span>
                <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  <BadgeCheck className="w-3 h-3" /> NICOP Verified Gateway
                </span>
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" /> SBP Escrow Protected
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                Overseas Investment Command Centre
              </h1>
              <p className="text-sm text-slate-400 font-medium mt-2 max-w-2xl">
                {user?.name
                  ? `Welcome back, ${user.name}.`
                  : 'Welcome.'}{' '}
                Track your Pakistan property portfolio in real-time with multi-currency analytics, AI-powered legal protection, and live agent access.
              </p>
            </div>

            {/* Right: Currency Switcher + Actions */}
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
                      className={`text-[10px] font-black px-3 py-1.5 rounded-xl border transition-all duration-150 flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-900/40'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <span>{c.flag}</span>
                      <span>{c.code}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.location.reload()}
                  title="Refresh"
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 transition"
                >
                  <RefreshCw className="w-4 h-4" />
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

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Overseas Investment Analytics Hub (KPI Cards) ─────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-black text-white">Investment Analytics Hub</h2>
            <span className="text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full">
              Live {activeCurrency} View
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Total Saved Assets */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Reserved Assets
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Shortlisted Properties</p>
                </div>
              </div>
              <p className="text-3xl font-black text-white mb-1">{fmt(totalAssetsPKR)}</p>
              <p className="text-[11px] text-slate-400 font-medium">
                Across {DEMO_SAVED.length} properties · Rate: {CURRENCIES[activeCurrency].symbol}1 = Rs{CURRENCIES[activeCurrency].rateInPKR}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-bold">NICOP Buyer Portfolio Active</span>
              </div>
            </div>

            {/* Card 2: Projected Yield & Capital Gain */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Projected Returns
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">Yield & 3-Year Capital Gain</p>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-3xl font-black text-white">{avgYield.toFixed(1)}%</p>
                <span className="text-sm font-bold text-indigo-400">avg. rental yield</span>
              </div>
              <div className="flex items-center gap-2 text-xs mt-2">
                <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {avg3YrGrowth.toFixed(1)}% 3-Yr Capital Growth
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-3">
                AI market growth forecast based on DHA / Federal B Area / Capital Smart City index
              </p>
            </div>

            {/* Card 3: SBP Escrow Protection Status */}
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-8 translate-x-8 blur-2xl pointer-events-none" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Escrow Protection
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">FBR & SBP Compliance</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">NICOP Verification</span>
                  <span className="text-[10px] font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Escrow Account</span>
                  <span className="text-[10px] font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Documents Verified</span>
                  <span className="text-[10px] font-black bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> In Review
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">SBP Remittance</span>
                  <span className="text-[10px] font-black bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Landmark className="w-2.5 h-2.5" /> Approved
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Legal & Escrow Deal Progress Tracker ─────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileCheck2 className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-black text-white">Legal & Escrow Deal Progress Tracker</h2>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-6 shadow-xl">
            {/* Property being tracked */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-800/50 border border-slate-700 rounded-2xl">
              <Building2 className="w-5 h-5 text-indigo-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-black text-white">1 Kanal Luxury Mansion — DHA Phase 6, Lahore</p>
                <p className="text-[10px] text-slate-400 font-medium">Deal ID: NXM-OVS-2026-001 · Token Amount: PKR 2,000,000</p>
              </div>
              <span className="ml-auto text-[10px] font-black bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full whitespace-nowrap">
                Step 3 of 4
              </span>
            </div>

            {/* Step tracker */}
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-6 left-6 right-6 h-0.5 bg-slate-700 hidden sm:block" />
              <div className="absolute top-6 left-6 right-[50%] h-0.5 bg-gradient-to-r from-emerald-500 to-amber-500 hidden sm:block" />

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {ESCROW_MILESTONES.map((milestone, idx) => {
                  const styles = {
                    complete: {
                      icon: 'bg-emerald-500 text-white',
                      label: 'text-emerald-400',
                      card: 'border-emerald-500/40 bg-emerald-500/5',
                      badge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                      badgeText: '✓ Complete',
                    },
                    active: {
                      icon: 'bg-amber-500 text-white',
                      label: 'text-amber-400',
                      card: 'border-amber-500/60 bg-amber-500/5 shadow-lg shadow-amber-900/20',
                      badge: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                      badgeText: '⟳ In Progress',
                    },
                    pending: {
                      icon: 'bg-slate-700 text-slate-400',
                      label: 'text-slate-500',
                      card: 'border-slate-700 bg-slate-800/30',
                      badge: 'bg-slate-700/50 border-slate-600 text-slate-500',
                      badgeText: '○ Pending',
                    },
                  }[milestone.status];

                  return (
                    <div key={milestone.key} className={`relative border rounded-2xl p-4 flex flex-col gap-2 transition ${styles.card}`}>
                      <div className="flex items-center gap-3 sm:flex-col sm:items-start">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${styles.icon}`}>
                          {milestone.status === 'active'
                            ? <div className="relative">{milestone.icon}<span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" /></div>
                            : milestone.icon
                          }
                        </div>
                        <div>
                          <p className={`text-xs font-black ${styles.label}`}>Step {idx + 1}</p>
                          <p className="text-sm font-black text-white leading-tight">{milestone.label}</p>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">{milestone.sublabel}</p>
                      <span className={`self-start text-[10px] font-black border px-2 py-0.5 rounded-full ${styles.badge}`}>
                        {styles.badgeText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action row */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl transition">
                <FileCheck2 className="w-3.5 h-3.5" />
                Upload SBP Remittance Proof
              </button>
              <button className="flex items-center gap-2 text-xs bg-slate-700 hover:bg-slate-600 text-white font-bold px-4 py-2.5 rounded-xl transition">
                <Info className="w-3.5 h-3.5" />
                View Full Deal Timeline
              </button>
              <span className="text-xs text-slate-500 font-medium">
                🛡️ All funds held in Meezan Bank RERA-compliant escrow account.
              </span>
            </div>
          </div>
        </section>

        {/* ── Saved & Tracked Properties Grid ──────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-black text-white">Saved & Tracked Properties</h2>
              <span className="text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full">
                {DEMO_SAVED.length} Shortlisted
              </span>
            </div>
            <Link
              href="/marketplace"
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              Browse Marketplace <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {DEMO_SAVED.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-3xl p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-base font-black text-white mb-1">No Properties Saved Yet</p>
              <p className="text-xs text-slate-500 font-medium mb-5">
                Browse the NexMove marketplace and shortlist properties for your investment portfolio.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-3 rounded-2xl transition"
              >
                <Globe2 className="w-4 h-4" /> Explore Marketplace
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {DEMO_SAVED.map((prop) => (
                <SavedPropertyCard key={prop.id} property={prop} activeCurrency={activeCurrency} />
              ))}
            </div>
          )}
        </section>

        {/* ── Investment ROI Calculator ──────────────────────────────────── */}
        <section>
          <ROICalculator activeCurrency={activeCurrency} />
        </section>

        {/* ── Quick Nav Links ────────────────────────────────────────────── */}
        <section className="pb-8">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-3xl p-6">
            <h2 className="text-sm font-black text-white mb-4">Quick Access Tools</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: '/investors', label: 'Investment Deals', icon: <DollarSign className="w-4 h-4" />, cls: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700' },
                { href: '/marketplace', label: 'Browse Marketplace', icon: <Globe2 className="w-4 h-4" />, cls: 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' },
                { href: '/agencies', label: 'Find Verified Agents', icon: <BadgeCheck className="w-4 h-4" />, cls: 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' },
                { href: '/dashboard', label: 'Domestic Dashboard', icon: <RotateCcw className="w-4 h-4" />, cls: 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' },
              ].map(({ href, label, icon, cls }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 text-xs font-bold px-4 py-3 rounded-2xl border transition shadow-sm ${cls}`}
                >
                  {icon}
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
