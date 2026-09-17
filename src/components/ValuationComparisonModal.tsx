'use client'
// src/components/ValuationComparisonModal.tsx
// Side-by-Side Comparison Matrix for Top 3 Agency Valuation Proposals

import React, { useState } from 'react'

interface ValuationProposal {
  id: string
  agencyName: string
  estimatedMinPKR: number | string
  estimatedMaxPKR: number | string
  sellingDaysEstimate: number
  commissionRate: number
  marketingStrategy?: string
  status: string
}

interface ValuationComparisonModalProps {
  lead: {
    id: string
    society: string
    phase?: string
    demandPKR: number | string
    valuationProposals?: ValuationProposal[]
  }
  isOpen: boolean
  onClose: () => void
}

export default function ValuationComparisonModal({
  lead,
  isOpen,
  onClose,
}: ValuationComparisonModalProps) {
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignedSuccess, setAssignedSuccess] = useState<string | null>(null)

  if (!isOpen) return null

  const proposals = lead.valuationProposals || []

  const handleAcceptProposal = async (proposalId: string) => {
    setSelectedProposalId(proposalId)
    setIsAssigning(true)
    try {
      const res = await fetch('/api/leads/private/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          proposalId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to assign agency')

      setAssignedSuccess(data.message)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 overflow-hidden relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
              ⚡ Live Matched Proposals
            </span>
            <h2 className="text-xl font-bold text-stone-900 mt-1">
              Top 3 Agency Valuation Proposals
            </h2>
            <p className="text-xs text-stone-500">
              Property: <strong>{lead.society} {lead.phase || ''}</strong> • Demand: PKR {Number(lead.demandPKR).toLocaleString('en-PK')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center text-sm"
          >
            ✕
          </button>
        </div>

        {assignedSuccess ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl mx-auto mb-3">
              ✓
            </div>
            <h3 className="text-base font-bold text-stone-900">Mandate Activated!</h3>
            <p className="text-xs text-stone-600 max-w-md mx-auto mt-1 leading-relaxed">
              {assignedSuccess} Your dedicated agency representative will contact you on WhatsApp to arrange physical verification and digital document watermarking.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proposals.map((prop, idx) => {
              const isSelected = selectedProposalId === prop.id
              const minPKR = Number(prop.estimatedMinPKR).toLocaleString('en-PK')
              const maxPKR = Number(prop.estimatedMaxPKR).toLocaleString('en-PK')

              return (
                <div
                  key={prop.id || idx}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    idx === 0
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-sm'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {idx === 0 ? '⭐ Recommended' : `Agency #${idx + 1}`}
                      </span>
                      <span className="text-[11px] font-mono text-stone-500">
                        {prop.commissionRate}% comm.
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 line-clamp-1 mb-2">
                      {prop.agencyName}
                    </h4>

                    <div className="space-y-2 py-2 border-t border-stone-100 text-[11px]">
                      <div>
                        <span className="text-stone-500 block">Valuation Range:</span>
                        <span className="font-bold text-stone-800 text-xs">
                          PKR {minPKR} - {maxPKR}
                        </span>
                      </div>

                      <div>
                        <span className="text-stone-500 block">Est. Time to Close:</span>
                        <span className="font-semibold text-stone-700">
                          {prop.sellingDaysEstimate} Days
                        </span>
                      </div>

                      {prop.marketingStrategy && (
                        <div>
                          <span className="text-stone-500 block">Strategy:</span>
                          <span className="text-stone-600 italic line-clamp-2">
                            "{prop.marketingStrategy}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAcceptProposal(prop.id)}
                    disabled={isAssigning}
                    className={`w-full mt-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      idx === 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                    } disabled:opacity-50`}
                  >
                    {isAssigning && isSelected ? 'Activating...' : '1-Click Accept (MOU)'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
