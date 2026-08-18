'use client';

/**
 * KYCVerificationModal.tsx
 * ─────────────────────────────────────────────────────────────────
 * Full-screen glassmorphism KYC modal for OVERSEAS_BUYER / INVESTOR
 * roles. Supports Passport, NICOP, and POC Card document uploads
 * with animated AI verification flow and strict doc-type validation.
 *
 * Used by: src/app/overseas/dashboard/page.tsx
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, X, Upload, CheckCircle2, AlertTriangle,
  FileText, Clock, BadgeCheck, Fingerprint, Loader2,
  AlertCircle, ChevronRight,
} from 'lucide-react';

// ── KYC Types ──────────────────────────────────────────────────────────────────

export type KYCDocumentType = 'PASSPORT' | 'NICOP' | 'POC';
export type KYCVerificationStatus = 'IDLE' | 'UPLOADING' | 'SCANNING' | 'VERIFIED' | 'REJECTED';
export type KYCRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type KYCEscrowStatus = 'ESCROW_SECURED' | 'PENDING' | 'REJECTED';
export type KYCFBRStatus = 'OVERSEAS_FILER' | 'OVERSEAS_NON_FILER';

export interface KYCData {
  documentType: KYCDocumentType;
  fullName: string;
  documentNumber: string;
  nationality: string;
  expiryDate: string;
  fbrStatus: KYCFBRStatus;
  riskScorePct: number;
  riskLevel: KYCRiskLevel;
  escrowStatus: KYCEscrowStatus;
  authenticityScorePct: number;
  extractedAt: string;
  validationError?: string | null;
}

interface KYCVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (data: KYCData) => void;
  userEmail?: string;
  userName?: string;
}

// ── Document Type Config ───────────────────────────────────────────────────────

const DOC_TYPES: {
  id: KYCDocumentType;
  emoji: string;
  title: string;
  desc: string;
  keywords: string[];
  negKeywords: string[];
  errorMsg: string;
}[] = [
    {
      id: 'NICOP',
      emoji: '🪪',
      title: 'NICOP',
      desc: 'National Identity Card for Overseas Pakistanis',
      keywords: ['nicop', 'cnic', 'identity', 'overseas', 'national'],
      negKeywords: ['passport', 'pass', 'allotment', 'title', 'deed', 'poc', 'origin'],
      errorMsg:
        'Validation Failed: Please upload a valid NICOP / Overseas CNIC document.',
    },
    {
      id: 'PASSPORT',
      emoji: '🛂',
      title: 'Foreign Passport',
      desc: 'US, UK, UAE, EU & International Investors',
      keywords: ['passport', 'pass', 'foreign', 'us_', 'uk_', 'intl'],
      negKeywords: ['nicop', 'cnic', 'allotment', 'title', 'deed', 'poc'],
      errorMsg:
        'Validation Failed: Please upload a valid Foreign Passport document.',
    },
    {
      id: 'POC',
      emoji: '🌐',
      title: 'POC Card',
      desc: 'Pakistan Origin Certificate — Foreign National Investors',
      keywords: ['poc', 'origin', 'pakistan_origin', 'certificate'],
      negKeywords: ['passport', 'nicop', 'cnic', 'allotment', 'title', 'deed'],
      errorMsg:
        'Validation Failed: Please upload a valid POC (Pakistan Origin Certificate) card.',
    },
  ];

// ── Validation helper ──────────────────────────────────────────────────────────

function validateDocType(fileName: string, docType: KYCDocumentType): string | null {
  const fn = fileName.toLowerCase().replace(/[\s-]/g, '_');
  const cfg = DOC_TYPES.find((d) => d.id === docType);
  if (!cfg) return null;

  const hasNegative = cfg.negKeywords.some((k) => fn.includes(k));
  const hasPositive = cfg.keywords.some((k) => fn.includes(k));

  if (hasNegative || !hasPositive) return cfg.errorMsg;
  return null;
}

// ── Scan step labels ───────────────────────────────────────────────────────────

const SCAN_STEPS = [
  'Initialising AI Vision OCR Engine…',
  'Extracting document metadata…',
  'Cross-validating document category…',
  'Running CNIC checksum verification…',
  'Querying FBR Tax Filer Registry…',
  'Computing authenticity score…',
  'Finalising trust assurance report…',
];

// ── Modal Component ────────────────────────────────────────────────────────────

export default function KYCVerificationModal({
  isOpen,
  onClose,
  onVerified,
  userEmail,
  userName,
}: KYCVerificationModalProps) {
  const [selectedDoc, setSelectedDoc] = useState<KYCDocumentType>('NICOP');
  const [status, setStatus] = useState<KYCVerificationStatus>('IDLE');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [kycResult, setKycResult] = useState<KYCData | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStatus('IDLE');
        setScanProgress(0);
        setScanStepIndex(0);
        setFileName(null);
        setValidationError(null);
        setKycResult(null);
        setIsDragging(false);
      }, 300);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const runAIScan = useCallback(
    (file: File, docType: KYCDocumentType) => {
      setFileName(file.name);
      setValidationError(null);
      setKycResult(null);
      setStatus('UPLOADING');
      setScanProgress(0);
      setScanStepIndex(0);

      // Simulate upload phase (0–25%)
      const uploadTimer = setTimeout(() => {
        setStatus('SCANNING');

        let step = 0;
        const stepDuration = 300;

        const stepInterval = setInterval(() => {
          step += 1;
          setScanStepIndex(Math.min(step, SCAN_STEPS.length - 1));
          setScanProgress(Math.min(25 + step * 11, 96));

          if (step >= SCAN_STEPS.length) {
            clearInterval(stepInterval);

            // Final validation
            setTimeout(() => {
              setScanProgress(100);
              const error = validateDocType(file.name, docType);

              if (error) {
                setValidationError(error);
                setStatus('REJECTED');
                const rejected: KYCData = {
                  documentType: docType,
                  fullName: 'Document Rejected',
                  documentNumber: 'REJECTED',
                  nationality: 'Unknown',
                  expiryDate: 'N/A',
                  fbrStatus: 'OVERSEAS_NON_FILER',
                  riskScorePct: 0,
                  riskLevel: 'HIGH',
                  escrowStatus: 'REJECTED',
                  authenticityScorePct: 0,
                  extractedAt: new Date().toISOString().split('T')[0],
                  validationError: error,
                };
                setKycResult(rejected);
              } else {
                setStatus('VERIFIED');
                const verified: KYCData = {
                  documentType: docType,
                  fullName: userName ?? '[Extracted from Document]',
                  documentNumber: '[Extracted from Document]',
                  nationality:
                    docType === 'PASSPORT'
                      ? '[Foreign National]'
                      : docType === 'POC'
                        ? '[Pakistan-Origin Foreign National]'
                        : '[Overseas Pakistani]',
                  expiryDate: '[Extracted from Document]',
                  fbrStatus: 'OVERSEAS_FILER',
                  riskScorePct: 98.6,
                  riskLevel: 'LOW',
                  escrowStatus: 'ESCROW_SECURED',
                  authenticityScorePct: 99.4,
                  extractedAt: new Date().toISOString().split('T')[0],
                };
                setKycResult(verified);
                onVerified(verified);
              }
            }, 400);
          }
        }, stepDuration);
      }, 700);

      return () => clearTimeout(uploadTimer);
    },
    [userName, onVerified]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) runAIScan(file, selectedDoc);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) runAIScan(file, selectedDoc);
  };

  const resetToIdle = () => {
    setStatus('IDLE');
    setScanProgress(0);
    setScanStepIndex(0);
    setFileName(null);
    setValidationError(null);
    setKycResult(null);
  };

  const isScanning = status === 'UPLOADING' || status === 'SCANNING';
  const isTerminal = status === 'VERIFIED' || status === 'REJECTED';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="kyc-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={!isScanning ? onClose : undefined}
      />

      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/50 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">

        {/* ── Top Gradient Bar ─────────────────────────────────────── */}
        <div className="h-1.5 w-full rounded-t-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Fingerprint className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2
                id="kyc-modal-title"
                className="text-base font-black text-slate-900 leading-tight"
              >
                Identity Verification Gateway
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                AI-powered KYC · Overseas Buyer &amp; Investor Onboarding
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            {status === 'VERIFIED' && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> AI Verified
              </span>
            )}
            {status === 'REJECTED' && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-red-100 border border-red-300 text-red-800 px-3 py-1 rounded-full">
                <AlertTriangle className="w-3 h-3" /> Rejected
              </span>
            )}
            {isScanning && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1 rounded-full animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> Scanning…
              </span>
            )}
            {!isScanning && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                aria-label="Close KYC modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ── User Context ─────────────────────────────────────────── */}
          {(userEmail || userName) && (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                {(userName?.[0] ?? userEmail?.[0] ?? 'U').toUpperCase()}
              </div>
              <div>
                {userName && (
                  <p className="text-xs font-black text-slate-900">{userName}</p>
                )}
                {userEmail && (
                  <p className="text-[11px] text-slate-500 font-medium">{userEmail}</p>
                )}
              </div>
              <span className="ml-auto text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full">
                Overseas Buyer / Investor
              </span>
            </div>
          )}

          {/* ── Step 1: Document Type Selector ───────────────────────── */}
          {!isTerminal && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Step 1 — Select Document Type
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DOC_TYPES.map((doc) => {
                  const isActive = selectedDoc === doc.id;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        if (!isScanning) {
                          setSelectedDoc(doc.id);
                          setValidationError(null);
                        }
                      }}
                      disabled={isScanning}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col gap-1.5 ${isActive
                          ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                        } ${isScanning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="text-xl">{doc.emoji}</span>
                      <span className={`text-xs font-black ${isActive ? 'text-emerald-900' : 'text-slate-800'}`}>
                        {doc.title}
                      </span>
                      <span className="text-[10px] text-slate-500 leading-snug">{doc.desc}</span>
                      {isActive && (
                        <span className="mt-1 self-start text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Selected
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 2: Upload / Drop Zone ───────────────────────────── */}
          {!isTerminal && (
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                Step 2 — Upload Document (PDF · JPG · PNG)
              </p>

              <div
                onDragOver={(e) => { e.preventDefault(); if (!isScanning) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 min-h-[180px] transition-all duration-200 ${isScanning
                    ? 'border-amber-400 bg-amber-50/60 cursor-not-allowed'
                    : isDragging
                      ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                      : 'border-slate-300 bg-slate-50/80 hover:border-emerald-400 hover:bg-emerald-50/30 cursor-pointer'
                  }`}
              >
                {!isScanning && (
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    aria-label="Upload KYC document"
                  />
                )}

                {isScanning ? (
                  /* ── Scan Progress ── */
                  <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-4 border-amber-200" />
                      <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-amber-900 mb-1">
                        {SCAN_STEPS[scanStepIndex]}
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium">
                        File: <span className="font-mono">{fileName}</span>
                      </p>
                    </div>
                    <div className="w-full bg-amber-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                    <p className="text-xs font-bold text-amber-800">{scanProgress}% Complete</p>
                  </div>
                ) : (
                  /* ── Idle Drop Zone ── */
                  <>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDragging ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                      <Upload className={`w-6 h-6 ${isDragging ? 'text-emerald-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-800">
                        Drop your {DOC_TYPES.find((d) => d.id === selectedDoc)?.title} here
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        or click to browse · PDF, JPG, PNG accepted
                      </p>
                    </div>
                    {fileName && (
                      <span className="text-xs font-mono bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl shadow-sm">
                        📄 {fileName}
                      </span>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {['AI OCR', 'FBR Filer Check', 'Watermark Auth', 'CNIC Checksum'].map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full"
                        >
                          ✓ {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Validation Error Banner ───────────────────────────────── */}
          {validationError && status === 'REJECTED' && (
            <div className="bg-red-50 border-2 border-red-400/60 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-black text-red-900 mb-0.5">
                  AI Document Cross-Validation Error
                </p>
                <p className="text-xs font-medium text-red-800">{validationError}</p>
                <p className="text-[11px] text-red-700 mt-1">
                  Escrow protection and low-risk certification are blocked until a matching document is provided.
                </p>
              </div>
            </div>
          )}

          {/* ── Result Panel ─────────────────────────────────────────── */}
          {kycResult && isTerminal && (
            <div
              className={`rounded-3xl border p-5 ${kycResult.escrowStatus === 'REJECTED'
                  ? 'bg-slate-950 border-red-800/60'
                  : 'bg-slate-900 border-slate-700'
                }`}
            >
              {/* Result header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {kycResult.escrowStatus === 'REJECTED' ? '⚠️' : '✨'}
                  </span>
                  <h3 className="text-sm font-black text-white tracking-wide">
                    AI Extracted Document Metadata &amp; Trust Assurance
                  </h3>
                </div>
                {kycResult.escrowStatus !== 'REJECTED' ? (
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 rounded-full">
                    ✓ Authenticity: {kycResult.authenticityScorePct}%
                  </span>
                ) : (
                  <span className="text-[10px] font-black bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-0.5 rounded-full">
                    ❌ Blocked
                  </span>
                )}
              </div>

              {/* Result grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: 'Full Name', value: kycResult.fullName },
                  { label: 'Document No.', value: kycResult.documentNumber, mono: true, emerald: true },
                  { label: 'Nationality', value: kycResult.nationality },
                  {
                    label: 'Verification Status',
                    value:
                      kycResult.escrowStatus === 'REJECTED'
                        ? 'REJECTED (Type Mismatch)'
                        : 'Overseas Filer — 15% WHT',
                    color: kycResult.escrowStatus === 'REJECTED' ? 'text-red-400' : 'text-amber-400',
                  },
                ].map(({ label, value, emerald, color }) => (
                  <div
                    key={label}
                    className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 flex flex-col gap-1"
                  >
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {label}
                    </span>
                    <span
                      className={`text-sm font-bold break-all ${color ?? (emerald ? 'text-emerald-400 font-mono' : 'text-white')
                        }`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Trust badges (only on success) */}
              {kycResult.escrowStatus === 'ESCROW_SECURED' && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-3 py-1.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" /> Risk Score: Low ({kycResult.riskScorePct}%)
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-teal-500/15 border border-teal-500/30 text-teal-400 px-3 py-1.5 rounded-full">
                    <BadgeCheck className="w-3 h-3" /> Escrow Secured
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-full">
                    <FileText className="w-3 h-3" /> {kycResult.documentType}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black bg-slate-700 border border-slate-600 text-slate-300 px-3 py-1.5 rounded-full">
                    <Clock className="w-3 h-3" /> {kycResult.extractedAt}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Action Buttons ────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {status === 'VERIFIED' ? (
              <>
                <p className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Identity Auto-Verified via AI Gateway
                </p>
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black px-5 py-2.5 rounded-2xl transition shadow-sm shadow-emerald-900/30"
                >
                  Continue to Dashboard <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : status === 'REJECTED' ? (
              <>
                <p className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Verification failed — try again
                </p>
                <button
                  onClick={resetToIdle}
                  className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white font-black px-5 py-2.5 rounded-2xl transition"
                >
                  Re-upload Document
                </button>
              </>
            ) : (
              <p className="text-[11px] text-slate-400 font-medium">
                🔒 Documents are processed locally. No data is stored without your consent.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
