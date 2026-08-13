'use client'

import React, { useState } from 'react'

export interface BankTransferCheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  selectedPlanTitle?: string
  selectedPlanPricePKR?: number
}

export default function BankTransferCheckoutModal({
  isOpen,
  onClose,
  selectedPlanTitle = 'Professional Plan',
  selectedPlanPricePKR = 15000,
}: BankTransferCheckoutModalProps) {
  const [trxId, setTrxId] = useState('')
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFileName(e.target.files[0].name)
      setError(null)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!trxId.trim()) {
      setError('Please enter your Bank Transaction ID (TRX ID).')
      return
    }
    if (!receiptFileName) {
      setError('Please upload your bank transfer payment receipt screenshot.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1200)
  }

  const handleReset = () => {
    setIsSubmitted(false)
    setTrxId('')
    setReceiptFileName(null)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center"
        >
          ✕
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Modal Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  🏦 Direct Bank Transfer Checkout
                </span>
                <span className="text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Meezan Bank Verified
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                Subscribe to {selectedPlanTitle}
              </h3>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Amount Due:{' '}
                <span className="font-black text-emerald-700 text-base">
                  PKR {selectedPlanPricePKR.toLocaleString()} / month
                </span>
              </p>
            </div>

            {/* Bank Transfer Details Card */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-4 border border-emerald-500/30 space-y-3 font-mono text-xs shadow-md">
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-2">
                <span className="font-sans font-bold text-emerald-400 text-xs">OFFICIAL BANK TRANSFER DETAILS</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-sans font-bold">
                  MEEZAN BANK
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">ACCOUNT TITLE</span>
                  <span className="font-bold text-sm text-white">Sharafat Ali</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">BANK NAME</span>
                  <span className="font-bold text-xs text-emerald-300">Meezan Bank (PKR Current)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 font-sans block">INTERNATIONAL BANK ACCOUNT NUMBER (IBAN)</span>
                <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-emerald-400 font-bold text-xs tracking-wider mt-1">
                  <span>PK67 MEZN 0011 3701 0985 0413</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText('PK67MEZN0011370109850413')}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded font-sans transition"
                  >
                    Copy IBAN
                  </button>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-800 text-xs font-bold p-3 rounded-xl flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Inputs: TRX ID & Receipt Screenshot */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Transaction ID (TRX ID / Reference No) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRX-908231045 or MZN-88192"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  2. Upload Payment Receipt / Screenshot *
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition relative cursor-pointer flex flex-col items-center gap-2">
                  <input
                    type="file"
                    required
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <span className="text-xl">📸</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {receiptFileName ? receiptFileName : 'Click or drop payment receipt screenshot here'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">JPEG, PNG or PDF bank receipt screenshot</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Submitting Payment Receipt...' : 'Confirm Payment & Submit Receipt →'}
            </button>
          </form>
        ) : (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-full flex items-center justify-center text-3xl mx-auto font-bold shadow-sm">
              ✓
            </div>
            <h3 className="text-2xl font-black text-slate-900">Receipt Submitted for Verification!</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed font-medium">
              Your payment receipt for <span className="font-bold text-emerald-700">{selectedPlanTitle}</span> (PKR {selectedPlanPricePKR.toLocaleString()}) has been submitted with TRX ID: <span className="font-mono font-bold text-slate-900">{trxId}</span>.
            </p>
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3.5 rounded-2xl text-xs font-semibold max-w-sm mx-auto">
              ⏱️ Admin verification takes ~15–30 minutes. Your subscription features are provisionally unlocked.
            </div>
            <button
              onClick={handleReset}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow"
            >
              Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
