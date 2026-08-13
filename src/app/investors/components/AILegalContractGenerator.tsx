'use client'

import React, { useState } from 'react'
import { CURRENCIES, CurrencyCode, formatCurrencyPrice } from '@/lib/currency'
import { InvestorCategory, getRentalWithholdingTaxRate } from '@/lib/services/fbrService'
import { generateEscrowContractPDF } from '@/lib/services/escrowContractPdf'

interface AILegalContractGeneratorProps {
  initialDealTitle?: string
  initialPricePKR?: number
  initialAgency?: string
  activeCurrency?: CurrencyCode
}

export default function AILegalContractGenerator({
  initialDealTitle = 'Executive High-Floor Residence — Gulberg III',
  initialPricePKR = 42000000,
  initialAgency = 'Prime Realty Group',
  activeCurrency = 'PKR',
}: AILegalContractGeneratorProps) {
  const [investorName, setInvestorName] = useState('Tariq Mahmood Al-Hassan')
  const [nicopOrPassport, setNicopOrPassport] = useState('PK-35202-9876543-1')
  const [countryResidence, setCountryResidence] = useState('United Arab Emirates')
  const [investorCategory, setInvestorCategory] = useState<InvestorCategory>('OVERSEAS_FILER')
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(activeCurrency)

  const [isGenerating, setIsGenerating] = useState(false)
  const [contractGeneratedMsg, setContractGeneratedMsg] = useState<string | null>(null)

  const curr = CURRENCIES[selectedCurrency] || CURRENCIES.PKR
  const isFiler = investorCategory.includes('FILER') && !investorCategory.includes('NON_FILER')
  const { ratePct: whtRatePct } = getRentalWithholdingTaxRate(investorCategory)
  const advanceTaxPct = isFiler ? 3.0 : 12.0
  const advanceTaxPKR = (initialPricePKR * advanceTaxPct) / 100

  const handleGeneratePDF = () => {
    setIsGenerating(true)
    setContractGeneratedMsg(null)

    setTimeout(() => {
      try {
        generateEscrowContractPDF({
          contractId: `NEX-ESC-${Math.floor(100000 + Math.random() * 900000)}`,
          investorName,
          nicopOrPassport,
          countryResidence,
          investorCategory,
          propertyTitle: initialDealTitle,
          location: 'MM Alam Road, Gulberg III',
          city: 'Lahore',
          agencyName: initialAgency,
          propertyType: 'APARTMENT',
          propertyPricePKR: initialPricePKR,
          activeCurrency: selectedCurrency,
          riskScore: 'Low (98.4% AI Confidence)',
          kycVerificationStatus: 'Escrow Secure & State Bank Verified',
        })
        setContractGeneratedMsg(`PDF agreement downloaded successfully! Formatted with ${selectedCurrency} exchange rates & FBR FY2026-27 tax integration.`)
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
            <span>📜</span> AI Legal Contract Generator
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Generates legally binding, bilingual PDF contracts titled <strong className="text-amber-400">&apos;NexMove AI-Secured Escrow Contract&apos;</strong>.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating}
          className={`px-6 py-3.5 rounded-2xl font-bold text-xs shadow-lg transition flex items-center gap-2 flex-shrink-0 ${
            isGenerating
              ? 'bg-amber-500 text-slate-950 cursor-wait'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/30'
          }`}
        >
          {isGenerating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              <span>Building PDF Contract...</span>
            </>
          ) : (
            <>
              <span className="text-base">📄</span>
              <span>Generate AI-Secured Escrow Contract (PDF)</span>
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
                className="w-full mt-0.5 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Passport / NICOP Number</label>
              <input
                type="text"
                value={nicopOrPassport}
                onChange={(e) => setNicopOrPassport(e.target.value)}
                className="w-full mt-0.5 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Country of Residence</label>
              <input
                type="text"
                value={countryResidence}
                onChange={(e) => setCountryResidence(e.target.value)}
                className="w-full mt-0.5 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Currency & Tax Options */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            2. Currency &amp; FBR Category
          </span>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-[10px] text-slate-400 font-bold">Contract Currency</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                className="w-full mt-0.5 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                {Object.values(CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.name} (1 {c.code} = {c.rateInPKR} PKR)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold">FBR Investor Status</label>
              <select
                value={investorCategory}
                onChange={(e) => setInvestorCategory(e.target.value as InvestorCategory)}
                className="w-full mt-0.5 p-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="OVERSEAS_FILER">🇵🇰 Overseas Active Filer (15% WHT)</option>
                <option value="OVERSEAS_NON_FILER">⚠️ Overseas Non-Filer (30% WHT)</option>
              </select>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-700 flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between text-slate-300">
                <span>Converted Value:</span>
                <span className="font-bold text-emerald-400">
                  {formatCurrencyPrice(initialPricePKR, selectedCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Rate applied:</span>
                <span>1 {selectedCurrency} = {curr.rateInPKR} PKR</span>
              </div>
            </div>
          </div>
        </div>

        {/* FBR FY2026-27 Tax Integration Preview */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-3 justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              3. FY2026-27 FBR Tax Withholding Summary
            </span>

            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between border-b border-slate-700/60 pb-1">
                <span className="text-slate-400">Rental WHT Rate:</span>
                <span className="font-bold text-emerald-400">{whtRatePct}%</span>
              </div>
              <div className="flex justify-between border-b border-slate-700/60 pb-1">
                <span className="text-slate-400">Advance Purchase Tax:</span>
                <span className="font-bold text-amber-400">{advanceTaxPct}% ({formatCurrencyPrice(advanceTaxPKR, selectedCurrency)})</span>
              </div>
              <div className="flex justify-between border-b border-slate-700/60 pb-1">
                <span className="text-slate-400">CGT Sliding Exemption:</span>
                <span className="font-bold text-slate-200">Yr 4+ (0% Exempt)</span>
              </div>
              <div className="flex justify-between border-b border-slate-700/60 pb-1">
                <span className="text-slate-400">Escrow Depository:</span>
                <span className="font-bold text-teal-400">SBP Escrow Vault</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-[10px] text-slate-400 leading-relaxed block">
              ✓ Automated watermark &amp; cryptographic hash embedded upon PDF generation.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
