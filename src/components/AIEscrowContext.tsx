'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { KYCData } from '@/app/investors/components/AIDocumentKYCVerifier'

export type VerificationStatus = 'UNVERIFIED' | 'VERIFYING' | 'VERIFIED' | 'REJECTED'

export interface UploadedDocumentRecord {
  id: string
  fileName: string
  docType: 'NICOP' | 'PASSPORT' | 'PROPERTY_TITLE' | 'RERA_LICENSE' | 'TAX_CERTIFICATE'
  uploadedAt: string
  riskScorePct: number
  status: 'APPROVED' | 'IN_REVIEW'
}

interface AIEscrowContextType {
  verificationStatus: VerificationStatus
  kycData: KYCData | null
  riskScorePct: number | null
  escrowSecured: boolean
  uploadedDocuments: UploadedDocumentRecord[]
  updateKYCResult: (data: KYCData) => void
  resetVerification: () => void
  addUploadedDocument: (doc: UploadedDocumentRecord) => void
}

const DEFAULT_KYC: KYCData = {
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
}

const DEFAULT_DOCUMENTS: UploadedDocumentRecord[] = [
  {
    id: 'doc-101',
    fileName: 'Overseas_NICOP_Pak_Dubai_Holder.pdf',
    docType: 'NICOP',
    uploadedAt: '2026-08-13',
    riskScorePct: 98.4,
    status: 'APPROVED',
  },
  {
    id: 'doc-102',
    fileName: 'Property_Title_Deed_Gulberg_Res.pdf',
    docType: 'PROPERTY_TITLE',
    uploadedAt: '2026-08-10',
    riskScorePct: 99.1,
    status: 'APPROVED',
  },
]

const AIEscrowContext = createContext<AIEscrowContextType>({
  verificationStatus: 'VERIFIED',
  kycData: DEFAULT_KYC,
  riskScorePct: 98.4,
  escrowSecured: true,
  uploadedDocuments: DEFAULT_DOCUMENTS,
  updateKYCResult: () => {},
  resetVerification: () => {},
  addUploadedDocument: () => {},
})

export function AIEscrowProvider({ children }: { children: React.ReactNode }) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('VERIFIED')
  const [kycData, setKycData] = useState<KYCData | null>(DEFAULT_KYC)
  const [riskScorePct, setRiskScorePct] = useState<number | null>(98.4)
  const [escrowSecured, setEscrowSecured] = useState<boolean>(true)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocumentRecord[]>(DEFAULT_DOCUMENTS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('nexmove_escrow_kyc')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.kycData) {
          setKycData(parsed.kycData)
          setVerificationStatus(parsed.verificationStatus || 'VERIFIED')
          setRiskScorePct(parsed.riskScorePct || 98.4)
          setEscrowSecured(parsed.escrowSecured ?? true)
        }
        if (parsed.uploadedDocuments) {
          setUploadedDocuments(parsed.uploadedDocuments)
        }
      }
    } catch (e) {
      console.error('Failed to load escrow KYC from localStorage', e)
    }
  }, [])

  const updateKYCResult = (data: KYCData) => {
    setKycData(data)
    setVerificationStatus('VERIFIED')
    setRiskScorePct(data.riskScorePct)
    setEscrowSecured(data.escrowStatus === 'ESCROW_SECURED')

    const newDoc: UploadedDocumentRecord = {
      id: `doc-${Date.now()}`,
      fileName: `${data.documentType}_Verified_Document.pdf`,
      docType: data.documentType,
      uploadedAt: data.extractedAt,
      riskScorePct: data.riskScorePct,
      status: 'APPROVED',
    }

    setUploadedDocuments((prev) => [newDoc, ...prev.filter((d) => d.docType !== data.documentType)])

    try {
      localStorage.setItem(
        'nexmove_escrow_kyc',
        JSON.stringify({
          verificationStatus: 'VERIFIED',
          kycData: data,
          riskScorePct: data.riskScorePct,
          escrowSecured: data.escrowStatus === 'ESCROW_SECURED',
          uploadedDocuments: [newDoc, ...uploadedDocuments],
        })
      )
    } catch (e) {
      console.error('Failed to save escrow KYC to localStorage', e)
    }
  }

  const addUploadedDocument = (doc: UploadedDocumentRecord) => {
    setUploadedDocuments((prev) => [doc, ...prev])
  }

  const resetVerification = () => {
    setVerificationStatus('UNVERIFIED')
    setKycData(null)
    setRiskScorePct(null)
    setEscrowSecured(false)
    localStorage.removeItem('nexmove_escrow_kyc')
  }

  return (
    <AIEscrowContext.Provider
      value={{
        verificationStatus,
        kycData,
        riskScorePct,
        escrowSecured,
        uploadedDocuments,
        updateKYCResult,
        resetVerification,
        addUploadedDocument,
      }}
    >
      {children}
    </AIEscrowContext.Provider>
  )
}

export function useAIEscrow() {
  return useContext(AIEscrowContext)
}
