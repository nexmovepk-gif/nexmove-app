"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingArchitect {
  id: string;
  name: string;
  title?: string | null;
  specialization: string;
  experienceLevel?: string | null;
  location?: string | null;
  councilLicenseNo?: string | null;
  verificationStatus: string;
  isVerified: boolean;
  bio?: string | null;
  software?: string[];
  projectTypes?: string[];
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
  overseasCountry?: string | null;
  createdAt: string;
}

interface ApprovalsData {
  pendingArchitects: PendingArchitect[];
  pendingAgencies: PendingAgency[];
  pendingUserKYC: PendingUser[];
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

  const [activeTab, setActiveTab] = useState<"architects" | "agencies" | "kyc" | "system">("architects");
  const [data, setData] = useState<ApprovalsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [systemStatus, setSystemStatus] = useState<{ status: string; databaseConnection: string; activeTenantsCount: number } | null>(null);
  const [systemLoading, setSystemLoading] = useState(false);

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
      const res = await fetch("/api/admin/approvals");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      addToast("Failed to load approvals data.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

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

  const handleAction = async (
    type: "architect" | "agency" | "user",
    id: string,
    action: "approve" | "reject",
    label: string
  ) => {
    setActionLoading(`${type}-${id}-${action}`);
    try {
      // Route architect actions to the dedicated endpoint for immediate DB sync
      const endpoint =
        type === "architect" ? "/api/admin/approve-architect" : "/api/admin/action";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }
      addToast(`${label} ${action === "approve" ? "✓ Approved" : "✗ Rejected"} successfully.`, "success");
      // Immediate UI refresh after action
      await fetchApprovals();
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
              Global Control & Approvals
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-6 flex flex-col gap-5">

        {/* Identity Banner */}
        <section className="bg-gradient-to-br from-purple-950/30 to-indigo-950/20 border border-purple-500/20 rounded-3xl p-4 flex items-center gap-4 shadow-xl shadow-purple-950/30">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black text-base flex-shrink-0">
            SA
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-slate-200 truncate">{session.user.name ?? session.user.email}</span>
            <span className="text-xs text-slate-400 truncate">{session.user.email}</span>
          </div>
          <div className="ml-auto flex-shrink-0">
            <span className="text-[10px] bg-purple-500/10 border border-purple-500/30 text-purple-400 px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider">
              SUPER ADMIN
            </span>
          </div>
        </section>

        {/* Tabs */}
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
                    activeTab === tab.key ? "bg-white/20 text-white" : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
          <button
            onClick={fetchApprovals}
            disabled={loading}
            className="ml-auto flex-shrink-0 text-[11px] text-slate-500 hover:text-slate-300 px-2.5 py-1.5 rounded-xl hover:bg-slate-800/60 transition flex items-center gap-1"
          >
            {loading ? (
              <span className="w-3 h-3 border border-slate-500 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <span>↻</span>
            )}
            Refresh
          </button>
        </div>

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
                        {arch.location ? ` · ${arch.location}` : ""}
                      </span>
                      {/* Bio excerpt */}
                      {arch.bio && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{arch.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {arch.experienceLevel && (
                          <Chip color="teal">{arch.experienceLevel}</Chip>
                        )}
                        {arch.councilLicenseNo && (
                          <Chip color="amber">License: {arch.councilLicenseNo}</Chip>
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
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <span className="text-3xl">{emoji}</span>
      <span className="text-sm text-slate-500">{text}</span>
    </div>
  );
}
