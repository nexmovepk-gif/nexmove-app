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
  description?: string | null;
  ntn?: string | null;
  cnicNumber?: string | null;
  cnicFrontUrl?: string | null;
  cnicBackUrl?: string | null;
  storefrontPhoto?: string | null;
  ownerPhoto?: string | null;
  commercialLicenseDoc?: string | null;
  verified: boolean;
  verifiedLicense?: boolean;
  isKycVerified: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: string | null;
  userCount: number;
  listingCount: number;
  propertyCount?: number;
  dealCount?: number;
  createdAt: string;
}

interface ManagedUser {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  address?: string | null;
  role: string;
  accountRoleType: string | null;
  cnicNumber?: string | null;
  cnicFrontUrl?: string | null;
  cnicBackUrl?: string | null;
  nicopNumber?: string | null;
  passportNumber?: string | null;
  overseasCountry?: string | null;
  overseasCity?: string | null;
  overseasDocPhoto?: string | null;
  liveSelfieUrl?: string | null;
  taxIdNumber?: string | null;
  isKycVerified: boolean;
  isOverseasVerified?: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: string | null;
  agencyId: string | null;
  agencyName: string | null;
  architectProfile?: { id: string; name: string; specialization: string; pcatpNo?: string | null; isVerified: boolean } | null;
  listingCount?: number;
  propertyCount?: number;
  dealsCount?: number;
  createdAt: string;
}

interface ManagedProperty {
  id: string;
  title: string;
  price: number;
  city?: string;
  address?: string;
  propertyType?: string;
  images?: string[];
  agency?: { name?: string };
  contactName?: string;
  verifiedProperty?: boolean;
  createdAt?: string;
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

  const [activeTab, setActiveTab] = useState<"management" | "ads" | "properties" | "architects" | "agencies" | "kyc" | "system">("management");
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

  // ─── Properties Management State ───────────────────────────────────────────
  const [managedProperties, setManagedProperties] = useState<ManagedProperty[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);

  // ─── Permanent Delete Modal State ──────────────────────────────────────────
  interface DeleteModalTarget {
    type: "property" | "agency" | "user" | "architect" | "ad";
    id: string;
    title: string;
  }
  const [deleteModalTarget, setDeleteModalTarget] = useState<DeleteModalTarget | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Admin Ads & Promotions Manager State ─────────────────────────────────
  const [adminPromotions, setAdminPromotions] = useState<Record<string, unknown>[]>([]);
  const [promoStats, setPromoStats] = useState<{
    totalAds: number;
    activeAds: number;
    pendingAds: number;
    totalAdRevenuePKR: number;
    totalViews: number;
    totalClicks: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoStatusFilter, setPromoStatusFilter] = useState("ALL");

  // ─── Profile Details Modal State ───────────────────────────────────────────
  const [selectedDetail, setSelectedDetail] = useState<{
    type: "agency" | "user";
    data: ManagedAgency | ManagedUser;
  } | null>(null);

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

