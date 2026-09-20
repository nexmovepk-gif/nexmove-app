'use client'
// src/components/agency/AgencyValuationSubmissionModal.tsx
// Agency Valuation Bidding Submission Modal

import React, { useState } from 'react'

interface AgencyValuationSubmissionModalProps {
 leadId: string
 propertyTitle: string
 demandPKR: number | string
 isOpen: boolean
 onClose: () => void
 onSuccess?: () => void
}

export default function AgencyValuationSubmissionModal({
 leadId,
 propertyTitle,
 demandPKR,
 isOpen,
 onClose,
 onSuccess,
}: AgencyValuationSubmissionModalProps) {
 const [minPrice, setMinPrice] = useState<string>(String(Math.round(Number(demandPKR) * 0.95)))
 const [maxPrice, setMaxPrice] = useState<string>(String(demandPKR))
 const [sellingDays, setSellingDays] = useState<number>(25)
 const [commissionRate, setCommissionRate] = useState<number>(1.0)
 const [strategy, setStrategy] = useState<string>('')
 const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
 const [error, setError] = useState<string | null>(null)

 if (!isOpen) return null

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault()
 setError(null)
 setIsSubmitting(true)

 try {
 const res = await fetch('/api/agency/valuations', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 leadId,
 estimatedMinPKR: minPrice,
 estimatedMaxPKR: maxPrice,
 sellingDaysEstimate: sellingDays,
 commissionRate,
 marketingStrategy: strategy || 'Direct WhatsApp investor list & verified local buyers network.',
 }),
 })

 const data = await res.json()
 if (!res.ok) throw new Error(data.error || 'Failed to submit proposal')

 if (onSuccess) onSuccess()
 onClose()
 } catch (err: unknown) {
 const msg = err instanceof Error ? err.message : 'Failed to submit proposal';
 setError(msg)
 } finally {
 setIsSubmitting(false)
 }
 }

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
 <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200">
 <div className="flex justify-between items-start mb-4">
 <div>
 <h3 className="text-base font-bold text-stone-900">Submit Valuation Proposal</h3>
 <p className="text-xs text-stone-500 mt-0.5">
 Property: <strong>{propertyTitle}</strong> • Demand: PKR {Number(demandPKR).toLocaleString('en-PK')}
 </p>
 </div>
 <button
 onClick={onClose}
 className="w-8 h-8 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center text-sm"
 >
 
 </button>
 </div>

 {error && (
 <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
 {error}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-medium text-stone-700 mb-1">
 Estimated Min Price (PKR)
 </label>
 <input
 type="number"
 value={minPrice}
 onChange={(e) => setMinPrice(e.target.value)}
 required
 className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-500"
 />
 </div>

 <div>
 <label className="block text-xs font-medium text-stone-700 mb-1">
 Estimated Max Price (PKR)
 </label>
 <input
 type="number"
 value={maxPrice}
 onChange={(e) => setMaxPrice(e.target.value)}
 required
 className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-500"
 />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-xs font-medium text-stone-700 mb-1">
 Estimated Days to Close
 </label>
 <input
 type="number"
 value={sellingDays}
 onChange={(e) => setSellingDays(Number(e.target.value))}
 required
 className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-500"
 />
 </div>

 <div>
 <label className="block text-xs font-medium text-stone-700 mb-1">
 Commission Rate (%)
 </label>
 <input
 type="number"
 step={0.1}
 value={commissionRate}
 onChange={(e) => setCommissionRate(Number(e.target.value))}
 required
 className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-500"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-medium text-stone-700 mb-1">
 Marketing Strategy & Pitch for Seller
 </label>
 <textarea
 rows={3}
 value={strategy}
 onChange={(e) => setStrategy(e.target.value)}
 placeholder="e.g. Exclusive investor network, social media campaigns, physical site signage..."
 className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-stone-500"
 />
 </div>

 <div className="flex gap-2 pt-2">
 <button
 type="button"
 onClick={onClose}
 className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isSubmitting}
 className="flex-1 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
 >
 {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )
}
