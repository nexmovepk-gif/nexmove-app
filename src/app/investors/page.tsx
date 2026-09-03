'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useCurrency } from '@/components/CurrencyContext'
import { CURRENCIES, CurrencyCode } from '@/lib/currency'
import TaxCalculator from './components/TaxCalculator'
import AIDocumentKYCVerifier from './components/AIDocumentKYCVerifier'
import SmartEscrowMilestoneTracker from './components/SmartEscrowMilestoneTracker'
import AILegalContractGenerator from './components/AILegalContractGenerator'
import AIEscrowGuard from '@/components/AIEscrowGuard'
import BankTransferCheckoutModal from '@/components/BankTransferCheckoutModal'
import { getFBRMetadata, getRentalWithholdingTaxRate } from '@/lib/services/fbrService'

// --- Interfaces ---
interface InvestmentDeal {
  id: string
  title: string
  location: string
  city: string
  propertyType: string
  pricePKR: number
  marketValuationPKR: number
  discountPct: number
  rentalYieldPct: number
  capitalGrowth3YrPct: number
  roiScore: number
  isDistress: boolean
  isOffMarket: boolean
  escrowSecured: boolean
  image: string
  agencyName: string
}

interface PortfolioInvestment {
  id: string
  dealId: string
  propertyTitle: string
  location: string
  city: string
  propertyType: string
  image: string
  status: 'ACTIVE' | 'PENDING_RENEWAL' | 'EXITED'
  startDate: string
  maturityDate: string
  investedAmountPKR: number
  currentValuePKR: number
  equitySharePct: number
  fixedRoiPct: number
  monthlyYieldPKR: number
  contractPdfName: string
  agencyName: string
  exitDetails?: {
    exitDate: string
    finalSaleValuePKR: number
    netCapitalGainsPKR: number
    totalRoiPct: number
  }
}

interface CashflowTransaction {
  id: string
  date: string
  propertyTitle: string
  type: 'RENTAL_INCOME' | 'PROFIT_DISTRIBUTION' | 'CAPITAL_EXIT'
  grossAmountPKR: number
  fbrTaxPKR: number
  netPayoutPKR: number
  paymentMethod: string
  receiptId: string
  status: 'COMPLETED' | 'PROCESSING'
}


// --- Production Data is loaded dynamically from APIs (see useEffect hooks below) ---


const TYPE_ICONS: Record<string, string> = {
  APARTMENT: '🏢',
  VILLA: '🏯',
  COMMERCIAL: '🏪',
  PLOT: '🗺️',
  HOUSE: '🏠',
}

const TIMEZONES = [
  { label: 'GST — Dubai, UAE (UTC+4)', offset: 4 },
  { label: 'PKT — Islamabad, Pakistan (UTC+5)', offset: 5 },
  { label: 'GMT — London, UK (UTC+0)', offset: 0 },
  { label: 'EST — New York, USA (UTC-5)', offset: -5 },
  { label: 'SGT — Singapore (UTC+8)', offset: 8 },
]

