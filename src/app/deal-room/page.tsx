'use client'
// src/app/deal-room/page.tsx
// Digital Deal Rooms Overview & Active Transactions Listing

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
 ShieldCheck,
 Plus,
 ArrowRight,
 Clock,
 CheckCircle2,
 Building2,
 UserCheck,
 Lock,
 Sparkles,
 RefreshCw,
 Search,
 ExternalLink,
 ChevronRight,
 Printer,
 Share2,
 MessageSquare
} from 'lucide-react'
import DealClosingSlipModal from '@/components/deal-room/DealClosingSlipModal'
import DealWhatsAppModal from '@/components/deal-room/DealWhatsAppModal'

interface DealSummary {
 id: string
 dealNumber: string
 totalAgreedPrice: number | string
 status: string
 currentMilestone: number
 buyerName: string
 sellerName: string
 agencyName: string
 createdAt: string
 milestones: {
 id: string
 stepNumber: number
 title: string
 status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
 cprNumber?: string
 psidNumber?: string
 proofAttachmentUrl?: string
 completedAt?: string
 }[]
}

export default function DealRoomsPage() {
 const [deals, setDeals] = useState<DealSummary[]>([])
 const [loading, setLoading] = useState(true)
 const [showCreateModal, setShowCreateModal] = useState(false)
 const [isCreating, setIsCreating] = useState(false)
 const [search, setSearch] = useState('')
 const [selectedClosingDeal, setSelectedClosingDeal] = useState<DealSummary | null>(null)
 const [selectedWhatsAppDeal, setSelectedWhatsAppDeal] = useState<DealSummary | null>(null)

 // Form state for creating new deal room
 const [formData, setFormData] = useState({
 buyerName: '',
 sellerName: '',
 agencyName: '',
 totalAgreedPrice: '38000000',
 })

 const fetchDeals = async () => {
 setLoading(true)
 try {
 const res = await fetch('/api/deal-room/milestones?list=true')
 const data = await res.json()
 if (data.deals) {
 setDeals(data.deals)
 }
 } catch (err) {
 console.error('Failed to load deals', err)
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 fetchDeals()
 }, [])

 const handleCreateDeal = async (e: React.FormEvent) => {
 e.preventDefault()
 setIsCreating(true)
 try {
 const res = await fetch('/api/deal-room/milestones', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 action: 'create',
 buyerName: formData.buyerName || 'Ali Hamza (Buyer)',
 sellerName: formData.sellerName || 'Tariq Mehmood (Seller)',
 agencyName: formData.agencyName || 'Premier Estate Advisors',
 totalAgreedPrice: formData.totalAgreedPrice,
 }),
 })
 const data = await res.json()
 if (data.success && data.dealRoom) {
 setShowCreateModal(false)
 fetchDeals()
 } else {
 alert(data.error || 'Failed to create Deal Room')
 }
 } catch (_err) {
 alert('Network error while initializing Deal Room')
 } finally {
 setIsCreating(false)
 }
 }

 const filteredDeals = deals.filter((d) => {
 const query = search.toLowerCase()
 return (
 d.dealNumber.toLowerCase().includes(query) ||
 d.buyerName.toLowerCase().includes(query) ||
 d.sellerName.toLowerCase().includes(query) ||
 d.agencyName.toLowerCase().includes(query)
 )
 })

 const totalVolume = deals.reduce((acc, curr) => acc + Number(curr.totalAgreedPrice || 0), 0)

 return (
 <div className="min-h-screen bg-[#FDFBF7] text-stone-900 pb-20 pt-8 px-4 sm:px-6 lg:px-8">
 <div className="max-w-6xl mx-auto space-y-8">
 {/* Top Header Banner */}
 <div className="bg-stone-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
 <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
 <div>
 <div className="flex items-center gap-2 mb-2">
 <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
 <ShieldCheck className="w-3.5 h-3.5" />
 Tri-Party Closing Desks
 </span>
 <span className="text-xs text-stone-400">SBP Escrow & Housing Authority Standard</span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
 Digital Deal Rooms
 <Sparkles className="w-6 h-6 text-amber-400" />
 </h1>
 <p className="text-xs sm:text-sm text-stone-300 mt-2 max-w-xl leading-relaxed">
 4-Stage safe transaction desk connecting Buyers, Sellers, and Verified Agencies with Escrow Bayana, NDC clearance, FBR CPR tax compliance, and DHA biometric transfer.
 </p>
 </div>

 <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
 <button
 onClick={() => setShowCreateModal(true)}
 className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
 >
 <Plus className="w-4 h-4" />
 Initialize New Deal Room
 </button>
 <Link
 href="/dashboard"
 className="inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-semibold backdrop-blur-md transition-all"
 >
 Go to Dashboard
 </Link>
 </div>
 </div>

 {/* Quick Metrics Bar */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/10">
 <div>
 <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
 Active Deal Rooms
 </span>
 <span className="text-2xl font-black text-white">{deals.length} Transacting</span>
 </div>
 <div>
 <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
 Escrow Protected Volume
 </span>
 <span className="text-2xl font-black text-emerald-400 font-mono">
 PKR {totalVolume.toLocaleString('en-PK')}
 </span>
 </div>
 <div>
 <span className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 block">
 Security Guarantee
 </span>
 <span className="text-sm font-bold text-stone-200 mt-1 block flex items-center gap-1">
 <Lock className="w-3.5 h-3.5 text-emerald-400" /> 100% Anti-Theft Watermarked
 </span>
 </div>
 </div>
 </div>

 {/* Search & Filter Toolbar */}
 <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
 <div className="relative w-full sm:w-80">
 <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by Deal # or Participant..."
 className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs text-stone-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-sm transition-all"
 />
 </div>

 <button
 onClick={fetchDeals}
 disabled={loading}
 className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl text-xs font-semibold text-stone-700 shadow-sm transition-all self-end sm:self-auto"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
 Refresh Desk
 </button>
 </div>

 {/* Deals Cards Grid */}
 {loading ? (
 <div className="py-20 text-center text-xs text-stone-500 bg-white rounded-3xl border border-stone-200 shadow-sm flex flex-col items-center justify-center gap-3">
 <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
 <p className="font-semibold text-stone-700">Loading Active Deal Rooms...</p>
 </div>
 ) : filteredDeals.length === 0 ? (
 <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 shadow-sm p-8 max-w-md mx-auto">
 <ShieldCheck className="w-10 h-10 text-stone-300 mx-auto mb-3" />
 <h3 className="text-sm font-bold text-stone-800">No Deal Rooms Found</h3>
 <p className="text-xs text-stone-500 mt-1 mb-4">
 Initialize your first deal room to begin tracking Bayana escrow and society transfer milestones.
 </p>
 <button
 onClick={() => setShowCreateModal(true)}
 className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold"
 >
 + Create Sample Deal Room
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
 {filteredDeals.map((deal) => {
 const price = Number(deal.totalAgreedPrice || 0)
 const completedMilestones = deal.milestones?.filter((m) => m.status === 'COMPLETED').length || 0

 return (
 <div
 key={deal.id}
 className="bg-white rounded-3xl border border-stone-200/90 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
 >
 <div>
 {/* Top Row: Deal # & Badge */}
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2">
 <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg">
 #{deal.dealNumber}
 </span>
 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
 deal.status === 'CLOSED'
 ? 'bg-blue-100 text-blue-800'
 : 'bg-emerald-100 text-emerald-800'
 }`}>
 {deal.status === 'CLOSED' ? 'Closed' : 'Active'}
 </span>
 </div>
 <span className="text-[11px] font-bold text-stone-500">
 Stage {deal.currentMilestone} of 4
 </span>
 </div>

 {/* Price */}
 <div className="mb-4">
 <span className="text-[10px] uppercase font-bold text-stone-400 block">
 Agreed Price
 </span>
 <span className="text-xl font-black text-stone-900 font-mono">
 PKR {price.toLocaleString('en-PK')}
 </span>
 </div>

 {/* Parties */}
 <div className="space-y-1.5 text-xs text-stone-700 bg-stone-50 p-3.5 rounded-2xl border border-stone-100 mb-4">
 <div className="flex justify-between items-center">
 <span className="text-stone-500">Buyer:</span>
 <span className="font-bold text-stone-900 truncate max-w-[200px]">{deal.buyerName}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-stone-500">Seller:</span>
 <span className="font-bold text-stone-900 truncate max-w-[200px]">{deal.sellerName}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-stone-500">Agency:</span>
 <span className="font-bold text-indigo-700 truncate max-w-[200px]">{deal.agencyName}</span>
 </div>
 </div>

 {/* Milestone Progress Bar */}
 <div className="mb-4">
 <div className="flex justify-between text-[11px] text-stone-600 font-semibold mb-1.5">
 <span>Milestone Progress</span>
 <span>{completedMilestones}/4 Completed</span>
 </div>
 <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden flex gap-1 p-0.5">
 {[1, 2, 3, 4].map((step) => {
 const isDone = (deal.milestones?.find((m) => m.stepNumber === step)?.status === 'COMPLETED')
 const isCurr = step === deal.currentMilestone
 return (
 <div
 key={step}
 className={`h-full flex-1 rounded-full ${
 isDone
 ? 'bg-emerald-600'
 : isCurr
 ? 'bg-amber-400 animate-pulse'
 : 'bg-stone-200'
 }`}
 />
 )
 })}
 </div>
 </div>
 </div>

 {/* Quick Action Bar for Print Slip & WhatsApp */}
 <div className="grid grid-cols-2 gap-2 pt-1">
 <button
 type="button"
 onClick={() => setSelectedClosingDeal(deal)}
 className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition shadow-xs"
 >
 <Printer className="w-3.5 h-3.5 text-stone-700" />
 <span>Print Slip / PDF</span>
 </button>
 <button
 type="button"
 onClick={() => setSelectedWhatsAppDeal(deal)}
 className="inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-xs"
 >
 <Share2 className="w-3.5 h-3.5 text-emerald-600" />
 <span>WhatsApp</span>
 </button>
 </div>

 {/* Enter Button */}
 <Link
 href={`/deal-room/${deal.id}`}
 className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm group"
 >
 <span>Enter Closing Deal Desk</span>
 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
 </Link>
 </div>
 )
 })}
 </div>
 )}

 {/* Modal: Initialize New Deal Room */}
 {showCreateModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in">
 <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-stone-200 shadow-2xl space-y-5">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-lg font-black text-stone-900">
 Initialize Digital Deal Room
 </h3>
 <p className="text-xs text-stone-500 mt-0.5">
 Start a 4-milestone secure closing room for buyer, seller & agency.
 </p>
 </div>
 <button
 onClick={() => setShowCreateModal(false)}
 className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center text-xs font-bold"
 >
 
 </button>
 </div>

 <form onSubmit={handleCreateDeal} className="space-y-3.5 text-xs">
 <div>
 <label className="block font-bold text-stone-700 mb-1">
 Buyer Full Name & City
 </label>
 <input
 type="text"
 required
 value={formData.buyerName}
 onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
 placeholder="e.g. Hamza Tariq (Lahore)"
 className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
 />
 </div>

 <div>
 <label className="block font-bold text-stone-700 mb-1">
 Seller Full Name (Overseas or Local)
 </label>
 <input
 type="text"
 required
 value={formData.sellerName}
 onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
 placeholder="e.g. Kamran Ali (Overseas - UK)"
 className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
 />
 </div>

 <div>
 <label className="block font-bold text-stone-700 mb-1">
 Facilitating Real Estate Agency
 </label>
 <input
 type="text"
 required
 value={formData.agencyName}
 onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
 placeholder="e.g. Zameen Experts & Associates"
 className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
 />
 </div>

 <div>
 <label className="block font-bold text-stone-700 mb-1">
 Agreed Transaction Price (PKR)
 </label>
 <input
 type="number"
 required
 value={formData.totalAgreedPrice}
 onChange={(e) => setFormData({ ...formData, totalAgreedPrice: e.target.value })}
 placeholder="35000000"
 className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono focus:outline-none focus:border-emerald-600 focus:bg-white"
 />
 </div>

 <div className="pt-2 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowCreateModal(false)}
 className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={isCreating}
 className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all disabled:opacity-50"
 >
 {isCreating ? 'Initializing...' : 'Launch Deal Room →'}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Printable Deal Closing Slip Modal */}
 {selectedClosingDeal && (
 <DealClosingSlipModal
 deal={selectedClosingDeal as any}
 onClose={() => setSelectedClosingDeal(null)}
 onOpenWhatsApp={() => {
 setSelectedWhatsAppDeal(selectedClosingDeal)
 setSelectedClosingDeal(null)
 }}
 />
 )}

 {/* WhatsApp Notification Modal */}
 {selectedWhatsAppDeal && (
 <DealWhatsAppModal
 deal={selectedWhatsAppDeal as any}
 onClose={() => setSelectedWhatsAppDeal(null)}
 />
 )}
 </div>
 </div>
 )
}
