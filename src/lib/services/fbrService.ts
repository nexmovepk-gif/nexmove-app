import fbrTaxConfig from '@/config/fbrTaxConfig.json'

export type InvestorCategory =
  | 'LOCAL_FILER'
  | 'LOCAL_NON_FILER'
  | 'OVERSEAS_FILER'
  | 'OVERSEAS_NON_FILER'

export interface FBRMetadata {
  version: string
  fiscalYear: string
  title: string
  lastUpdated: string
  authority: string
  description: string
}

export interface RentalTaxCalculation {
  grossAnnualIncome: number
  grossMonthlyIncome: number
  withholdingTaxPct: number
  annualTaxDeduction: number
  taxLabel: string
  annualMgmtFee: number
  netAnnualIncome: number
  netMonthlyIncome: number
  netYieldPct: number
}

export interface CGTCalculation {
  holdingPeriodYears: number
  cgtRatePct: number
  projectedAppreciationPct: number
  estimatedCapitalGain: number
  estimatedCGTTax: number
  netCapitalGain: number
}

export interface PropertyAdvanceTaxCalculation {
  propertyPrice: number
  isPurchase: boolean
  status: 'FILER' | 'NON_FILER' | 'LATE_FILER'
  advanceTaxPct: number
  advanceTaxAmount: number
}

export interface ATLVerificationResult {
  success: boolean
  cnicOrNtn: string
  isFiler: boolean
  status: 'FILER' | 'NON_FILER'
  category: InvestorCategory
  name?: string
  ntn?: string
  taxOffice?: string
  message: string
  checkedAt: string
}

/**
 * Returns the centralized raw FBR tax configuration object.
 */
export function getFBRTaxConfig() {
  return fbrTaxConfig
}

/**
 * Returns FBR versioning and fiscal policy metadata.
 */
export function getFBRMetadata(): FBRMetadata {
  return fbrTaxConfig.metadata
}

/**
 * Retrieves the withholding tax rate percentage and descriptive label dynamically for an investor category.
 */
export function getRentalWithholdingTaxRate(category: InvestorCategory): {
  ratePct: number
  label: string
} {
  const rates = fbrTaxConfig.rentalIncomeTax
  switch (category) {
    case 'LOCAL_FILER':
      return {
        ratePct: rates.localFilerRatePct,
        label: `Local Filer Withholding Tax (${rates.localFilerRatePct}%)`,
      }
    case 'LOCAL_NON_FILER':
      return {
        ratePct: rates.localNonFilerRatePct,
        label: `Local Non-Filer Withholding Tax (${rates.localNonFilerRatePct}%)`,
      }
    case 'OVERSEAS_FILER':
      return {
        ratePct: rates.overseasFilerRatePct,
        label: `Overseas Filer Withholding Tax (${rates.overseasFilerRatePct}%)`,
      }
    case 'OVERSEAS_NON_FILER':
      return {
        ratePct: rates.overseasNonFilerRatePct,
        label: `Overseas Non-Filer Withholding Tax (${rates.overseasNonFilerRatePct}%)`,
      }
    default:
      return {
        ratePct: rates.overseasFilerRatePct,
        label: `FBR Filer Tax Rate (${rates.overseasFilerRatePct}%)`,
      }
  }
}

/**
 * Computes the Capital Gains Tax (CGT) rate percentage dynamically based on holding duration and filer status.
 */
export function getCGTRate(
  holdingPeriodYears: number,
  category: InvestorCategory
): number {
  const cgtConfig = fbrTaxConfig.capitalGainsTax
  const clampedYears = Math.max(1, Math.min(4, Math.floor(holdingPeriodYears)))

  const scaleEntry = cgtConfig.baseSlidingScale.find(
    (item) => item.holdingPeriodYears === clampedYears
  )
  let baseRate = scaleEntry ? scaleEntry.filerRatePct : 0

  if (category.includes('NON_FILER')) {
    baseRate = baseRate * cgtConfig.nonFilerMultiplier
  }

  return baseRate
}

/**
 * Calculates rental income financial waterfall (gross income, FBR WHT deduction, management fees, net yield).
 */
export function calculateRentalTax(
  propertyValuation: number,
  expectedYieldPct: number,
  category: InvestorCategory,
  mgmtFeePct: number = 5.0
): RentalTaxCalculation {
  const grossAnnualIncome = (propertyValuation * expectedYieldPct) / 100
  const grossMonthlyIncome = grossAnnualIncome / 12

  const { ratePct: withholdingTaxPct, label: taxLabel } = getRentalWithholdingTaxRate(category)

  const annualTaxDeduction = (grossAnnualIncome * withholdingTaxPct) / 100
  const annualMgmtFee = (grossAnnualIncome * mgmtFeePct) / 100
  const netAnnualIncome = grossAnnualIncome - annualTaxDeduction - annualMgmtFee
  const netMonthlyIncome = netAnnualIncome / 12
  const netYieldPct = propertyValuation > 0 ? (netAnnualIncome / propertyValuation) * 100 : 0

  return {
    grossAnnualIncome,
    grossMonthlyIncome,
    withholdingTaxPct,
    annualTaxDeduction,
    taxLabel,
    annualMgmtFee,
    netAnnualIncome,
    netMonthlyIncome,
    netYieldPct,
  }
}

