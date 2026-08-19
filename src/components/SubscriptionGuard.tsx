'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock, AlertTriangle, ShieldAlert, CreditCard, RefreshCw,
  PhoneCall, CheckCircle2, ArrowRight, Building2, HelpCircle
} from 'lucide-react';
import BankTransferCheckoutModal from './BankTransferCheckoutModal';
import { formatSubscriptionDate, isSubscriptionLocked, SubscriptionStatus } from '@/types/subscription';

interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallbackStatus?: SubscriptionStatus;
  fallbackEndDate?: string | null;
}

export default function SubscriptionGuard({
  children,
  fallbackStatus,
  fallbackEndDate,
}: SubscriptionGuardProps) {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SubscriptionStatus>(fallbackStatus || 'ACTIVE');
  const [endDate, setEndDate] = useState<string | null>(fallbackEndDate || null);
  const [agencyName, setAgencyName] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setIsChecking(true);
      const res = await fetch('/api/agency/status');
      if (res.ok) {
        const data = await res.json();
        if (data?.subscription) {
          const currentStatus: SubscriptionStatus = data.subscription.status;
          const currentEndDate: string | null = data.subscription.endDate;
          const locked = data.subscription.isLocked ?? isSubscriptionLocked(currentStatus, currentEndDate);

          setStatus(currentStatus);
          setEndDate(currentEndDate);
          setIsLocked(locked);
          if (data.agency?.name) setAgencyName(data.agency.name);
        }
      } else {
        // Fallback calculation if API is unavailable
        const locked = isSubscriptionLocked(fallbackStatus, fallbackEndDate);
        setIsLocked(locked);
      }
    } catch (err) {
      console.warn('[SubscriptionGuard] Status check warning:', err);
      const locked = isSubscriptionLocked(fallbackStatus, fallbackEndDate);
      setIsLocked(locked);
    } finally {
      setLoading(false);
      setIsChecking(false);
    }
  }, [fallbackStatus, fallbackEndDate]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="min-h-[500px] w-full flex flex-col items-center justify-center p-8 bg-slate-950/60 backdrop-blur-md rounded-3xl border border-slate-800 text-slate-400">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
        <span className="text-sm font-semibold text-slate-300">Verifying Agency Access & Subscription Guard...</span>
        <span className="text-xs text-slate-500 mt-1">Multi-tenant cryptographic tenant handshake in progress</span>
      </div>
    );
  }

  // If locked, render the full-card lockout banner / overlay
  if (isLocked) {
    const isSuspended = status === 'SUSPENDED';
    const isExpired = status === 'EXPIRED' || (endDate && new Date(endDate) < new Date());

    return (
      <div className="min-h-screen bg-[#060812] text-slate-100 p-4 sm:p-6 lg:p-8 flex items-center justify-center relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl w-full bg-slate-900/90 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-rose-950/40 relative z-10 backdrop-blur-xl flex flex-col gap-6">

          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0 shadow-lg shadow-rose-950/50">
                {isSuspended ? (
                  <ShieldAlert className="w-7 h-7" />
                ) : isExpired ? (
                  <AlertTriangle className="w-7 h-7" />
                ) : (
                  <Lock className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                    {isSuspended ? 'ACCOUNT SUSPENDED' : isExpired ? 'SUBSCRIPTION EXPIRED' : 'PAYMENT REQUIRED'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-1 tracking-tight">
                  Agency Portal Access Locked
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {agencyName ? `Agency: ${agencyName}` : 'NexMove Agency Command Center'}
                </p>
              </div>
            </div>

            <button
              onClick={fetchStatus}
              disabled={isChecking}
              className="self-start sm:self-auto text-xs bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3.5 py-2 rounded-xl transition flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Re-check Status</span>
            </button>
          </div>

          {/* Explanation Alert Box */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-4 sm:p-5 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <span>⚠️</span>
              <span>Why is my Agency Account restricted?</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {isSuspended
                ? 'Your agency account has been temporarily suspended by the Super Admin compliance team. Please contact administration directly to resolve outstanding requirements or billing discrepancies.'
                : isExpired
                ? `Your agency subscription expired on ${formatSubscriptionDate(endDate)}. Automated listing indexing, buyer lead matching, and deal workflows have been paused until renewal.`
                : 'Your agency has an outstanding invoice / pending subscription payment. Settle your fee via direct bank transfer or online checkout to immediately restore full access.'}
            </p>
          </div>

          {/* Payment & Restoration Instructions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Direct Bank Transfer Details */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-wider">Meezan Bank Settle Account</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Bank Name</span>
                  <span className="font-bold text-slate-200">Meezan Bank Limited</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Account Title</span>
                  <span className="font-bold text-slate-200">NexMove Real Estate Tech</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400">Account Number</span>
                  <span className="font-mono font-bold text-emerald-400">02130104889201</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IBAN</span>
                  <span className="font-mono text-[11px] font-bold text-emerald-400">PK45MEZN0002130104889201</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                * Please send payment proof (screenshot/receipt) to WhatsApp support or upload via checkout modal.
              </p>
            </div>

            {/* Quick Actions & Support */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-purple-400 mb-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-wider">Instant Restoration</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Choose a subscription plan to generate an automated renewal invoice or submit your bank transaction ID for instant verification.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Renew Subscription Online</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <a
                  href="https://wa.me/923001234567?text=Hello%20NexMove%20Admin,%20I%20need%20assistance%20unlocking%20my%20Agency%20subscription."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Contact WhatsApp Support (+92 300 1234567)</span>
                </a>
              </div>
            </div>

          </div>

          {/* Trust Guarantee Note */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>All property data and client leads are securely preserved and encrypted.</span>
            </div>
            <div className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Support available 24/7</span>
            </div>
          </div>

        </div>

        {/* Modal */}
        <BankTransferCheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          selectedPlanTitle="Professional Plan (Renewal)"
          selectedPlanPricePKR={15000}
        />
      </div>
    );
  }

  // Active & valid subscription — render children cleanly
  return <>{children}</>;
}
