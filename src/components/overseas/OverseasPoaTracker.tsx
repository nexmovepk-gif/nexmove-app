'use client'
// src/components/overseas/OverseasPoaTracker.tsx
// Embassy Special Power of Attorney (POA) & MOFA Attestation Tracker

import React, { useState } from 'react'

interface OverseasPoaTrackerProps {
  country?: string
  attorneyName?: string
  className?: string
}

export default function OverseasPoaTracker({
  country = 'United Arab Emirates (Dubai)',
  attorneyName = 'Muhammad Salman (Brother/Attorney)',
  className = '',
}: OverseasPoaTrackerProps) {
  const [currentStep, setCurrentStep] = useState(2)

  const steps = [
    {
      num: 1,
      title: 'Drafting Special Power of Attorney',
      desc: 'Contains specific Khasra, plot number, and authority limits.',
      completed: true,
    },
    {
      num: 2,
      title: 'Pakistan Embassy / Consulate Attestation',
      desc: 'Physical appearance, biometric verification, and consular seal abroad.',
      completed: true,
    },
    {
      num: 3,
      title: 'MOFA Counter-Attestation in Pakistan',
      desc: 'Ministry of Foreign Affairs verification receipt upon document arrival.',
      completed: currentStep >= 3,
    },
    {
      num: 4,
      title: 'Housing Authority (DHA) Recording',
      desc: 'Attorney registered at DHA transfer desk for biometric execution.',
      completed: currentStep >= 4,
    },
  ]

  return (
    <div className={`bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-sm ${className}`}>
      <div className="flex justify-between items-start mb-4 pb-4 border-b border-stone-100">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Overseas Pakistani Closing Desk
          </span>
          <h3 className="text-sm font-bold text-stone-900 mt-1">
            Special Power of Attorney (POA) Tracker
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Country of Origin: <strong>{country}</strong> • Designated Attorney: <strong>{attorneyName}</strong>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {steps.map((s) => (
          <div
            key={s.num}
            className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
              s.completed
                ? 'bg-emerald-50/40 border-emerald-200/80'
                : 'bg-stone-50 border-stone-200/70'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                s.completed ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-700'
              }`}
            >
              {s.completed ? '✓' : s.num}
            </div>

            <div className="flex-1">
              <h4 className="text-xs font-bold text-stone-900">{s.title}</h4>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">{s.desc}</p>
            </div>

            {!s.completed && s.num === currentStep && (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-3 py-1 bg-stone-900 text-white rounded-lg text-[11px] font-semibold hover:bg-stone-800 flex-shrink-0"
              >
                Mark Verified
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 leading-relaxed">
        🏦 <strong>RDA Inward Remittance:</strong> Payments sent via Roshan Digital Account (RDA) bypass local banking withholding taxes and provide instant foreign inward remittance certificates (FIRC).
      </div>
    </div>
  )
}
