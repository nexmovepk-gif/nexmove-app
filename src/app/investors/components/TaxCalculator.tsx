'use client'

import React, { useState, useEffect } from 'react'
import { useCurrency } from '@/components/CurrencyContext'
import {
  getFBRMetadata,
  calculateRentalTax,
  calculateCGT,
  verifyFBRActiveTaxpayerStatus,
  InvestorCategory,
  ATLVerificationResult,
  getFBRTaxConfig,
} from '@/lib/services/fbrService'

interface TaxCalculatorProps {
  initialInvestmentPKR?: number
  initialRentalYieldPct?: number
}

export default function TaxCalculator({
  initialInvestmentPKR = 50000000,
  initialRentalYieldPct = 9.5,
}: TaxCalculatorProps) {
  const { currency, formatPrice } = useCurrency()

  // FBR Metadata
  const fbrMetadata = getFBRMetadata()
  const mockTaxpayers = getFBRTaxConfig().atlVerificationMockDb

  // Inputs
  const [propertyValuation, setPropertyValuation] = useState<number>(initialInvestmentPKR)
  const [expectedYieldPct, setExpectedYieldPct] = useState<number>(initialRentalYieldPct)
  const [investorCategory, setInvestorCategory] = useState<InvestorCategory>('OVERSEAS_FILER')
  const [holdingPeriodYears, setHoldingPeriodYears] = useState<number>(2)
  const [mgmtFeePct, setMgmtFeePct] = useState<number>(5.0)

  // ATL Verification Simulator state
  const [cnicInput, setCnicInput] = useState<string>('98765-4321098-7')
  const [isVerifying, setIsVerifying] = useState<boolean>(false)
  const [verificationResult, setVerificationResult] = useState<ATLVerificationResult | null>(null)

  // Trigger initial verification lookup on mount for default mock CNIC
  useEffect(() => {
    handleVerifyATL('98765-4321098-7', false)
  }, [])

  const handleVerifyATL = async (inputVal: string, autoUpdateCategory: boolean = true) => {
    setIsVerifying(true)
    try {
      const result = await verifyFBRActiveTaxpayerStatus(inputVal)
      setVerificationResult(result)
      if (autoUpdateCategory && result.success) {
        setInvestorCategory(result.category)
      }
    } catch (err) {
      console.error('FBR ATL verification failed', err)
    } finally {
      setIsVerifying(false)
    }
  }

  // Calculate rental income waterfall using dynamic fbrService engine
  const rentalCalc = calculateRentalTax(
    propertyValuation,
    expectedYieldPct,
    investorCategory,
    mgmtFeePct
  )

  // Calculate capital gains tax forecast using dynamic fbrService engine
  const cgtCalc = calculateCGT(propertyValuation, holdingPeriodYears, investorCategory)

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 md:p-8 flex flex-col gap-8">
      {/* Header with Dynamic FBR Policy Version Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              🧮 Financial &amp; FBR Tax Engine
            </span>
            <span className="text-[11px] bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Tax Rates Synced with FBR Fiscal Policy [Version {fbrMetadata.version}]
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            FBR Tax &amp; Net Yield Estimator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculate exact net-in-hand rental returns, withholding tax deductions, and capital gains using dynamic FBR {fbrMetadata.fiscalYear} rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Column */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span>⚙️</span> Investment Parameters
          </h3>

          {/* Asset Valuation */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex justify-between">
              <span>Property Valuation</span>
              <span className="text-emerald-700 font-mono">{formatPrice(propertyValuation)}</span>
            </label>
            <input
              type="range"
              min={10000000}
              max={300000000}
              step={2500000}
              value={propertyValuation}
              onChange={(e) => setPropertyValuation(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>PKR 10M</span>
              <span>PKR 150M</span>
              <span>PKR 300M</span>
            </div>
          </div>

          {/* Expected Gross Rental Yield */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex justify-between">
              <span>Expected Rental Yield (Gross)</span>
              <span className="text-teal-700 font-mono">{expectedYieldPct.toFixed(1)}% p.a.</span>
            </label>
            <input
              type="range"
              min={4.0}
              max={15.0}
              step={0.1}
              value={expectedYieldPct}
              onChange={(e) => setExpectedYieldPct(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>4.0%</span>
              <span>9.5% Avg</span>
              <span>15.0%</span>
            </div>
          </div>

          {/* Automated FBR Active Taxpayer List (ATL) CNIC/NTN Simulator */}
          <div className="bg-white border border-slate-300 rounded-xl p-3.5 flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>🛡️</span> FBR ATL CNIC / NTN Verification
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Live Verification Simulator
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 12345-6789012-3 or NTN"
                value={cnicInput}
                onChange={(e) => setCnicInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                disabled={isVerifying}
                onClick={() => handleVerifyATL(cnicInput, true)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-xs disabled:opacity-50 flex items-center gap-1"
              >
                {isVerifying ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Checking...</span>
                  </>
                ) : (
                  <span>Verify ATL</span>
                )}
              </button>
            </div>

            {/* Quick Test Presets */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-400 font-medium">Try Sample:</span>
              {mockTaxpayers.map((tp) => (
                <button
                  key={tp.identifier}
                  type="button"
                  onClick={() => {
                    setCnicInput(tp.identifier)
                    handleVerifyATL(tp.identifier, true)
                  }}
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition ${
                    tp.status === 'FILER'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {tp.name.split(' ')[0]} ({tp.status === 'FILER' ? 'Filer' : 'Non-Filer'})
                </button>
              ))}
            </div>

            {/* Verification Result Display */}
            {verificationResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs flex flex-col gap-1 ${
                  verificationResult.isFiler
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50/80 border-amber-300 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1">
                    {verificationResult.isFiler ? '✓ FBR Active Taxpayer (ATL Filer)' : '⚠️ FBR Inactive / Non-Filer'}
                  </span>
                  <span className="text-[10px] font-mono opacity-80">
                    {new Date(verificationResult.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] leading-tight">{verificationResult.message}</p>
                {verificationResult.ntn && (
                  <div className="text-[10px] font-mono opacity-90 flex gap-3 mt-0.5">
                    <span>NTN: {verificationResult.ntn}</span>
                    {verificationResult.taxOffice && <span>Office: {verificationResult.taxOffice}</span>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Investor FBR Tax Status Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Investor FBR Tax Residency &amp; Status</label>
            <select
              value={investorCategory}
              onChange={(e) => setInvestorCategory(e.target.value as InvestorCategory)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-sm"
            >
              <option value="OVERSEAS_FILER">🇵🇰 Overseas Pakistani — Filer (15% Tax)</option>
              <option value="OVERSEAS_NON_FILER">⚠️ Overseas Pakistani — Non-Filer (30% Tax)</option>
              <option value="LOCAL_FILER">🏠 Local Resident — Active Filer (15% Tax)</option>
              <option value="LOCAL_NON_FILER">🚫 Local Resident — Non-Filer (30% Tax)</option>
            </select>
          </div>

          {/* Holding Period */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">Intended Holding Period (for CGT calculation)</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setHoldingPeriodYears(yr)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    holdingPeriodYears === yr
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
                  }`}
                >
                  {yr === 4 ? '4+ Yrs' : `${yr} Yr${yr > 1 ? 's' : ''}`}
                </button>
              ))}
            </div>
          </div>

          {/* Management Fee */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 flex justify-between">
              <span>Property Management Fee</span>
              <span className="text-slate-700 font-mono">{mgmtFeePct}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={10}
              step={0.5}
              value={mgmtFeePct}
              onChange={(e) => setMgmtFeePct(Number(e.target.value))}
              className="w-full accent-slate-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Output & Breakdown Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Top Key Result Banner */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Net Monthly Cashflow In-Hand ({currency})
              </span>
              <div className="text-3xl font-black text-white mt-1 font-mono">
                {formatPrice(rentalCalc.netMonthlyIncome)}
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Net Annual Yield: <strong className="text-emerald-400">{rentalCalc.netYieldPct.toFixed(2)}%</strong> (after {rentalCalc.withholdingTaxPct}% FBR Tax &amp; {mgmtFeePct}% Mgmt)
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross vs Net Spread</span>
              <span className="text-base font-bold text-amber-400 font-mono">
                {(expectedYieldPct - rentalCalc.netYieldPct).toFixed(2)}% Deducted
              </span>
            </div>
          </div>

          {/* Detailed Financial Waterfall Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 font-bold text-xs text-slate-700 uppercase tracking-wider flex justify-between">
              <span>Yield Waterfall Breakdown</span>
              <span>Annual Amount ({currency})</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-3.5 flex justify-between items-center">
                <span className="font-semibold text-slate-800">Gross Annual Rental Income</span>
                <span className="font-bold text-slate-900 font-mono">{formatPrice(rentalCalc.grossAnnualIncome)}</span>
              </div>
              <div className="p-3.5 flex justify-between items-center bg-red-50/50 text-red-900">
                <div>
                  <span className="font-semibold text-red-800">{rentalCalc.taxLabel}</span>
                  <p className="text-[10px] text-red-600">Deducted at source prior to transfer (FBR Config FY2026-27)</p>
                </div>
                <span className="font-bold font-mono text-red-700">-{formatPrice(rentalCalc.annualTaxDeduction)}</span>
              </div>
              <div className="p-3.5 flex justify-between items-center bg-amber-50/50 text-amber-900">
                <div>
                  <span className="font-semibold text-amber-800">Property Mgmt &amp; Maintenance ({mgmtFeePct}%)</span>
                  <p className="text-[10px] text-amber-600">Includes tenant management &amp; escrow audit</p>
                </div>
                <span className="font-bold font-mono text-amber-700">-{formatPrice(rentalCalc.annualMgmtFee)}</span>
              </div>
              <div className="p-4 flex justify-between items-center bg-emerald-50 text-emerald-950 font-bold border-t border-emerald-200">
                <div>
                  <span className="text-sm text-emerald-900">Net Take-Home Annual Cashflow</span>
                  <p className="text-[10px] text-emerald-700 font-normal">Direct deposit to Escrow / Bank Wallet</p>
                </div>
                <span className="text-lg font-black font-mono text-emerald-700">{formatPrice(rentalCalc.netAnnualIncome)}</span>
              </div>
            </div>
          </div>

          {/* Capital Gains & Liquidation Tax Forecast */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📈</span> Projected Exit CGT Tax ({holdingPeriodYears} Year Holding Period)
                </h4>
                <p className="text-[11px] text-slate-500">Based on estimated ~{cgtCalc.projectedAppreciationPct}% total asset growth</p>
              </div>
              <span className="text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-1 rounded-full font-mono">
                CGT Rate: {cgtCalc.cgtRatePct}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Est. Gross Capital Gain</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{formatPrice(cgtCalc.estimatedCapitalGain)}</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] text-red-500 font-bold uppercase block">CGT Tax Liability ({cgtCalc.cgtRatePct}%)</span>
                <span className="text-sm font-bold text-red-600 font-mono">-{formatPrice(cgtCalc.estimatedCGTTax)}</span>
              </div>
              <div className="bg-white border border-emerald-200 rounded-xl p-3 bg-emerald-50/40">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Net Gain Realized</span>
                <span className="text-sm font-black text-emerald-700 font-mono">+{formatPrice(cgtCalc.netCapitalGain)}</span>
              </div>
            </div>
          </div>

          {/* Overseas Repatriation Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-blue-900">
            <span className="text-xl">ℹ️</span>
            <div className="text-xs leading-relaxed">
              <strong className="font-bold block mb-0.5">State Bank of Pakistan (SBP) Repatriation Guarantee:</strong>
              Under SBP Foreign Exchange Manual, overseas investors registered with active Filer Status are guaranteed 100% full repatriation of rental income and net capital liquidation proceeds directly to foreign currency accounts.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