  const fetchAdminPromotions = useCallback(async () => {
    setPromoLoading(true);
    try {
      const res = await fetch(`/api/admin/promotions?status=${promoStatusFilter}`, { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setAdminPromotions(json.promotions || []);
        if (json.stats) setPromoStats(json.stats);
      }
    } catch {
      /* ignore */
    } finally {
      setPromoLoading(false);
    }
  }, [promoStatusFilter]);

  const handleAdminPromoAction = async (promotionId: string, action: string, extra?: { days?: number }) => {
    try {
      setActionLoading(`promo-${promotionId}-${action}`);
      if (action === "DELETE") {
        const res = await fetch(`/api/admin/promotions?id=${promotionId}`, { method: "DELETE" });
        if (res.ok) {
          addToast("Promotion permanently removed.", "success");
          await fetchAdminPromotions();
        }
      } else {
        const res = await fetch(`/api/admin/promotions`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promotionId,
            status:
              action === "ACTIVATE"
                ? "ACTIVE"
                : action === "PAUSE"
                ? "PAUSED"
                : action === "REJECT"
                ? "REJECTED"
                : undefined,
            extendDays: action === "EXTEND" ? (extra?.days || 7) : undefined,
          }),
        });
        if (res.ok) {
          addToast(`Promotion updated (${action}).`, "success");
          await fetchAdminPromotions();
        }
      }
    } catch {
      addToast("Failed to update promotion", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    try {
      const res = await fetch("/api/public/listings", { cache: "no-store" });
      const json = await res.json();
      if (json.listings && Array.isArray(json.listings)) {
        setManagedProperties(json.listings);
      }
    } catch {
      /* silently ignore */
    } finally {
      setPropertiesLoading(false);
    }
  }, []);

  const handleConfirmPermanentDelete = async () => {
    if (!deleteModalTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/admin/delete-item?type=${deleteModalTarget.type}&id=${encodeURIComponent(deleteModalTarget.id)}`,
        { method: "DELETE" }
      );
      const json = await res.json();
      if (res.ok && json.success) {
        addToast(json.message || "Item permanently deleted!", "success");
        if (deleteModalTarget.type === "property") {
          setManagedProperties((prev) => prev.filter((p) => p.id !== deleteModalTarget.id));
        } else if (deleteModalTarget.type === "agency") {
          setManagedAgencies((prev) => prev.filter((a) => a.id !== deleteModalTarget.id));
        } else if (deleteModalTarget.type === "user") {
          setManagedUsers((prev) => prev.filter((u) => u.id !== deleteModalTarget.id));
        } else if (deleteModalTarget.type === "architect") {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  pendingArchitects: prev.pendingArchitects.filter((a) => a.id !== deleteModalTarget.id),
                }
              : null
          );
        } else if (deleteModalTarget.type === "ad") {
          setAdminPromotions((prev) => prev.filter((p) => p.id !== deleteModalTarget.id));
        }
        setDeleteModalTarget(null);
        setSelectedDetail(null);
      } else {
        addToast(json.error || "Failed to delete item.", "error");
      }
    } catch (err) {
      console.error("Permanent delete error:", err);
      addToast("Network error during permanent deletion.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [approvalsRes, pendingRes] = await Promise.all([
        fetch("/api/admin/approvals", { cache: "no-store" }),
        fetch("/api/admin/pending", { cache: "no-store" }),
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

      const res = await fetch(`/api/admin/users-agencies?${params.toString()}`, { cache: "no-store" });
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

        // Keep detail modal state synced if open
        setSelectedDetail((current) => {
          if (!current) return null;
          if (current.type === "agency") {
            const found = (json.agencies as ManagedAgency[])?.find((a) => a.id === current.data.id);
            return found ? { type: "agency", data: found } : current;
          } else {
            const found = (json.users as ManagedUser[])?.find((u) => u.id === current.data.id);
            return found ? { type: "user", data: found } : current;
          }
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
      fetchProperties();
    }
  }, [status, isSuperAdmin, fetchApprovals, fetchProperties]);

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

      setSelectedDetail((current) => {
        if (current && current.type === "agency" && current.data.id === agencyId) {
          return {
            type: "agency",
            data: {
              ...(current.data as ManagedAgency),
              subscriptionStatus: updatedAgency.subscriptionStatus ?? current.data.subscriptionStatus,
              subscriptionEndDate: updatedAgency.subscriptionEndDate ?? current.data.subscriptionEndDate,
              isKycVerified: updatedAgency.isKycVerified ?? (current.data as ManagedAgency).isKycVerified,
              verified: updatedAgency.verified ?? (current.data as ManagedAgency).verified,
            },
          };
        }
        return current;
      });

      addToast(
        updates.extensionDays
          ? `✓ Extended ${agencyName}'s subscription by ${updates.extensionDays} days!`
          : `✓ ${agencyName} updated: ${updates.subscriptionStatus || (updates.isKycVerified !== undefined ? "KYC updated" : "Saved")}`,
        "success"
      );
      router.refresh();
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

      setSelectedDetail((current) => {
        if (current && current.type === "user" && current.data.id === userId) {
          return {
            type: "user",
            data: {
              ...(current.data as ManagedUser),
              subscriptionStatus: updatedUser.subscriptionStatus ?? current.data.subscriptionStatus,
              subscriptionEndDate: updatedUser.subscriptionEndDate ?? current.data.subscriptionEndDate,
              isKycVerified: updatedUser.isKycVerified ?? (current.data as ManagedUser).isKycVerified,
            },
          };
        }
        return current;
      });

      addToast(`✓ Updated ${userEmail} subscription: ${updates.subscriptionStatus || (updates.isKycVerified !== undefined ? "KYC updated" : "Saved")}`, "success");
      router.refresh();
    } catch (err) {
      addToast((err as Error).message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Super Admin Impersonation Action Handler ─────────────────────────────
  const handleStartImpersonation = async (targetUserId?: string, targetAgencyId?: string) => {
    const key = `impersonate-${targetUserId || targetAgencyId}`;
    setActionLoading(key);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, targetAgencyId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start impersonation");
      }
      const data = await res.json();
      addToast(`✓ Switching to ${data.targetUser?.name || "Target"}'s dashboard as Super Admin...`, "success");
      setSelectedDetail(null);
      router.push(data.destinationUrl || "/agency/dashboard");
      router.refresh();
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
    {
      key: "ads" as const,
      label: "Ads & Revenue",
      emoji: "📢",
      count: promoStats?.activeAds ?? 0,
    },
    {
      key: "properties" as const,
      label: "Properties & Listings",
      emoji: "🏡",
      count: managedProperties.length,
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

        {/* ── Tab Content renders ── */}
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
                    Real-time database queries, inspect complete profiles, individual status toggles & KYC guards.
                  </p>
                </div>

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

            {/* Render: Managed Agencies */}
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
                        className="bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition shadow-lg group"
                      >
                        <div
                          onClick={() => setSelectedDetail({ type: "agency", data: agency })}
                          className="flex items-start gap-3.5 flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow group-hover:scale-105 transition-transform">
                            {agency.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors">
                                {agency.name}
                              </span>
                              
                              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg} ${badge.text} ${badge.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>

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

                        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto flex-shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
                          <button
                            onClick={() => setSelectedDetail({ type: "agency", data: agency })}
                            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                          >
                            <span>🔍</span>
                            <span>View Details</span>
                          </button>

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

                          <button
                            onClick={() => setDeleteModalTarget({ type: "agency", id: agency.id, title: agency.name })}
                            className="text-xs bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl font-bold transition flex items-center gap-1"
                            title="Permanently Delete Agency from Database"
                          >
                            <span>🗑️ Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Render: Managed Users */}
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
                        className="bg-slate-900/50 border border-slate-800 hover:border-purple-500/30 rounded-3xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition shadow-lg group"
                      >
                        <div
                          onClick={() => setSelectedDetail({ type: "user", data: u })}
                          className="flex items-start gap-3.5 flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-700 to-purple-700 flex items-center justify-center text-white font-black text-base flex-shrink-0 shadow group-hover:scale-105 transition-transform">
                            {(u.name || u.email).charAt(0).toUpperCase()}
                          </div>

                          <div className="flex flex-col gap-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors">
                                {u.name || "Unnamed User"}
                              </span>
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

                        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto flex-shrink-0">
                          <button
                            onClick={() => setSelectedDetail({ type: "user", data: u })}
                            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                          >
                            <span>🔍</span>
                            <span>View Details</span>
                          </button>

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
                            onClick={() => setDeleteModalTarget({ type: "user", id: u.id, title: u.name || u.email })}
                            className="text-xs bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl font-bold transition flex items-center gap-1"
                            title="Permanently Delete User from Database"
                          >
                            <span>🗑️ Delete</span>
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

        {/* ── Tab: Properties & Listings Vault ── */}
        {activeTab === "properties" && (
          <section className="flex flex-col gap-4">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div>
                <h2 className="text-base font-black text-slate-100 tracking-tight flex items-center gap-2">
                  <span>🏡 Platform Properties &amp; Listings Vault</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect all active properties and permanently remove any unverified or violating listing from platform.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchProperties}
                  disabled={propertiesLoading}
                  className="text-xs font-bold bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl transition"
                >
                  ↻ Refresh Listings
                </button>
                <span className="text-xs bg-slate-950 border border-slate-800 text-purple-400 font-bold px-3 py-1.5 rounded-xl font-mono">
                  Total: {managedProperties.length} Properties
                </span>
              </div>
            </div>

            {propertiesLoading ? (
              <SkeletonRows count={4} />
            ) : managedProperties.length === 0 ? (
              <EmptyState emoji="🏡" text="No property listings found in database." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {managedProperties.map((prop) => (
                  <div key={prop.id} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex gap-4 shadow-md hover:border-slate-700 transition">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-950 flex-shrink-0 border border-slate-800">
                      {prop.images && prop.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-[10px]">No Image</div>
                      )}
                    </div>
                    <div className="flex flex-col justify-between flex-1 min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{prop.title}</h4>
                          <span className="text-xs font-black text-emerald-400 font-mono whitespace-nowrap">
                            PKR {prop.price.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          📍 {prop.address || prop.city || 'Pakistan'} · {prop.propertyType || 'Property'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Owner/Agency: <strong className="text-slate-300">{prop.agency?.name || prop.contactName || 'Marketplace Seller'}</strong>
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2">
                        <span className="text-[10px] font-mono text-slate-500">ID: {prop.id.slice(0, 8)}...</span>
                        <button
                          onClick={() => setDeleteModalTarget({ type: 'property', id: prop.id, title: prop.title })}
                          className="text-[11px] font-bold bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 px-3 py-1 rounded-xl transition flex items-center gap-1"
                        >
                          <span>🗑️ Permanent Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Tab: Ads & Revenue Management ──────────────────────────────────── */}
        {activeTab === "ads" && (
          <section className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <span>📢 Platform Ads & Paid Promotions Manager</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review real-time advertiser campaigns, approve sponsored listings, and monitor ad revenue.
                </p>
              </div>

              <button
                onClick={fetchAdminPromotions}
                disabled={promoLoading}
                className="self-start sm:self-auto text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5"
              >
                {promoLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  "↻"
                )}
                <span>Refresh Ads</span>
              </button>
            </div>

            {/* Ads Revenue & Analytics KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Total Ad Revenue</span>
                <p className="text-xl font-black text-white mt-1">
                  Rs. {promoStats?.totalAdRevenuePKR.toLocaleString() ?? 0}
                </p>
                <span className="text-[10px] text-slate-400">All-time paid ads</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Campaigns</span>
                <p className="text-xl font-black text-emerald-400 mt-1">
                  {promoStats?.activeAds ?? 0}
                </p>
                <span className="text-[10px] text-slate-500">Live on platform</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Impressions</span>
                <p className="text-xl font-black text-teal-400 mt-1">
                  {promoStats?.totalViews.toLocaleString() ?? 0}
                </p>
                <span className="text-[10px] text-slate-500">Public ad views</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Buyer Clicks</span>
                <p className="text-xl font-black text-indigo-400 mt-1">
                  {promoStats?.totalClicks.toLocaleString() ?? 0}
                </p>
                <span className="text-[10px] text-slate-500">Click-throughs</span>
              </div>
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80">
              {["ALL", "ACTIVE", "PENDING", "PAUSED", "EXPIRED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setPromoStatusFilter(st)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                    promoStatusFilter === st
                      ? "bg-purple-600 text-white shadow"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Promotions List */}
            {promoLoading ? (
              <SkeletonRows count={4} />
            ) : adminPromotions.length === 0 ? (
              <EmptyState emoji="📢" text="No ad campaigns found in this filter." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {adminPromotions.map((promo) => {
                  const isActive = promo.status === "ACTIVE";
                  const isPending = promo.status === "PENDING";
                  const isPaused = promo.status === "PAUSED";
                  const isActionLoading = actionLoading?.includes(promo.id);

                  return (
                    <div
                      key={promo.id}
                      className={`bg-slate-900/60 border rounded-3xl p-5 flex flex-col justify-between gap-4 transition shadow-lg ${
                        isActive
                          ? "border-emerald-500/40"
                          : isPending
                          ? "border-amber-500/40"
                          : "border-slate-800"
                      }`}
                    >
                      <div>
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                                isActive
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  : isPending
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : isPaused
                                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                                  : "bg-slate-800 text-slate-400 border-slate-700"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                                }`}
                              />
                              {promo.status}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                              {promo.package} ({promo.durationDays}D)
                            </span>
                          </div>

                          <span className="text-xs font-black text-emerald-400">
                            Rs. {promo.budgetPKR?.toLocaleString()} PKR
                          </span>
                        </div>

                        {/* Target Info */}
                        <div className="flex items-start gap-3 mt-3.5">
                          {promo.entityImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={promo.entityImage as string}
                              alt={String(promo.entityTitle || "Promo")}
                              className="w-16 h-16 object-cover rounded-2xl border border-slate-700 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700 flex-shrink-0">
                              🏢
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-black text-slate-100 truncate">{promo.entityTitle}</h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Owner: <strong className="text-slate-200">{promo.ownerName || promo.ownerEmail || "Advertiser"}</strong> ({promo.ownerType})
                            </p>
                            {promo.ownerEmail && (
                              <p className="text-[11px] text-slate-500">{promo.ownerEmail}</p>
                            )}

                            {/* Placements */}
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {Array.isArray(promo.placements) &&
                                promo.placements.map((pl: string) => (
                                  <span
                                    key={pl}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 border border-teal-500/20"
                                  >
                                    {pl}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>

                        {/* Performance Numbers */}
                        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 border border-slate-800 rounded-2xl p-2.5 mt-3.5 text-center">
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold">Views</span>
                            <p className="text-xs font-black text-white">{promo.viewsCount?.toLocaleString() ?? 0}</p>
                          </div>
                          <div className="border-x border-slate-800">
                            <span className="text-[9px] text-slate-500 uppercase font-bold">Searches</span>
                            <p className="text-xs font-black text-indigo-400">{promo.searchImpressions?.toLocaleString() ?? 0}</p>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-500 uppercase font-bold">Clicks</span>
                            <p className="text-xs font-black text-emerald-400">{promo.clicksCount?.toLocaleString() ?? 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="border-t border-slate-800 pt-3 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          {isPending && (
                            <button
                              disabled={Boolean(isActionLoading)}
                              onClick={() => handleAdminPromoAction(promo.id, "ACTIVATE")}
                              className="text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl transition shadow flex items-center gap-1"
                            >
                              ⚡ Approve & Activate
                            </button>
                          )}

                          {isActive && (
                            <button
                              disabled={Boolean(isActionLoading)}
                              onClick={() => handleAdminPromoAction(promo.id, "PAUSE")}
                              className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl transition"
                            >
                              ⏸️ Pause
                            </button>
                          )}

                          {isPaused && (
                            <button
                              disabled={Boolean(isActionLoading)}
                              onClick={() => handleAdminPromoAction(promo.id, "ACTIVATE")}
                              className="text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition"
                            >
                              ▶️ Resume
                            </button>
                          )}

                          <button
                            disabled={Boolean(isActionLoading)}
                            onClick={() => handleAdminPromoAction(promo.id, "EXTEND", { days: 7 })}
                            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl transition"
                          >
                            +7 Days
                          </button>
                        </div>

                        <button
                          disabled={Boolean(isActionLoading)}
                          onClick={() => setDeleteModalTarget({ type: "ad", id: promo.id, title: promo.entityTitle })}
                          className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-500/30 rounded-xl transition"
                          title="Permanently Delete Ad"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Architects */}
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {arch.name?.charAt(0).toUpperCase() ?? "A"}
                    </div>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-100">{arch.name}</span>
                        {arch.companyName && (
                          <span className="text-xs font-semibold text-slate-400">({arch.companyName})</span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            arch.isOverseas
                              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {arch.isOverseas ? "🌐 OVERSEAS" : "🇵🇰 PAKISTAN"}
                        </span>
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

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 mt-0.5">
                        {arch.user?.email && <span>📧 {arch.user.email}</span>}
                        {(arch.phone || arch.user?.phone) && <span>📞 {arch.phone || arch.user?.phone}</span>}
                        {(arch.pcatpNo || arch.councilLicenseNo) && (
                          <span className="font-mono text-amber-400">📜 PCATP: {arch.pcatpNo || arch.councilLicenseNo}</span>
                        )}
                      </div>

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

        {/* Tab 3: Agencies */}
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {agency.name?.charAt(0).toUpperCase() ?? "A"}
                  </div>
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

        {/* Tab 4: KYC Reviews */}
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-700 to-purple-700 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                    {(user.name ?? user.email)?.charAt(0).toUpperCase() ?? "U"}
                  </div>
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

        {/* Tab 5: System Health */}
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

      {/* ── Complete Profile & Agency Details Modal / Drawer ───────── */}
      {selectedDetail && (
        <DetailsModal
          detail={selectedDetail}
          onClose={() => setSelectedDetail(null)}
          onUpdateAgencySubscription={handleUpdateAgencySubscription}
          onUpdateUserSubscription={handleUpdateUserSubscription}
          onStartImpersonation={handleStartImpersonation}
          actionLoading={actionLoading}
          onDeleteRequest={(target) => setDeleteModalTarget(target)}
        />
      )}

      {/* ── PERMANENT DELETE CONFIRMATION MODAL ──────────────────────────────── */}
      {deleteModalTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => !deleteLoading && setDeleteModalTarget(null)}>
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-slate-900 border border-red-500/40 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-400 border-b border-slate-800 pb-4">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">Confirm Permanent Delete</h3>
                <p className="text-xs text-red-400 font-semibold">Irreversible Hard Deletion Action</p>
              </div>
            </div>

            <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to permanently delete this <strong className="text-white uppercase">{deleteModalTarget.type}</strong>?
              </p>
              <p className="font-bold text-red-300 font-mono text-sm bg-slate-950 p-2.5 rounded-xl border border-red-950">
                &quot;{deleteModalTarget.title}&quot;
              </p>
              <p className="text-[11px] text-slate-400 italic">
                This item will be permanently removed from the Database, Supabase tables, and public platform listings.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteModalTarget(null)}
                className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmPermanentDelete}
                className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition shadow-lg shadow-red-950 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleteLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>🗑️ Yes, Delete Permanently</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Profile & Agency Details Modal Component ─────────────────────────────────

function DetailsModal({
  detail,
  onClose,
  onUpdateAgencySubscription,
  onUpdateUserSubscription,
  onStartImpersonation,
  actionLoading,
  onDeleteRequest,
}: {
  detail: { type: "agency" | "user"; data: ManagedAgency | ManagedUser };
  onClose: () => void;
  onUpdateAgencySubscription: (
    agencyId: string,
    agencyName: string,
    updates: {
      subscriptionStatus?: SubscriptionStatus;
      extensionDays?: number;
      isKycVerified?: boolean;
      verified?: boolean;
    }
  ) => Promise<void>;
  onUpdateUserSubscription: (
    userId: string,
    userEmail: string,
    updates: {
      subscriptionStatus?: SubscriptionStatus;
      extensionDays?: number;
      isKycVerified?: boolean;
    }
  ) => Promise<void>;
  onStartImpersonation: (targetUserId?: string, targetAgencyId?: string) => Promise<void>;
  actionLoading: string | null;
  onDeleteRequest: (target: { type: "agency" | "user"; id: string; title: string }) => void;
}) {
  const isAgency = detail.type === "agency";
  const agency = isAgency ? (detail.data as ManagedAgency) : null;
  const user = !isAgency ? (detail.data as ManagedUser) : null;

  const subscriptionStatus = detail.data.subscriptionStatus;
  const subscriptionEndDate = detail.data.subscriptionEndDate;
  const badge = getSubscriptionBadgeStyle(subscriptionStatus);
  const daysRemaining = calculateRemainingDays(subscriptionEndDate);
  const isKycVerified = Boolean(
    isAgency ? agency?.isKycVerified || agency?.verified : user?.isKycVerified || user?.isOverseasVerified
  );

  const title = isAgency ? agency?.name : user?.name || user?.email;
  const subtitle = isAgency ? `License: ${agency?.licenseNumber || "Not Registered"}` : user?.email;

  const isRowLoading = actionLoading?.includes(detail.data.id);
  const isImpersonating = actionLoading?.startsWith("impersonate-");

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-[#0b0f19] border border-purple-500/30 rounded-3xl max-w-3xl w-full shadow-2xl shadow-purple-950/60 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-slate-900 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0 shadow-lg ${
              isAgency ? "bg-gradient-to-br from-emerald-600 to-teal-700" : "bg-gradient-to-br from-indigo-600 to-purple-700"
            }`}>
              {isAgency ? "🏢" : "👤"}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-slate-100 truncate">{title}</h3>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${badge.bg} ${badge.text} ${badge.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.label}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isKycVerified
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {isKycVerified ? "✓ KYC VERIFIED" : "⏳ KYC PENDING"}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Primary Action Button: Inspect Dashboard / Impersonate */}
            <button
              onClick={() =>
                isAgency
                  ? onStartImpersonation(undefined, agency!.id)
                  : onStartImpersonation(user!.id, undefined)
              }
              disabled={Boolean(isImpersonating)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-purple-950/60 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isImpersonating ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>👁️</span>
              )}
              <span className="hidden sm:inline">{isAgency ? "Inspect Agency Dashboard" : "Inspect User Dashboard"}</span>
              <span className="sm:hidden">Inspect</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 text-sm font-bold w-9 h-9 rounded-xl flex items-center justify-center transition flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* Section 1: Overview & Contact Grid */}
          <div>
            <h4 className="text-[11px] font-black uppercase text-purple-400 tracking-wider mb-3 flex items-center gap-1.5">
              <span>📋</span> Overview & Contact Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <DetailRow label="Entity Type" value={isAgency ? "Real Estate Agency Tenant" : "Individual Platform User"} />
              <DetailRow label="Role / Category" value={isAgency ? "Agency Tenant" : (user?.accountRoleType || user?.role || "Public User")} />
              {isAgency ? (
                <>
                  <DetailRow label="Official License" value={agency?.licenseNumber || "Not registered"} />
                  <DetailRow label="Phone Number" value={agency?.phone || "Not provided"} />
                  <DetailRow label="Office Address" value={agency?.address || "Not provided"} />
                  <DetailRow label="NTN Tax ID" value={agency?.ntn || "Not provided"} />
                </>
              ) : (
                <>
                  <DetailRow label="Email Address" value={user?.email || "N/A"} />
                  <DetailRow label="Phone Number" value={user?.phone || "Not provided"} />
                  <DetailRow label="Residential Address" value={user?.address || "Not provided"} />
                  <DetailRow label="Linked Agency" value={user?.agencyName || "Independent"} />
                </>
              )}
              <DetailRow
                label="Registered Date"
                value={new Date(detail.data.createdAt).toLocaleDateString("en-PK", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              <DetailRow label="Record UUID" value={<span className="font-mono text-[10px] text-slate-400">{detail.data.id}</span>} />
            </div>
          </div>

          {/* Section 2: Complete KYC & Identity Verification */}
          <div>
            <h4 className="text-[11px] font-black uppercase text-emerald-400 tracking-wider mb-3 flex items-center gap-1.5">
              <span>🪪</span> Complete KYC & Legal Verification
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <DetailRow
                label="KYC Status"
                value={
                  <span className={`font-bold ${isKycVerified ? "text-emerald-400" : "text-amber-400"}`}>
                    {isKycVerified ? "✓ Fully Verified & Approved" : "⏳ Pending Review / Unverified"}
                  </span>
                }
              />
              {isAgency ? (
                <>
                  <DetailRow label="Owner CNIC" value={agency?.cnicNumber || "Not provided"} />
                  <DetailRow label="Official License Doc" value={agency?.commercialLicenseDoc ? "✓ Document Uploaded" : "Not uploaded"} />
                  <DetailRow label="Storefront Photo" value={agency?.storefrontPhoto ? "✓ Photo Verified" : "Not uploaded"} />
                  <DetailRow label="Owner Identity Photo" value={agency?.ownerPhoto ? "✓ Photo Uploaded" : "Not uploaded"} />
                </>
              ) : (
                <>
                  <DetailRow label="CNIC / National ID" value={user?.cnicNumber || "Not provided"} />
                  <DetailRow label="NICOP / Overseas ID" value={user?.nicopNumber || "N/A"} />
                  <DetailRow label="Passport Number" value={user?.passportNumber || "N/A"} />
                  <DetailRow
                    label="Overseas Location"
                    value={
                      user?.overseasCountry
                        ? `${user.overseasCity ? `${user.overseasCity}, ` : ""}${user.overseasCountry}`
                        : "Pakistan Resident"
                    }
                  />
                  <DetailRow label="Live Selfie Capture" value={user?.liveSelfieUrl ? "✓ Live Selfie Verified" : "Not captured"} />
                  <DetailRow label="FBR / Tax ID" value={user?.taxIdNumber || "Not registered"} />
                </>
              )}
            </div>
          </div>

          {/* Section 3: Subscription & Billing Status */}
          <div>
            <h4 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider mb-3 flex items-center gap-1.5">
              <span>💳</span> Subscription Status & Access Guard
            </h4>
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Status</span>
                  <span className={`text-sm font-black mt-0.5 ${badge.text}`}>{subscriptionStatus}</span>
                </div>
                <div className="flex flex-col bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Expiration Date</span>
                  <span className="text-sm font-black text-slate-200 mt-0.5">{formatSubscriptionDate(subscriptionEndDate)}</span>
                </div>
                <div className="flex flex-col bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Time Remaining</span>
                  <span className={`text-sm font-black mt-0.5 ${
                    daysRemaining !== null && daysRemaining <= 5 ? "text-rose-400" : "text-emerald-400"
                  }`}>
                    {daysRemaining !== null
                      ? daysRemaining > 0
                        ? `${daysRemaining} Days Left`
                        : daysRemaining === 0
                        ? "Expires Today"
                        : `${Math.abs(daysRemaining)} Days Overdue`
                      : "Indefinite"}
                  </span>
                </div>
              </div>

              {/* Quick Extension Actions inside Modal */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quick Renew:</span>
                <button
                  onClick={() =>
                    isAgency
                      ? onUpdateAgencySubscription(agency!.id, agency!.name, { extensionDays: 30, subscriptionStatus: "ACTIVE" })
                      : onUpdateUserSubscription(user!.id, user!.email, { extensionDays: 30, subscriptionStatus: "ACTIVE" })
                  }
                  disabled={Boolean(isRowLoading)}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition flex items-center gap-1"
                >
                  <span>+30 Days</span>
                </button>
                <button
                  onClick={() =>
                    isAgency
                      ? onUpdateAgencySubscription(agency!.id, agency!.name, { extensionDays: 90, subscriptionStatus: "ACTIVE" })
                      : onUpdateUserSubscription(user!.id, user!.email, { extensionDays: 90, subscriptionStatus: "ACTIVE" })
                  }
                  disabled={Boolean(isRowLoading)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition flex items-center gap-1"
                >
                  <span>+90 Days</span>
                </button>
                <button
                  onClick={() =>
                    isAgency
                      ? onUpdateAgencySubscription(agency!.id, agency!.name, { extensionDays: 365, subscriptionStatus: "ACTIVE" })
                      : onUpdateUserSubscription(user!.id, user!.email, { extensionDays: 365, subscriptionStatus: "ACTIVE" })
                  }
                  disabled={Boolean(isRowLoading)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition flex items-center gap-1"
                >
                  <span>+1 Year</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Activity & Managed Inventory (For Agencies) */}
          {isAgency && (
            <div>
              <h4 className="text-[11px] font-black uppercase text-amber-400 tracking-wider mb-3 flex items-center gap-1.5">
                <span>📊</span> Managed Inventory & Tenant Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <MetricBox label="Agents / Members" value={String(agency?.userCount || 0)} color="indigo" />
                <MetricBox label="Active Listings" value={String(agency?.listingCount || 0)} color="emerald" />
                <MetricBox label="Managed Properties" value={String(agency?.propertyCount || agency?.listingCount || 0)} color="teal" />
                <MetricBox label="Closed Deals" value={String(agency?.dealCount || 0)} color="purple" />
              </div>
            </div>
          )}

        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Status select */}
            <span className="text-[11px] font-bold text-slate-400">Set Status:</span>
            <select
              value={subscriptionStatus}
              onChange={(e) =>
                isAgency
                  ? onUpdateAgencySubscription(agency!.id, agency!.name, { subscriptionStatus: e.target.value as SubscriptionStatus })
                  : onUpdateUserSubscription(user!.id, user!.email, { subscriptionStatus: e.target.value as SubscriptionStatus })
              }
              disabled={Boolean(isRowLoading)}
              className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 focus:outline-none cursor-pointer"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING_PAYMENT">PENDING PAYMENT</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>

            {/* KYC Toggle in modal */}
            <button
              onClick={() =>
                isAgency
                  ? onUpdateAgencySubscription(agency!.id, agency!.name, { isKycVerified: !agency?.isKycVerified, verified: !agency?.verified })
                  : onUpdateUserSubscription(user!.id, user!.email, { isKycVerified: !user?.isKycVerified })
              }
              disabled={Boolean(isRowLoading)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${
                isKycVerified
                  ? "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
              }`}
            >
              {isKycVerified ? "Revoke KYC" : "✓ Verify KYC"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Fast Toggle: Active <-> Suspended */}
            <button
              onClick={() =>
                isAgency
                  ? onUpdateAgencySubscription(agency!.id, agency!.name, {
                      subscriptionStatus: subscriptionStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                    })
                  : onUpdateUserSubscription(user!.id, user!.email, {
                      subscriptionStatus: subscriptionStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
                    })
              }
              disabled={Boolean(isRowLoading)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition ${
                subscriptionStatus === "ACTIVE"
                  ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                  : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {isRowLoading ? (
                <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{subscriptionStatus === "ACTIVE" ? "🔒 Suspend Access" : "⚡ Activate Account"}</span>
              )}
            </button>

            <button
              onClick={() => {
                const targetType = isAgency ? "agency" : "user";
                const targetId = isAgency ? agency!.id : user!.id;
                const targetTitle = isAgency ? agency!.name : (user!.name || user!.email);
                onDeleteRequest({ type: targetType, id: targetId, title: targetTitle });
              }}
              className="text-xs font-bold bg-red-950/50 hover:bg-red-900/80 text-red-400 border border-red-500/40 px-3.5 py-2 rounded-xl transition flex items-center gap-1"
              title="Permanently Delete Entity"
            >
              <span>🗑️ Delete</span>
            </button>

            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{label}</span>
      <span className="text-xs font-semibold text-slate-200 break-words">{value}</span>
    </div>
  );
}

function MetricBox({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    teal: "text-teal-400",
    purple: "text-purple-400",
  };
  return (
    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
      <span className="text-[10px] text-slate-500 uppercase font-bold">{label}</span>
      <span className={`text-lg font-black mt-1 ${colorMap[color] ?? "text-slate-200"}`}>{value}</span>
    </div>
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