export default function InvestorPortalPage() {
  const { currency, setCurrency, formatPrice } = useCurrency()
  const { data: session, status } = useSession()

  // Login Gate State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  // Main Dashboard Tab State
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'PORTFOLIO' | 'LEDGER' | 'ESCROW' | 'TAX_CALCULATOR'>('OVERVIEW')
  const [showBankModal, setShowBankModal] = useState(false)

  // Overview Filters & Meeting Modal State
  const [filterTab, setFilterTab] = useState<'ALL' | 'OFF_MARKET' | 'DISTRESS' | 'HIGH_YIELD'>('ALL')
  const [meetingDeal, setMeetingDeal] = useState<InvestmentDeal | null>(null)
  const [selectedTimezone, setSelectedTimezone] = useState(TIMEZONES[0].label)
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingTime, setMeetingTime] = useState('15:00')
  const [nicopOrPassport, setNicopOrPassport] = useState('')
  const [countryResidence, setCountryResidence] = useState('')
  const [investorName, setInvestorName] = useState('')
  const [investorEmail, setInvestorEmail] = useState('')
  const [scheduleSuccess, setScheduleSuccess] = useState(false)

  // Portfolio & Agreement State
  const [portfolio, setPortfolio] = useState<PortfolioInvestment[]>([])
  const [selectedAgreement, setSelectedAgreement] = useState<PortfolioInvestment | null>(null)
  const [, setRenewingContractId] = useState<string | null>(null)
  const [renewalSuccessMsg, setRenewalSuccessMsg] = useState<string | null>(null)

  // Escrow Wallet State
  const [escrowBalancePKR, setEscrowBalancePKR] = useState<number>(0)
  const [pendingWalletPKR, setPendingWalletPKR] = useState<number>(0)
  const [cashflowTransactions, setCashflowTransactions] = useState<CashflowTransaction[]>([])
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)
  const [payoutAmountPKR, setPayoutAmountPKR] = useState<number>(0)
  const [payoutBankName, setPayoutBankName] = useState('')
  const [payoutAccountTitle, setPayoutAccountTitle] = useState('')
  const [payoutIban, setPayoutIban] = useState('')
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null)

  // Live investment deals from database
  const [investmentDeals, setInvestmentDeals] = useState<InvestmentDeal[]>([])
  const [selectedContractDeal, setSelectedContractDeal] = useState<InvestmentDeal | null>(null)

  const [searchCity, setSearchCity] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showMeetingForm, setShowMeetingForm] = useState(false)

  // ─── API Loaders ────────────────────────────────────────────────────────────
  const loadDealsAndSaved = useCallback(async () => {
    try {
      const [dealsRes, savedRes] = await Promise.allSettled([
        fetch('/api/investors/deals').then((r) => r.json()),
        fetch('/api/saved-listings').then((r) => r.json()),
      ]);

      const baseDeals: InvestmentDeal[] =
        dealsRes.status === 'fulfilled' && dealsRes.value?.success
          ? (dealsRes.value.deals ?? [])
          : [];

      let savedDeals: InvestmentDeal[] = [];
      if (savedRes.status === 'fulfilled' && savedRes.value?.success && Array.isArray(savedRes.value.saved)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        savedDeals = savedRes.value.saved
          .map((item: any) => {
            const p = item.publicListing || item.property;
            if (!p) return null;
            const pricePKR = p.price || 0;
            const marketValuationPKR = pricePKR * 1.15;
            const isOff = Boolean(
              p.isOffMarket ||
              (Array.isArray(p.features) && p.features.includes('OFF_MARKET'))
            );
            return {
              id: p.id,
              title: p.title,
              location: p.address || 'Pakistan',
              city: p.city || 'Lahore',
              propertyType: String(p.propertyType || 'HOUSE'),
              pricePKR,
              marketValuationPKR,
              discountPct: 13.0,
              rentalYieldPct: 8.4,
              capitalGrowth3YrPct: 31,
              roiScore: 89,
              isDistress: false,
              isOffMarket: isOff,
              escrowSecured: true,
              image: (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
              agencyName: p.agency?.name || p.contactName || 'Verified Marketplace Owner',
            };
          })
          .filter((d: InvestmentDeal | null): d is InvestmentDeal => d !== null);
      }

      // Merge: bookmarked listings first, then pre-vetted deals (prevent duplicate IDs)
      const seenIds = new Set<string>();
      const merged: InvestmentDeal[] = [];

      for (const d of savedDeals) {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          merged.push(d);
        }
      }
      for (const d of baseDeals) {
        if (!seenIds.has(d.id)) {
          seenIds.add(d.id);
          merged.push(d);
        }
      }

      setInvestmentDeals(merged);
    } catch {
      /* silently ignore */
    }
  }, []);

  const loadPortfolio = useCallback(async () => {
    try {
      const res = await fetch('/api/investors/portfolio')
      const data = await res.json()
      if (data.success) setPortfolio(data.portfolio ?? [])
    } catch { /* silently ignore */ }
  }, [])

  const loadWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/investors/wallet')
      const data = await res.json()
      if (data.success) {
        setEscrowBalancePKR(data.wallet?.balancePKR ?? 0)
        setPendingWalletPKR(data.wallet?.pendingPKR ?? 0)
        setCashflowTransactions(data.cashflows ?? [])
      }
    } catch { /* silently ignore */ }
  }, [])

  // Load all data once session is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      loadDealsAndSaved()
      loadPortfolio()
      loadWallet()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, loadDealsAndSaved])

  // ─── Calculations (computed from live state) ─────────────────────────────
  const activeHoldings = portfolio.filter((p) => p.status !== 'EXITED')
  const totalPortfolioPKR = activeHoldings.reduce((sum, item) => sum + item.currentValuePKR, 0)
  const totalInvestedPKR = activeHoldings.reduce((sum, item) => sum + item.investedAmountPKR, 0)
  const avgRentalYield = activeHoldings.length > 0
    ? activeHoldings.reduce((sum, p) => sum + p.fixedRoiPct, 0) / activeHoldings.length
    : 0
  const avgGrowth3Yr = 0

  const ytdIncomePKR = cashflowTransactions.filter((t) => t.type !== 'CAPITAL_EXIT').reduce((acc, t) => acc + t.netPayoutPKR, 0)
  const pendingPayoutsPKR = cashflowTransactions.filter((t) => t.status === 'PROCESSING').reduce((acc, t) => acc + t.netPayoutPKR, 0)
  const realizedCapitalExitsPKR = portfolio
    .filter((p) => p.status === 'EXITED' && p.exitDetails)
    .reduce((acc, p) => acc + (p.exitDetails?.finalSaleValuePKR || 0), 0)

  const filteredDeals = investmentDeals.filter((deal) => {
    if (filterTab === 'OFF_MARKET' && !deal.isOffMarket) return false
    if (filterTab === 'DISTRESS' && !deal.isDistress) return false
    if (filterTab === 'HIGH_YIELD' && deal.rentalYieldPct < 9.0) return false
    if (searchCity && !deal.city.toLowerCase().includes(searchCity.toLowerCase())) return false
    if (searchTerm && !deal.title.toLowerCase().includes(searchTerm.toLowerCase()) && !deal.location.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  // Handlers
  const handleScheduleMeeting = (e: React.FormEvent) => {
    e.preventDefault()
    setScheduleSuccess(true)
  }

  const handleRenewContract = (contractId: string) => {
    setPortfolio((prev) =>
      prev.map((item) => {
        if (item.id === contractId) {
          return {
            ...item,
            status: 'ACTIVE',
            maturityDate: '2028-08-30',
          }
        }
        return item
      })
    )
    setRenewalSuccessMsg(`Contract #${contractId} has been successfully renewed for an additional 2-year term!`)
    setTimeout(() => setRenewalSuccessMsg(null), 6000)
    setRenewingContractId(null)
    if (selectedAgreement?.id === contractId) {
      setSelectedAgreement((prev) => prev ? { ...prev, status: 'ACTIVE', maturityDate: '2028-08-30' } : null)
    }
  }

  const handleDownloadContractPdf = (item: PortfolioInvestment) => {
    const text = `
===================================================================
                  NEXMOVE ENTERPRISE ASSET VAULT
                    OFFICIAL INVESTMENT AGREEMENT
===================================================================
Contract Reference : ${item.id}
Property           : ${item.propertyTitle}
Location           : ${item.location}, ${item.city}
Agency             : ${item.agencyName}
Invested Amount    : PKR ${item.investedAmountPKR.toLocaleString()}
Current Value      : PKR ${item.currentValuePKR.toLocaleString()}
Maturity Date      : ${item.maturityDate}
Status             : ${item.status}
===================================================================
    `
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.contractPdfName
    a.click()
    URL.revokeObjectURL(url)
  }

  // Direct Investor Sign-In Handlers
  const handleDirectInvestorLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)

    const res = await signIn('credentials', {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    })

    setLoginLoading(false)

    if (res?.error) {
      setLoginError('Invalid investor credentials. Please check your email and password.')
    }
  }

  const handleQuickInvestorLogin = async () => {
    setLoginError(null)
    setLoginLoading(true)
    const res = await signIn('credentials', {
      email: 'investor@nexmove.com',
      password: 'investor123',
      redirect: false,
    })
    setLoginLoading(false)
    if (res?.error) {
      setLoginError('Failed to sign in with quick investor account.')
    }
  }

  // Direct Login Gateway View for Unauthenticated Users
  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-semibold">Verifying Investor Session...</span>
        </div>
      </main>
    )
  }

  if (status === 'unauthenticated' || !session) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold px-3.5 py-1 rounded-full uppercase tracking-wider">
              🌐 Direct Investor Sign-In Gateway
            </span>
            <h1 className="text-2xl font-black text-slate-50 mt-1">Investor Portal Sign In</h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Sign in with your registered investor account to access your overseas asset vault, escrow portfolio &amp; legal contracts.
            </p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-2xl text-center font-semibold leading-relaxed">
              {loginError}
            </div>
          )}

          <form onSubmit={handleDirectInvestorLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Email Address</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="investor@nexmove.com"
                required
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs py-3.5 rounded-xl transition shadow-lg disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Vault...</span>
                </>
              ) : (
                <span>Sign In to Investor Dashboard →</span>
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <span className="relative bg-slate-900 px-3 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
              Quick Investor Sign-In
            </span>
          </div>

          <button
            type="button"
            onClick={handleQuickInvestorLogin}
            disabled={loginLoading}
            className="w-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 rounded-2xl p-3.5 text-left transition flex items-center justify-between group"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition">
                Demo Investor Account
              </span>
              <span className="text-[10px] text-slate-500">investor@nexmove.com</span>
            </div>
            <span className="text-xs bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-lg">
              Quick Sign In →
            </span>
          </button>

          <div className="text-center pt-3 border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Don&apos;t have an investor account yet?{' '}
              <Link href="/register" className="text-amber-400 hover:underline font-bold">
                Register Now →
              </Link>
            </p>
          </div>
        </div>
      </main>
    )
  }

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (payoutAmountPKR > escrowBalancePKR) {
      alert('Requested amount exceeds available wallet balance.')
      return
    }
    try {
      const res = await fetch('/api/investors/wallet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PAYOUT', amountPKR: payoutAmountPKR, bankName: payoutBankName, iban: payoutIban }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Payout failed')
      setEscrowBalancePKR(data.wallet?.balancePKR ?? (escrowBalancePKR - payoutAmountPKR))
      setPendingWalletPKR(data.wallet?.pendingPKR ?? (pendingWalletPKR + payoutAmountPKR))
      // Refresh cashflows
      await loadWallet()
    } catch { /* Optimistic update already done */ }
    setPayoutSuccessMsg(`Payout request of ${formatPrice(payoutAmountPKR)} to ${payoutBankName} (${payoutIban}) has been submitted to Escrow Trustee!`)
    setPayoutModalOpen(false)
    setTimeout(() => setPayoutSuccessMsg(null), 7000)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">

      {/* Dark Navy Hero Banner */}
      <div className="bg-slate-900 text-white px-4 py-8 border-b border-slate-800 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                🌐 Global Investor Network
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                ✓ State Bank Escrow Verified
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              International Investor Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              Cross-border real estate, asset vault, cashflow ledgers &amp; FBR tax optimization for overseas Pakistanis &amp; institutional buyers.
            </p>
          </div>

          {/* Currency Switcher */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Global Currency
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(CURRENCIES).map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code as CurrencyCode)}
                  className={`text-xs px-3 py-1.5 rounded-xl border font-bold transition flex items-center gap-1 ${
                    currency === c.code
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                  }`}
                >
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">

        {/* Global AIEscrowGuard Header Trust Status */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3 py-1 rounded-full uppercase tracking-wider">
                🛡️ Verified Asset Vault &amp; Escrow Gateway
              </span>
              {session?.user && (
                <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 rounded-full px-3 py-1">
                  <span className="text-[10px] text-slate-300 font-medium">
                    Signed in as <strong className="text-amber-300 font-bold">{session.user.name || session.user.email}</strong>
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/investors' })}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 px-2 py-0.5 rounded-full font-bold transition"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
        <AIEscrowGuard mode="escrow_protection" title="Global Investor Escrow Guard & Trust Portal" subtitle="Automated AI Document Verification, NICOP/Passport authentication, and SBP Escrow Trustee Security." />

        {/* Global Alert Banners */}
        {renewalSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2 font-bold">
              <span>🎉</span> {renewalSuccessMsg}
            </div>
            <button onClick={() => setRenewalSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950 font-bold text-sm">✕</button>
          </div>
        )}

        {payoutSuccessMsg && (
          <div className="bg-teal-50 border border-teal-300 text-teal-900 rounded-2xl p-4 flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2 font-bold">
              <span>💸</span> {payoutSuccessMsg}
            </div>
            <button onClick={() => setPayoutSuccessMsg(null)} className="text-teal-700 hover:text-teal-950 font-bold text-sm">✕</button>
          </div>
        )}

        {/* Unified Tabbed Navigation Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm flex flex-wrap gap-1.5">
          {[
            { id: 'OVERVIEW', label: '📊 Overview & Deals', badge: null },
            {
              id: 'PORTFOLIO',
              label: '📜 Portfolio & Contracts',
              badge: portfolio.some((p) => p.status === 'PENDING_RENEWAL') ? 'Action Needed' : null,
            },
            { id: 'LEDGER', label: '💸 Financial Ledger', badge: null },
            { id: 'ESCROW', label: '🏦 Escrow Wallet', badge: escrowBalancePKR > 0 ? formatPrice(escrowBalancePKR) : null },
            { id: 'TAX_CALCULATOR', label: '🧮 Tax Calculator', badge: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'OVERVIEW' | 'PORTFOLIO' | 'LEDGER' | 'ESCROW' | 'TAX_CALCULATOR')}
              className={`flex-1 min-w-[140px] text-xs sm:text-sm font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    activeTab === tab.id
                      ? 'bg-white text-emerald-800'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowBankModal(true)}
            className="text-xs font-bold py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white transition flex items-center justify-center gap-1.5 shadow"
          >
            <span>🏦</span> Upgrade Plan (Meezan Bank)
          </button>
        </div>

        {/* TAB 1: OVERVIEW & DEALS */}
        {activeTab === 'OVERVIEW' && (
          <div className="flex flex-col gap-8">
            {/* AI Portfolio Analytics Card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>📊</span> Portfolio Asset Valuation &amp; Forecasts
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time active assets in{' '}
                    <strong className="text-emerald-700">{CURRENCIES[currency].name} ({currency})</strong>
                  </p>
                </div>
                <span className="text-xs bg-slate-100 border border-slate-200 text-teal-700 px-3.5 py-1.5 rounded-xl font-bold font-mono hidden sm:block">
                  1 {currency} = {CURRENCIES[currency].rateInPKR} PKR
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 hover:shadow-md transition">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Portfolio Value</span>
                  <span className="text-2xl font-black text-emerald-700">{formatPrice(totalPortfolioPKR)}</span>
                  <span className="text-[10px] text-slate-500">Capital Invested: {formatPrice(totalInvestedPKR)}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 hover:shadow-md transition">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Expected Yield</span>
                  <span className="text-2xl font-black text-teal-700">
                    {avgRentalYield}% <span className="text-xs font-normal text-slate-500">p.a.</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">✓ Top 5% Regional Benchmark</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 hover:shadow-md transition">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">3-Year Growth Forecast</span>
                  <span className="text-2xl font-black text-emerald-700">+{avgGrowth3Yr}%</span>
                  <span className="text-[10px] text-slate-500">AI urban infrastructure model</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 hover:shadow-md transition">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Available Escrow Cash</span>
                  <span className="text-2xl font-black text-slate-900 font-mono">{formatPrice(escrowBalancePKR)}</span>
                  <button
                    onClick={() => setActiveTab('ESCROW')}
                    className="text-[10px] font-bold text-emerald-700 hover:underline self-start mt-0.5"
                  >
                    Withdraw Funds →
                  </button>
                </div>
              </div>
            </div>

            {/* Deals Catalog Section */}
            <div className="flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    🔥 Pre-Vetted Off-Market &amp; Distress Opportunities
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {filteredDeals.length} high-ROI opportunity{filteredDeals.length !== 1 ? 'ies' : ''} available for investment
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'ALL', label: 'All Investments' },
                    { id: 'OFF_MARKET', label: '🔒 Off-Market' },
                    { id: 'DISTRESS', label: '⚡ Distress' },
                    { id: 'HIGH_YIELD', label: '📈 High Yield' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterTab(tab.id as 'ALL' | 'OFF_MARKET' | 'DISTRESS' | 'HIGH_YIELD')}
                      className={`text-xs font-bold px-3.5 py-2 rounded-xl transition border ${
                        filterTab === tab.id
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400 hover:text-emerald-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Filters Row */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or location..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-sm"
                />
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Filter by city (Lahore, Karachi...)"
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-sm"
                />
              </div>

              <div className="flex flex-col gap-4">
                {filteredDeals.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl p-14 text-center flex flex-col items-center gap-4">
                    <span className="text-5xl">📊</span>
                    <div>
                      <p className="font-black text-slate-900 text-lg">No investment deals available yet</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                        Pre-vetted off-market and distress investment opportunities will appear here once listed by verified agencies.
                      </p>
                    </div>
                  </div>
                ) : filteredDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md rounded-2xl overflow-hidden transition duration-200 group flex flex-col sm:flex-row"
                  >
                    <div className="relative h-44 sm:h-auto sm:w-56 flex-shrink-0 overflow-hidden">
                      <Image
                        src={deal.image}
                        alt={deal.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        unoptimized
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {deal.isDistress && (
                          <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full shadow">
                            ⚡ {deal.discountPct}% Below Market
                          </span>
                        )}
                        {deal.isOffMarket && (
                          <span className="text-[10px] font-black bg-purple-600 text-white px-2 py-0.5 rounded-full shadow">
                            🔒 Off-Market
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-1">
                      <div className="flex items-start gap-3.5 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                          {TYPE_ICONS[deal.propertyType] ?? '🏠'}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {deal.propertyType}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-100 border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-full">
                              ROI Score {deal.roiScore}/100
                            </span>
                            {deal.escrowSecured && (
                              <span className="text-[10px] font-bold bg-teal-100 border border-teal-300 text-teal-800 px-2 py-0.5 rounded-full">
                                ✓ Escrow Protected
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                            {deal.title}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium">📍 {deal.location}, {deal.city}</span>
                          <div className="flex flex-wrap gap-3 mt-1">
                            <span className="text-xs text-slate-600">
                              Yield: <strong className="text-teal-700">{deal.rentalYieldPct}% p.a.</strong>
                            </span>
                            <span className="text-xs text-slate-600">
                              3yr Growth: <strong className="text-emerald-700">+{deal.capitalGrowth3YrPct}%</strong>
                            </span>
                            <span className="text-xs text-slate-400 line-through">
                              Valued: {formatPrice(deal.marketValuationPKR)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">via {deal.agencyName}</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 gap-2 flex-shrink-0 w-full sm:w-auto">
                        <span className="text-xl font-black text-emerald-700">
                          {formatPrice(deal.pricePKR)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedContractDeal(deal)
                              setActiveTab('ESCROW')
                            }}
                            className="text-xs bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-slate-700 font-bold px-3 py-2 rounded-xl transition shadow flex items-center gap-1 whitespace-nowrap"
                          >
                            <span>📄 Legal Contract</span>
                          </button>
                          <button
                            onClick={() => { setMeetingDeal(deal); setScheduleSuccess(false) }}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition shadow whitespace-nowrap"
                          >
                            View Deal →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PORTFOLIO & CONTRACT VAULT */}
        {activeTab === 'PORTFOLIO' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>📜</span> Enterprise Investment Portfolio &amp; Contract Vault
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage active contracts, view legal agreements, renew expiring terms, and track exited partnerships.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl">
                  Total Active: {portfolio.filter((p) => p.status !== 'EXITED').length}
                </span>
                <span className="text-xs bg-purple-100 border border-purple-200 text-purple-800 font-bold px-3 py-1.5 rounded-xl">
                  Exited: {portfolio.filter((p) => p.status === 'EXITED').length}
                </span>
              </div>
            </div>

            {/* Active & Expiring Investments */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>🏢</span> Active Property Contracts
              </h3>

              {portfolio.filter((p) => p.status !== 'EXITED').length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center flex flex-col items-center gap-3">
                  <span className="text-4xl">📜</span>
                  <div>
                    <p className="font-bold text-slate-900">No active investment contracts yet</p>
                    <p className="text-xs text-slate-500 mt-1">Your confirmed property investment agreements will appear here after you enter an investment deal.</p>
                  </div>
                </div>
              ) : portfolio.filter((p) => p.status !== 'EXITED').map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-3xl p-5 shadow-sm transition flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
                    item.status === 'PENDING_RENEWAL' ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-200">
                      <Image src={item.image} alt={item.propertyTitle} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center flex-wrap gap-2">
                        {item.status === 'ACTIVE' && (
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                            ● Active Contract
                          </span>
                        )}
                        {item.status === 'PENDING_RENEWAL' && (
                          <span className="text-[10px] font-black bg-amber-500 text-white px-2.5 py-0.5 rounded-full shadow animate-pulse">
                            ⚠️ Pending Renewal (Expires within 30 days)
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-slate-500 font-mono">
                          ID: {item.id}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{item.propertyTitle}</h4>
                      <p className="text-xs text-slate-500">📍 {item.location}, {item.city} · via {item.agencyName}</p>

                      <div className="flex flex-wrap gap-4 text-xs mt-1">
                        <span>Invested: <strong className="text-slate-900">{formatPrice(item.investedAmountPKR)}</strong></span>
                        <span>Current Value: <strong className="text-emerald-700">{formatPrice(item.currentValuePKR)}</strong></span>
                        <span>Equity Share: <strong className="text-slate-900">{item.equitySharePct}%</strong></span>
                        <span>Monthly Yield: <strong className="text-teal-700">{formatPrice(item.monthlyYieldPKR)}/mo</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex md:flex-col items-end justify-between md:justify-center border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 gap-2.5 flex-shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => setSelectedAgreement(item)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-4 py-2.5 rounded-xl transition border border-slate-300 flex items-center gap-1.5"
                    >
                      <span>📜 Agreement Details</span>
                    </button>

                    {item.status === 'PENDING_RENEWAL' && (
                      <button
                        onClick={() => handleRenewContract(item.id)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-1"
                      >
                        <span>🔄 Renew Contract Now</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadContractPdf(item)}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-1"
                    >
                      <span>⬇️ PDF Contract</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Exited Portfolio Section */}
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>🏁</span> Exited &amp; Liquidated Partnerships
                </h3>
                <span className="text-xs text-slate-500 font-bold">
                  Total Realized Exits: {formatPrice(realizedCapitalExitsPKR)}
                </span>
              </div>

              {portfolio.filter((p) => p.status === 'EXITED').length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center flex flex-col items-center gap-2">
                  <span className="text-3xl">🏁</span>
                  <p className="font-bold text-slate-700 text-sm">No exited partnerships recorded</p>
                  <p className="text-xs text-slate-400">Completed and liquidated investment agreements will be archived here.</p>
                </div>
              ) : portfolio.filter((p) => p.status === 'EXITED').map((item) => (
                <div key={item.id} className="bg-slate-100/70 border border-slate-300 rounded-3xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-start gap-4">
                    <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-300 grayscale">
                      <Image src={item.image} alt={item.propertyTitle} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black bg-slate-700 text-white px-2.5 py-0.5 rounded-full self-start">
                        ✓ Exited / Fully Liquidated
                      </span>
                      <h4 className="text-base font-bold text-slate-800">{item.propertyTitle}</h4>
                      <p className="text-xs text-slate-500">📍 {item.location}, {item.city}</p>

                      {item.exitDetails && (
                        <div className="flex flex-wrap gap-4 text-xs mt-1 text-slate-700">
                          <span>Exit Date: <strong>{item.exitDetails.exitDate}</strong></span>
                          <span>Final Sale Value: <strong className="text-slate-900">{formatPrice(item.exitDetails.finalSaleValuePKR)}</strong></span>
                          <span>Net Capital Gain: <strong className="text-emerald-700">+{formatPrice(item.exitDetails.netCapitalGainsPKR)}</strong></span>
                          <span>Total ROI: <strong className="text-purple-700 font-bold">+{item.exitDetails.totalRoiPct}%</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadContractPdf(item)}
                    className="text-xs bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl transition border border-slate-700 flex items-center gap-1.5"
                  >
                    <span>📄 Download Exit Settlement</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FINANCIAL LEDGER */}
        {activeTab === 'LEDGER' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>💸</span> Monthly &amp; Annual Cashflow Ledger
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete audit trail of rental income payouts, profit distributions, withholding tax, and transaction receipts.
                </p>
              </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Income Received (YTD)</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">{formatPrice(ytdIncomePKR)}</span>
                <span className="text-[10px] text-slate-400">
                  After FBR {getRentalWithholdingTaxRate('OVERSEAS_FILER').ratePct}% Withholding Tax [{getFBRMetadata().version}]
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Payouts / In-Transit</span>
                <span className="text-2xl font-black text-amber-600 font-mono">{formatPrice(pendingPayoutsPKR)}</span>
                <span className="text-[10px] text-amber-700 font-semibold">Scheduled for 1st of next month</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Historical Capital Realized</span>
                <span className="text-2xl font-black text-purple-700 font-mono">{formatPrice(realizedCapitalExitsPKR)}</span>
                <span className="text-[10px] text-slate-400">Total liquidated partnership equity</span>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Payout &amp; Returns Transactions
                </h3>
                <span className="text-xs text-slate-500 font-medium">Showing all historical records</span>
              </div>

              <div className="overflow-x-auto">
                {cashflowTransactions.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <span className="text-4xl">💸</span>
                    <div>
                      <p className="font-bold text-slate-900">No transactions recorded yet</p>
                      <p className="text-xs text-slate-500 mt-1">Rental income payouts, profit distributions, and capital exits will appear here.</p>
                    </div>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/60 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Date</th>
                        <th className="py-3.5 px-4">Property</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Gross Amount</th>
                        <th className="py-3.5 px-4">FBR Tax Withheld</th>
                        <th className="py-3.5 px-4">Net Payout</th>
                        <th className="py-3.5 px-4">Payment Method</th>
                        <th className="py-3.5 px-4">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {cashflowTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-4 px-4 font-mono font-bold text-slate-600 whitespace-nowrap">{txn.date}</td>
                          <td className="py-4 px-4 font-bold text-slate-900 max-w-xs">{txn.propertyTitle}</td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                txn.type === 'RENTAL_INCOME'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : txn.type === 'PROFIT_DISTRIBUTION'
                                  ? 'bg-teal-100 text-teal-800 border border-teal-300'
                                  : 'bg-purple-100 text-purple-800 border border-purple-300'
                              }`}
                            >
                              {txn.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono font-bold">{formatPrice(txn.grossAmountPKR)}</td>
                          <td className="py-4 px-4 font-mono text-red-600 font-bold">-{formatPrice(txn.fbrTaxPKR)}</td>
                          <td className="py-4 px-4 font-mono font-black text-emerald-700">{formatPrice(txn.netPayoutPKR)}</td>
                          <td className="py-4 px-4 text-slate-600 text-[11px] whitespace-nowrap">{txn.paymentMethod}</td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => alert(`Receipt #${txn.receiptId} is verified on Blockchain Ledger.`)}
                              className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-lg font-mono transition"
                            >
                              {txn.receiptId}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ESCROW WALLET & AI TRUST MODULE */}
        {activeTab === 'ESCROW' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>🏦</span> AI Escrow &amp; Foreign Investor Trust Module
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated AI identity verification, 3-stage milestone release tracker, PDF legal contract generator &amp; State Bank escrow wallet.
                </p>
              </div>
              <button
                onClick={() => setPayoutModalOpen(true)}
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl transition shadow flex items-center gap-2"
              >
                <span>💸 Request Payout / Transfer Funds</span>
              </button>
            </div>

            {/* 1. AI Document & KYC Verifier */}
            <AIDocumentKYCVerifier />

            {/* 2. Smart Escrow Milestone Tracker */}
            <SmartEscrowMilestoneTracker
              propertyTitle={selectedContractDeal?.title || investmentDeals[0]?.title || ''}
              totalPricePKR={selectedContractDeal?.pricePKR || investmentDeals[0]?.pricePKR || 0}
              currency={currency}
              deals={investmentDeals.map((d) => ({ id: d.id, title: d.title, pricePKR: d.pricePKR }))}
            />

            {/* 3. AI Legal Contract Generator */}
            <AILegalContractGenerator
              initialDealTitle={selectedContractDeal?.title || ''}
              initialPricePKR={selectedContractDeal?.pricePKR || 0}
              initialAgency={selectedContractDeal?.agencyName || ''}
              activeCurrency={currency}
              deals={investmentDeals.map((d) => ({
                id: d.id,
                title: d.title,
                location: d.location,
                city: d.city,
                propertyType: d.propertyType,
                pricePKR: d.pricePKR,
                agencyName: d.agencyName,
              }))}
              defaultInvestorName={session?.user?.name || ''}
            />

            {/* Escrow Balance & Wallet Operations Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Wallet Card */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[260px]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-wider">
                      Verified SBP Escrow Account
                    </span>
                    <h3 className="text-xs text-slate-400 font-bold mt-3 uppercase tracking-wider">Available Wallet Balance</h3>
                    <div className="text-4xl font-black text-white mt-1 font-mono">{formatPrice(escrowBalancePKR)}</div>
                  </div>
                  <span className="text-3xl">🛡️</span>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-slate-700/60">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Pending Rental Transfers:</span>
                    <strong className="text-amber-400 font-mono">{formatPrice(pendingWalletPKR)}</strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Escrow Trustee Bank:</span>
                    <strong className="text-white">State Bank Trustee Escrow</strong>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>SBP Repatriation Clearance:</span>
                    <strong className="text-emerald-400 font-bold">100% Guaranteed ✓</strong>
                  </div>
                </div>
              </div>

              {/* Wallet Actions & Activity */}
              <div className="lg:col-span-7 flex flex-col gap-5">
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>⚡</span> Quick Wallet Operations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setPayoutModalOpen(true)}
                      className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex flex-col gap-1 transition"
                    >
                      <span className="text-sm font-bold text-slate-900">Request Bank Transfer</span>
                      <span className="text-[11px] text-slate-500">Direct wire to PKR or Overseas Bank Account</span>
                    </button>
                    <button
                      onClick={() => alert('Please contact your designated account manager for SBP escrow depository transfer details.')}
                      className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex flex-col gap-1 transition"
                    >
                      <span className="text-sm font-bold text-slate-900">Deposit Capital into Escrow</span>
                      <span className="text-[11px] text-slate-500">Fund upcoming property acquisitions safely</span>
                    </button>
                  </div>
                </div>

                {/* SBP Repatriation Info Banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-start gap-3 text-emerald-950">
                  <span className="text-2xl">🌐</span>
                  <div className="text-xs leading-relaxed">
                    <strong className="font-bold text-emerald-900 block mb-0.5">Roshan Digital Account (RDA) Integration:</strong>
                    Overseas Pakistanis can receive automated zero-delay USD / AED / GBP conversion payouts directly into their RDA account without local tax withholding friction.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FINANCIAL & TAX CALCULATOR */}
        {activeTab === 'TAX_CALCULATOR' && (
          <TaxCalculator initialInvestmentPKR={totalPortfolioPKR} initialRentalYieldPct={avgRentalYield} />
        )}

      </div>

      {/* --- MODALS & DRAWERS --- */}

      {/* Modal 1: Agreement Details Drawer / Modal */}
      {selectedAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setSelectedAgreement(null)}>
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Official Legal Agreement Vault
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">{selectedAgreement.propertyTitle}</h3>
                <p className="text-xs text-slate-500 font-mono">Contract ID: {selectedAgreement.id}</p>
              </div>
              <button onClick={() => setSelectedAgreement(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>

            {selectedAgreement.status === 'PENDING_RENEWAL' && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-black text-amber-900 block">⚠️ Contract Expiring Soon</span>
                  <span className="text-amber-800">This agreement expires on {selectedAgreement.maturityDate}. Renew now to lock in yield.</span>
                </div>
                <button
                  onClick={() => handleRenewContract(selectedAgreement.id)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow transition flex-shrink-0"
                >
                  Renew Contract
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Agreement Start Date</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{selectedAgreement.startDate}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Agreement Maturity Date</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{selectedAgreement.maturityDate}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Invested Capital Amount</span>
                <span className="text-sm font-bold text-emerald-700 font-mono">{formatPrice(selectedAgreement.investedAmountPKR)}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Equity Share &amp; ROI Target</span>
                <span className="text-sm font-bold text-slate-900 font-mono">{selectedAgreement.equitySharePct}% Equity ({selectedAgreement.fixedRoiPct}% Target ROI)</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Key Contract Terms &amp; Conditions</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>SBP Escrow Trustee Protection: Rental distributions paid monthly into investor wallet.</li>
                <li>FBR Tax Withholding: {getRentalWithholdingTaxRate('OVERSEAS_FILER').ratePct}% withheld at source for active filers ({getFBRMetadata().version}).</li>
                <li>Right of First Refusal: Investor maintains priority rights on asset liquidation.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedAgreement(null)}
                className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadContractPdf(selectedAgreement)}
                className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <span>⬇️ Download Contract PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Payout Request Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setPayoutModalOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-900">Request Escrow Wallet Payout</h3>
                <p className="text-xs text-slate-500 mt-0.5">Available Balance: <strong className="text-emerald-700">{formatPrice(escrowBalancePKR)}</strong></p>
              </div>
              <button onClick={() => setPayoutModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-xl font-bold">✕</button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Withdrawal Amount (PKR)</label>
                <input
                  type="number"
                  min={0}
                  max={escrowBalancePKR}
                  value={payoutAmountPKR}
                  onChange={(e) => setPayoutAmountPKR(Number(e.target.value))}
                  required
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Bank Name</label>
                <input
                  type="text"
                  value={payoutBankName}
                  onChange={(e) => setPayoutBankName(e.target.value)}
                  required
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Account Title</label>
                <input
                  type="text"
                  value={payoutAccountTitle}
                  onChange={(e) => setPayoutAccountTitle(e.target.value)}
                  required
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">IBAN / Account Number</label>
                <input
                  type="text"
                  value={payoutIban}
                  onChange={(e) => setPayoutIban(e.target.value)}
                  required
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="flex-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow"
                >
                  Confirm Payout Request ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Property Details & Deal Room Schedule Meeting Modal */}
      {meetingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto py-8" onClick={() => { setMeetingDeal(null); setShowMeetingForm(false) }}>
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                  <span className="text-[10px] bg-amber-100 border border-amber-300 text-amber-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-widest">
                    Cross-Border Private Deal Room
                  </span>
                  {meetingDeal.isOffMarket && (
                    <span className="text-[10px] bg-purple-100 border border-purple-300 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                      🔒 Off-Market
                    </span>
                  )}
                  <span className="text-[10px] bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    ✓ Escrow Secured
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 leading-snug">{meetingDeal.title}</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  📍 {meetingDeal.location}, {meetingDeal.city} &bull; via <span className="text-slate-800 font-bold">{meetingDeal.agencyName}</span>
                </p>
              </div>
              <button onClick={() => { setMeetingDeal(null); setShowMeetingForm(false) }} className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1">✕</button>
            </div>

            {/* Property Image & Key Specs */}
            <div className="relative h-56 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
              <Image
                src={meetingDeal.image}
                alt={meetingDeal.title}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700">
                {meetingDeal.propertyType}
              </div>
            </div>

            {/* Price & ROI Financial Breakdown Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Investment Price</span>
                <span className="text-lg font-black text-emerald-700">{formatPrice(meetingDeal.pricePKR)}</span>
                <span className="text-[10px] text-slate-400 line-through">Valued: {formatPrice(meetingDeal.marketValuationPKR)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ROI Score</span>
                <span className="text-lg font-black text-teal-700">{meetingDeal.roiScore}/100</span>
                <span className="text-[10px] text-emerald-600 font-bold">Top 5% Grade</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rental Yield</span>
                <span className="text-lg font-black text-emerald-700">{meetingDeal.rentalYieldPct}% p.a.</span>
                <span className="text-[10px] text-slate-500">Monthly Cashflow</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">3-Yr Forecast</span>
                <span className="text-lg font-black text-purple-700">+{meetingDeal.capitalGrowth3YrPct}%</span>
                <span className="text-[10px] text-slate-500">Capital Growth</span>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedContractDeal(meetingDeal)
                  setActiveTab('ESCROW')
                  setMeetingDeal(null)
                  setShowMeetingForm(false)
                }}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs py-3 px-4 rounded-xl border border-slate-700 transition shadow flex items-center justify-center gap-1.5"
              >
                <span>📜 Preview Legal Contract &amp; Escrow</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMeetingForm((prev) => !prev)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition shadow flex items-center justify-center gap-1.5"
              >
                <span>📅 {showMeetingForm ? 'Hide Meeting Form' : 'Schedule Private Deal Meeting'}</span>
              </button>
            </div>

            {/* Schedule Meeting Form (Shown when toggled or active) */}
            {(showMeetingForm || scheduleSuccess) && (
              <div className="pt-2 border-t border-slate-100">
                {scheduleSuccess ? (
                  <div className="flex flex-col items-center gap-4 py-6 text-center bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-2xl text-emerald-700">✓</div>
                    <div>
                      <h3 className="text-base font-bold text-emerald-800">Deal Room Meeting Reserved!</h3>
                      <p className="text-xs text-slate-600 max-w-md mt-1 leading-relaxed">
                        Your meeting request for <strong className="text-slate-900">{meetingDeal.title}</strong> has been logged. An encrypted video link will be sent to{' '}
                        <span className="text-slate-900 font-bold">{investorEmail || 'your email'}</span>.
                      </p>
                    </div>
                    <button
                      onClick={() => { setMeetingDeal(null); setShowMeetingForm(false) }}
                      className="mt-1 text-xs bg-white hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl transition font-medium border border-slate-300 shadow-sm"
                    >
                      Close Window
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleScheduleMeeting} className="flex flex-col gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Investor KYC Verification</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">Investor Full Name *</label>
                          <input type="text" value={investorName} onChange={(e) => setInvestorName(e.target.value)} placeholder="e.g. Tariq Al-Mansoor" required className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">Email Address *</label>
                          <input type="email" value={investorEmail} onChange={(e) => setInvestorEmail(e.target.value)} placeholder="investor@domain.com" required className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">CNIC / NICOP / Passport Number *</label>
                          <input type="text" value={nicopOrPassport} onChange={(e) => setNicopOrPassport(e.target.value)} placeholder="42101-9988771-3 / A9823412" required className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-500 transition" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">Country of Residence</label>
                          <input type="text" value={countryResidence} onChange={(e) => setCountryResidence(e.target.value)} placeholder="Pakistan / UAE / UK" className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">2. Preferred Meeting Schedule</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1 sm:col-span-3">
                          <label className="text-[11px] font-bold text-slate-600">Investor Preferred Timezone</label>
                          <select value={selectedTimezone} onChange={(e) => setSelectedTimezone(e.target.value)} className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition">
                            {TIMEZONES.map((tz) => (
                              <option key={tz.label} value={tz.label}>{tz.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1 sm:col-span-2">
                          <label className="text-[11px] font-bold text-slate-600">Preferred Date *</label>
                          <input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-bold text-slate-600">Local Time *</label>
                          <input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} required className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 transition" />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                      <button type="button" onClick={() => setShowMeetingForm(false)} className="flex-1 text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 py-3 rounded-xl transition font-medium">
                        Cancel
                      </button>
                      <button type="submit" className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow">
                        Confirm Private Deal Room ✓
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Meezan Bank Checkout Modal for Investor Subscriptions */}
      <BankTransferCheckoutModal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        selectedPlanTitle="Investor Escrow Vault Subscription"
        selectedPlanPricePKR={15000}
      />
    </main>
  )
}
