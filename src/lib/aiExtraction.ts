// src/lib/aiExtraction.ts
// Mock AI Document & Image Extraction Service
// Simulates real AI extraction (Gemini Vision / GPT-4o) using filename/type heuristics.
// Replace the `extractFromMetadata` body with actual AI API calls in future phases.

export interface AIExtractionInput {
  fileName: string
  fileType: string  // MIME type e.g. 'image/jpeg', 'application/pdf'
  fileSizeBytes: number
}

export interface AIExtractionResult {
  success: boolean
  bedrooms: number | null
  bathrooms: number | null
  areaSqFt: number | null
  locationHint: string | null
  propertyType: 'HOUSE' | 'APARTMENT' | 'PLOT' | 'COMMERCIAL' | 'VILLA' | null
  confidence: number  // 0.0 – 1.0
  rawData: Record<string, unknown>
  message: string
}

// ─── Keyword Heuristics ───────────────────────────────────────────────────────

const BED_PATTERNS: [RegExp, number][] = [
  [/\b(studio|1br|1\s*bed)\b/i, 1],
  [/\b(2br|2\s*bed)\b/i, 2],
  [/\b(3br|3\s*bed)\b/i, 3],
  [/\b(4br|4\s*bed)\b/i, 4],
  [/\b(5br|5\s*bed)\b/i, 5],
]

const AREA_PATTERNS: [RegExp, number][] = [
  [/(\d{3,5})\s*(sqft|sq\.?ft|square)/i, 0],
  [/(\d+)\s*marla/i, 1],   // 1 marla ≈ 272 sqft
  [/(\d+)\s*kanal/i, 2],   // 1 kanal ≈ 4356 sqft
]

const TYPE_KEYWORDS: [RegExp, AIExtractionResult['propertyType']][] = [
  [/\b(villa|farmhouse)\b/i, 'VILLA'],
  [/\b(apartment|flat|studio)\b/i, 'APARTMENT'],
  [/\b(plot|land|open)\b/i, 'PLOT'],
  [/\b(commercial|office|shop|warehouse)\b/i, 'COMMERCIAL'],
  [/\b(house|home|bungalow|kothi)\b/i, 'HOUSE'],
]

const CITY_KEYWORDS: [RegExp, string][] = [
  [/lahore/i, 'Lahore'],
  [/karachi/i, 'Karachi'],
  [/islamabad/i, 'Islamabad'],
  [/rawalpindi|pindi/i, 'Rawalpindi'],
  [/faisalabad/i, 'Faisalabad'],
  [/bahria/i, 'Bahria Town'],
  [/dha/i, 'DHA'],
  [/gulberg/i, 'Gulberg'],
]

function parseArea(name: string): number | null {
  for (const [pattern, multiplier] of AREA_PATTERNS) {
    const match = name.match(pattern)
    if (match) {
      const num = parseFloat(match[1])
      if (multiplier === 0) return num                // sqft direct
      if (multiplier === 1) return Math.round(num * 272)   // marla → sqft
      if (multiplier === 2) return Math.round(num * 4356)  // kanal → sqft
    }
  }
  return null
}

function parseBedrooms(name: string): number | null {
  for (const [pattern, count] of BED_PATTERNS) {
    if (pattern.test(name)) return count
  }
  return null
}

function parsePropertyType(name: string): AIExtractionResult['propertyType'] {
  for (const [pattern, type] of TYPE_KEYWORDS) {
    if (pattern.test(name)) return type
  }
  return null
}

function parseLocation(name: string): string | null {
  for (const [pattern, city] of CITY_KEYWORDS) {
    if (pattern.test(name)) return city
  }
  return null
}

function calculateConfidence(result: Partial<AIExtractionResult>): number {
  let score = 0
  if (result.bedrooms != null) score += 0.25
  if (result.areaSqFt != null) score += 0.30
  if (result.locationHint != null) score += 0.20
  if (result.propertyType != null) score += 0.25
  return Math.min(score, 1.0)
}

// ─── Main Extraction Function ─────────────────────────────────────────────────

export function extractFromMetadata(input: AIExtractionInput): AIExtractionResult {
  const searchText = input.fileName.replace(/[_\-\.]/g, ' ')

  const bedrooms = parseBedrooms(searchText)
  const areaSqFt = parseArea(searchText)
  const locationHint = parseLocation(searchText)
  const propertyType = parsePropertyType(searchText)
  const bathrooms = bedrooms ? Math.max(1, Math.floor(bedrooms * 0.7)) : null

  const partial = { bedrooms, areaSqFt, locationHint, propertyType, bathrooms }
  const confidence = calculateConfidence(partial)

  const rawData: Record<string, unknown> = {
    inputFileName: input.fileName,
    inputFileType: input.fileType,
    inputFileSizeBytes: input.fileSizeBytes,
    parsedAt: new Date().toISOString(),
    heuristicsEngine: 'NexMove-AI-Mock-v1',
  }

  const anyExtracted = confidence > 0

  return {
    success: true,
    bedrooms,
    bathrooms,
    areaSqFt,
    locationHint,
    propertyType,
    confidence,
    rawData,
    message: anyExtracted
      ? `AI extracted ${Math.round(confidence * 100)}% of fields. Please verify highlighted data before submitting.`
      : 'No data could be extracted from the file name. Please fill in details manually.',
  }
}
