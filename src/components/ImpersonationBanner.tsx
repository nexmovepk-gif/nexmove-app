'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Eye, ArrowLeft } from 'lucide-react';

interface ImpersonationState {
  isActive: boolean;
  targetUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    accountRoleType?: string | null;
    agencyId?: string | null;
    agencyName?: string | null;
  };
  admin?: {
    id: string;
    email: string;
    name: string;
  };
  destinationUrl?: string;
}

export default function ImpersonationBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [impersonation, setImpersonation] = useState<ImpersonationState | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const checkImpersonationStatus = useCallback(async () => {
    try {
      // Don't render banner if already on /admin/dashboard
      if (pathname === '/admin/dashboard') {
        setImpersonation(null);
        return;
      }

      const res = await fetch('/api/admin/impersonate');
      if (res.ok) {
        const data = await res.json();
        if (data?.isActive) {
          setImpersonation(data);
        } else {
          setImpersonation(null);
        }
      } else {
        setImpersonation(null);
      }
    } catch {
      setImpersonation(null);
    }
  }, [pathname]);

  useEffect(() => {
    checkImpersonationStatus();
  }, [checkImpersonationStatus]);

  const handleExitImpersonation = async () => {
    try {
      setIsExiting(true);
      await fetch('/api/admin/impersonate', { method: 'DELETE' });
      setImpersonation(null);
      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      console.error('Failed to exit impersonation:', err);
      setIsExiting(false);
    }
  };

  if (!impersonation || !impersonation.isActive || !impersonation.targetUser) {
    return null;
  }

  const target = impersonation.targetUser;

  return (
    <div className="sticky top-0 z-[99999] bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-950 border-b-2 border-purple-500/80 text-slate-100 px-4 py-2.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left Side: Status Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center text-sm flex-shrink-0 animate-pulse">
            <Eye className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-xs font-semibold text-slate-200">
              👁️ You are currently inspecting{' '}
              <span className="font-black text-amber-300 underline decoration-amber-400">
                {target.name || target.email}
              </span>
              &apos;s Dashboard as <strong className="text-purple-300">Super Admin</strong>.
            </span>
            <span className="text-[10px] bg-purple-500/20 border border-purple-400/30 text-purple-200 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              {target.accountRoleType || target.role}
            </span>
            {target.agencyName && (
              <span className="text-[10px] bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                🏢 {target.agencyName}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Exit Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <button
            onClick={handleExitImpersonation}
            disabled={isExiting}
            className="text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-3.5 py-1.5 rounded-xl shadow-lg shadow-amber-950/40 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {isExiting ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowLeft className="w-3.5 h-3.5" />
            )}
            <span>Exit Inspection / Return to Admin</span>
          </button>
        </div>

      </div>
    </div>
  );
}
