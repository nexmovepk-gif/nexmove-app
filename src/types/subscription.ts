// src/types/subscription.ts
// Centralized type definitions and helpers for NexMove User & Agency Subscription Management

export type SubscriptionStatus = 'ACTIVE' | 'PENDING_PAYMENT' | 'EXPIRED' | 'SUSPENDED';

export interface SubscriptionData {
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndDate: string | null;
  isKycVerified: boolean;
}

export interface AgencySubscriptionOverview {
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
  createdAt: string;
}

export interface UserSubscriptionOverview {
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
  createdAt: string;
}

/**
 * Calculates remaining days until subscription expiration.
 * Returns negative numbers if expired, or null if no end date set.
 */
export function calculateRemainingDays(subscriptionEndDate?: string | Date | null): number | null {
  if (!subscriptionEndDate) return null;
  const end = new Date(subscriptionEndDate);
  if (isNaN(end.getTime())) return null;

  const now = new Date();
  // Calculate difference in whole days
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Checks if subscription is active but expiring within threshold days (default 5 days).
 */
export function isSubscriptionExpiringSoon(
  subscriptionStatus?: string | null,
  subscriptionEndDate?: string | Date | null,
  thresholdDays: number = 5
): boolean {
  if (!subscriptionStatus || subscriptionStatus.toUpperCase() !== 'ACTIVE') {
    return false;
  }
  const remaining = calculateRemainingDays(subscriptionEndDate);
  if (remaining === null) return false;
  return remaining >= 0 && remaining <= thresholdDays;
}

/**
 * Checks if access should be locked due to status (PENDING_PAYMENT, EXPIRED, SUSPENDED)
 * or if subscriptionEndDate has passed.
 */
export function isSubscriptionLocked(
  subscriptionStatus?: string | null,
  subscriptionEndDate?: string | Date | null
): boolean {
  const normStatus = (subscriptionStatus || '').toUpperCase();

  if (normStatus === 'PENDING_PAYMENT' || normStatus === 'EXPIRED' || normStatus === 'SUSPENDED') {
    return true;
  }

  // If status is ACTIVE, check if end date has passed
  if (subscriptionEndDate) {
    const remaining = calculateRemainingDays(subscriptionEndDate);
    if (remaining !== null && remaining < 0) {
      return true;
    }
  }

  return false;
}

/**
 * Human-friendly date formatter
 */
export function formatSubscriptionDate(date?: string | Date | null): string {
  if (!date) return 'Indefinite';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-PK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Color and styling tokens for subscription status badges
 */
export function getSubscriptionBadgeStyle(status: SubscriptionStatus | string) {
  switch ((status || '').toUpperCase()) {
    case 'ACTIVE':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
        label: 'ACTIVE',
      };
    case 'PENDING_PAYMENT':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
        label: 'PENDING PAYMENT',
      };
    case 'EXPIRED':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        dot: 'bg-rose-400',
        label: 'EXPIRED',
      };
    case 'SUSPENDED':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-500',
        label: 'SUSPENDED',
      };
    default:
      return {
        bg: 'bg-slate-800',
        text: 'text-slate-400',
        border: 'border-slate-700',
        dot: 'bg-slate-400',
        label: status || 'UNKNOWN',
      };
  }
}
