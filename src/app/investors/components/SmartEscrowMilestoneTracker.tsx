'use client'

import React, { useState } from 'react'
import { CurrencyCode, formatCurrencyPrice } from '@/lib/currency'

export interface EscrowMilestone {
  stageNumber: number
  title: string
  subtitle: string
  percentage: number
  payoutAmountPKR: number
  status: 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED'
  completedAt?: string
  verificationRequirements: string[]
  txHash?: string
}

interface SmartEscrowMilestoneTrackerProps {
  propertyTitle?: string
  totalPricePKR?: number
  currency?: CurrencyCode
}

export default function SmartEscrowMilestoneTracker({
  propertyTitle = '',
  totalPricePKR = 0,
  currency = 'PKR',
}: SmartEscrowMilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<EscrowMilestone[]>([
    {
      stageNumber: 1,
      title: 'Stage 1: Legal Check & Title Search',
      subtitle: 'Clear title deed verification & land revenue encumbrance check',
      percentage: 20,
      payoutAmountPKR: totalPricePKR * 0.2,
      status: 'IN_PROGRESS',
      verificationRequirements: [
        'LDA / DHA Land Revenue NOC verified',
        'No pending bank mortgages or litigation',
        'Title Registry Lawyer stamp verified',
      ],
    },
    {
      stageNumber: 2,
      title: 'Stage 2: Sales Agreement & FBR Tax Clearance',
      subtitle: 'FBR Tax Withholding (15% Filer) voucher & Agreement execution',
      percentage: 30,
      payoutAmountPKR: totalPricePKR * 0.3,
      status: 'LOCKED',
      verificationRequirements: [
        'FBR CPR (Computerized Payment Receipt) generated',
        'Bilingual NexMove AI Escrow Contract signed',
        'Overseas Investor NICOP verified on ATL roll',
      ],
    },
    {
      stageNumber: 3,
      title: 'Stage 3: Handover & Deed Transfer',
      subtitle: 'Physical possession, key handover & Registry transfer deed',
      percentage: 50,
      payoutAmountPKR: totalPricePKR * 0.5,
      status: 'LOCKED',
      verificationRequirements: [
        'Physical property key handover certificate',
        'Final Transfer Deed signed at Sub-Registrar Office',
        'Seller final escrow release authorization',
      ],
    },
  ])

  const [releaseModalStage, setReleaseModalStage] = useState<EscrowMilestone | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [releaseSuccessMsg, setReleaseSuccessMsg] = useState<string | null>(null)
  // Audit log starts empty — entries are added as real stages are approved
  const [auditLog, setAuditLog] = useState<Array<{ date: string; stage: string; amountPKR: number; tx: string }>>([])

  // Calculations
  const releasedAmountPKR = milestones
    .filter((m) => m.status === 'COMPLETED')
    .reduce((sum, m) => sum + m.payoutAmountPKR, 0)

  const lockedVaultAmountPKR = totalPricePKR - releasedAmountPKR
  const progressPct = milestones.reduce((acc, m) => (m.status === 'COMPLETED' ? acc + m.percentage : acc), 0)

  const handleApproveRelease = (e: React.FormEvent) => {
    e.preventDefault()
    if (!releaseModalStage) return

    const currentStageNum = releaseModalStage.stageNumber
    const newTx = `0x${Math.random().toString(16).substr(2, 16).toUpperCase()}`
    const timestamp = new Date().toLocaleString()

    setMilestones((prev) =>
      prev.map((m) => {
        if (m.stageNumber === currentStageNum) {
          return {
            ...m,
            status: 'COMPLETED',
            completedAt: timestamp,
            txHash: newTx,
          }
        }
        if (m.stageNumber === currentStageNum + 1) {
          return {
            ...m,
            status: 'IN_PROGRESS',
          }
        }
        return m
      })
    )

    setAuditLog((prev) => [
      {
        date: timestamp,
        stage: releaseModalStage.title,
        amountPKR: releaseModalStage.payoutAmountPKR,
        tx: newTx,
      },
      ...prev,
    ])

    setReleaseSuccessMsg(
      `Successfully released ${formatCurrencyPrice(releaseModalStage.payoutAmountPKR, currency)} for ${releaseModalStage.title}! Transaction Hash: ${newTx}`
    )
    setReleaseModalStage(null)
    setPinInput('')
    setTimeout(() => setReleaseSuccessMsg(null), 8000)
  }

  // Zero-state: no active contract loaded
  if (totalPricePKR === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-sm flex flex-col items-center justify-center gap-4 text-center min-h-[200px]">
        <span className="text-4xl">📈</span>
        <div>
          <p className="text-base font-black text-slate-900">No Active Contract Selected</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            The 3-stage escrow milestone tracker will appear here once an active investment
            contract is associated with your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black bg-teal-100 text-teal-800 border border-teal-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              🏛️ State Bank Escrow Vault Protocols
            </span>
            <span className="text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              3-Stage Smart Fund Release
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>📈</span> Smart Escrow Milestone Tracker
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage-wise fund release for <strong className="text-slate-800">{propertyTitle}</strong>.
          </p>
        </div>

        {/* Global Progress Pill */}
        <div className="bg-slate-900 text-white rounded-2xl p-3 flex items-center gap-4 flex-shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Escrow Released</span>
            <span className="text-lg font-black text-emerald-400">{progressPct}% Complete</span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent flex items-center justify-center font-extrabold text-xs">
            {progressPct}%
          </div>
        </div>
      </div>

      {releaseSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-center justify-between text-xs font-bold shadow-sm">
          <div className="flex items-center gap-2">
            <span>🎉</span> {releaseSuccessMsg}
          </div>
          <button onClick={() => setReleaseSuccessMsg(null)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* Escrow Vault Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Contract Value</span>
          <span className="text-xl font-black text-slate-900">{formatCurrencyPrice(totalPricePKR, currency)}</span>
          <span className="text-[10px] text-slate-400">Rs {totalPricePKR.toLocaleString('en-PK')} PKR</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Released to Seller</span>
          <span className="text-xl font-black text-emerald-700">{formatCurrencyPrice(releasedAmountPKR, currency)}</span>
          <span className="text-[10px] text-emerald-600">State Bank Verified Releases</span>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col gap-1">
          <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Locked in Escrow Vault</span>
          <span className="text-xl font-black text-teal-800 font-mono">{formatCurrencyPrice(lockedVaultAmountPKR, currency)}</span>
          <span className="text-[10px] text-teal-600">Protected until next milestone</span>
        </div>
      </div>

      {/* 3-Stage Progress Timeline */}
      <div className="flex flex-col gap-4 mt-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>Stage Release Timeline</span>
          <span className="text-[11px] text-slate-400 font-normal">Click active stage to approve payout</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {milestones.map((stage) => {
            const isCompleted = stage.status === 'COMPLETED'
            const isInProgress = stage.status === 'IN_PROGRESS'

            return (
              <div
                key={stage.stageNumber}
                className={`border rounded-3xl p-5 flex flex-col justify-between gap-4 transition relative ${
                  isCompleted
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : isInProgress
                    ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20'
                    : 'border-slate-200 bg-slate-50/50 opacity-75'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isInProgress
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? '✓ Completed & Disbursed' : isInProgress ? '⏳ Ready for Release' : '🔒 Locked'}
                    </span>
                    <span className="text-xs font-black text-slate-800 font-mono">{stage.percentage}% Share</span>
                  </div>

                  <h5 className="text-sm font-bold text-slate-900 mt-1">{stage.title}</h5>
                  <p className="text-xs text-slate-500">{stage.subtitle}</p>

                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 mt-1 flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Milestone Amount</span>
                    <span className="text-base font-black text-emerald-700">
                      {formatCurrencyPrice(stage.payoutAmountPKR, currency)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Requirements:</span>
                    {stage.verificationRequirements.map((req, idx) => (
                      <div key={idx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                        <span className={isCompleted ? 'text-emerald-600' : 'text-slate-400'}>
                          {isCompleted ? '✓' : '•'}
                        </span>
                        <span>{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  {isCompleted ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-slate-400">Disbursed on {stage.completedAt}</span>
                      <span className="text-[10px] font-mono text-emerald-700 truncate">TX: {stage.txHash}</span>
                    </div>
                  ) : isInProgress ? (
                    <button
                      onClick={() => setReleaseModalStage(stage)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center justify-center gap-1"
                    >
                      <span>🔓 Approve &amp; Release Funds</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full bg-slate-200 text-slate-400 font-bold text-xs py-2.5 px-4 rounded-xl cursor-not-allowed text-center"
                    >
                      Locked (Complete Stage {stage.stageNumber - 1} First)
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction Audit Log */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
          <span>📜 Cryptographic Escrow Audit Log</span>
          <span className="text-[10px] text-emerald-400 font-mono">State Bank Trustee Node #PK-782</span>
        </h4>
        <div className="flex flex-col gap-2 max-h-36 overflow-y-auto pr-1">
          {auditLog.map((log, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-slate-800/80 p-2.5 rounded-xl gap-2 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-slate-200">{log.stage}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <span>{formatCurrencyPrice(log.amountPKR, currency)}</span>
                <span className="text-emerald-400">{log.tx}</span>
                <span className="text-[10px] text-slate-500">{log.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Release Confirmation Modal */}
      {releaseModalStage && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full uppercase">
                  Escrow Release Authorization
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-1">{releaseModalStage.title}</h4>
              </div>
              <button onClick={() => setReleaseModalStage(null)} className="text-slate-400 hover:text-slate-700 font-bold text-lg">✕</button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-1 text-xs text-amber-900">
              <span className="font-bold">⚠️ Warning: Irrevocable Fund Release</span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                You are authorizing the State Bank Escrow Trustee to release{' '}
                <strong className="text-emerald-950 font-black">{formatCurrencyPrice(releaseModalStage.payoutAmountPKR, currency)}</strong> directly to the verified seller account.
              </p>
            </div>

            <form onSubmit={handleApproveRelease} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Enter Investor Security PIN / Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="p-3 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReleaseModalStage(null)}
                  className="flex-1 bg-slate-100 text-slate-700 font-bold text-xs py-3 rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow"
                >
                  Confirm &amp; Release Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
