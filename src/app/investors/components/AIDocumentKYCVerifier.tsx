'use client'

import React, { useState } from 'react'

export interface KYCData {
  documentType: 'NICOP' | 'PASSPORT' | 'PROPERTY_TITLE' | 'TAX_CERTIFICATE'
  fullName: string
  documentNumber: string
  nationality: string
  expiryDate: string
  fbrStatus: 'OVERSEAS_FILER' | 'OVERSEAS_NON_FILER'
  riskScorePct: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  escrowStatus: 'ESCROW_SECURED' | 'PENDING'
  authenticityScorePct: number
  extractedAt: string
}

interface AIDocumentKYCVerifierProps {
  onVerificationComplete?: (data: KYCData) => void
}

export default function AIDocumentKYCVerifier({ onVerificationComplete }: AIDocumentKYCVerifierProps) {
  const [selectedDocType, setSelectedDocType] = useState<'NICOP' | 'PASSPORT' | 'PROPERTY_TITLE'>('NICOP')
  const [isUploading, setIsUploading] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>('Overseas_NICOP_Pak_Dubai_Holder.pdf')
  const [kycResult, setKycResult] = useState<KYCData | null>({
    documentType: 'NICOP',
    fullName: 'Tariq Mahmood Al-Hassan',
    documentNumber: 'PK-35202-9876543-1',
    nationality: 'Overseas Pakistani (UAE Resident)',
    expiryDate: '2031-10-15',
    fbrStatus: 'OVERSEAS_FILER',
    riskScorePct: 98.4,
    riskLevel: 'LOW',
    escrowStatus: 'ESCROW_SECURED',
    authenticityScorePct: 99.2,
    extractedAt: '2026-08-13',
  })

  const simulateAIScan = (fileName: string, type: 'NICOP' | 'PASSPORT' | 'PROPERTY_TITLE') => {
    setIsUploading(true)
    setScanProgress(10)
    setKycResult(null)

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 20
      })
    }, 250)

    setTimeout(() => {
      clearInterval(interval)
      setScanProgress(100)
      setIsUploading(false)

      const isPassport = type === 'PASSPORT'
      const isProperty = type === 'PROPERTY_TITLE'

      const newResult: KYCData = {
        documentType: type,
        fullName: isPassport ? 'Sarah Jenkins (Foreign Investor)' : isProperty ? 'Gulberg III Luxury Residence Title' : 'Tariq Mahmood Al-Hassan',
        documentNumber: isPassport ? 'US-994821038' : isProperty ? 'REG-LHR-2026-8819' : 'PK-35202-9876543-1',
        nationality: isPassport ? 'United States (Foreigner)' : 'Overseas Pakistani (UAE Resident)',
        expiryDate: isProperty ? 'N/A (Registered Deed)' : '2032-05-20',
        fbrStatus: 'OVERSEAS_FILER',
        riskScorePct: 98.6,
        riskLevel: 'LOW',
        escrowStatus: 'ESCROW_SECURED',
        authenticityScorePct: 99.4,
        extractedAt: new Date().toISOString().split('T')[0],
      }

      setKycResult(newResult)
      if (onVerificationComplete) {
        onVerificationComplete(newResult)
      }
    }, 1600)
  }

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setUploadedFileName(file.name)
      simulateAIScan(file.name, selectedDocType)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setUploadedFileName(file.name)
      simulateAIScan(file.name, selectedDocType)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
      {/* Header & Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              🤖 AI Automated Document &amp; KYC Verification
            </span>
            <span className="text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              🌐 Overseas Investor Trust
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>🛡️</span> AI Document &amp; KYC Verifier
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Instant AI authentication of Overseas NICOP, Foreign Passports &amp; Property Allotment Letters backed by State Bank Escrow compliance.
          </p>
        </div>

        {/* Dynamic Status Badge */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
          {isUploading ? (
            <div className="bg-amber-500 text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span className="text-xs font-bold">Verification in Progress ({scanProgress}%)</span>
            </div>
          ) : kycResult ? (
            <>
              <div className="bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow text-xs font-bold">
                <span>🛡️</span> Risk Score: Low ({kycResult.riskScorePct}%)
              </div>
              <div className="bg-teal-600 text-white px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow text-xs font-bold">
                <span>🔒</span> Escrow Secure
              </div>
            </>
          ) : (
            <div className="bg-slate-100 text-slate-600 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold">
              Ready for Document Scan
            </div>
          )}
        </div>
      </div>

      {/* Document Selector & Upload Dropzone */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 flex flex-col gap-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Select Document Category
          </label>
          <div className="flex flex-col gap-2">
            {[
              { id: 'NICOP', title: '🪪 NICOP (Overseas Pakistani CNIC)', desc: 'National Identity Card for Overseas Pakistanis' },
              { id: 'PASSPORT', title: '🛂 Foreign Passport (Non-Resident)', desc: 'US, UK, UAE, EU & International Investors' },
              { id: 'PROPERTY_TITLE', title: '📑 Property Title / Allotment Letter', desc: 'Transfer Deed, FBR Registry, ALLOTMENT-LHR' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedDocType(item.id as 'NICOP' | 'PASSPORT' | 'PROPERTY_TITLE')}
                className={`p-3.5 rounded-2xl border text-left transition flex flex-col gap-1 ${
                  selectedDocType === item.id
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="text-xs font-bold">{item.title}</span>
                <span className="text-[11px] text-slate-500">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Zone */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Upload Document File (PDF, JPG, PNG)
          </label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-3xl p-6 text-center transition flex flex-col items-center justify-center gap-3 relative cursor-pointer min-h-[200px] ${
              isUploading
                ? 'border-amber-400 bg-amber-50/50'
                : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/30'
            }`}
          >
            <input
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {isUploading ? (
              <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                <span className="text-sm font-bold text-amber-900">AI Vision OCR Extracting Document...</span>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl shadow-sm">
                  📄
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Click to browse or drop your {selectedDocType} file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    AI OCR verifies watermark, CNIC checksums &amp; FBR Tax Filer registry automatically.
                  </p>
                </div>
                {uploadedFileName && (
                  <span className="text-xs font-mono bg-white border border-slate-200 text-slate-700 px-3 py-1 rounded-lg shadow-sm">
                    Current: {uploadedFileName}
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              🔒 End-to-end encrypted with SBP Escrow Trustee Security
            </span>
            <button
              onClick={() => simulateAIScan('Demo_Overseas_Passport_Pak.pdf', selectedDocType)}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
            >
              Re-Scan Demo Document →
            </button>
          </div>
        </div>
      </div>

      {/* AI Extraction Verification Results Matrix */}
      {kycResult && (
        <div className="bg-slate-900 text-white rounded-3xl p-5 flex flex-col gap-4 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                AI Extracted Document Metadata &amp; Trust Assurance
              </h4>
            </div>
            <span className="text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full font-bold">
              ✓ AI Authenticity: {kycResult.authenticityScorePct}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Full Name</span>
              <span className="text-sm font-bold text-white">{kycResult.fullName}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Document No</span>
              <span className="text-sm font-bold font-mono text-emerald-400">{kycResult.documentNumber}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Nationality / Resident</span>
              <span className="text-sm font-bold text-white">{kycResult.nationality}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">FBR Tax Status</span>
              <span className="text-sm font-bold text-amber-400">Verified Overseas Filer (15% WHT)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
