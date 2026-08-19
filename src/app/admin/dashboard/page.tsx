"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  SubscriptionStatus,
  calculateRemainingDays,
  formatSubscriptionDate,
  getSubscriptionBadgeStyle,
} from "@/types/subscription";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingArchitect {
  id: string;
  name: string;
  title?: string | null;
  specialization: string;
  companyName?: string | null;
  isOverseas?: boolean;
  country?: string | null;
  city?: string | null;
  pcatpNo?: string | null;
  councilLicenseNo?: string | null;
  phone?: string | null;
  experienceLevel?: string | null;
  location?: string | null;
  verificationStatus: string;
  isVerified: boolean;
  bio?: string | null;
  portfolioUrl?: string | null;
  software?: string[];
  projectTypes?: string[];
  user?: { email?: string | null; phone?: string | null } | null;
  createdAt: string;
}

interface PendingAgency {
  id: string;
  name: string;
  licenseNumber?: string | null;
  phone?: string | null;
  address?: string | null;
  ntn?: string | null;
  cnicNumber?: string | null;
  verified: boolean;
  isKycVerified?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionEndDate?: string | null;
  createdAt: string;
  _count: { users: number };
}

interface PendingUser {
  id: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  accountRoleType?: string | null;
  cnicNumber?: string | null;
  cnicFrontUrl?: string | null;
  liveSelfieUrl?: string | null;
  isOverseasVerified: boolean;
  isKycVerified?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionEndDate?: string | null;
  overseasCountry?: string | null;
  createdAt: string;
}

interface ApprovalsData {
  pendingArchitects: PendingArchitect[];
  pendingAgencies: PendingAgency[];
  pendingUserKYC: PendingUser[];
}

interface ManagedAgency {
  id: string;
  name: string;
  licenseNumber: string | null;
  phone: string | null;
  address: string | null;
  verified: boolean;
  isKycVerified: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: string | null;
  userCount: number;
  listingCount: number;
  createdAt: string;
}

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  accountRoleType: string | null;
  isKycVerified: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: string | null;
  agencyId: string | null;
  agencyName: string | null;
  architectProfile?: { id: string; name: string; specialization: string; isVerified: boolean } | null;
  createdAt: string;
}