/**
 * Calculates projected liquidation Capital Gains Tax (CGT) and net realized gain.
 */
export function calculateCGT(
  propertyValuation: number,
  holdingPeriodYears: number,
  category: InvestorCategory
): CGTCalculation {
  const cgtRatePct = getCGTRate(holdingPeriodYears, category)
  const projectedAppreciationPct = 10 * holdingPeriodYears
  const estimatedCapitalGain = (propertyValuation * projectedAppreciationPct) / 100
  const estimatedCGTTax = (estimatedCapitalGain * cgtRatePct) / 100
  const netCapitalGain = estimatedCapitalGain - estimatedCGTTax

  return {
    holdingPeriodYears,
    cgtRatePct,
    projectedAppreciationPct,
    estimatedCapitalGain,
    estimatedCGTTax,
    netCapitalGain,
  }
}

/**
 * Calculates Advance Tax on Property Purchase or Sale dynamically.
 */
export function calculatePropertyAdvanceTax(
  propertyPrice: number,
  isPurchase: boolean,
  status: 'FILER' | 'NON_FILER' | 'LATE_FILER'
): PropertyAdvanceTaxCalculation {
  const advanceConfig = fbrTaxConfig.advanceTaxProperty
  const targetType = isPurchase ? advanceConfig.purchase : advanceConfig.sale

  let advanceTaxPct = targetType.filerRatePct
  if (status === 'NON_FILER') {
    advanceTaxPct = targetType.nonFilerRatePct
  } else if (status === 'LATE_FILER') {
    advanceTaxPct = targetType.lateFilerRatePct
  }

  const advanceTaxAmount = (propertyPrice * advanceTaxPct) / 100

  return {
    propertyPrice,
    isPurchase,
    status,
    advanceTaxPct,
    advanceTaxAmount,
  }
}

/**
 * Mock simulator hook for official FBR Active Taxpayer List (ATL) API verification by CNIC or NTN.
 */
export async function verifyFBRActiveTaxpayerStatus(
  cnicOrNtn: string
): Promise<ATLVerificationResult> {
  // Simulate network latency (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300))

  const sanitizedInput = cnicOrNtn.trim()
  const checkedAt = new Date().toISOString()

  if (!sanitizedInput) {
    return {
      success: false,
      cnicOrNtn: '',
      isFiler: false,
      status: 'NON_FILER',
      category: 'LOCAL_NON_FILER',
      message: 'Please provide a valid CNIC (e.g. 12345-6789012-3) or NTN number.',
      checkedAt,
    }
  }

  // Check mock DB for exact match
  const matchedRecord = fbrTaxConfig.atlVerificationMockDb.find(
    (item) =>
      item.identifier === sanitizedInput ||
      item.ntn === sanitizedInput ||
      item.identifier.replace(/-/g, '') === sanitizedInput.replace(/-/g, '')
  )

  if (matchedRecord) {
    const isFiler = matchedRecord.status === 'FILER'
    return {
      success: true,
      cnicOrNtn: sanitizedInput,
      isFiler,
      status: matchedRecord.status as 'FILER' | 'NON_FILER',
      category: matchedRecord.category as InvestorCategory,
      name: matchedRecord.name,
      ntn: matchedRecord.ntn,
      taxOffice: matchedRecord.taxOffice,
      message: isFiler
        ? `Verified Active Taxpayer: ${matchedRecord.name} (NTN: ${matchedRecord.ntn}) on FBR ATL Roll.`
        : `Record found for ${matchedRecord.name}. Status: Inactive / Non-Filer. 30% withholding tax applies.`,
      checkedAt,
    }
  }

  // Fallback heuristic verification for test inputs:
  // If CNIC digit sum or last digit is odd => Filer, even => Non-Filer
  const digitsOnly = sanitizedInput.replace(/\D/g, '')
  const lastDigit = digitsOnly.length > 0 ? parseInt(digitsOnly[digitsOnly.length - 1], 10) : 0
  const isFiler = lastDigit % 2 !== 0

  const status: 'FILER' | 'NON_FILER' = isFiler ? 'FILER' : 'NON_FILER'
  const category: InvestorCategory = isFiler ? 'LOCAL_FILER' : 'LOCAL_NON_FILER'

  return {
    success: true,
    cnicOrNtn: sanitizedInput,
    isFiler,
    status,
    category,
    name: isFiler ? 'Verified Investor (ATL Active)' : 'Investor (FBR Non-Filer)',
    ntn: digitsOnly ? `${digitsOnly.slice(0, 7)}-${digitsOnly.slice(7, 8) || '0'}` : 'NTN-PENDING',
    taxOffice: 'FBR Portal Auto-Verification',
    message: isFiler
      ? 'CNIC verified on Active Taxpayer List (ATL). Eligible for 15% Filer Tax rate.'
      : 'CNIC status: Non-Filer on FBR database. Standard 30% Non-Filer WHT applies.',
    checkedAt,
  }
}
