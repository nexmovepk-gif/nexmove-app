'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  interface SystemStatus {
    status: string
    databaseConnection: string
    activeTenantsCount: number
  }
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/unauthorized')
    }
  }, [status, session, router])

  const fetchSystemStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system-status')
      const data = await res.json()
      setSystemStatus(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'SUPER_ADMIN') {
      fetchSystemStatus()
    }
  }, [status, session])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading admin console...
      </div>
    )
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') return null

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-purple-500/20 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-4 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
            NexMove Super Admin Console
          </span>
          <span className="text-[10px] text-purple-400 uppercase tracking-widest font-semibold">
            Global Control Center
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-xl transition duration-200"
        >
          Sign Out
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-4 max-w-lg mx-auto w-full flex flex-col gap-6">
        {/* User Identity Card */}
        <section className="bg-gradient-to-br from-purple-950/20 to-slate-950 border border-purple-500/20 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-lg">
              SA
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-slate-200">{session.user.name}</span>
              <span className="text-xs text-slate-400">{session.user.email}</span>
            </div>
          </div>

          <div className="mt-2 pt-3 border-t border-purple-500/10 flex flex-col bg-purple-950/10 p-2.5 rounded-xl border border-purple-500/10">
            <span className="text-[9px] uppercase tracking-wider text-purple-500 font-bold">Access Scope</span>
            <span className="text-xs font-bold text-purple-400">GLOBAL SUPER ADMIN - BYPASS TENANT ISOLATION</span>
          </div>
        </section>

        {/* System Monitoring */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest">
            Core Engine Health Check
          </h2>

          {loading ? (
            <div className="text-xs text-slate-500 text-center py-4">Checking system health...</div>
          ) : systemStatus ? (
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <span className="text-xs text-slate-400">System Status</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {systemStatus.status}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <span className="text-xs text-slate-400">Database Connection</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {systemStatus.databaseConnection}
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <span className="text-xs text-slate-400">Active Tenants (Agencies)</span>
                <span className="text-xs font-bold text-teal-400">
                  {systemStatus.activeTenantsCount}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 text-center py-4">Failed to retrieve status</div>
          )}
        </section>

        {/* Navigation shortcut */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => router.push('/agency/agency-1/dashboard')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-3 rounded-2xl border border-slate-800 transition duration-300 flex items-center justify-center gap-2 text-xs"
          >
            Enter Agency 1 Tenant Workspace
          </button>
          <button
            onClick={() => router.push('/agency/agency-2/dashboard')}
            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium py-3 rounded-2xl border border-slate-800 transition duration-300 flex items-center justify-center gap-2 text-xs"
          >
            Enter Agency 2 Tenant Workspace
          </button>
        </div>

      </div>
    </main>
  )
}
