import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ArchitectDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/architects/login?callbackUrl=/architects/dashboard')
  }

  const isSuperAdmin =
    session.user.email?.toLowerCase() === 'nexmove.pk@gmail.com' ||
    session.user.role === 'SUPER_ADMIN'

  // Super Admins bypass the lockout to inspect or assist
  if (!isSuperAdmin) {
    let dbUser = null
    try {
      if (session.user.email) {
        dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionStatus: true,
            isKycVerified: true,
            isOverseasVerified: true,
          },
        })
      }
    } catch (e) {
      console.error('[Architect Dashboard Layout] DB check error:', e)
    }

    const isSuspended =
      dbUser?.subscriptionStatus === 'SUSPENDED' ||
      dbUser?.subscriptionStatus === 'PENDING_PAYMENT'

    if (isSuspended) {
      return (
        <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-slate-900 border border-red-500/40 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            {/* Red glow effect */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-4xl mb-6 shadow-inner">
              🚫
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full mb-3">
              {dbUser?.subscriptionStatus === 'PENDING_PAYMENT' ? 'Payment Required' : 'Account Suspended'}
            </span>

            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              {dbUser?.subscriptionStatus === 'PENDING_PAYMENT'
                ? 'Subscription Payment Pending'
                : 'Studio Access Suspended'}
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md mb-6">
              {dbUser?.subscriptionStatus === 'PENDING_PAYMENT'
                ? 'Your Architect Studio subscription has a pending payment. Please settle your dues or renew your subscription to reactivate access.'
                : 'Your Architect Studio account has been suspended or placed on hold by NexMove Super Administration. Your public profile has been removed from directory searches.'}
            </p>

            <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 mb-6 text-left flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Account:</span>
                <span className="font-semibold text-slate-300">{session.user.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-red-400">{dbUser?.subscriptionStatus || 'SUSPENDED'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">KYC Verification:</span>
                <span className="font-bold text-amber-400">
                  {dbUser?.isKycVerified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <a
                href="mailto:support@nexmove.pk?subject=Architect%20Account%20Reactivation%20Request"
                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-red-900/30 transition flex items-center justify-center gap-2"
              >
                <span>✉️</span>
                <span>Contact NexMove Support</span>
              </a>
              <Link
                href="/login"
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 px-4 rounded-xl transition flex items-center justify-center"
              >
                Sign In As Other User
              </Link>
            </div>
          </div>
        </main>
      )
    }
  }

  return <>{children}</>
}
