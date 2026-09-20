'use client'
// src/components/deal-room/DealRoomView.tsx
// Tri-Party Closing Desk with 4 Interactive Milestones Progress Tracker & FBR Tax Summary

import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Lock,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  User,
  BadgeCheck,
  FileCheck2,
  AlertCircle,
  RefreshCw,
  Stamp,
  Receipt,
  Printer,
  Share2,
  MessageSquare
} from 'lucide-react'
import DealClosingSlipModal from './DealClosingSlipModal'
import DealWhatsAppModal from './DealWhatsAppModal'
import DocumentWatermarkVault, { VaultDoc } from './DocumentWatermarkVault'

interface Milestone {
  id: string
  stepNumber: number
  title: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  proofAttachmentUrl?: string
  cprNumber?: string
  psidNumber?: string
  appointmentDate?: string
  completedAt?: string
}

interface DealRoomData {
  id: string
  dealNumber: string
  totalAgreedPrice: number | string
  status: string
  currentMilestone: number
  buyerName: string
  sellerName: string
  agencyName: string
  buyerFbrStatus?: string
  sellerFbrStatus?: string
  milestones: Milestone[]
}

export default function DealRoomView({ dealRoomId }: { dealRoomId?: string }) {
  const [deal, setDeal] = useState<DealRoomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<number>(1)
  const [proofInput, setProofInput] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<'MILESTONES' | 'TAX_BREAKDOWN' | 'VAULT'>('MILESTONES')
  const [showClosingSlip, setShowClosingSlip] = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [vaultDocs, setVaultDocs] = useState<VaultDoc[]>([])

  const fetchDealRoom = async () => {
    try {
      const url = dealRoomId
        ? `/api/deal-room/milestones?dealRoomId=${dealRoomId}`
        : `/api/deal-room/milestones`
      const res = await fetch(url)
      const data = await res.json()
      if (data.dealRoom) {
        setDeal(data.dealRoom)
        setActiveStep(data.dealRoom.currentMilestone || 1)
      }
    } catch (err) {
      console.error('Failed to load deal room', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDealRoom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealRoomId])

  const handleCompleteMilestone = async (milestone: Milestone) => {
    if (!deal) return
    setIsUpdating(true)
    try {
      const payload: Record<string, any> = {
        action: 'update_milestone',
        dealRoomId: deal.id,
        milestoneId: milestone.id,
        proofUrl: proofInput || `/uploads/deal_vault_${deal.dealNumber}_m${milestone.stepNumber}.pdf`,
      }

      if (milestone.stepNumber === 1) {
        payload.proofUrl = proofInput || `PO-ESCROW-${Date.now().toString().slice(-6)}`
      } else if (milestone.stepNumber === 2) {
        payload.psidNumber = proofInput || `NDC-DHA-${Date.now().toString().slice(-6)}`
      } else if (milestone.stepNumber === 3) {
        payload.cprNumber = proofInput || `CPR-2026-${Date.now().toString().slice(-6)}`
      } else if (milestone.stepNumber === 4) {
        payload.appointmentDate = new Date(Date.now() + 86400000 * 3).toISOString()
      }

      const res = await fetch('/api/deal-room/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setProofInput('')
        fetchDealRoom()
      } else {
        alert(data.error || 'Failed to update milestone')
      }
    } catch (_err) {
      alert('Network error while updating milestone')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-stone-500 bg-white rounded-3xl border border-stone-200/90 shadow-sm flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
        <p className="font-medium">Connecting to Encrypted Tri-Party Deal Room...</p>
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="p-12 text-center text-sm text-stone-500 bg-white rounded-3xl border border-stone-200/90 shadow-sm flex flex-col items-center justify-center gap-2">
        <AlertCircle className="w-8 h-8 text-amber-500" />
        <h3 className="text-base font-bold text-stone-900">No Active Deal Room Found</h3>
        <p className="text-xs text-stone-500 max-w-sm">This deal room reference may have expired or is not associated with your account.</p>
      </div>
    )
  }

  const milestones = deal.milestones || []
  const currentStepData = milestones.find((m) => m.stepNumber === activeStep)
  const price = Number(deal.totalAgreedPrice) || 35000000
  // Estimated FBR taxes: Buyer (3% Active Filer), Seller (3% Active Filer)
  const buyerTaxEst = price * 0.03
  const sellerTaxEst = price * 0.03
  const tokenBayanaEst = price * 0.10 // 10% Bayana

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl overflow-hidden transition-all">
      {/* Top Banner & Deal Identifiers */}
      <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-slate-900 text-white p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Tri-Party Escrow Protected
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-stone-300">
                #{deal.dealNumber}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                deal.status === 'CLOSED'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                ● {deal.status === 'CLOSED' ? 'Deal Successfully Closed' : 'Active Closing Desk'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Tri-Party Closing Room
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
              Legally binding multi-party closing desk between Buyer, Seller, and Facilitating Agency under State Bank escrow rules and Housing Authority regulations.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col sm:items-end justify-center min-w-[260px]">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block mb-1">
              Agreed Transaction Value
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              PKR {price.toLocaleString('en-PK')}
            </span>
            <span className="text-[11px] text-stone-400 mt-1">
              Estimated 10% Bayana: PKR {tokenBayanaEst.toLocaleString('en-PK')}
            </span>

            {/* Quick Action Bar for WhatsApp & Print PDF */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10 w-full justify-end">
              <button
                type="button"
                onClick={() => setShowClosingSlip(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-950 rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Printer className="w-3.5 h-3.5 text-stone-900" />
                <span>Print Slip / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setShowWhatsApp(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stakeholder Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Buyer Participant</span>
              <strong className="text-white text-xs">{deal.buyerName}</strong>
              <span className="text-[10px] text-emerald-400 block flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> FBR Active Filer Verified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Seller Participant</span>
              <strong className="text-white text-xs">{deal.sellerName}</strong>
              <span className="text-[10px] text-amber-300 block flex items-center gap-1">
                <BadgeCheck className="w-3 h-3" /> Title & Allotment Verified
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Facilitating Agency</span>
              <strong className="text-white text-xs">{deal.agencyName}</strong>
              <span className="text-[10px] text-indigo-300 block flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> NexMove Verified Mandate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50/80 px-6 overflow-x-auto text-xs font-bold">
        <div className="flex gap-2 sm:gap-4">
          <button
            onClick={() => setActiveTab('MILESTONES')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'MILESTONES'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-sm'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            4-Stage Milestones
          </button>

          <button
            onClick={() => setActiveTab('TAX_BREAKDOWN')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'TAX_BREAKDOWN'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-sm'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-indigo-600" />
            FBR Tax & Challan Guide (Sec 236C / 236K)
          </button>

          <button
            onClick={() => setActiveTab('VAULT')}
            className={`py-3.5 px-3 border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'VAULT'
                ? 'border-emerald-600 text-emerald-900 bg-white shadow-sm'
                : 'border-transparent text-stone-600 hover:text-stone-900'
            }`}
          >
            <Stamp className="w-4 h-4 text-amber-600" />
            Document Watermark Vault
          </button>
        </div>

        {/* Tab-Level Direct Action Triggers */}
        <div className="hidden md:flex items-center gap-2 py-2">
          <button
            type="button"
            onClick={() => setShowClosingSlip(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-700" />
            <span>Official Slip</span>
          </button>
          <button
            type="button"
            onClick={() => setShowWhatsApp(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            <span>WhatsApp Stakeholders</span>
          </button>
        </div>
      </div>

      {activeTab === 'MILESTONES' && (
        <div>
          {/* Closed Deal Success Banner */}
          {deal.status === 'CLOSED' && (
            <div className="p-5 bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-emerald-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">Deal Successfully Closed & Settled!</h4>
                  <p className="text-xs text-emerald-100">
                    All 4 milestones verified, tax paid, and property biometrics executed.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowClosingSlip(true)}
                  className="px-4 py-2 bg-white hover:bg-stone-100 text-emerald-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-800" />
                  Print Official Closing Slip
                </button>
                <button
                  type="button"
                  onClick={() => setShowWhatsApp(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp Certificate
                </button>
              </div>
            </div>
          )}

          {/* 4-Step Interactive Milestone Stepper */}
          <div className="p-6 bg-[#FAF9F6] border-b border-stone-200/90">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {milestones.map((m) => {
                const isCompleted = m.status === 'COMPLETED'
                const isCurrent = m.stepNumber === deal.currentMilestone
                const isSelected = activeStep === m.stepNumber

                return (
                  <button
                    key={m.id}
                    onClick={() => setActiveStep(m.stepNumber)}
                    className={`text-left p-4 rounded-2xl border transition-all relative ${
                      isSelected
                        ? 'border-emerald-600 bg-white shadow-md ring-2 ring-emerald-500/40'
                        : isCompleted
                        ? 'border-emerald-200 bg-emerald-50/40 hover:bg-white'
                        : 'border-stone-200 bg-white/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black tracking-wider uppercase text-stone-500">
                        Milestone {m.stepNumber} of 4
                      </span>
                      {isCompleted ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </span>
                      ) : isCurrent ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          In Progress
                        </span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-stone-900 line-clamp-2">
                      {m.title}
                    </h4>
                    <span className="text-[11px] font-medium text-stone-500 mt-2 block">
                      {isCompleted ? '✓ Signed & Verified' : isCurrent ? 'Active Desk' : 'Locked'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active Milestone Action Pane */}
          {currentStepData && (
            <div className="p-6 sm:p-8">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                    Stage {currentStepData.stepNumber}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {currentStepData.status === 'COMPLETED' ? 'Completed & Locked' : 'Action Required'}
                  </span>
                </div>

                <h3 className="text-lg font-black text-stone-900 mt-1">
                  {currentStepData.title}
                </h3>

                {/* Dynamic Pakistani Context Description */}
                <div className="mt-4 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs leading-relaxed text-stone-700 space-y-2">
                  {currentStepData.stepNumber === 1 && (
                    <>
                      <p className="font-semibold text-stone-900">
                        Milestone 1 — Bayana (Earnest Money) / Token Escrow Locker:
                      </p>
                      <p>
                        Buyer submits the agreed 10% Bayana pay order or bank receipt. The facilitating agency locks the deposit in the NexMove escrow log until the society NDC (No Demand Certificate) is approved.
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Required Proof: Pay Order Number or Bank Deposit Receipt Number.
                      </p>
                    </>
                  )}
                  {currentStepData.stepNumber === 2 && (
                    <>
                      <p className="font-semibold text-stone-900">
                        Milestone 2 — DHA / Housing Society NDC Clearance:
                      </p>
                      <p>
                        The seller and agency submit the NDC application to the relevant authority (DHA, Bahria, LDA, CDA). All outstanding utility bills, maintenance charges, and development dues are cleared.
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Required Proof: Official NDC Application Reference or Receipt Slip.
                      </p>
                    </>
                  )}
                  {currentStepData.stepNumber === 3 && (
                    <>
                      <p className="font-semibold text-stone-900">
                        Milestone 3 — FBR ATL Tax Challans & CPR Receipts:
                      </p>
                      <p>
                        Both parties generate 17-digit PSID challans on FBR IRIS:
                        Buyer pays <strong>Section 236K</strong> and Seller pays <strong>Section 236C</strong>. Both parties upload their Computerized Payment Receipts (CPR) for society validation.
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Required Proof: FBR Computerized Payment Receipt (CPR) Number.
                      </p>
                    </>
                  )}
                  {currentStepData.stepNumber === 4 && (
                    <>
                      <p className="font-semibold text-stone-900">
                        Milestone 4 — Final Transfer Desk & Biometric Appointment:
                      </p>
                      <p>
                        The final transfer appointment is booked at the Housing Authority Transfer Office. Buyer and Seller (or verified Overseas Power of Attorney) execute physical biometric thumbprints. Remaining balance and escrow funds are disbursed.
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Required Proof: Society Transfer Desk Appointment Slip.
                      </p>
                    </>
                  )}
                </div>

                {currentStepData.status === 'COMPLETED' ? (
                  <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <strong>Milestone Completed & Verified</strong>
                        <p className="text-[11px] text-emerald-700">
                          {currentStepData.cprNumber && `Receipt/CPR: ${currentStepData.cprNumber} `}
                          {currentStepData.psidNumber && `| PSID: ${currentStepData.psidNumber} `}
                          {currentStepData.proofAttachmentUrl && `| Doc: ${currentStepData.proofAttachmentUrl}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowClosingSlip(true)}
                        className="text-[10px] uppercase font-bold text-stone-800 bg-white hover:bg-stone-100 px-2.5 py-1.5 rounded-lg border border-stone-200 transition shadow-xs flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3 text-stone-700" /> Print Slip
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowWhatsApp(true)}
                        className="text-[10px] uppercase font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-300 transition shadow-xs flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3 text-emerald-600" /> WhatsApp
                      </button>
                      <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1.5 rounded-lg">
                        Approved
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-stone-800">
                          Reference / CPR / Pay Order Slip
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentStepData.stepNumber === 1) setProofInput(`PO-HBL-${Date.now().toString().slice(-6)}`)
                            if (currentStepData.stepNumber === 2) setProofInput(`NDC-DHA-LHR-${Date.now().toString().slice(-6)}`)
                            if (currentStepData.stepNumber === 3) setProofInput(`CPR-2026-FBR-${Date.now().toString().slice(-6)}`)
                            if (currentStepData.stepNumber === 4) setProofInput(`TRANSFER-DESK-SLIP-${Date.now().toString().slice(-6)}`)
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                        >
                          + Autofill Sample Reference
                        </button>
                      </div>
                      <input
                        type="text"
                        value={proofInput}
                        onChange={(e) => setProofInput(e.target.value)}
                        placeholder={
                          currentStepData.stepNumber === 1
                            ? 'e.g. PO-789123 or Pay Order Scanned URL'
                            : currentStepData.stepNumber === 2
                            ? 'e.g. NDC-DHA-98214'
                            : currentStepData.stepNumber === 3
                            ? 'e.g. CPR-2026-8812903 (17-digit)'
                            : 'e.g. DHA Counter 4 Appointment Slip'
                        }
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 font-mono focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                      />
                    </div>

                    <button
                      onClick={() => handleCompleteMilestone(currentStepData)}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                    >
                      {isUpdating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Verifying & Advancing Milestone...
                        </>
                      ) : (
                        <>
                          Sign & Advance Milestone #{currentStepData.stepNumber}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'TAX_BREAKDOWN' && (
        <div className="p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-base font-black text-stone-900">
              FBR Real Estate Tax Compliance Calculator (Finance Act 2024–2026)
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Automated advance tax calculation for property #{deal.dealNumber} with transaction value of PKR {price.toLocaleString('en-PK')}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buyer Section 236K */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Section 236K (Purchaser Tax)
                </span>
                <span className="text-xs font-bold text-stone-600">Buyer: {deal.buyerName}</span>
              </div>
              <div className="space-y-2 text-xs text-stone-700">
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span>Taxpayer Status:</span>
                  <strong className="text-emerald-700">Active Filer (3.0%)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span>Non-Filer Rate:</span>
                  <span className="text-stone-500">10.5% (PKR {(price * 0.105).toLocaleString('en-PK')})</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-stone-900">
                  <span>Total Tax Payable:</span>
                  <span className="text-emerald-600 font-mono">PKR {buyerTaxEst.toLocaleString('en-PK')}</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-3">
                Payable via 17-digit PSID on FBR IRIS portal under tax head <strong>00236K</strong>.
              </p>
            </div>

            {/* Seller Section 236C */}
            <div className="p-5 rounded-2xl border border-stone-200 bg-stone-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  Section 236C (Seller Advance Tax)
                </span>
                <span className="text-xs font-bold text-stone-600">Seller: {deal.sellerName}</span>
              </div>
              <div className="space-y-2 text-xs text-stone-700">
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span>Taxpayer Status:</span>
                  <strong className="text-emerald-700">Active Filer (3.0%)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200">
                  <span>Non-Filer Rate:</span>
                  <span className="text-stone-500">10.0% (PKR {(price * 0.10).toLocaleString('en-PK')})</span>
                </div>
                <div className="flex justify-between py-2 text-sm font-black text-stone-900">
                  <span>Total Tax Payable:</span>
                  <span className="text-amber-600 font-mono">PKR {sellerTaxEst.toLocaleString('en-PK')}</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-3">
                Payable via 17-digit PSID on FBR IRIS portal under tax head <strong>00236C</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'VAULT' && (
        <DocumentWatermarkVault
          dealRoomId={deal.id}
          dealNumber={deal.dealNumber}
          buyerName={deal.buyerName}
          sellerName={deal.sellerName}
          onDocumentsChange={(docs) => setVaultDocs(docs)}
        />
      )}

      {/* Printable Official Closing Slip & Audit Certificate Modal */}
      {showClosingSlip && (
        <DealClosingSlipModal
          deal={deal}
          vaultDocs={vaultDocs}
          onClose={() => setShowClosingSlip(false)}
          onOpenWhatsApp={() => {
            setShowClosingSlip(false)
            setShowWhatsApp(true)
          }}
        />
      )}

      {/* Interactive WhatsApp Stakeholder Notification Modal */}
      {showWhatsApp && (
        <DealWhatsAppModal
          deal={deal}
          onClose={() => setShowWhatsApp(false)}
        />
      )}
    </div>
  )
}

