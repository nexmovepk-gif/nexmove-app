'use client'

import { useSession, signOut } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import SubscriptionGuard from '@/components/SubscriptionGuard'

interface Listing {
  id: string
  title: string
  price: number
  address: string
  rooms: number
}

export default function AgencyDashboard() {
  const { data: session, status } = useSession()
  const { agencyId } = useParams()
  const router = useRouter()
  
  const [listings, setListings] = useState<Listing[]>([])
  const [loadingListings, setLoadingListings] = useState(false)
  const [apiResult, setApiResult] = useState<string | null>(null)
  const [apiStatus, setApiStatus] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const fetchAgencyListings = useCallback(async (targetId: string) => {
    setLoadingListings(true)
    setApiResult(null)
    setApiStatus(null)
    try {
      const res = await fetch(`/api/agency/${targetId}/listings`)
      const data = await res.json()
      setApiStatus(res.status)
      setApiResult(JSON.stringify(data, null, 2))
      if (res.status === 200 && targetId === agencyId) {
        setListings(data.listings || [])
      }
    } catch (err: unknown) {
      setApiResult(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingListings(false)
    }
  }, [agencyId])

  const fetchAdminStatus = async () => {
    setApiResult(null)
    setApiStatus(null)
    try {
      const res = await fetch('/api/admin/system-status')
      const data = await res.json()
      setApiStatus(res.status)
      setApiResult(JSON.stringify(data, null, 2))
    } catch (err: unknown) {
      setApiResult(err instanceof Error ? err.message : String(err))
    }
  }

  // Auto load listings for own agency on load
  useEffect(() => {
    if (status === 'authenticated' && agencyId) {
      fetchAgencyListings(agencyId as string)
    }
  }, [status, agencyId, fetchAgencyListings])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading secure session...
      </div>
    )
  }

  if (!session) return null

  const user = session.user

  return (
    <SubscriptionGuard>
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-4 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            NexMove CRM
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Tenant: {agencyId}
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
        <section className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-lg">
              {user.name?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-slate-200">{user.name}</span>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-slate-800/60">
            <div className="flex flex-col bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Your Role</span>
              <span className="text-xs font-bold text-teal-400">{user.role}</span>
            </div>
            <div className="flex flex-col bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/40">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Your Agency</span>
              <span className="text-xs font-bold text-cyan-400">{user.agencyId || 'None (Super Admin)'}</span>
            </div>
          </div>
        </section>

        {/* Multi-Tenant Security Testing Suite */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col gap-4">
          <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Multi-Tenant Shield Testing Panel
          </h2>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => fetchAgencyListings('agency-1')}
              className="w-full text-xs bg-slate-850 hover:bg-slate-800 border border-slate-700/30 text-slate-300 py-2.5 rounded-xl transition duration-200 font-medium text-left px-4 flex justify-between items-center"
            >
              <span>Query Agency 1 API</span>
              <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-400">/api/agency/agency-1/listings</span>
            </button>

            <button
              onClick={() => fetchAgencyListings('agency-2')}
              className="w-full text-xs bg-slate-850 hover:bg-slate-800 border border-slate-700/30 text-slate-300 py-2.5 rounded-xl transition duration-200 font-medium text-left px-4 flex justify-between items-center"
            >
              <span>Query Agency 2 API</span>
              <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-400">/api/agency/agency-2/listings</span>
            </button>

            <button
              onClick={fetchAdminStatus}
              className="w-full text-xs bg-slate-850 hover:bg-slate-800 border border-slate-700/30 text-slate-300 py-2.5 rounded-xl transition duration-200 font-medium text-left px-4 flex justify-between items-center"
            >
              <span>Query Admin Status API</span>
              <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-400">/api/admin/system-status</span>
            </button>
          </div>

          {apiResult && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold border-b border-slate-800/40 pb-2">
                <span className="text-slate-400">API Response Code</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${apiStatus === 200 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {apiStatus === 200 ? '200 OK (SHIELD PASSED)' : `${apiStatus} FORBIDDEN (SHIELD BLOCKED)`}
                </span>
              </div>
              <pre className="text-[10px] text-slate-300 font-mono overflow-auto max-h-32">
                {apiResult}
              </pre>
            </div>
          )}
        </section>

        {/* Agency Listings Section */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-extrabold text-slate-300 uppercase tracking-widest">
            Agency Inventory ({listings.length})
          </h2>

          {loadingListings ? (
            <div className="text-xs text-slate-500 py-4 text-center">Loading listings...</div>
          ) : listings.length > 0 ? (
            <div className="flex flex-col gap-2">
              {listings.map((lst: Listing) => (
                <div key={lst.id} className="bg-slate-900/30 border border-slate-800/60 hover:border-slate-800 rounded-2xl p-4 transition duration-200 flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold text-slate-200">{lst.title}</span>
                    <span className="text-[10px] text-slate-400">{lst.address}</span>
                  </div>
                  <span className="text-xs font-black text-emerald-400">
                    Rs {(lst.price / 10000000).toFixed(1)} Crore
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-900/20 border border-dashed border-slate-850 rounded-2xl py-8 text-center text-xs text-slate-500">
              No inventory visible. Check console tests above.
            </div>
          )}
        </section>
      </div>
    </main>
    </SubscriptionGuard>
  )
}
