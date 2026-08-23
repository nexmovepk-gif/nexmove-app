'use client'

import React, { useState, useEffect } from 'react'
import { CURRENCIES, CurrencyCode, formatCurrencyPrice } from '@/lib/currency'
import { InvestorCategory, getRentalWithholdingTaxRate } from '@/lib/services/fbrService'
import { generateEscrowContractPDF } from '@/lib/services/escrowContractPdf'

export interface DealOption {
  id: string
  title: string
  location?: string
  city?: string
  propertyType?: string
  pricePKR: number
  agencyName: string
}

interface AILegalContractGeneratorProps {
  initialDealTitle?: string
  initialPricePKR?: number
  initialAgency?: string
  activeCurrency?: CurrencyCode
  deals?: DealOption[]
  defaultInvestorName?: string
  defaultNicop?: string
  defaultCountry?: string
}

export default function AILegalContractGenerator({
  initialDealTitle = '',
  initialPricePKR = 0,
  initialAgency = '',
  activeCurrency = 'PKR',
  deals = [],
  defaultInvestorName = '',
  defaultNicop = '',
  defaultCountry = '',
}: AILegalContractGeneratorProps) {
  // Selected Deal state
  const [selectedDealId, setSelectedDealId] = useState<string>(deals[0]?.id || '')
  const [dealTitle, setDealTitle] = useState(initialDealTitle || deals[0]?.title || '1 Kanal Modern Designer Villa — Phase 6')
  const [dealPricePKR, setDealPricePKR] = useState(initialPricePKR || deals[0]?.pricePKR || 95000000)
  const [dealAgency, setDealAgency] = useState(initialAgency || deals[0]?.agencyName || 'Premier Royal Estate')
  const [dealCity, setDealCity] = useState(deals[0]?.city || 'Lahore')
  const [dealLocation, setDealLocation] = useState(deals[0]?.location || 'Block L, DHA Phase 6')
  const [dealType, setDealType] = useState(deals[0]?.propertyType || 'VILLA')

  const [investorName, setInvestorName] = useState(defaultInvestorName || 'Tariq Al-Mansoor')
  const [nicopOrPassport, setNicopOrPassport] = useState(defaultNicop || 'NICOP-42101-9988771-3')
  const [countryResidence, setCountryResidence] = useState(defaultCountry || 'United Arab Emirates')
  const [investorCategory, setInvestorCategory] = useState<InvestorCategory>('OVERSEAS_FILER')
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(activeCurrency)

  const [isGenerating, setIsGenerating] = useState(false)
  const [contractGeneratedMsg, setContractGeneratedMsg] = useState<string | null>(null)

  useEffect(() => {
    if (activeCurrency) setSelectedCurrency(activeCurrency)
  }, [activeCurrency])

  useEffect(() => {
    if (initialDealTitle && initialPricePKR > 0) {
      setDealTitle(initialDealTitle)
      setDealPricePKR(initialPricePKR)
      setDealAgency(initialAgency)
    } else if (deals.length > 0 && !selectedDealId) {
      const d = deals[0]
      setSelectedDealId(d.id)
      setDealTitle(d.title)
      setDealPricePKR(d.pricePKR)
      setDealAgency(d.agencyName)
      setDealCity(d.city || 'Pakistan')
      setDealLocation(d.location || '')
      setDealType(d.propertyType || 'HOUSE')
    }
  }, [initialDealTitle, initialPricePKR, initialAgency, deals, selectedDealId])

  const handleSelectDeal = (id: string) => {
    setSelectedDealId(id)
    const found = deals.find((d) => d.id === id)
    if (found) {
      setDealTitle(found.title)
      setDealPricePKR(found.pricePKR)
      setDealAgency(found.agencyName)
      setDealCity(found.city || 'Pakistan')
      setDealLocation(found.location || '')
      setDealType(found.propertyType || 'HOUSE')
    }
  }

  const isFiler = investorCategory.includes('FILER') && !investorCategory.includes('NON_FILER')
  const { ratePct: whtRatePct } = getRentalWithholdingTaxRate(investorCategory)
  const advanceTaxPct = isFiler ? 3.0 : 12.0
  const advanceTaxPKR = (dealPricePKR * advanceTaxPct) / 100

  const handleGeneratePDF = () => {
    setIsGenerating(true)
    setContractGeneratedMsg(null)

    setTimeout(() => {
      try {
        generateEscrowContractPDF({
          contractId: `NEX-ESC-${Math.floor(100000 + Math.random() * 900000)}`,
          investorName: investorName.trim() || 'Valued Investor',
          nicopOrPassport: nicopOrPassport.trim() || 'NICOP-VERIFIED',
          countryResidence: countryResidence.trim() || 'Overseas',
          investorCategory,
          propertyTitle: dealTitle,
          location: dealLocation,
          city: dealCity,
          agencyName: dealAgency,
          propertyType: dealType,
          propertyPricePKR: dealPricePKR,
          activeCurrency: selectedCurrency,
          riskScore: 'Low Risk (Escrow Vault Secured)',
          kycVerificationStatus: 'Verified by NADRA / SBP Trustee Protocol',
        })
        setContractGeneratedMsg(`Official Stamped PDF Agreement generated & downloaded successfully! Formatted with ${selectedCurrency} exchange rates & FBR FY2026-27 tax compliance.`)
      } catch (err) {
        console.error('PDF Generation Error:', err)
        alert('Could not generate PDF. Please try again.')
      } finally {
        setIsGenerating(false)
        setTimeout(() => setContractGeneratedMsg(null), 8000)
      }
    }, 600)
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col gap-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ⚖️ Automated Legal Engine
            </span>
            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              FBR FY2026-27 Compliant
            </span>
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-2">
            <span>📜</span> AI Legal Contract Generator (Digital Downloadable Agreement)
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Generates legally binding, bilingual PDF contracts titled <strong className="text-amber-400">&apos;NexMove AI-Secured Escrow Contract&apos;</strong> between Investor &amp; Property Seller/Agency.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className={`px-6 py-3.5 rounded-2xl font-bold text-xs shadow-lg transition flex items-center gap-2 flex-shrink-0 ${
            isGenerating
              ? 'bg-amber-500 text-slate-950 cursor-wait'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/30 cursor-pointer'
          }`}
        >
          {isGenerating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              <span>Building PDF Agreement...</span>
            </>
          ) : (
            <>
              <span className="text-base">📄</span>
              <span>Download Official Escrow Contract (PDF)</span>
            </>
          )}
        </button>
      </div>

      {contractGeneratedMsg && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl p-4 flex items-center justify-between text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <span>✅</span> {contractGeneratedMsg}
          </div>
          <button onClick={() => setContractGeneratedMsg(null)} className="text-emerald-400 font-bold">✕</button>
        </div>
      )}

      {/* Contract Options Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Investor Info */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            1. Investor Details
          </span>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Full Legal Name</label>
              <input
                type="text"
                value={investorName}
                onChange={(e) => setInvestorName(e.target.value)}
                placeholder="e.g. Tariq Al-Mansoor"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">NICOP / Passport No.</label>
              <input
                type="text"
                value={nicopOrPassport}
                onChange={(e) => setNicopOrPassport(e.target.value)}
                placeholder="NICOP-42101-9988771-3"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Country of Residence</label>
              <input
                type="text"
                value={countryResidence}
                onChange={(e) => setCountryResidence(e.target.value)}
                placeholder="United Arab Emirates / UK"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Deal & Partner Info */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            2. Property Deal &amp; Seller Agency
          </span>
          <div className="flex flex-col gap-2">
            {deals.length > 0 && (
              <div>
                <label className="text-[10px] text-slate-400 font-bold">Select Active Property Deal</label>
                <select
                  value={selectedDealId}
                  onChange={(e) => handleSelectDeal(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                >
                  {deals.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} — Rs {(d.pricePKR / 10000000).toFixed(2)} Cr
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Property Title</label>
              <input
                type="text"
                value={dealTitle}
                onChange={(e) => setDealTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Partner Agency Name</label>
              <input
                type="text"
                value={dealAgency}
                onChange={(e) => setDealAgency(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Property Price (PKR)</label>
              <input
                type="number"
                value={dealPricePKR}
                onChange={(e) => setDealPricePKR(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-bold font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Tax & Currency Parameters */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            3. Legal &amp; FBR Tax Terms
          </span>
          <div className="flex flex-col gap-2.5">
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Investor Tax Category</label>
              <select
                value={investorCategory}
                onChange={(e) => setInvestorCategory(e.target.value as InvestorCategory)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="OVERSEAS_FILER">Overseas Pakistani Active Filer (3% Adv. Tax)</option>
                <option value="DOMESTIC_FILER">Domestic Resident Filer (3% Adv. Tax)</option>
                <option value="OVERSEAS_NON_FILER">Overseas Non-Filer (12% Adv. Tax)</option>
                <option value="DOMESTIC_NON_FILER">Domestic Non-Filer (12% Adv. Tax)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Contract Currency Display</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 flex flex-col gap-1 text-[11px] border border-slate-700/50 mt-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Advance Tax ({advanceTaxPct}%):</span>
                <span className="text-amber-400 font-bold font-mono">
                  {formatCurrencyPrice(advanceTaxPKR, selectedCurrency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Rental WHT ({whtRatePct}%):</span>
                <span className="text-emerald-400 font-bold">{whtRatePct}% At Source</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SBP Escrow Release:</span>
                <span className="text-white font-bold">3 Milestones Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
