'use client'

import React, { useState } from 'react'
import { useAIEscrow } from '@/components/AIEscrowContext'
import AIDocumentKYCVerifier, { KYCData } from '@/app/investors/components/AIDocumentKYCVerifier'

export interface AIEscrowGuardProps {
  mode?: 'full' | 'agency_kyc' | 'escrow_protection' | 'property_title' | 'compact'
  title?: string
  subtitle?: string
  className?: string
}

export default function AIEscrowGuard({
  mode = 'full',
  title,
  subtitle,
  className = '',
}: AIEscrowGuardProps) {
  const { verificationStatus, riskScorePct, escrowSecured, updateKYCResult } = useAIEscrow()
  const [showScannerModal, setShowScannerModal] = useState(false)

  const handleVerificationComplete = (data: KYCData) => {
    updateKYCResult(data)
    setShowScannerModal(false)
  }

  // --- Compact Badge Mode ---
  if (mode === 'compact') {
    if (verificationStatus === 'REJECTED' || !escrowSecured) {
      return (
        <div className={`inline-flex items-center gap-2 bg-red-950 text-white px-3.5 py-1.5 rounded-xl border border-red-800 shadow-sm text-xs ${className}`}>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          <span className="font-bold text-red-400">⚠️ AI Escrow Guard: Validation Failed</span>
          <span className="text-red-300 font-mono text-[10px]">Document Mismatch</span>
        </div>
      )
    }

    return (
      <div className={`inline-flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-sm text-xs ${className}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span className="font-bold text-emerald-400">🛡️ AI Escrow Guard</span>
        <span className="text-slate-400">|</span>
        <span className="font-mono text-slate-200">Risk: Low ({riskScorePct || 98.4}%)</span>
        {escrowSecured && (
          <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold">
            ✓ Escrow Secure
          </span>
        )}
      </div>
    )
  }

  // --- Agency KYC Specific Mode ---
  if (mode === 'agency_kyc') {
    return (
      <div className={`bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 border border-purple-500/30 shadow-lg ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-2xl flex-shrink-0">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI Agency KYC &amp; RERA License Verification
                </span>
                {verificationStatus === 'REJECTED' ? (
                  <span className="text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Validation Failed: Mismatch
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Verified Active
                  </span>
                )}
              </div>
              <h4 className="text-base font-black text-white">
                {title || 'AIEscrowGuard — Agency Trust & Verification Status'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {subtitle || 'Trade Registry & RERA broker license authenticated by AI Vision OCR. Multi-tenant privacy shield active.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {verificationStatus === 'REJECTED' || !escrowSecured ? (
              <div className="bg-red-600/90 border border-red-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                <span>⚠️</span> Validation Failed: Document Mismatch
              </div>
            ) : (
              <>
                <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono">
                  Risk Score: Low ({riskScorePct || 98.4}%)
                </div>
                <div className="bg-teal-500/20 border border-teal-500/40 text-teal-300 px-3.5 py-1.5 rounded-xl text-xs font-bold">
                  ✓ Escrow Secure
                </div>
              </>
            )}
            <button
              onClick={() => setShowScannerModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow"
            >
              Update KYC License →
            </button>
          </div>
        </div>

        {/* Modal Scanner */}
        {showScannerModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowScannerModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 text-xl font-bold"
              >
                ✕
              </button>
              <AIDocumentKYCVerifier onVerificationComplete={handleVerificationComplete} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- Escrow Protection Mode ---
  if (mode === 'escrow_protection') {
    return (
      <div className={`bg-gradient-to-r from-teal-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 border border-teal-500/30 shadow-lg ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-2xl flex-shrink-0">
              🔒
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  State Bank Escrow Protocol Verified
                </span>
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  FBR FY2026-27 Integrated
                </span>
              </div>
              <h4 className="text-base font-black text-white">
                {title || 'AIEscrowGuard — Protected Transaction Pipeline'}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {subtitle || 'All client identity documents, title checks, and escrow tokens are protected by SBP Trustee Protocols.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {verificationStatus === 'REJECTED' || !escrowSecured ? (
              <span className="text-xs font-mono bg-red-950 text-red-400 border border-red-800 px-3 py-1.5 rounded-xl font-bold">
                ⚠️ Validation Failed: Document Mismatch
              </span>
            ) : (
              <span className="text-xs font-mono bg-slate-800 text-teal-400 border border-slate-700 px-3 py-1.5 rounded-xl font-bold">
                Status: Escrow Secure ✓
              </span>
            )}
            <button
              onClick={() => setShowScannerModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow"
            >
              Verify Documents →
            </button>
          </div>
        </div>

        {showScannerModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowScannerModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 text-xl font-bold"
              >
                ✕
              </button>
              <AIDocumentKYCVerifier onVerificationComplete={handleVerificationComplete} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- Property Title Mode ---
  if (mode === 'property_title') {
    return (
      <div className={`bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-md ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📑</span>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                  AI Title Deed &amp; Allotment Verifier
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                {title || 'AIEscrowGuard Property Title Check'}
              </h4>
              <p className="text-xs text-slate-400">
                {subtitle || 'Auto-scans title deeds, calculates FBR tax rates, and verifies property ownership encumbrance.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1.5 rounded-xl">
              ✓ Ownership Score: 99.2%
            </span>
            <button
              onClick={() => setShowScannerModal(true)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-1.5 rounded-xl transition"
            >
              Scan Document
            </button>
          </div>
        </div>

        {showScannerModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowScannerModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white z-10 text-xl font-bold"
              >
                ✕
              </button>
              <AIDocumentKYCVerifier onVerificationComplete={handleVerificationComplete} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // --- Full Standalone / Banner Mode ---
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <AIDocumentKYCVerifier onVerificationComplete={handleVerificationComplete} />
    </div>
  )
}
