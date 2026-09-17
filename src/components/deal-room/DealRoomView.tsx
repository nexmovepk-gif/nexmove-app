'use client'
// src/components/deal-room/DealRoomView.tsx
// Tri-Party Closing Desk with 4 Interactive Milestones Progress Tracker

import React, { useState, useEffect } from 'react'

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
  milestones: Milestone[]
}

export default function DealRoomView({ dealRoomId }: { dealRoomId?: string }) {
  const [deal, setDeal] = useState<DealRoomData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeStep, setActiveStep] = useState<number>(1)
  const [proofInput, setProofInput] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

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
      const res = await fetch('/api/deal-room/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_milestone',
          dealRoomId: deal.id,
          milestoneId: milestone.id,
          proofUrl: proofInput || '/uploads/mock_cpr_receipt.pdf',
          cprNumber: `CPR-${Date.now().toString().slice(-6)}`,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setProofInput('')
        fetchDealRoom()
      }
    } catch (_err) {
      alert('Failed to update milestone')
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200">
        Loading Deal Room Closing Desk...
      </div>
    )
  }

  if (!deal) {
    return (
      <div className="p-8 text-center text-xs text-stone-500 bg-white rounded-2xl border border-stone-200">
        No active Deal Room found.
      </div>
    )
  }

  const milestones = deal.milestones || []
  const currentStepData = milestones.find((m) => m.stepNumber === activeStep)

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-stone-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              🔒 Tri-Party Escrow Protected
            </span>
            <span className="text-xs text-stone-400 font-mono">#{deal.dealNumber}</span>
          </div>
          <h2 className="text-lg font-bold">Deal Room & Milestone Desk</h2>
          <p className="text-xs text-stone-300 mt-0.5">
            Buyer: <strong>{deal.buyerName}</strong> • Seller: <strong>{deal.sellerName}</strong> • Agency: <strong>{deal.agencyName}</strong>
          </p>
        </div>

        <div className="sm:text-right">
          <span className="text-[11px] text-stone-400 block">Agreed Transaction Price</span>
          <span className="text-xl font-bold text-emerald-400">
            PKR {Number(deal.totalAgreedPrice).toLocaleString('en-PK')}
          </span>
        </div>
      </div>

      {/* 4-Step Interactive Milestone Stepper */}
      <div className="p-6 border-b border-stone-200/80 bg-[#FAF9F6]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {milestones.map((m) => {
            const isCompleted = m.status === 'COMPLETED'
            const isCurrent = m.stepNumber === deal.currentMilestone
            const isSelected = activeStep === m.stepNumber

            return (
              <button
                key={m.id}
                onClick={() => setActiveStep(m.stepNumber)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-white shadow-sm ring-1 ring-emerald-500'
                    : isCompleted
                    ? 'border-stone-200 bg-white hover:border-stone-300'
                    : 'border-stone-200/70 bg-stone-100/60 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase text-stone-500">
                    Step {m.stepNumber}
                  </span>
                  {isCompleted ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                      ✓
                    </span>
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-stone-300" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-stone-900 line-clamp-2">
                  {m.title}
                </h4>
                <span className="text-[10px] font-medium text-stone-500 mt-1 block">
                  {isCompleted ? 'Verified & Completed' : isCurrent ? 'Active Now' : 'Upcoming'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Milestone Action Pane */}
      {currentStepData && (
        <div className="p-6">
          <div className="max-w-xl">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Active Milestone #{currentStepData.stepNumber}
            </span>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              {currentStepData.title}
            </h3>

            <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs leading-relaxed text-stone-700 space-y-2">
              {currentStepData.stepNumber === 1 && (
                <p>
                  <strong>Milestone 1 — Bayana / Token Escrow:</strong> Deposit the initial token into the NexMove Escrow Vault. Funds remain locked until DHA NDC verification is initiated.
                </p>
              )}
              {currentStepData.stepNumber === 2 && (
                <p>
                  <strong>Milestone 2 — DHA / Society NDC Clearance:</strong> The selling agency submits the No Demand Certificate (NDC) application. Outstanding dues and society inspection are cleared.
                </p>
              )}
              {currentStepData.stepNumber === 3 && (
                <p>
                  <strong>Milestone 3 — FBR ATL Tax Challans & CPR:</strong> Both buyer and seller generate their 17-digit PSID for Section 236K / 236C and upload their verified CPR receipts.
                </p>
              )}
              {currentStepData.stepNumber === 4 && (
                <p>
                  <strong>Milestone 4 — Final Transfer Desk & Biometric Appointment:</strong> Book the official biometric appointment with the housing authority. Once thumbprints are confirmed, escrow funds are automatically released.
                </p>
              )}
            </div>

            {currentStepData.status === 'COMPLETED' ? (
              <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
                <span>✓</span>
                <span>This milestone was completed and signed off successfully.</span>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Proof Attachment / CPR / Reference Document (Optional)
                  </label>
                  <input
                    type="text"
                    value={proofInput}
                    onChange={(e) => setProofInput(e.target.value)}
                    placeholder="e.g. /uploads/cpr_receipt_2026.pdf or Challan ID"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-500"
                  />
                </div>

                <button
                  onClick={() => handleCompleteMilestone(currentStepData)}
                  disabled={isUpdating}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isUpdating ? 'Updating Milestone...' : 'Complete & Sign Off Milestone →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
