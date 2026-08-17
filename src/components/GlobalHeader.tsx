'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCurrency } from './CurrencyContext';
import { CURRENCIES, CurrencyCode } from '@/lib/currency';

export default function GlobalHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { currency, setCurrency } = useCurrency();

  const user = session?.user;
  const isSuperAdmin =
    user?.email?.toLowerCase() === 'nexmove.pk@gmail.com' ||
    user?.role === 'SUPER_ADMIN';

  const isArchitectUser =
    !isSuperAdmin &&
    (Boolean(user?.isArchitect) || user?.role === 'ARCHITECT');

  const isAgencyUser =
    !isSuperAdmin &&
    !isArchitectUser &&
    (user?.role === 'AGENCY_MANAGER' ||
      user?.role === 'AGENCY_AGENT' ||
      user?.accountRoleType === 'AGENCY_ADMIN' ||
      user?.accountRoleType === 'AGENCY_AGENT' ||
      user?.accountRoleType === 'AGENCY_MANAGER' ||
      user?.accountRoleType === 'OVERSEAS_AGENCY' ||
      Boolean(user?.agencyId));

  const isInvestorUser =
    !isSuperAdmin &&
    !isArchitectUser &&
    !isAgencyUser &&
    Boolean(user) &&
    (user?.accountRoleType === 'OVERSEAS_INVESTOR' ||
      user?.role === 'INVESTOR');

  const isOverseasBuyer =
    !isSuperAdmin &&
    !isArchitectUser &&
    !isAgencyUser &&
    !isInvestorUser &&
    Boolean(user) &&
    (user?.accountRoleType === 'OVERSEAS_BUYER' ||
      user?.role === 'OVERSEAS_BUYER');

  const isStandardUser =
    !isSuperAdmin &&
    !isArchitectUser &&
    !isAgencyUser &&
    !isInvestorUser &&
    !isOverseasBuyer &&
    Boolean(user);

  const isGuest = !user;

  // Helper to construct dynamic breadcrumbs
  const getBreadcrumbs = () => {
    if (!pathname || pathname === '/') {
      return [{ label: 'Home', href: '/' }];
    }

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/' }];

    let accumulatedPath = '';
    segments.forEach((seg) => {
      accumulatedPath += `/${seg}`;
      let formattedLabel = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');

      // Custom label mappings
      if (seg === 'agency') formattedLabel = 'Agency';
      if (seg === 'dashboard') formattedLabel = 'Dashboard';
      if (seg === 'my-listings') formattedLabel = 'My Listings';
      if (seg === 'ledger') formattedLabel = 'Ledger';
      if (seg === 'leaderboard') formattedLabel = 'Leaderboard';
      if (seg === 'rent-collection') formattedLabel = 'Rent Collections';
      if (seg === 'submit-listing') formattedLabel = 'Add Property';
      if (seg === 'marketplace') formattedLabel = 'Marketplace';
      if (seg === 'agencies') formattedLabel = 'Agency Directory';
      if (seg === 'architects') formattedLabel = 'Architects & Designers';
      if (seg === 'investors') formattedLabel = 'Investor Portal';
      if (seg === 'login') formattedLabel = 'Login';
      if (seg === 'register') formattedLabel = 'Register';

      breadcrumbs.push({
        label: formattedLabel,
        href: accumulatedPath,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const isHomePage = pathname === '/';

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 text-slate-100 flex items-center justify-between gap-4">
      {/* Left: Brand & Dynamic Breadcrumbs */}
      <div className="flex items-center gap-3 overflow-x-auto">
        <Link
          href="/"
          className="text-base font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex-shrink-0"
        >
          NexMove
        </Link>

        {!isHomePage && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap">
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.href}>
                  <span className="text-slate-600">/</span>
                  {isLast ? (
                    <span className="font-bold text-emerald-400">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="hover:text-slate-200 transition font-medium"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        )}
      </div>

      {/* Right: Currency Switcher, Persistent Navigation & Role-Based Action Buttons */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Currency Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-0.5">
          <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">
            {CURRENCIES[currency].flag}
          </span>
          <select
            id="currency-switcher-header"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer py-0.5"
            aria-label="Select Currency"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100 font-bold">
                {c.flag} {c.code} ({c.symbol})
              </option>
            ))}
          </select>
        </div>

        <Link
          href="/marketplace"
          className="text-xs text-slate-400 hover:text-slate-200 transition hidden lg:inline"
        >
          Marketplace
        </Link>
        <Link
          href="/agencies"
          className="text-xs text-slate-400 hover:text-slate-200 transition hidden lg:inline"
        >
          Agencies
        </Link>
        <Link
          href="/architects"
          className="text-xs text-slate-400 hover:text-teal-300 transition hidden xl:inline font-medium"
        >
          Architects & Designers
        </Link>
        <Link
          href="/pricing"
          className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition hidden sm:inline"
        >
          Pricing
        </Link>

        {/* 👑 SUPER_ADMIN: Show all dashboards */}
        {isSuperAdmin && (
          <>
            <Link
              href="/admin/dashboard"
              className="text-xs bg-purple-600/20 border border-purple-500/50 text-purple-300 hover:bg-purple-600/40 hover:text-purple-200 px-3 py-1 rounded-lg transition font-bold flex items-center gap-1 shadow-sm shadow-purple-900/50"
            >
              <span>👑</span>
              <span className="hidden sm:inline">Admin Portal</span>
            </Link>
            <Link
              href="/investors"
              className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg transition font-bold flex items-center gap-1"
            >
              <span>🌐</span>
              <span>Investor Portal</span>
            </Link>
            <Link
              href="/agency/dashboard"
              className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition shadow shadow-emerald-950/50 flex items-center gap-1"
            >
              <span>🏢</span>
              <span className="hidden sm:inline">Agency Portal</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
            >
              <span>🏠</span>
              <span className="hidden sm:inline">User Dashboard</span>
            </Link>
          </>
        )}

        {/* 📐 ARCHITECT: Show ONLY Architect Portal */}
        {isArchitectUser && (
          <Link
            href="/architects/dashboard"
            className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1.5 rounded-xl transition shadow shadow-teal-950/50 flex items-center gap-1.5"
          >
            <span>🏛️</span>
            <span>Architect Studio</span>
          </Link>
        )}

        {/* 🏢 AGENCY / AGENT: Show ONLY Agency Portal */}
        {isAgencyUser && (
          <Link
            href="/agency/dashboard"
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition shadow shadow-emerald-950/50 flex items-center gap-1.5"
          >
            <span>🏢</span>
            <span>Agency Portal</span>
          </Link>
        )}

        {/* 💼 INVESTOR: Show ONLY Investor Portal */}
        {isInvestorUser && (
          <Link
            href="/investors"
            className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition shadow shadow-amber-950/50 flex items-center gap-1.5"
          >
            <span>💼</span>
            <span>Investor Portal</span>
          </Link>
        )}

        {/* 🌍 OVERSEAS BUYER: Show Overseas Buyer Portal */}
        {isOverseasBuyer && (
          <Link
            href="/overseas/dashboard"
            className="text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold px-3 py-1.5 rounded-xl transition shadow shadow-indigo-950/50 flex items-center gap-1.5"
          >
            <span>🌍</span>
            <span>Overseas Portal</span>
          </Link>
        )}

        {/* 🏠 STANDARD USER: Show User Dashboard / My Listings */}
        {isStandardUser && (
          <Link
            href="/dashboard"
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-xl transition shadow shadow-emerald-950/50 flex items-center gap-1.5"
          >
            <span>🏠</span>
            <span>User Dashboard</span>
          </Link>
        )}

        {/* 👤 GUEST / UNAUTHENTICATED: Show Register & Login */}
        {isGuest && (
          <>
            <Link
              href="/login"
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition font-medium"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3 py-1.5 rounded-xl transition shadow shadow-emerald-950/50 flex items-center gap-1"
            >
              <span>Register</span>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
