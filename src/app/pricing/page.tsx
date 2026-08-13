'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import BankTransferCheckoutModal from '@/components/BankTransferCheckoutModal'

export interface PricingPlan {
  id: string
  title: string
  pricePKR: number
  badge?: string
  description: string
  features: string[]
  recommended?: boolean
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    title: 'Starter Plan',
    pricePKR: 5000,
    badge: 'Individual Agents',
    description: 'Essential real estate tools for independent brokers and single agents.',
    features: [
      'Basic Property Listing Indexing',
      'Standard Public Marketplace Access',
      'Standard WhatsApp Lead Buttons',
      'Single User Account',
      'Standard Support',
    ],
  },
  {
    id: 'professional',
    title: 'Professional Plan',
    pricePKR: 15000,
    badge: 'MOST POPULAR',
    recommended: true,
    description: 'Complete SaaS suite for growing agencies needing AI Escrow & KYC tools.',
    features: [
      'Full AIEscrowGuard Document Verification',
      'Smart Escrow Milestone & Vault Tracker',
      'AI Legal SPA Contract Generator (PDF)',
      'Multi-Tenant Data Shielding (Shielded Deals)',
      'Co-Brokering Network & 50/50 Profit Split',
      'RERA / DLD Verified Agency Badge',
      'Priority Support',
    ],
  },
  {
    id: 'enterprise',
    title: 'Enterprise Plan',
    pricePKR: 40000,
    badge: 'Large Developers',
    description: 'Unlimited ecosystem access for property developers and enterprise firms.',
    features: [
      'Unlimited AI Document OCR & KYC Audits',
      'Custom Escrow Milestone Workflow Builder',
      'Priority AI Lead Cross-Matching Engine',
      'Zero Commission Cap on Co-Brokered Sales',
      'Dedicated Account Manager & API Access',
      'Custom Multi-Agency Franchise Ledger',
      '24/7 SLA Guarantee',
    ],
  },
]

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  const handleSelectPlan = (plan: PricingPlan) => {
    setSelectedPlan(plan)
    setIsCheckoutOpen(true)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider">
                NexMove PropTech Ecosystem Pricing
              </span>
              <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-0.5 rounded-full uppercase tracking-wider">
                Direct Bank Transfer (Meezan Bank)
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Subscription &amp; Access Control Plans
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl font-medium">
              Public property browsing &amp; architecture portals remain 100% free. Upgrade for premium Investor Escrow Vaults &amp; Agency KYC tools.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Access Control Notice */}
        <div className="bg-slate-900/80 border border-teal-500/30 rounded-3xl p-5 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-start gap-3">
            <span className="text-xl">🆓</span>
            <div>
              <h4 className="font-bold text-teal-300 uppercase">Public Marketplace</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">100% Free forever. Search, list, and inquire with zero subscription barriers.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🏛️</span>
            <div>
              <h4 className="font-bold text-teal-300 uppercase">Architecture Portal</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">100% Open &amp; Free. Explore 3D visualizers, BIM blueprints, and architect profiles.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <h4 className="font-bold text-purple-300 uppercase">Restricted Portals</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">Requires active subscription: Investor Vaults, Agency KYC, Escrow &amp; AIEscrowGuard.</p>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative border ${
                plan.recommended
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/60 border-emerald-500 shadow-xl shadow-emerald-950/40 scale-102'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{plan.badge}</span>
                </div>
                <h3 className="text-xl font-black text-white">{plan.title}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{plan.description}</p>

                <div className="my-6 border-y border-slate-800/80 py-4">
                  <span className="text-3xl font-black text-white">PKR {plan.pricePKR.toLocaleString()}</span>
                  <span className="text-xs font-semibold text-slate-400"> / month</span>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-300 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                className={`w-full font-bold text-xs py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-1.5 ${
                  plan.recommended
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <span>🏦</span> Select Plan &amp; Pay via Bank Transfer
              </button>
            </div>
          ))}
        </div>

        {/* Bank Details Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-xs text-slate-300 space-y-3 font-mono">
          <h4 className="font-sans font-bold text-white text-sm">Direct Bank Transfer Instruction</h4>
          <p className="text-slate-400 font-sans">
            NexMove accepts direct bank transfers into our Meezan Bank current account. Select a plan above to upload your transaction screenshot receipt and enter your Transaction ID (TRX ID).
          </p>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-sans block">ACCOUNT TITLE</span>
              <span className="font-bold text-white">Sharafat Ali</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-sans block">BANK</span>
              <span className="font-bold text-emerald-400">Meezan Bank</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-sans block">IBAN</span>
              <span className="font-bold text-white">PK67 MEZN 0011 3701 0985 0413</span>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
        <BankTransferCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          selectedPlanTitle={selectedPlan.title}
          selectedPlanPricePKR={selectedPlan.pricePKR}
        />
      )}
    </main>
  )
}
