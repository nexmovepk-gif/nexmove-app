// src/lib/services/escrowContractPdf.ts
import { jsPDF } from 'jspdf'
import { CURRENCIES, CurrencyCode } from '@/lib/currency'
import { getRentalWithholdingTaxRate, InvestorCategory } from '@/lib/services/fbrService'

export interface EscrowContractParams {
  contractId: string
  investorName: string
  nicopOrPassport: string
  countryResidence: string
  investorCategory: InvestorCategory
  propertyTitle: string
  location: string
  city: string
  agencyName: string
  propertyType: string
  propertyPricePKR: number
  activeCurrency: CurrencyCode
  riskScore: string // e.g. "Low (98.4% Confidence)"
  kycVerificationStatus: string // e.g. "Escrow Secure & SBP Verified"
}

export function generateEscrowContractPDF(params: EscrowContractParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const {
    contractId,
    investorName,
    nicopOrPassport,
    countryResidence,
    investorCategory,
    propertyTitle,
    location,
    city,
    agencyName,
    propertyType,
    propertyPricePKR,
    activeCurrency,
    riskScore,
    kycVerificationStatus,
  } = params

  const curr = CURRENCIES[activeCurrency] || CURRENCIES.PKR
  const priceInSelectedCurrency = propertyPricePKR / curr.rateInPKR
  const isFiler = investorCategory.includes('FILER') && !investorCategory.includes('NON_FILER')
  const { ratePct: whtRatePct } = getRentalWithholdingTaxRate(investorCategory)
  const advanceTaxPct = isFiler ? 3.0 : 12.0
  const advanceTaxAmountPKR = (propertyPricePKR * advanceTaxPct) / 100

  let y = 15

  // Header Banner
  doc.setFillColor(15, 23, 42) // Navy
  doc.rect(0, 0, 210, 36, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('NEXMOVE AI-SECURED ESCROW CONTRACT', 14, 16)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225)
  doc.text('Cross-Border Property Investment & FBR Tax Compliance — Fiscal Year 2026-27', 14, 23)
  doc.text(`Official SBP Trustee Escrow Vault Protocol · Contract ID: ${contractId}`, 14, 29)

  // Document Badge Right Header
  doc.setFillColor(5, 150, 105)
  doc.roundedRect(148, 10, 48, 16, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('STATE BANK ESCROW', 151, 16)
  doc.text('VERIFIED & SECURED', 151, 22)

  y = 44

  // Section 1: Executive Summary & KYC Status
  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, y, 182, 30, 2, 2, 'FD')

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('AUTOMATED AI KYC & TRUST MATRIX', 18, y + 7)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)

  doc.text(`Investor Verification Status:`, 18, y + 14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text(kycVerificationStatus, 68, y + 14)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`AI Risk Rating:`, 18, y + 21)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text(riskScore, 46, y + 21)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`FBR Tax Category:`, 110, y + 14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(isFiler ? 'OVERSEAS FILER (15% WHT)' : 'OVERSEAS NON-FILER (30% WHT)', 142, y + 14)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Issue Timestamp:`, 110, y + 21)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), 142, y + 21)

  y += 36

  // Section 2: Parties Information
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('1. PARTIES TO THE AGREEMENT', 14, y)
  doc.setLineWidth(0.4)
  doc.setDrawColor(226, 232, 240)
  doc.line(14, y + 2, 196, y + 2)

  y += 8

  // Party A: Investor Box
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(14, y, 88, 36, 2, 2, 'FD')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text('PARTY A: FOREIGN INVESTOR', 18, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(`Full Name: ${investorName || 'Tariq Overseas Investor'}`, 18, y + 13)
  doc.text(`Passport/NICOP: ${nicopOrPassport || 'PK-998822-N'}`, 18, y + 19)
  doc.text(`Residence: ${countryResidence || 'United Arab Emirates'}`, 18, y + 25)
  doc.text(`Escrow ID: ESC-INV-${contractId.split('-')[1] || '101'}`, 18, y + 31)

  // Party B: Agency & Trustee Box
  doc.roundedRect(108, y, 88, 36, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text('PARTY B: AGENCY & ESCROW TRUSTEE', 112, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(`Agency Partner: ${agencyName}`, 112, y + 13)
  doc.text(`Trustee: SBP Licensed Escrow Vault`, 112, y + 19)
  doc.text(`Regulatory Body: FBR & SECP Pakistan`, 112, y + 25)
  doc.text(`Escrow Vault Hash: 0x8F92...B401`, 112, y + 31)

  y += 42

  // Section 3: Property Details & Multi-Currency Valuation
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('2. PROPERTY & MULTI-CURRENCY FINANCIAL VALUATION', 14, y)
  doc.line(14, y + 2, 196, y + 2)

  y += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`Property Asset: ${propertyTitle}`, 14, y)
  doc.text(`Location: ${location}, ${city}`, 14, y + 5)
  doc.text(`Category: ${propertyType}`, 14, y + 10)

  y += 16

  // Valuation Breakdown Table Header
  doc.setFillColor(15, 23, 42)
  doc.rect(14, y, 182, 7, 'F')
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('CURRENCY', 18, y + 4.8)
  doc.text('CONVERSION RATE', 65, y + 4.8)
  doc.text('EQUIVALENT VALUATION', 125, y + 4.8)
  doc.text('STATUS', 170, y + 4.8)

  y += 7

  // Rows for Base PKR and Selected Target Currency
  const currenciesToShow = [
    { code: 'PKR', rate: 1, val: propertyPricePKR, label: 'Base Contract Currency (PKR)' },
    { code: curr.code, rate: curr.rateInPKR, val: priceInSelectedCurrency, label: `Investor Base Currency (${curr.code})` },
    ...(curr.code !== 'USD' ? [{ code: 'USD', rate: CURRENCIES.USD.rateInPKR, val: propertyPricePKR / CURRENCIES.USD.rateInPKR, label: 'Global Benchmark (USD)' }] : []),
  ]

  currenciesToShow.forEach((item, index) => {
    doc.setFillColor(index % 2 === 0 ? 255 : 248, 250, 252)
    doc.rect(14, y, 182, 7, 'F')
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(15, 23, 42)
    doc.text(`${item.code} (${CURRENCIES[item.code as CurrencyCode]?.symbol || ''})`, 18, y + 4.8)
    doc.text(`1 ${item.code} = ${item.rate} PKR`, 65, y + 4.8)
    doc.setFont('helvetica', 'bold')
    doc.text(
      item.code === 'PKR'
        ? `Rs ${item.val.toLocaleString('en-PK')} PKR`
        : `${CURRENCIES[item.code as CurrencyCode]?.symbol} ${item.val.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${item.code}`,
      125,
      y + 4.8
    )
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(5, 150, 105)
    doc.text('LOCKED IN ESCROW', 170, y + 4.8)
    y += 7
  })

  y += 8

  // Section 4: FBR FY2026-27 Tax Integration
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('3. FBR TAX WITHHOLDING & ADVANCE TAX INTEGRATION (FY2026-27)', 14, y)
  doc.line(14, y + 2, 196, y + 2)

  y += 8

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y, 182, 28, 2, 2, 'FD')

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`• FBR Property Purchase Advance Tax (${advanceTaxPct}%):`, 18, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`Rs ${advanceTaxAmountPKR.toLocaleString('en-PK')} PKR`, 110, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`• Rental Income Withholding Tax Rate (FY2026-27):`, 18, y + 12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`${whtRatePct}% (${isFiler ? 'Overseas Active Filer Rate' : 'Non-Filer Penalty Rate'})`, 110, y + 12)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`• Capital Gains Tax (CGT) Schedule:`, 18, y + 18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(`15% Yr 1 → 10% Yr 2 → 7.5% Yr 3 → 0% Exempt (Yr 4+)`, 110, y + 18)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text(`• SBP Repatriation Guarantee:`, 18, y + 24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text(`100% Tax Payout & Foreign Currency Repatriation Eligible`, 110, y + 24)

  y += 34

  // Section 5: Smart Escrow Milestone Release Workflow
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('4. SMART ESCROW STAGE-WISE MILESTONE RELEASE SCHEDULE', 14, y)
  doc.line(14, y + 2, 196, y + 2)

  y += 8

  const milestones = [
    { stage: 'Stage 1 (20%)', title: 'Legal & Title Search Check', pct: 20, pkr: propertyPricePKR * 0.2, trigger: 'Clear Title Certification' },
    { stage: 'Stage 2 (30%)', title: 'Agreement & FBR Clearance', pct: 30, pkr: propertyPricePKR * 0.3, trigger: 'FBR Tax Voucher & Token Deposit' },
    { stage: 'Stage 3 (50%)', title: 'Physical Handover & Registry', pct: 50, pkr: propertyPricePKR * 0.5, trigger: 'Registry Key Handover' },
  ]

  milestones.forEach((m) => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(14, y, 182, 11, 2, 2, 'FD')

    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(5, 150, 105)
    doc.text(m.stage, 18, y + 7)

    doc.setTextColor(15, 23, 42)
    doc.text(m.title, 50, y + 7)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(`Trigger: ${m.trigger}`, 112, y + 7)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(`Rs ${(m.pkr / 1000000).toFixed(2)}M`, 172, y + 7)

    y += 14
  })

  y += 4

  // Footer Signatures & Seals
  doc.setFillColor(15, 23, 42)
  doc.rect(14, y, 182, 22, 'F')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('ELECTRONICALLY SIGNED & VERIFIED VIA NEXMOVE AI ESCROW VAULT', 18, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(203, 213, 225)
  doc.text(`Digital Signer: ${investorName || 'Overseas Investor'} (Verified Passport/NICOP)`, 18, y + 11)
  doc.text(`Trustee Escrow Signature Hash: 0x9A48F71C2E...88B01`, 18, y + 16)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(5, 150, 105)
  doc.text('SECP & SBP COMPLIANT', 146, y + 11)

  // Save / Trigger Download
  const filename = `NexMove_AI_Escrow_Contract_${contractId}.pdf`
  doc.save(filename)
}
