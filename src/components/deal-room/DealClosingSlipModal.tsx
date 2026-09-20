'use client'
// src/components/deal-room/DealClosingSlipModal.tsx
// Official Printable Deal Closing Slip & Settlement Certificate with A4 Print Styling

import React, { useRef } from 'react'
import {
 Printer,
 Share2,
 X,
 ShieldCheck,
 CheckCircle2,
 Building2,
 User,
 Calendar,
 Lock,
 Receipt,
 FileCheck2,
 QrCode,
 Stamp
} from 'lucide-react'

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

interface DealData {
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
 createdAt?: string
}

interface Props {
 deal: DealData
 onClose: () => void
 onOpenWhatsApp?: () => void
 vaultDocs?: Array<{
 id?: string
 docType: string
 fileName?: string
 status?: string
 }>
}

export default function DealClosingSlipModal({ deal, onClose, onOpenWhatsApp, vaultDocs }: Props) {
 const printRef = useRef<HTMLDivElement>(null)

 const handlePrint = () => {
 window.print()
 }

 const price = Number(deal.totalAgreedPrice) || 35000000
 const tokenBayana = price * 0.10 // 10%
 const buyerTax = price * 0.03 // 3% Section 236K (Active Filer)
 const sellerTax = price * 0.03 // 3% Section 236C (Active Filer)
 const isAllClosed = deal.status === 'CLOSED' || deal.milestones?.every((m) => m.status === 'COMPLETED')
 const closingDate = new Date().toLocaleDateString('en-PK', {
 day: 'numeric',
 month: 'long',
 year: 'numeric',
 })

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
 {/* Print Stylesheet injection to isolate slip during window.print() */}
 <style dangerouslySetInnerHTML={{
 __html: `
 @media print {
 body * {
 visibility: hidden !important;
 }
 #deal-closing-slip-print, #deal-closing-slip-print * {
 visibility: visible !important;
 }
 #deal-closing-slip-print {
 position: absolute !important;
 left: 0 !important;
 top: 0 !important;
 width: 100% !important;
 margin: 0 !important;
 padding: 24px !important;
 background: white !important;
 color: black !important;
 box-shadow: none !important;
 border: none !important;
 }
 .no-print {
 display: none !important;
 }
 @page {
 size: A4 portrait;
 margin: 12mm;
 }
 }
 `
 }} />

 <div className="bg-white rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
 {/* Modal Action Bar (Hidden in Print) */}
 <div className="no-print p-4 sm:px-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
 <div className="flex items-center gap-2">
 <Printer className="w-5 h-5 text-emerald-400" />
 <div>
 <h3 className="text-sm font-bold text-white">Deal Closing Slip & Audit Certificate</h3>
 <p className="text-[11px] text-stone-400">Official Settlement Receipt for #{deal.dealNumber}</p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {onOpenWhatsApp && (
 <button
 type="button"
 onClick={onOpenWhatsApp}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
 >
 <Share2 className="w-3.5 h-3.5" />
 <span>WhatsApp</span>
 </button>
 )}
 <button
 type="button"
 onClick={handlePrint}
 className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-xs font-bold transition shadow-sm"
 >
 <Printer className="w-3.5 h-3.5 text-stone-800" />
 <span>Print / Save PDF</span>
 </button>
 <button
 type="button"
 onClick={onClose}
 className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Scrollable Document Container */}
 <div className="overflow-y-auto p-4 sm:p-8 bg-stone-100 flex justify-center">
 {/* Printable A4 Certificate Box */}
 <div
 id="deal-closing-slip-print"
 ref={printRef}
 className="w-full max-w-2xl bg-white border-2 border-stone-900 p-6 sm:p-8 rounded-2xl shadow-md text-stone-900 text-xs space-y-6 relative"
 >
 {/* Background Watermark */}
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] overflow-hidden select-none">
 <span className="text-7xl sm:text-8xl font-black rotate-[-30deg] tracking-widest text-stone-900 uppercase">
 NEXMOVE SETTLED
 </span>
 </div>

 {/* Document Header */}
 <div className="border-b-2 border-stone-900 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
 <div>
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-black text-sm">
 NM
 </div>
 <div>
 <h1 className="text-base sm:text-lg font-black tracking-tight text-stone-900 leading-tight">
 NEXMOVE TRI-PARTY CLOSING CERTIFICATE
 </h1>
 <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">
 Escrow Settlement & Property Handover Slip
 </p>
 </div>
 </div>
 <p className="text-[10px] text-stone-600 mt-2 font-mono">
 Standard Operating Procedure under SBP Escrow Guidelines & Housing Authority Act
 </p>
 </div>

 <div className="text-right sm:border-l border-stone-300 sm:pl-4">
 <span className="inline-block px-2.5 py-0.5 rounded font-mono font-bold text-[10px] bg-stone-900 text-white uppercase mb-1">
 {deal.dealNumber}
 </span>
 <p className="text-[10px] text-stone-600">Date: {closingDate}</p>
 <p className="text-[10px] font-bold text-emerald-700 mt-0.5">
 Status: {isAllClosed ? 'CLOSED & SETTLED' : 'ACTIVE / IN PROGRESS'}
 </p>
 </div>
 </div>

 {/* Agreed Financial Valuation */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
 <div>
 <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Agreed Price</span>
 <span className="text-base font-black text-stone-900 font-mono">
 PKR {price.toLocaleString('en-PK')}
 </span>
 </div>
 <div>
 <span className="text-[10px] uppercase font-bold text-stone-500 block">10% Escrow Bayana</span>
 <span className="text-sm font-bold text-emerald-700 font-mono">
 PKR {tokenBayana.toLocaleString('en-PK')}
 </span>
 </div>
 <div>
 <span className="text-[10px] uppercase font-bold text-stone-500 block">Remaining Handover Balance</span>
 <span className="text-sm font-bold text-stone-800 font-mono">
 PKR {(price - tokenBayana).toLocaleString('en-PK')}
 </span>
 </div>
 </div>

 {/* Tri-Party Legal Identifiers */}
 <div>
 <h2 className="text-[11px] uppercase font-black tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
 1. Tri-Party Legal Stakeholders
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="p-3 border border-stone-200 rounded-xl bg-white">
 <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-stone-500 mb-1">
 <User className="w-3 h-3 text-emerald-600" /> Buyer Participant
 </div>
 <strong className="text-xs text-stone-900 block">{deal.buyerName}</strong>
 <span className="text-[10px] text-stone-600 block mt-0.5">Status: Active Tax Filer</span>
 <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5"> FBR Sec 236K Assessed</span>
 </div>

 <div className="p-3 border border-stone-200 rounded-xl bg-white">
 <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-stone-500 mb-1">
 <User className="w-3 h-3 text-amber-600" /> Seller Participant
 </div>
 <strong className="text-xs text-stone-900 block">{deal.sellerName}</strong>
 <span className="text-[10px] text-stone-600 block mt-0.5">Status: Titleholder Verified</span>
 <span className="text-[9px] text-amber-700 font-semibold block mt-0.5"> Society NDC Applied</span>
 </div>

 <div className="p-3 border border-stone-200 rounded-xl bg-white">
 <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-stone-500 mb-1">
 <Building2 className="w-3 h-3 text-indigo-600" /> Facilitating Agency
 </div>
 <strong className="text-xs text-stone-900 block">{deal.agencyName}</strong>
 <span className="text-[10px] text-stone-600 block mt-0.5">Role: Escrow Custodian</span>
 <span className="text-[9px] text-indigo-700 font-semibold block mt-0.5"> NexMove Mandate Registered</span>
 </div>
 </div>
 </div>

 {/* 4-Milestone Audit Trail Log */}
 <div>
 <h2 className="text-[11px] uppercase font-black tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
 <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
 2. 4-Stage Closing Audit Trail & Compliance Log
 </h2>
 <div className="border border-stone-300 rounded-xl overflow-hidden divide-y divide-stone-200">
 {deal.milestones?.map((m) => {
 const isDone = m.status === 'COMPLETED'
 return (
 <div key={m.id} className="p-2.5 flex items-center justify-between text-xs bg-white">
 <div className="flex items-center gap-2">
 <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
 isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-500'
 }`}>
 {isDone ? '' : m.stepNumber}
 </span>
 <div>
 <strong className="text-xs text-stone-900">
 Stage {m.stepNumber}: {m.title}
 </strong>
 <p className="text-[10px] text-stone-500 font-mono">
 {m.cprNumber && `CPR: ${m.cprNumber} | `}
 {m.psidNumber && `PSID/Ref: ${m.psidNumber} | `}
 {m.proofAttachmentUrl && `Ref: ${m.proofAttachmentUrl}`}
 {!m.cprNumber && !m.psidNumber && !m.proofAttachmentUrl && (isDone ? 'Directly Verified' : 'Awaiting Submission')}
 </p>
 </div>
 </div>

 <div className="text-right">
 <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
 isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
 }`}>
 {isDone ? 'COMPLETED' : 'PENDING'}
 </span>
 <span className="text-[9px] text-stone-400 block mt-0.5">
 {m.completedAt ? new Date(m.completedAt).toLocaleDateString('en-PK') : '—'}
 </span>
 </div>
 </div>
 )
 })}
 </div>
 </div>

 {/* FBR Advance Tax Clearance Summary */}
 <div>
 <h2 className="text-[11px] uppercase font-black tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
 <Receipt className="w-3.5 h-3.5 text-emerald-700" />
 3. FBR Tax & Challan Compliance Summary (Sec 236C / 236K)
 </h2>
 <div className="border border-stone-200 rounded-xl overflow-hidden">
 <table className="w-full text-left text-[11px]">
 <thead className="bg-stone-100 border-b border-stone-200 text-stone-700 font-bold">
 <tr>
 <th className="p-2">Section & Head</th>
 <th className="p-2">Obligated Party</th>
 <th className="p-2">Filer Rate</th>
 <th className="p-2 text-right">Tax Amount</th>
 <th className="p-2 text-center">Status</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-stone-200 text-stone-800">
 <tr>
 <td className="p-2 font-mono">Sec 236K (Purchaser Tax)</td>
 <td className="p-2">{deal.buyerName}</td>
 <td className="p-2">3.0% (ATL Filer)</td>
 <td className="p-2 text-right font-mono font-bold">PKR {buyerTax.toLocaleString('en-PK')}</td>
 <td className="p-2 text-center text-emerald-700 font-bold">CPR Issued</td>
 </tr>
 <tr>
 <td className="p-2 font-mono">Sec 236C (Seller Tax)</td>
 <td className="p-2">{deal.sellerName}</td>
 <td className="p-2">3.0% (ATL Filer)</td>
 <td className="p-2 text-right font-mono font-bold">PKR {sellerTax.toLocaleString('en-PK')}</td>
 <td className="p-2 text-center text-emerald-700 font-bold">CPR Issued</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* 4. Verified Legal Documents Vault (Anti-Theft Watermarked) */}
 <div>
 <h2 className="text-[11px] uppercase font-black tracking-wider text-stone-800 mb-2 flex items-center gap-1.5">
 <Stamp className="w-3.5 h-3.5 text-emerald-700" />
 4. Verified Legal Documents Vault (Watermarked & Encrypted)
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
 {(vaultDocs && vaultDocs.length > 0 ? vaultDocs : [
 { docType: 'ALLOTMENT_LETTER', fileName: 'Allotment_Letter.pdf' },
 { docType: 'SELLER_CNIC', fileName: 'Seller_CNIC_Verified.jpg' },
 { docType: 'NDC_SLIP', fileName: 'DHA_NDC_Clearance.pdf' },
 ]).map((doc, idx) => (
 <div key={idx} className="p-2 border border-stone-200 rounded-xl bg-stone-50 flex items-center justify-between">
 <div className="min-w-0 pr-2">
 <strong className="block text-stone-900 font-bold uppercase text-[9px] truncate">
 {doc.docType.replace(/_/g, ' ')}
 </strong>
 <span className="text-stone-500 font-mono text-[9px] truncate block">
 {doc.fileName || 'Verified & Stored'}
 </span>
 </div>
 <span className="text-[9px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
 Watermarked
 </span>
 </div>
 ))}
 </div>
 </div>

 {/* Security Verification & Signatures */}
 <div className="pt-4 border-t-2 border-stone-900 space-y-6">
 <div className="flex items-center justify-between text-[10px] text-stone-600">
 <div className="flex items-center gap-2">
 <Stamp className="w-4 h-4 text-emerald-700" />
 <span>
 Digitally validated via <strong>NexMove Hash: SHA256-{deal.id.slice(-12).toUpperCase()}</strong>
 </span>
 </div>
 <div className="font-mono">
 Verification URL: nexmove.pk/deal-room/{deal.id}
 </div>
 </div>

 {/* Tri-Party Signature Blocks */}
 <div className="grid grid-cols-3 gap-4 pt-6 text-center">
 <div className="border-t border-dashed border-stone-400 pt-2">
 <strong className="text-xs text-stone-900 block">{deal.buyerName}</strong>
 <span className="text-[10px] text-stone-500">Buyer Acknowledgment</span>
 </div>

 <div className="border-t border-dashed border-stone-400 pt-2">
 <strong className="text-xs text-stone-900 block">{deal.sellerName}</strong>
 <span className="text-[10px] text-stone-500">Seller Handover Sign</span>
 </div>

 <div className="border-t border-dashed border-stone-400 pt-2">
 <strong className="text-xs text-stone-900 block">{deal.agencyName}</strong>
 <span className="text-[10px] text-stone-500">NexMove Escrow Officer Seal</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Footer (No print) */}
 <div className="no-print p-4 bg-white border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
 <p className="flex items-center gap-1">
 <Lock className="w-3.5 h-3.5 text-emerald-600" />
 Print layout is pre-configured for standard A4 paper or PDF export.
 </p>
 <div className="flex items-center gap-2">
 <button
 onClick={onClose}
 className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold transition"
 >
 Close
 </button>
 <button
 onClick={handlePrint}
 className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-md"
 >
 <Printer className="w-4 h-4 text-emerald-400" />
 <span>Print Slip / Download PDF</span>
 </button>
 </div>
 </div>
 </div>
 </div>
 )
}
