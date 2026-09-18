'use client'
// src/components/deal-room/DealWhatsAppModal.tsx
// WhatsApp Notification Dispatcher & Composer for Deal Room Stakeholders

import React, { useState } from 'react'
import {
  MessageSquare,
  Share2,
  X,
  Check,
  Send,
  ExternalLink,
  Copy,
  Sparkles,
  Smartphone,
  User,
  Building2,
  RefreshCw,
  AlertCircle
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
  milestones: Milestone[]
}

interface Props {
  deal: DealData
  onClose: () => void
}

export default function DealWhatsAppModal({ deal, onClose }: Props) {
  const [recipientRole, setRecipientRole] = useState<'BUYER' | 'SELLER' | 'AGENCY' | 'CUSTOM'>('BUYER')
  const [phone, setPhone] = useState('03001234567')
  const [templateType, setTemplateType] = useState<'AUTO' | 'CLOSED' | 'M1' | 'M2' | 'M3' | 'M4'>('AUTO')
  const [copied, setCopied] = useState(false)
  const [isSendingApi, setIsSendingApi] = useState(false)
  const [apiFeedback, setApiFeedback] = useState<{ success: boolean; message: string } | null>(null)

  const price = Number(deal.totalAgreedPrice) || 35000000
  const isClosed = deal.status === 'CLOSED' || deal.milestones?.every((m) => m.status === 'COMPLETED')
  const currentStep = deal.currentMilestone || 1

  // Generate customized WhatsApp text based on template
  const generateMessage = () => {
    const recipientName =
      recipientRole === 'BUYER'
        ? deal.buyerName
        : recipientRole === 'SELLER'
        ? deal.sellerName
        : recipientRole === 'AGENCY'
        ? deal.agencyName
        : 'Respected Stakeholder'

    const dealLink = typeof window !== 'undefined'
      ? `${window.location.origin}/deal-room/${deal.id}`
      : `https://nexmove.pk/deal-room/${deal.id}`

    // 1. Full Closed Template
    if (templateType === 'CLOSED' || (templateType === 'AUTO' && isClosed)) {
      return `🏢 *NEXMOVE TRI-PARTY CLOSING DESK*
══════════════════════════
Dear *${recipientName}*,

🎉 *DEAL CLOSED & SETTLED!*
We are pleased to notify you that all 4 milestones for your property deal have been verified and finalized.

🔖 *Deal Reference:* #${deal.dealNumber}
💰 *Total Agreed Value:* PKR ${price.toLocaleString('en-PK')}
🤝 *Parties Involved:*
• *Buyer:* ${deal.buyerName}
• *Seller:* ${deal.sellerName}
• *Facilitating Agency:* ${deal.agencyName}

✅ *Milestones Completed:*
1. 10% Bayana Escrow Locked ✓
2. Society NDC Clearance Cleared ✓
3. FBR Sec 236C / 236K CPRs Paid ✓
4. Biometric Handover & Registry Transferred ✓

📄 *Download Printable Closing Certificate & Slip:*
${dealLink}

══════════════════════════
_Powered by NexMove Digital Closing Escrow Engine_
_Protected under SBP Escrow & Housing Authority Standard_`
    }

    // 2. Specific Milestone 1 Template
    if (templateType === 'M1' || (templateType === 'AUTO' && currentStep === 1)) {
      return `🏢 *NEXMOVE DEAL ROOM UPDATE*
══════════════════════════
Dear *${recipientName}*,

🔒 *Milestone 1 — Bayana Escrow Deposited*
The 10% Earnest Money (Bayana) for Deal *#${deal.dealNumber}* has been logged into the secure Escrow Locker.

💰 *Transaction Value:* PKR ${price.toLocaleString('en-PK')}
💵 *Estimated Bayana:* PKR ${(price * 0.1).toLocaleString('en-PK')}
🏢 *Agency:* ${deal.agencyName}

Next Step: Society NDC Clearance application filing.

🌐 *Track Real-Time Status:*
${dealLink}`
    }

    // 3. Milestone 2 Template
    if (templateType === 'M2' || (templateType === 'AUTO' && currentStep === 2)) {
      return `🏢 *NEXMOVE DEAL ROOM UPDATE*
══════════════════════════
Dear *${recipientName}*,

📜 *Milestone 2 — DHA / Society NDC Cleared*
The No Demand Certificate (NDC) for Deal *#${deal.dealNumber}* has been verified. All municipal & development dues are cleared.

🔖 *Deal Ref:* #${deal.dealNumber}
Next Step: Generation of 17-digit FBR PSID Challans (Sec 236K & 236C).

🌐 *Review Documents in Secure Vault:*
${dealLink}`
    }

    // 4. Milestone 3 Template
    if (templateType === 'M3' || (templateType === 'AUTO' && currentStep === 3)) {
      return `🏢 *NEXMOVE DEAL ROOM UPDATE*
══════════════════════════
Dear *${recipientName}*,

🧾 *Milestone 3 — FBR Tax Challans & CPRs Verified*
Advance tax payments under Sections 236C (Seller) and 236K (Buyer) for Deal *#${deal.dealNumber}* are verified on FBR IRIS.

Next Step: Final Housing Authority biometric thumbprint & registry handover.

🌐 *View CPR Records:*
${dealLink}`
    }

    // 5. Milestone 4 Template
    return `🏢 *NEXMOVE DEAL ROOM UPDATE*
══════════════════════════
Dear *${recipientName}*,

🏛️ *Milestone 4 — Final Transfer Desk & Biometric Scheduled*
The final transfer appointment has been scheduled at the Housing Authority Transfer Counter for Deal *#${deal.dealNumber}*.

Please ensure you bring original CNIC, allotment letters, and biometric confirmation.

🌐 *View Appointment Details & Closing Slip:*
${dealLink}`
  }

  const message = generateMessage()

  // Format phone to clean international format
  const getCleanPhone = () => {
    let clean = phone.replace(/\D/g, '')
    if (clean.startsWith('0')) {
      clean = '92' + clean.substring(1)
    }
    return clean
  }

  const handleOpenWhatsApp = () => {
    const cleanNumber = getCleanPhone()
    const encoded = encodeURIComponent(message)
    const url = cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`
    window.open(url, '_blank')
  }

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (_e) {
      alert('Unable to copy text directly.')
    }
  }

  const handleSendViaCloudApi = async () => {
    const cleanNumber = getCleanPhone()
    if (!cleanNumber) {
      alert('Please enter a valid phone number')
      return
    }

    setIsSendingApi(true)
    setApiFeedback(null)
    try {
      const res = await fetch('/api/deal-room/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealRoomId: deal.id,
          recipientPhone: cleanNumber,
          recipientRole,
          messageText: message,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setApiFeedback({
          success: true,
          message: `Notification successfully sent to +${cleanNumber} via WhatsApp Cloud API!`,
        })
      } else {
        setApiFeedback({
          success: false,
          message: `${data.message || data.error}. Click "Open in WhatsApp Web" below to dispatch immediately.`,
        })
      }
    } catch (_err) {
      setApiFeedback({
        success: false,
        message: 'Could not connect to Cloud API. You can send directly using WhatsApp Web.',
      })
    } finally {
      setIsSendingApi(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Send WhatsApp Notification
                <Sparkles className="w-4 h-4 text-amber-300" />
              </h3>
              <p className="text-[11px] text-emerald-200">
                Official deal update for #{deal.dealNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs text-stone-700 max-h-[80vh] overflow-y-auto">
          {/* Recipient Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1.5">
              Select Recipient Party:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRecipientRole('BUYER')
                  setPhone('03001234567')
                }}
                className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition ${
                  recipientRole === 'BUYER'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
                    : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                }`}
              >
                <User className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
                Buyer
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecipientRole('SELLER')
                  setPhone('03219876543')
                }}
                className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition ${
                  recipientRole === 'SELLER'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
                    : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                }`}
              >
                <User className="w-3.5 h-3.5 mx-auto mb-1 text-amber-600" />
                Seller
              </button>

              <button
                type="button"
                onClick={() => {
                  setRecipientRole('AGENCY')
                  setPhone('03335558888')
                }}
                className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition ${
                  recipientRole === 'AGENCY'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
                    : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
                Agency
              </button>

              <button
                type="button"
                onClick={() => setRecipientRole('CUSTOM')}
                className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition ${
                  recipientRole === 'CUSTOM'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30'
                    : 'border-stone-200 bg-stone-50 hover:bg-white text-stone-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 mx-auto mb-1 text-stone-600" />
                Custom
              </button>
            </div>
          </div>

          {/* Phone Number Input */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1">
              WhatsApp Phone Number (with Country Code):
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-stone-400 font-mono text-xs">
                🇵🇰 +92
              </span>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300 1234567"
                className="w-full pl-16 pr-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
            <span className="text-[10px] text-stone-400 mt-1 block">
              Recipient: {recipientRole === 'BUYER' ? deal.buyerName : recipientRole === 'SELLER' ? deal.sellerName : deal.agencyName}
            </span>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-900 mb-1">
              Message Template:
            </label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
            >
              <option value="AUTO">✨ Auto-Detect Current Deal Stage</option>
              <option value="CLOSED">🎉 Final Deal Closing & Settlement Certificate</option>
              <option value="M1">🔒 Milestone 1: Bayana / Escrow Deposited</option>
              <option value="M2">📜 Milestone 2: DHA/Society NDC Cleared</option>
              <option value="M3">🧾 Milestone 3: FBR Tax CPR Verified</option>
              <option value="M4">🏛️ Milestone 4: Biometric Transfer Desk Scheduled</option>
            </select>
          </div>

          {/* WhatsApp Chat Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                Live Message Preview:
              </span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>

            <div className="p-4 bg-[#ECE5DD] rounded-2xl border border-stone-300 shadow-inner">
              <div className="bg-[#DCF8C6] p-3.5 rounded-2xl rounded-tr-none shadow-sm text-stone-900 font-sans text-xs whitespace-pre-line leading-relaxed border border-emerald-200/50">
                {message}
                <div className="text-right text-[10px] text-stone-500 mt-2 font-mono">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>

          {/* API Feedback Alert */}
          {apiFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                apiFeedback.success
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              {apiFeedback.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{apiFeedback.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleSendViaCloudApi}
            disabled={isSendingApi}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            {isSendingApi ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                Send via Cloud API
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-900/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in WhatsApp Web / App
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
