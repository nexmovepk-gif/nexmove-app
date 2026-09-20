'use client'
// src/components/FbrTaxCalculatorWidget.tsx
// Interactive Real-Time FBR Tax Calculator Widget (Filer vs Non-Filer Savings)

import React, { useState, useEffect } from 'react'

interface FbrTaxCalculatorWidgetProps {
 initialPrice?: number
 className?: string
}

export default function FbrTaxCalculatorWidget({
 initialPrice = 30000000,
 className = '',
}: FbrTaxCalculatorWidgetProps) {
 const [price, setPrice] = useState<number>(initialPrice)
 const [buyerFiler, setBuyerFiler] = useState<boolean>(true)
 const [sellerFiler, setSellerFiler] = useState<boolean>(true)
 const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer')

 // Section 236K (Buyer Advance Tax)
 const buyerRate = buyerFiler ? 0.03 : 0.105
 const buyerTax = Math.round(price * buyerRate)
 const buyerFilerTax = Math.round(price * 0.03)
 const buyerNonFilerTax = Math.round(price * 0.105)
 const buyerSavings = buyerNonFilerTax - buyerFilerTax

 // Section 236C (Seller Advance Tax)
 const sellerRate = sellerFiler ? 0.04 : 0.06
 const sellerTax = Math.round(price * sellerRate)
 const sellerFilerTax = Math.round(price * 0.04)
 const sellerNonFilerTax = Math.round(price * 0.06)
 const sellerSavings = sellerNonFilerTax - sellerFilerTax

 const formatPKR = (num: number) => 'PKR ' + num.toLocaleString('en-PK')

 return (
 <div className={`bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-sm ${className}`}>
 {/* Header */}
 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-4 border-b border-stone-100">
 <div>
 <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
 FBR Official Tax Matrix FY2026-27
 </span>
 <h3 className="text-sm font-bold text-stone-900 mt-1">
 Real Estate Tax Calculator (236K / 236C)
 </h3>
 </div>

 {/* Tab Toggle */}
 <div className="flex bg-stone-100 p-0.5 rounded-xl self-start">
 <button
 onClick={() => setActiveTab('buyer')}
 className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
 activeTab === 'buyer' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
 }`}
 >
 Buyer (236K)
 </button>
 <button
 onClick={() => setActiveTab('seller')}
 className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
 activeTab === 'seller' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
 }`}
 >
 Seller (236C)
 </button>
 </div>
 </div>

 {/* Property Consideration Input */}
 <div className="mb-4">
 <label className="block text-xs font-medium text-stone-700 mb-1">
 Property Value / Consideration (PKR)
 </label>
 <div className="relative">
 <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-semibold">PKR</span>
 <input
 type="number"
 value={price}
 onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
 step={1000000}
 className="w-full pl-12 pr-4 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-500"
 />
 </div>
 <span className="text-[11px] text-stone-500 mt-1 block">
 {formatPKR(price)}
 </span>
 </div>

 {/* Calculations View */}
 {activeTab === 'buyer' ? (
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/60">
 <div>
 <span className="text-xs font-semibold text-stone-800 block">Active FBR Tax Filer Status</span>
 <span className="text-[11px] text-stone-500">Toggle to calculate Non-Filer surcharge</span>
 </div>
 <button
 onClick={() => setBuyerFiler(!buyerFiler)}
 className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
 buyerFiler ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
 }`}
 >
 {buyerFiler ? 'Active Filer (3%)' : 'Non-Filer (10.5%)'}
 </button>
 </div>

 <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-xl">
 <div className="flex justify-between items-baseline">
 <span className="text-xs text-emerald-900 font-medium">Estimated 236K Advance Tax:</span>
 <span className="text-base font-bold text-emerald-700">{formatPKR(buyerTax)}</span>
 </div>
 <div className="mt-2 pt-2 border-t border-emerald-100 flex justify-between text-[11px]">
 <span className="text-stone-500">Potential Savings by being a Filer:</span>
 <span className="font-bold text-emerald-600">{formatPKR(buyerSavings)}</span>
 </div>
 </div>
 </div>
 ) : (
 <div className="space-y-3">
 <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200/60">
 <div>
 <span className="text-xs font-semibold text-stone-800 block">Seller FBR Tax Filer Status</span>
 <span className="text-[11px] text-stone-500">Section 236C Advance Tax on transfer</span>
 </div>
 <button
 onClick={() => setSellerFiler(!sellerFiler)}
 className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
 sellerFiler ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
 }`}
 >
 {sellerFiler ? 'Active Filer (4%)' : 'Non-Filer (6%)'}
 </button>
 </div>

 <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-xl">
 <div className="flex justify-between items-baseline">
 <span className="text-xs text-emerald-900 font-medium">Estimated 236C Advance Tax:</span>
 <span className="text-base font-bold text-emerald-700">{formatPKR(sellerTax)}</span>
 </div>
 <div className="mt-2 pt-2 border-t border-emerald-100 flex justify-between text-[11px]">
 <span className="text-stone-500">Seller Savings as Active Filer:</span>
 <span className="font-bold text-emerald-600">{formatPKR(sellerSavings)}</span>
 </div>
 </div>
 </div>
 )}

 {/* CPR / PSID Guidance */}
 <div className="mt-4 p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 leading-relaxed">
 <strong>Next Step:</strong> Generate a 17-digit PSID on the FBR IRIS portal, pay through 1BILL or NBP, and upload the Computerized Payment Receipt (CPR) to your Deal Room to unlock the final transfer appointment.
 </div>
 </div>
 )
}
