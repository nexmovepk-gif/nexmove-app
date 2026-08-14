'use client'
// src/app/agencies/page.tsx

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import RatingStars from '@/components/RatingStars'
import VerifiedBadge, { VerificationTier } from '@/components/VerifiedBadge'

interface Agency {
  id: string
  name: string
  verified: boolean
  verifiedLicense: boolean
  tier?: VerificationTier
  ntn?: string
  latitude?: number
  longitude?: number
  logo?: string | null
  storefrontPhoto?: string | null
  ownerPhoto?: string | null
  description: string
  avgRating: number
  reviewCount: number
  activeListings: number
  phone: string
  address: string
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const fetchAgencies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/public/agencies')
      const data = await res.json()
      setAgencies(data.agencies || [])
    } catch (err) {
      console.error('Failed to fetch agencies:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgencies()
  }, [fetchAgencies])

  const filteredAgencies = agencies.filter((agency) => {
    const matchesSearch =
      agency.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agency.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agency.ntn && agency.ntn.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesVerified = !verifiedOnly || agency.verified
    return matchesSearch && matchesVerified
  })

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white px-4 py-8 border-b border-slate-800 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
              Verified Directory & Legal NTN Network
            </span>
            <h1 className="text-3xl font-black text-white mt-2">Agency Directory</h1>
            <p className="text-xs text-slate-300 mt-1">
              Verified real estate agencies with tax registration (NTN), client navigation, and public ratings
            </p>
          </div>
          <Link
            href="/register"
            className="self-start sm:self-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg transition"
          >
            + Register Agency
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Filter Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Search Agency Directory
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              id="agency-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by agency name, NTN, or city (e.g. Elite, NTN-4829)..."
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500 transition"
            />
            <div className="flex items-center gap-2 px-1">
              <button
                id="agency-verified-toggle"
                type="button"
                onClick={() => setVerifiedOnly((v) => !v)}
                className={`w-9 h-5 rounded-full relative transition-colors duration-200 focus:outline-none ${
                  verifiedOnly ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={verifiedOnly}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
                    verifiedOnly ? 'left-4' : 'left-0.5'
                  }`}
                />
              </button>
              <span className="text-xs text-slate-700 font-medium">
                Verified agencies only
              </span>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-3">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            Loading agency directory...
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm flex flex-col items-center gap-3 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <span className="text-4xl">🏢</span>
            <div>
              <p className="font-bold text-slate-800 text-base">No verified agencies registered yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Register your agency profile, upload NTN and license credentials to join the directory.
              </p>
            </div>
            <Link
              href="/register"
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
            >
              + Register First Agency
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {filteredAgencies.length} Agenc{filteredAgencies.length === 1 ? 'y' : 'ies'} Found
              </p>
              <span className="text-xs text-emerald-700 font-bold">
                ✓ NTN Verified Legal Entities Active
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredAgencies.map((agency) => (
                <div
                  key={agency.id}
                  className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition duration-200 group"
                >
                  {/* Left Column: Logo Avatar, Title, Location & Badges */}
                  <div className="flex items-start gap-4">
                    {/* Logo Avatar */}
                    {agency.logo ? (
                      <Image
                        src={agency.logo}
                        alt={agency.name}
                        width={56}
                        height={56}
                        className="w-14 h-14 rounded-2xl object-contain border border-slate-200 p-1 flex-shrink-0 shadow-sm bg-white"
                        unoptimized
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-emerald-700 font-black text-lg flex-shrink-0 shadow-sm">
                        {agency.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 min-w-0">
                      {/* Name & Location */}
                      <div>
                        <Link
                          href={`/agencies/${agency.id}`}
                          className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug hover:underline"
                        >
                          {agency.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                          <span>📍 {agency.address}</span>
                          {agency.latitude && agency.longitude && (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${agency.latitude},${agency.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold transition flex items-center gap-1"
                              title="Navigate to agency with Google Maps"
                            >
                              <span>🗺️</span> Navigate (Map)
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Badges Row */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <VerifiedBadge
                          type="AGENCY"
                          verified={agency.verified}
                          tier={agency.tier ?? 'GOLD'}
                        />
                        {agency.ntn && (
                          <span className="text-[10px] font-mono bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                            📜 NTN: {agency.ntn}
                          </span>
                        )}
                        {agency.verifiedLicense && (
                          <span className="text-[10px] bg-indigo-100 border border-indigo-300 text-indigo-800 px-2.5 py-0.5 rounded-full font-bold">
                            ✓ Licensed Agency
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold">
                          🏢 {agency.activeListings} Active Listing{agency.activeListings !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mt-0.5">
                        {agency.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Rating Stars & Action Buttons */}
                  <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-3 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <RatingStars rating={agency.avgRating} size="sm" />
                      <span className="text-xs font-bold text-amber-500">
                        {agency.avgRating}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({agency.reviewCount} review{agency.reviewCount !== 1 ? 's' : ''})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {agency.latitude && agency.longitude && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${agency.latitude},${agency.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold px-3 py-2 rounded-xl transition shadow-sm"
                          title="Open Google Maps Directions"
                        >
                          🗺️ Map
                        </a>
                      )}
                      <Link
                        href={`/agencies/${agency.id}`}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition shadow whitespace-nowrap"
                      >
                        View Agency →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