// ─── Action Toast ─────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"management" | "architects" | "agencies" | "kyc" | "system">("management");
  const [data, setData] = useState<ApprovalsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [systemStatus, setSystemStatus] = useState<{ status: string; databaseConnection: string; activeTenantsCount: number } | null>(null);
  const [systemLoading, setSystemLoading] = useState(false);

  // ─── User & Agency Management State ─────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [managedAgencies, setManagedAgencies] = useState<ManagedAgency[]>([]);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [managementStats, setManagementStats] = useState({
    totalAgencies: 0,
    totalUsers: 0,
    filteredAgencies: 0,
    filteredUsers: 0,
  });
  const [managementLoading, setManagementLoading] = useState(false);
  const [managementView, setManagementView] = useState<"agencies" | "users">("agencies");

  const isSuperAdmin =
    session?.user?.email?.toLowerCase() === "nexmove.pk@gmail.com" ||
    session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?role=admin");
    else if (status === "authenticated" && !isSuperAdmin) router.push("/unauthorized");
  }, [status, session, router, isSuperAdmin]);

  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [approvalsRes, pendingRes] = await Promise.all([
        fetch("/api/admin/approvals"),
        fetch("/api/admin/pending"),
      ]);

      const approvalsJson = approvalsRes.ok ? await approvalsRes.json() : {};
      const pendingJson = pendingRes.ok ? await pendingRes.json() : {};

      const archMap = new Map<string, PendingArchitect>();
      (approvalsJson.pendingArchitects ?? []).forEach((a: PendingArchitect) => archMap.set(a.id, a));
      (pendingJson.pendingArchitects ?? []).forEach((a: PendingArchitect) => archMap.set(a.id, a));

      const agencyMap = new Map<string, PendingAgency>();
      (approvalsJson.pendingAgencies ?? []).forEach((a: PendingAgency) => agencyMap.set(a.id, a));
      (pendingJson.pendingAgencies ?? []).forEach((a: PendingAgency) => agencyMap.set(a.id, a));

      const kycMap = new Map<string, PendingUser>();
      (approvalsJson.pendingUserKYC ?? []).forEach((u: PendingUser) => kycMap.set(u.id, u));
      (pendingJson.pendingUserKYC ?? []).forEach((u: PendingUser) => kycMap.set(u.id, u));

      setData({
        pendingArchitects: Array.from(archMap.values()),
        pendingAgencies: Array.from(agencyMap.values()),
        pendingUserKYC: Array.from(kycMap.values()),
      });
    } catch {
      addToast("Failed to load approvals data.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Real-time Database Search & Filter ────────────────────────────────────
  const fetchUsersAndAgencies = useCallback(async () => {
    setManagementLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("subscriptionStatus", statusFilter);

      const res = await fetch(`/api/admin/users-agencies?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to search database");

      const json = await res.json();
      if (json.success) {
        setManagedAgencies(json.agencies || []);
        setManagedUsers(json.users || []);
        setManagementStats(json.stats || {
          totalAgencies: json.agencies?.length || 0,
          totalUsers: json.users?.length || 0,
          filteredAgencies: json.agencies?.length || 0,
          filteredUsers: json.users?.length || 0,
        });
      }
    } catch {
      addToast("Error filtering users & agencies", "error");
    } finally {
      setManagementLoading(false);
    }
  }, [searchQuery, roleFilter, statusFilter]);

  // Debounced search effect
  useEffect(() => {
    if (status === "authenticated" && isSuperAdmin) {
      const timeoutId = setTimeout(() => {
        fetchUsersAndAgencies();
      }, 250);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, roleFilter, statusFilter, status, isSuperAdmin, fetchUsersAndAgencies]);

  const fetchSystemStatus = async () => {
    setSystemLoading(true);
    try {
      const res = await fetch("/api/admin/system-status");
      const json = await res.json();
      setSystemStatus(json);
    } catch {
      addToast("Failed to load system status.", "error");
    } finally {
      setSystemLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && isSuperAdmin) {
      fetchApprovals();
    }
  }, [status, isSuperAdmin, fetchApprovals]);

  // ─── Individual Agency Subscription Toggle / Action Handler ─────────────────
  const handleUpdateAgencySubscription = async (
    agencyId: string,
    agencyName: string,
    updates: {
      subscriptionStatus?: SubscriptionStatus;
      extensionDays?: number;
      isKycVerified?: boolean;
      verified?: boolean;
    }
  ) => {
    const actionKey = `agency-sub-${agencyId}-${updates.subscriptionStatus || updates.extensionDays || "kyc"}`;
    setActionLoading(actionKey);

    try {
      const res = await fetch("/api/admin/agency-subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyId, ...updates }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update agency subscription");
      }

      const json = await res.json();
      const updatedAgency = json.agency;

      // Update local state without full page reload
      setManagedAgencies((prev) =>
        prev.map((a) =>
          a.id === agencyId
            ? {
                ...a,
                subscriptionStatus: updatedAgency.subscriptionStatus ?? a.subscriptionStatus,
                subscriptionEndDate: updatedAgency.subscriptionEndDate ?? a.subscriptionEndDate,
                isKycVerified: updatedAgency.isKycVerified ?? a.isKycVerified,
                verified: updatedAgency.verified ?? a.verified,
              }
            : a
        )
      );

      addToast(
        updates.extensionDays
          ? `✓ Extended ${agencyName}'s subscription by ${updates.extensionDays} days!`
          : `✓ ${agencyName} updated: ${updates.subscriptionStatus || (updates.isKycVerified !== undefined ? "KYC updated" : "Saved")}`,
        "success"
      );
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Individual User Subscription Toggle Handler ────────────────────────────
  const handleUpdateUserSubscription = async (
    userId: string,
    userEmail: string,
    updates: {
      subscriptionStatus?: SubscriptionStatus;
      extensionDays?: number;
      isKycVerified?: boolean;
    }
  ) => {
    const actionKey = `user-sub-${userId}-${updates.subscriptionStatus || updates.extensionDays || "kyc"}`;
    setActionLoading(actionKey);

    try {
      const res = await fetch("/api/admin/agency-subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...updates }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update user subscription");
      }

      const json = await res.json();
      const updatedUser = json.user;

      setManagedUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                subscriptionStatus: updatedUser.subscriptionStatus ?? u.subscriptionStatus,
                subscriptionEndDate: updatedUser.subscriptionEndDate ?? u.subscriptionEndDate,
                isKycVerified: updatedUser.isKycVerified ?? u.isKycVerified,
              }
            : u
        )
      );

      addToast(`✓ Updated ${userEmail} subscription: ${updates.subscriptionStatus || "Saved"}`, "success");
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (
    type: "architect" | "agency" | "user",
    id: string,
    action: "approve" | "reject",
    label: string
  ) => {
    setActionLoading(`${type}-${id}-${action}`);
    try {
      const endpoint =
        type === "architect" ? "/api/admin/approve-architect" : "/api/admin/approve";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      addToast(`${label} – ${action === "approve" ? "✓ Approved" : "✗ Rejected"} successfully.`, "success");
      await fetchApprovals();
      fetchUsersAndAgencies();
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" });

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading admin console...</span>
        </div>
      </div>
    );
  }

  if (!session || !isSuperAdmin) return null;

  const tabs = [
    {
      key: "management" as const,
      label: "User & Agency Management",
      emoji: "👥",
      count: managedAgencies.length + managedUsers.length,
    },
    { key: "architects" as const, label: "Architects", emoji: "🏗️", count: data?.pendingArchitects?.length ?? 0 },
    { key: "agencies" as const, label: "Agencies", emoji: "🏢", count: data?.pendingAgencies?.length ?? 0 },
    { key: "kyc" as const, label: "KYC Reviews", emoji: "🪪", count: data?.pendingUserKYC?.length ?? 0 },
    { key: "system" as const, label: "System", emoji: "⚙️", count: null },
  ];

  return (
    <main className="min-h-screen bg-[#060812] text-slate-100 flex flex-col">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border pointer-events-auto animate-fade-in ${
              t.type === "success"
                ? "bg-emerald-950 border-emerald-500/40 text-emerald-300"
                : "bg-red-950 border-red-500/40 text-red-300"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-purple-500/20 bg-[#0a0b1a]/80 backdrop-blur-md px-5 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-purple-900/50">
            <span className="text-base">👑</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent leading-tight">
              NexMove Super Admin
            </span>
            <span className="text-[10px] text-purple-400/70 uppercase tracking-widest font-semibold">
              Global Access & Subscription Control
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/agency/dashboard"
            className="text-[11px] text-purple-300 hover:text-white px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/50 transition flex items-center gap-1.5"
          >
            <span>🏢</span> Agency Portal
          </Link>
          <Link
            href="/"
            className="text-[11px] text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-600 transition"
          >
            ← Home
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl transition border border-slate-700"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6 flex flex-col gap-5">

        {/* Identity & Global Stats Banner */}
        <section className="bg-gradient-to-br from-purple-950/40 via-indigo-950/20 to-slate-900/50 border border-purple-500/20 rounded-3xl p-5 shadow-xl shadow-purple-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black text-lg flex-shrink-0">
              👑
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-slate-100 truncate">{session.user.name ?? session.user.email}</span>
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  MASTER ADMIN
                </span>
              </div>
              <span className="text-xs text-slate-400 truncate">{session.user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto flex-wrap">
            <div className="bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-2xl flex flex-col min-w-[90px]">
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Total Agencies</span>
              <span className="text-sm font-black text-emerald-400">{managementStats.totalAgencies}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-2xl flex flex-col min-w-[90px]">
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Total Users</span>
              <span className="text-sm font-black text-indigo-400">{managementStats.totalUsers}</span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 px-3.5 py-2 rounded-2xl flex flex-col min-w-[90px]">
              <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Pending KYC</span>
              <span className="text-sm font-black text-amber-400">{data?.pendingUserKYC?.length ?? 0}</span>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/40 border border-slate-800 rounded-2xl p-1.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "system" && !systemStatus) fetchSystemStatus();
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                activeTab === tab.key
                  ? "bg-purple-600 text-white shadow-sm shadow-purple-900"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-purple-500/20 text-purple-300"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={() => {
              fetchApprovals();
              fetchUsersAndAgencies();
            }}
            disabled={loading || managementLoading}
            className="ml-auto flex-shrink-0 text-[11px] text-slate-500 hover:text-slate-300 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/60 transition flex items-center gap-1"
          >
            {loading || managementLoading ? (
              <span className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <span>↻</span>
            )}
            Refresh
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* ── Tab 1: User & Agency Management (Live Search & Toggle) ─────── */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === "management" && (
          <section className="flex flex-col gap-4">
            
            {/* Search & Filter Bar Controls */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
                    <span>👥 User & Agency Management Control Board</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time database queries, individual subscription status toggles, advance dates & KYC guards.
                  </p>
                </div>

                {/* Switch between Agencies & Users view */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800 self-start md:self-auto">
                  <button
                    onClick={() => setManagementView("agencies")}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      managementView === "agencies"
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    🏢 Agencies ({managedAgencies.length})
                  </button>
                  <button
                    onClick={() => setManagementView("users")}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                      managementView === "users"
                        ? "bg-purple-600 text-white shadow"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    👤 Users ({managedUsers.length})
                  </button>
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Real-time Search Input */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Name, Email, or Agency Title..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Role Filter Dropdown */}
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex-shrink-0">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none w-full font-medium cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900 text-slate-200">All Roles</option>
                    <option value="AGENCY" className="bg-slate-900 text-slate-200">Agency</option>
                    <option value="LOCAL_PUBLIC" className="bg-slate-900 text-slate-200">Local Public</option>
                    <option value="ARCHITECT" className="bg-slate-900 text-slate-200">Architect</option>
                    <option value="OVERSEAS_BUYER" className="bg-slate-900 text-slate-200">Overseas Buyer</option>
                  </select>
                </div>

                {/* Subscription Status Filter Dropdown */}
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider flex-shrink-0">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-xs text-slate-200 focus:outline-none w-full font-medium cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900 text-slate-200">All Statuses</option>
                    <option value="ACTIVE" className="bg-slate-900 text-emerald-400">Active</option>
                    <option value="PENDING_PAYMENT" className="bg-slate-900 text-amber-400">Pending Payment</option>
                    <option value="EXPIRED" className="bg-slate-900 text-rose-400">Expired</option>
                    <option value="SUSPENDED" className="bg-slate-900 text-red-400">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Render: Managed Agencies ── */}
            {managementView === "agencies" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Agencies matching filter ({managedAgencies.length})
                  </span>
                  {managementLoading && (
                    <span className="text-xs text-purple-400 flex items-center gap-1.5">
                      <span className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Live DB filtering...
                    </span>
                  )}
                </div>

                {managementLoading && managedAgencies.length === 0 ? (
                  <SkeletonRows count={3} />
                ) : managedAgencies.length === 0 ? (
                  <EmptyState emoji="🏢" text="No agencies found matching your search or filters" />
                ) : (
                  managedAgencies.map((agency) => {
                    const badge = getSubscriptionBadgeStyle(agency.subscriptionStatus);
                    const daysRemaining = calculateRemainingDays(agency.subscriptionEndDate);
                    const isRowActionLoading = actionLoading?.startsWith(`agency-sub-${agency.id}`);

                    return (
                      <div
                        key={agency.id}
                        className="bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition shadow-lg"
                      >
                        {/* Agency Info */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow">
                            {agency.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-100">{agency.name}</span>
                              
                              {/* Status Badge */}
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg} ${badge.text} ${badge.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>

                              {/* KYC Badge */}
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  agency.isKycVerified || agency.verified
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {agency.isKycVerified || agency.verified ? "✓ KYC VERIFIED" : "⏳ KYC PENDING"}
                              </span>
                            </div>

                            <span className="text-xs text-slate-400 truncate">
                              {agency.address || "Address not specified"} · {agency.phone || "No phone"}
                            </span>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                              {agency.licenseNumber && (
                                <span className="font-mono text-purple-300">Lic: {agency.licenseNumber}</span>
                              )}
                              <Chip color="slate">{agency.userCount} Agents</Chip>
                              <Chip color="slate">{agency.listingCount} Properties</Chip>
                              
                              {/* Expiry Pill */}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                daysRemaining !== null && daysRemaining <= 5
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 font-black"
                                  : "bg-slate-950 text-slate-300 border-slate-800"
                              }`}>
                                📅 Expiry: {formatSubscriptionDate(agency.subscriptionEndDate)}
                                {daysRemaining !== null && (
                                  <span className="ml-1 opacity-80">
                                    ({daysRemaining > 0 ? `${daysRemaining}d left` : daysRemaining === 0 ? "Today" : "Expired"})
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ── INDIVIDUAL ACTION BUTTONS & TOGGLES (No Full Reload) ── */}
                        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                          
                          {/* Fast Toggle: ACTIVE <-> SUSPENDED */}
                          <button
                            onClick={() =>
                              handleUpdateAgencySubscription(
                                agency.id,
                                agency.name,
                                {
                                  subscriptionStatus:
                                    agency.subscriptionStatus === "ACTIVE"
                                      ? "SUSPENDED"
                                      : "ACTIVE",
                                }
                              )
                            }
                            disabled={isRowActionLoading}
                            title="Toggle Subscription Active vs Suspended"
                            className={`text-xs font-bold px-3 py-2 rounded-xl border transition flex items-center gap-1.5 ${
                              agency.subscriptionStatus === "ACTIVE"
                                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {isRowActionLoading ? (
                              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>{agency.subscriptionStatus === "ACTIVE" ? "🔒 Suspend" : "⚡ Activate"}</span>
                            )}
                          </button>

                          {/* Quick Status Dropdown */}
                          <select
                            value={agency.subscriptionStatus}
                            onChange={(e) =>
                              handleUpdateAgencySubscription(
                                agency.id,
                                agency.name,
                                { subscriptionStatus: e.target.value as SubscriptionStatus }
                              )
                            }
                            disabled={isRowActionLoading}
                            className="bg-slate-950 border border-slate-700 hover:border-slate-600 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none cursor-pointer"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                            <option value="EXPIRED">EXPIRED</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </select>

                          {/* +30 Days Renewal Extension Action */}
                          <button
                            onClick={() =>
                              handleUpdateAgencySubscription(
                                agency.id,
                                agency.name,
                                { extensionDays: 30, subscriptionStatus: "ACTIVE" }
                              )
                            }
                            disabled={isRowActionLoading}
                            title="Add 30 Days to Subscription & Activate"
                            className="text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3 py-2 rounded-xl font-bold transition flex items-center gap-1"
                          >
                            <span>+30d Renew</span>
                          </button>

                          {/* Toggle KYC Action */}
                          <button
                            onClick={() =>
                              handleUpdateAgencySubscription(
                                agency.id,
                                agency.name,
                                { isKycVerified: !agency.isKycVerified, verified: !agency.isKycVerified }
                              )
                            }
                            disabled={isRowActionLoading}
                            title="Toggle KYC Verification Status"
                            className={`text-xs px-2.5 py-2 rounded-xl border transition ${
                              agency.isKycVerified
                                ? "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            }`}
                          >
                            {agency.isKycVerified ? "Revoke KYC" : "Verify KYC"}
                          </button>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── Render: Managed Users ── */}
            {managementView === "users" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Users matching filter ({managedUsers.length})
                  </span>
                  {managementLoading && (
                    <span className="text-xs text-purple-400 flex items-center gap-1.5">
                      <span className="w-3 h-3 border border-purple-400 border-t-transparent rounded-full animate-spin" />
                      Live DB filtering...
                    </span>
                  )}
                </div>

                {managementLoading && managedUsers.length === 0 ? (
                  <SkeletonRows count={3} />
                ) : managedUsers.length === 0 ? (
                  <EmptyState emoji="👤" text="No users found matching your search or filters" />
                ) : (
                  managedUsers.map((u) => {
                    const badge = getSubscriptionBadgeStyle(u.subscriptionStatus);
                    const isUserActionLoading = actionLoading?.startsWith(`user-sub-${u.id}`);

                    return (
                      <div
                        key={u.id}
                        className="bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition shadow-lg"
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-700 to-purple-700 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow">
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </div>

                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-100">{u.name || "Unnamed User"}</span>
                              <span className="text-xs text-slate-400">({u.email})</span>
                              
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                                {badge.label}
                              </span>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  u.isKycVerified
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {u.isKycVerified ? "✓ KYC VERIFIED" : "⏳ KYC PENDING"}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                              <Chip color="indigo">Role: {u.accountRoleType || u.role}</Chip>
                              {u.agencyName && <Chip color="emerald">Agency: {u.agencyName}</Chip>}
                              {u.phone && <span>📞 {u.phone}</span>}
                              <span>Registered: {formatDate(u.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        {/* User Actions */}
                        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto flex-shrink-0">
                          <button
                            onClick={() =>
                              handleUpdateUserSubscription(
                                u.id,
                                u.email,
                                {
                                  subscriptionStatus:
                                    u.subscriptionStatus === "ACTIVE"
                                      ? "SUSPENDED"
                                      : "ACTIVE",
                                }
                              )
                            }
                            disabled={isUserActionLoading}
                            className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${
                              u.subscriptionStatus === "ACTIVE"
                                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                            }`}
                          >
                            {isUserActionLoading ? (
                              <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span>{u.subscriptionStatus === "ACTIVE" ? "🔒 Suspend" : "⚡ Activate"}</span>
                            )}
                          </button>

                          <select
                            value={u.subscriptionStatus}
                            onChange={(e) =>
                              handleUpdateUserSubscription(
                                u.id,
                                u.email,
                                { subscriptionStatus: e.target.value as SubscriptionStatus }
                              )
                            }
                            disabled={isUserActionLoading}
                            className="bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none cursor-pointer"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
                            <option value="EXPIRED">EXPIRED</option>
                            <option value="SUSPENDED">SUSPENDED</option>
                          </select>

                          <button
                            onClick={() =>
                              handleUpdateUserSubscription(
                                u.id,
                                u.email,
                                { isKycVerified: !u.isKycVerified }
                              )
                            }
                            disabled={isUserActionLoading}
                            className={`text-xs px-2.5 py-2 rounded-xl border transition ${
                              u.isKycVerified
                                ? "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            }`}
                          >
                            {u.isKycVerified ? "Revoke KYC" : "Verify KYC"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </section>
        )}

        {/* ── Tab: Architects ─────────────────────────────────────────── */}
        {activeTab === "architects" && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest">
                Pending Architects & Designers
              </h2>
              <span className="text-[11px] text-slate-500">
                {data?.pendingArchitects?.length ?? 0} pending
              </span>
            </div>

            {loading ? (
              <SkeletonRows />
            ) : !data?.pendingArchitects || data.pendingArchitects.length === 0 ? (
              <EmptyState emoji="🎉" text="No pending architect submissions" />
            ) : (
              data.pendingArchitects.map((arch) => (
                <div
                  key={arch.id}
                  className={`bg-slate-900/50 border rounded-2xl p-4 flex flex-col gap-3 hover:border-purple-500/30 transition ${
                    arch.verificationStatus === "REJECTED"
                      ? "border-red-500/20"
                      : "border-slate-800"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {arch.name?.charAt(0).toUpperCase() ?? "A"}
                    </div>
                    {/* Info */}
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100">{arch.name}</span>
                        {arch.companyName && (
                          <span className="text-xs font-semibold text-slate-400">({arch.companyName})</span>
                        )}
                        {/* Overseas Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            arch.isOverseas
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {arch.isOverseas ? "🌐 OVERSEAS" : "🇵🇰 PAKISTAN"}
                        </span>
                        {/* Verification Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            arch.verificationStatus === "VERIFIED" || arch.isVerified
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : arch.verificationStatus === "REJECTED"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          }`}
                        >
                          {arch.isVerified ? "VERIFIED" : arch.verificationStatus}
                        </span>
                      </div>

                      <span className="text-xs text-slate-400 truncate">
                        {arch.title ?? arch.specialization}
                        {(arch.city || arch.country || arch.location) ? ` · ${arch.city ? `${arch.city}, ` : ""}${arch.country || arch.location || ""}` : ""}
                      </span>

                      {/* Contact & License Info */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-0.5">
                        {arch.user?.email && <span>📧 {arch.user.email}</span>}
                        {(arch.phone || arch.user?.phone) && <span>📞 {arch.phone || arch.user?.phone}</span>}
                        {(arch.pcatpNo || arch.councilLicenseNo) && (
                          <span className="font-mono text-amber-400">📜 PCATP: {arch.pcatpNo || arch.councilLicenseNo}</span>
                        )}
                      </div>

                      {/* Bio excerpt */}
                      {arch.bio && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{arch.bio}</p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {arch.experienceLevel && (
                          <Chip color="teal">{arch.experienceLevel}</Chip>
                        )}
                        {arch.software?.slice(0, 3).map((s) => (
                          <Chip key={s} color="indigo">{s}</Chip>
                        ))}
                        {arch.projectTypes?.slice(0, 2).map((p) => (
                          <Chip key={p} color="cyan">{p}</Chip>
                        ))}
                        <Chip color="slate">Applied: {formatDate(arch.createdAt)}</Chip>
                      </div>
                    </div>
                    {/* Actions — hide if already verified */}
                    {!arch.isVerified && arch.verificationStatus !== "VERIFIED" && (
                      <div className="flex gap-2 flex-shrink-0 self-start">
                        <ActionButton
                          variant="approve"
                          loading={actionLoading === `architect-${arch.id}-approve`}
                          onClick={() => handleAction("architect", arch.id, "approve", arch.name)}
                        />
                        <ActionButton
                          variant="reject"
                          loading={actionLoading === `architect-${arch.id}-reject`}
                          onClick={() => handleAction("architect", arch.id, "reject", arch.name)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* ── Tab: Agencies ────────────────────────────────────────────── */}
        {activeTab === "agencies" && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest">
                Pending Agency Approvals
              </h2>
              <span className="text-[11px] text-slate-500">
                {data?.pendingAgencies?.length ?? 0} pending
              </span>
            </div>

            {loading ? (
              <SkeletonRows />
            ) : data?.pendingAgencies?.length === 0 ? (
              <EmptyState emoji="🏢" text="All agencies have been reviewed" />
            ) : (
              data?.pendingAgencies?.map((agency) => (
                <div
                  key={agency.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-purple-500/30 transition"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {agency.name?.charAt(0).toUpperCase() ?? "A"}
                  </div>
                  {/* Info */}
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="font-bold text-sm text-slate-100">{agency.name}</span>
                    <span className="text-xs text-slate-400 truncate">
                      {agency.address ?? "Address not provided"}
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {agency.licenseNumber && (
                        <Chip color="emerald">Lic: {agency.licenseNumber}</Chip>
                      )}
                      {agency.ntn && <Chip color="cyan">NTN: {agency.ntn}</Chip>}
                      <Chip color="slate">{agency._count.users} member{agency._count.users !== 1 ? "s" : ""}</Chip>
                      <Chip color="slate">Joined: {formatDate(agency.createdAt)}</Chip>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <ActionButton
                      variant="approve"
                      loading={actionLoading === `agency-${agency.id}-approve`}
                      onClick={() => handleAction("agency", agency.id, "approve", agency.name)}
                    />
                    <ActionButton
                      variant="reject"
                      loading={actionLoading === `agency-${agency.id}-reject`}
                      onClick={() => handleAction("agency", agency.id, "reject", agency.name)}
                    />
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {/* ── Tab: KYC Reviews ─────────────────────────────────────────── */}
        {activeTab === "kyc" && (
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest">
                User KYC Reviews
              </h2>
              <span className="text-[11px] text-slate-500">
                {data?.pendingUserKYC?.length ?? 0} submitted
              </span>
            </div>

            {loading ? (
              <SkeletonRows />
            ) : data?.pendingUserKYC?.length === 0 ? (
              <EmptyState emoji="🪪" text="No KYC submissions pending review" />
            ) : (
              data?.pendingUserKYC?.map((user) => (
                <div
                  key={user.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-purple-500/30 transition"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-purple-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {(user.name ?? user.email)?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  {/* Info */}
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="font-bold text-sm text-slate-100">{user.name ?? "Unnamed User"}</span>
                    <span className="text-xs text-slate-400 truncate">{user.email}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {user.accountRoleType && (
                        <Chip color="indigo">{user.accountRoleType.replace(/_/g, " ")}</Chip>
                      )}
                      {user.cnicNumber && (
                        <Chip color="slate">CNIC: {user.cnicNumber}</Chip>
                      )}
                      <Chip color={user.isOverseasVerified ? "emerald" : "amber"}>
                        {user.isOverseasVerified ? "✓ Verified" : "⏳ Pending"}
                      </Chip>
                      <Chip color="slate">Registered: {formatDate(user.createdAt)}</Chip>
                    </div>
                  </div>
                  {/* Actions — only if not yet verified */}
                  {!user.isOverseasVerified && (
                    <div className="flex gap-2 flex-shrink-0">
                      <ActionButton
                        variant="approve"
                        loading={actionLoading === `user-${user.id}-approve`}
                        onClick={() => handleAction("user", user.id, "approve", user.email)}
                      />
                      <ActionButton
                        variant="reject"
                        loading={actionLoading === `user-${user.id}-reject`}
                        onClick={() => handleAction("user", user.id, "reject", user.email)}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </section>
        )}

        {/* ── Tab: System ──────────────────────────────────────────────── */}
        {activeTab === "system" && (
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest">
                System Health Monitor
              </h2>
              <button
                onClick={fetchSystemStatus}
                disabled={systemLoading}
                className="text-[11px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-xl hover:bg-slate-800 border border-slate-700 transition flex items-center gap-1"
              >
                {systemLoading ? (
                  <span className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin inline-block" />
                ) : "↻"}
                Refresh
              </button>
            </div>

            {systemLoading ? (
              <SkeletonRows count={3} />
            ) : systemStatus ? (
              <div className="flex flex-col gap-3">
                <StatusRow label="System Status" value={systemStatus.status} color="emerald" />
                <StatusRow label="Database Connection" value={systemStatus.databaseConnection} color="emerald" />
                <StatusRow label="Active Tenants (Agencies)" value={String(systemStatus.activeTenantsCount)} color="teal" />
              </div>
            ) : (
              <EmptyState emoji="❌" text="Failed to retrieve system status. Click Refresh to retry." />
            )}

            {/* Quick Navigation */}
            <div className="flex flex-col gap-2 mt-2">
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Quick Navigation</p>
              <Link
                href="/agency/dashboard"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-3 px-4 rounded-2xl transition flex items-center gap-2"
              >
                <span>🏢</span> Agency Dashboard
              </Link>
              <Link
                href="/investors"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-3 px-4 rounded-2xl transition flex items-center gap-2"
              >
                <span>🌐</span> Investor Portal
              </Link>
              <Link
                href="/architects"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-3 px-4 rounded-2xl transition flex items-center gap-2"
              >
                <span>🏗️</span> Architects & Designers
              </Link>
              <Link
                href="/marketplace"
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium py-3 px-4 rounded-2xl transition flex items-center gap-2"
              >
                <span>🏠</span> Public Marketplace
              </Link>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionButton({
  variant,
  loading,
  onClick,
}: {
  variant: "approve" | "reject";
  loading: boolean;
  onClick: () => void;
}) {
  const isApprove = variant === "approve";
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-xl border transition disabled:opacity-50 disabled:cursor-not-allowed ${
        isApprove
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50"
          : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50"
      }`}
    >
      {loading ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>{isApprove ? "✓" : "✗"}</span>
      )}
      {isApprove ? "Approve" : "Reject"}
    </button>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  const palette: Record<string, string> = {
    teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    slate: "bg-slate-800 text-slate-400 border-slate-700",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${palette[color] ?? palette.slate}`}>
      {children}
    </span>
  );
}

function StatusRow({ label, value, color }: { label: string; value: string; color: string }) {
  const palette: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    teal: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  };
  return (
    <div className="flex justify-between items-center bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/40">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${palette[color] ?? palette.teal}`}>
        {value}
      </span>
    </div>
  );
}

function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex gap-4 animate-pulse">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-3 bg-slate-800 rounded w-1/3" />
            <div className="h-2.5 bg-slate-800/60 rounded w-2/3" />
            <div className="h-2 bg-slate-800/40 rounded w-1/2" />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <div className="w-20 h-8 bg-slate-800 rounded-xl" />
            <div className="w-16 h-8 bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl">
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm text-slate-400">{text}</span>
    </div>
  );
}
