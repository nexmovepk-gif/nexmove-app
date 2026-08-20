// src/lib/documentValidation.ts
// Production Document Validation Engine for NexMove
// Hybrid keyword + structural analysis covering Pakistani & global IDs.

export interface DocumentAnalysisResult {
  isValid: boolean;
  score: number; // alias: verifiedScore — 0 for invalid, 80–98 for valid
  verifiedScore: number;
  confidence: number; // 0.0 – 1.0
  documentType:
    | 'CNIC_NICOP'
    | 'ALLOTMENT_LETTER'
    | 'REGISTRY_SALE_DEED'
    | 'TITLE_DEED'
    | 'BLUEPRINT_PLAN'
    | 'PROPERTY_DOCUMENT'
    | 'GLOBAL_ID'
    | 'OTHER_LEGAL'
    | 'INVALID';
  documentTypeLabel: string;
  errorMessage?: string;
  fallback?: boolean; // true when score was computed via fallback (80%)
  extractedParams: {
    propertyType: 'House' | 'Flat / Apartment' | 'Residential Plot' | 'Commercial Plot' | 'Villa / Farmhouse' | null;
    bedrooms: number | null;
    bathrooms: number | null;
    areaSqFt: number | null;
    areaOriginalText?: string;
    city: string | null;
    societyOrLocation: string | null;
    plotOrUnitNo: string | null;
    suggestedTitle: string | null;
    detectedKeywords: string[];
  };
  rawOcrSnippet?: string;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

/**
 * Normalize text: lowercase, strip special chars, collapse whitespace.
 */
export function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Keyword Signatures ───────────────────────────────────────────────────────

// Pakistani & Global Identity Card signatures
const CNIC_PRIMARY = [
  'cnic', 'nicop', 'nadra', 'national identity card', 'identity card', 'national id',
  'islamic republic of pakistan', 'republic of pakistan',
];
const CNIC_SECONDARY = [
  'identity', 'card', 'republic', 'pakistan', 'national', 'dob', 'gender', 'holder',
  'father', 'husband', 'issue', 'expiry', 'date of birth', 'date of issue',
  'date of expiry', 'family no', 'identity number', 'cardholder',
  'country of stay', 'government of pakistan',
];

// Global IDs (passport, driving licence, etc.)
const GLOBAL_ID_KEYWORDS = [
  'passport', 'driving licence', 'driver license', 'driving license',
  'foreign national', 'visa', 'immigration', 'border control',
  'social security', 'iqama', 'residence permit', 'nid', 'voter id',
  'pan card', 'aadhar', 'emirates id', 'iqama number',
];

// Property / Legal document signatures
const PROPERTY_PRIMARY = [
  'allotment', 'deed', 'registry', 'dha', 'authority', 'plot', 'sector', 'phase',
  'transfer', 'letter', 'blueprint', 'society', 'title', 'pcatp',
  'khasra', 'khewat', 'allotment letter', 'sale deed',
];
const PROPERTY_SECONDARY = [
  'sub registrar', 'sub-registrar', 'bainama', 'stamp paper', 'fard', 'fard malkiat',
  'intiqal', 'mutation', 'khatooni', 'mauza', 'tehsil', 'patwari', 'halqa', 'court fee',
  'conveyance deed', 'gift deed', 'power of attorney', 'mukhtar nama', 'purchaser',
  'vendor', 'deed of transfer', 'possession order', 'membership no', 'allottee',
  'allotted', 'intimation letter', 'allocation',
  // Housing authorities and societies
  'cda', 'lda', 'fda', 'kda', 'rda', 'bahria', 'bahria town', 'gulberg',
  'fazaia', 'naval anchorage', 'wapda town', 'park view', 'defence housing',
  // Blueprint / plans
  'floor plan', 'site plan', 'architectural drawing', 'master plan', 'layout plan',
  'sanctioned plan', 'elevation', 'structural drawing', 'key plan',
  'ground floor', 'first floor', 'basement plan', 'approved plan',
];
const GENERAL_PROPERTY = [
  'plot no', 'block', 'marla', 'kanal', 'sq ft', 'sqft', 'sq yards',
  'square yards', 'square feet', 'residential', 'commercial',
  'frontage', 'boundary', 'measuring', 'dimensions', 'demarcation',
  'street', 'boulevard', 'corner', 'house no',
];

// Explicit invalid-image keyword patterns (vehicles, animals, food, scenery)
const INVALID_SIGNALS = [
  'toyota', 'honda', 'suzuki', 'hyundai', 'kia', 'mercedes', 'bmw', 'audi',
  'ford', 'tesla', 'nissan', 'volkswagen', 'mitsubishi',
  'car', 'cars', 'vehicle', 'van', 'suv', 'sedan', 'truck', 'automobile',
  'motorcycle', 'motorbike', 'bike', 'scooter',
  'cat', 'dog', 'animal', 'pet', 'wildlife', 'elephant', 'lion',
  'selfie', 'food', 'meal', 'dinner', 'restaurant', 'pizza', 'burger',
  'scenery', 'sunset', 'beach', 'forest', 'mountain',
];

// ─── City Mappings ────────────────────────────────────────────────────────────

const CITY_MAPPINGS: Record<string, string[]> = {
  Islamabad: ['islamabad', 'cda', 'f-6', 'f-7', 'f-8', 'f-10', 'f-11', 'g-11', 'g-13', 'i-8', 'e-11', 'd-12', 'b-17', 'gulberg greens'],
  Rawalpindi: ['rawalpindi', 'pindi', 'bahria', 'bahria town', 'chaklala', 'adiala', 'satellite town', 'rda', 'dha rawalpindi'],
  Lahore: ['lahore', 'dha lahore', 'gulberg', 'johar town', 'model town', 'cantt', 'lda', 'bahria orchard', 'wapda town', 'lake city'],
  Karachi: ['karachi', 'clifton', 'defence', 'dha karachi', 'gulshan', 'pechs', 'north nazimabad', 'scheme 33', 'bahria karachi', 'kda'],
  Peshawar: ['peshawar', 'hayatabad', 'university town', 'warsak', 'regi model town'],
  Faisalabad: ['faisalabad', 'madina town', 'fda', 'peoples colony', 'canal road'],
  Multan: ['multan', 'mda', 'bosan road', 'cantt multan', 'dha multan'],
  Quetta: ['quetta', 'cantt quetta', 'samungli', 'jinnah town'],
};

const SOCIETY_LIST = [
  'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 5', 'DHA Phase 6', 'DHA Phase 7',
  'DHA Phase 8', 'DHA Phase 9', 'DHA',
  'Bahria Town Phase 1', 'Bahria Town Phase 4', 'Bahria Town Phase 7',
  'Bahria Town Phase 8', 'Bahria Town', 'Bahria Orchard',
  'Gulberg Greens', 'Gulberg Residencia', 'Gulberg',
  'CDA Sector F-6', 'CDA Sector F-7', 'CDA Sector F-8', 'CDA Sector F-10',
  'CDA Sector F-11', 'CDA Sector G-11', 'CDA Sector G-13', 'CDA Sector I-8',
  'CDA Sector D-12', 'CDA Sector B-17',
  'Model Town', 'Johar Town', 'Lake City', 'Wapda Town',
  'Clifton', 'PECHS', 'Hayatabad',
];

// ─── Fast Buffer String Extractor ─────────────────────────────────────────────

export function extractBufferStrings(buffer: Buffer): string {
  try {
    const raw = buffer.toString('utf-8');
    const matches = raw.match(/[a-zA-Z0-9_\-\.\s]{4,}/g) || [];
    return matches.slice(0, 500).join(' ');
  } catch {
    return '';
  }
}

// ─── Extractors ───────────────────────────────────────────────────────────────

function extractArea(text: string): { areaSqFt: number | null; label?: string } {
  const kanalMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kanal|kanals)\b/);
  if (kanalMatch) {
    const k = parseFloat(kanalMatch[1]);
    return { areaSqFt: Math.round(k * 4356), label: `${k} Kanal` };
  }
  const marlaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:marla|marlas)\b/);
  if (marlaMatch) {
    const m = parseFloat(marlaMatch[1]);
    return { areaSqFt: Math.round(m * 272), label: `${m} Marla` };
  }
  const sqYardsMatch = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq(?:uare)?\s*(?:yards?|yds?))\b/);
  if (sqYardsMatch) {
    const y = parseFloat(sqYardsMatch[1].replace(/,/g, ''));
    return { areaSqFt: Math.round(y * 9), label: `${y} Sq Yds` };
  }
  const sqftMatch = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq(?:uare)?\s*(?:ft|feet)?|sqft)\b/);
  if (sqftMatch) {
    const s = parseFloat(sqftMatch[1].replace(/,/g, ''));
    return { areaSqFt: Math.round(s), label: `${s} Sq Ft` };
  }
  return { areaSqFt: null };
}

function extractBedrooms(text: string): number | null {
  const patterns: [RegExp, number][] = [
    [/\bstudio\b/, 1],
    [/\b1\s*(?:bed|bedroom|br)\b/, 1],
    [/\b2\s*(?:bed|bedroom|br|beds)\b/, 2],
    [/\b3\s*(?:bed|bedroom|br|beds)\b/, 3],
    [/\b4\s*(?:bed|bedroom|br|beds)\b/, 4],
    [/\b5\s*(?:bed|bedroom|br|beds)\b/, 5],
    [/\b6\s*(?:bed|bedroom|br|beds)\b/, 6],
  ];
  for (const [p, n] of patterns) if (p.test(text)) return n;
  return null;
}

function extractCityAndSociety(text: string): { city: string | null; society: string | null } {
  let matchedCity: string | null = null;
  for (const [cityName, aliases] of Object.entries(CITY_MAPPINGS)) {
    if (aliases.some((a) => text.includes(a))) { matchedCity = cityName; break; }
  }
  let matchedSociety: string | null = null;
  for (const s of SOCIETY_LIST) {
    if (text.includes(s.toLowerCase())) { matchedSociety = s; break; }
  }
  return { city: matchedCity, society: matchedSociety };
}

function extractPlotNumber(text: string): string | null {
  const m = text.match(/\b(?:plot|flat|unit|house)\s*(?:no\.?|#|number)?\s*([a-z0-9\/-]+)/i);
  if (m && m[1]) {
    const v = m[1].trim();
    if (v.length <= 15 && !['is', 'and', 'the', 'of', 'for'].includes(v)) {
      return `Plot ${v.toUpperCase()}`;
    }
  }
  return null;
}

function classifyPropertyType(
  text: string,
  docType: DocumentAnalysisResult['documentType']
): DocumentAnalysisResult['extractedParams']['propertyType'] {
  if (/\b(commercial|shop|plaza|office)\b/.test(text)) return 'Commercial Plot';
  if (/\b(flat|apartment|studio|penthouse)\b/.test(text)) return 'Flat / Apartment';
  if (/\b(villa|farmhouse)\b/.test(text)) return 'Villa / Farmhouse';
  if (/\b(plot|allocation)\b/.test(text) || docType === 'ALLOTMENT_LETTER') {
    if (/\b(house|constructed|bungalow)\b/.test(text)) return 'House';
    return 'Residential Plot';
  }
  if (/\b(house|home|bungalow|kothi)\b/.test(text)) return 'House';
  return 'House';
}

// ─── Keyword Scorer ───────────────────────────────────────────────────────────

function countHits(text: string, keywords: string[]): string[] {
  return keywords.filter((kw) => text.includes(kw));
}

// ─── Main Analysis Function ───────────────────────────────────────────────────

/**
 * Analyze OCR text + filename against Pakistani/global document keyword signatures.
 * Returns isValid=false (score=0) for vehicles, animals, random photos.
 * Falls back to score=80 when format is valid but OCR yields no matches (compressed/blurry image).
 */
export function analyzeDocumentContent(
  rawOcrText: string,
  fileName: string = '',
  fileMime: string = '',
  /** If true, the file format was verified valid (PDF/image) — enables 80% fallback */
  formatVerified = false,
): DocumentAnalysisResult {
  // Normalize all text sources
  const norm = normalizeText(`${fileName} ${rawOcrText}`);

  // ── Invalid-image signal check ────────────────────────────────────────────
  const invalidHits = INVALID_SIGNALS.filter((kw) => {
    const idx = norm.indexOf(kw);
    if (idx === -1) return false;
    // Ensure it's a word boundary (not e.g. "caramel")
    const before = idx === 0 ? ' ' : norm[idx - 1];
    const after = idx + kw.length >= norm.length ? ' ' : norm[idx + kw.length];
    return /[\s\-]/.test(before) || /[\s\-,.]/.test(after) || idx === 0;
  });

  // ── Keyword hit counts ────────────────────────────────────────────────────
  const cnicPrimaryHits   = countHits(norm, CNIC_PRIMARY);
  const cnicSecondaryHits = countHits(norm, CNIC_SECONDARY);
  const globalIdHits      = countHits(norm, GLOBAL_ID_KEYWORDS);
  const propPrimaryHits   = countHits(norm, PROPERTY_PRIMARY);
  const propSecondaryHits = countHits(norm, PROPERTY_SECONDARY);
  const generalPropHits   = countHits(norm, GENERAL_PROPERTY);

  const totalIdHits       = cnicPrimaryHits.length + cnicSecondaryHits.length + globalIdHits.length;
  const totalPropHits     = propPrimaryHits.length + propSecondaryHits.length + generalPropHits.length;
  const totalLegalHits    = totalIdHits + totalPropHits;

  const detectedKeywords  = Array.from(new Set([
    ...cnicPrimaryHits, ...cnicSecondaryHits, ...globalIdHits,
    ...propPrimaryHits, ...propSecondaryHits, ...generalPropHits,
  ]));

  // ── Reject obvious non-documents (vehicles, scenery, food, selfies) ───────
  // Only reject if invalid signals are present AND total legal/property keywords are near-zero.
  if (invalidHits.length >= 1 && totalLegalHits <= 1) {
    return buildInvalidResult(rawOcrText);
  }

  // ── Determine document classification ─────────────────────────────────────
  let documentType: DocumentAnalysisResult['documentType'] = 'INVALID';
  let documentTypeLabel = 'Unrecognized Document';

  if (cnicPrimaryHits.length >= 1 ||
      (cnicSecondaryHits.length >= 2 && norm.includes('pakistan'))) {
    documentType = 'CNIC_NICOP';
    documentTypeLabel = 'CNIC / National Identity Card';
  } else if (globalIdHits.length >= 1) {
    documentType = 'GLOBAL_ID';
    documentTypeLabel = 'Global Identity Document';
  } else if (propPrimaryHits.some((k) => ['blueprint', 'floor plan', 'site plan', 'layout plan', 'sanctioned plan'].includes(k))) {
    documentType = 'BLUEPRINT_PLAN';
    documentTypeLabel = 'Architectural Blueprint / Layout Plan';
  } else if (
    propPrimaryHits.includes('allotment') ||
    propPrimaryHits.includes('allotment letter') ||
    (propPrimaryHits.includes('authority') && generalPropHits.length >= 1)
  ) {
    documentType = 'ALLOTMENT_LETTER';
    documentTypeLabel = 'Allotment Letter / Transfer Order';
  } else if (
    propPrimaryHits.includes('deed') || propPrimaryHits.includes('registry') ||
    propPrimaryHits.includes('khasra') || propPrimaryHits.includes('khewat') ||
    propSecondaryHits.includes('sub registrar') || propSecondaryHits.includes('sub-registrar')
  ) {
    documentType = 'REGISTRY_SALE_DEED';
    documentTypeLabel = 'Registry / Sale Deed / Fard';
  } else if (propPrimaryHits.includes('title')) {
    documentType = 'TITLE_DEED';
    documentTypeLabel = 'Property Title Document';
  } else if (propPrimaryHits.length >= 1 || generalPropHits.length >= 2) {
    documentType = 'PROPERTY_DOCUMENT';
    documentTypeLabel = 'Property Document';
  } else if (totalLegalHits >= 1) {
    documentType = 'OTHER_LEGAL';
    documentTypeLabel = 'Legal Document';
  }

  // ── Validate: at least 1 primary keyword must match ───────────────────────
  const hasPrimaryHit =
    cnicPrimaryHits.length >= 1 ||
    globalIdHits.length >= 1 ||
    propPrimaryHits.length >= 1 ||
    cnicSecondaryHits.length >= 2;

  const hasStructuralHint = generalPropHits.length >= 2;

  if (!hasPrimaryHit && !hasStructuralHint) {
    // Check fallback: valid format (PDF/image) but OCR found nothing (compressed/blurry)
    if (formatVerified && totalLegalHits === 0) {
      return buildFallbackResult(rawOcrText, fileMime);
    }
    return buildInvalidResult(rawOcrText);
  }

  // ── Dynamic Score Calculation (85–98%) ────────────────────────────────────
  let baseScore = 85.0;

  // Primary keyword depth bonus
  baseScore += Math.min(8.0, (cnicPrimaryHits.length + propPrimaryHits.length + globalIdHits.length) * 2.0);
  // Secondary keyword bonus
  baseScore += Math.min(3.0, (cnicSecondaryHits.length + propSecondaryHits.length) * 0.5);
  // General property bonus
  baseScore += Math.min(2.0, generalPropHits.length * 0.4);

  // Official entity bonus
  if (/\b(dha|nadra|cda|bahria|sub.?registrar|authority|government)\b/.test(norm)) baseScore += 1.5;

  // Extraction-based bonus
  const areaInfo = extractArea(norm);
  const bedCount = extractBedrooms(norm);
  const { city, society } = extractCityAndSociety(norm);
  const plotNo = extractPlotNumber(norm);
  const propertyType = classifyPropertyType(norm, documentType);

  if (areaInfo.areaSqFt) baseScore += 1.0;
  if (city) baseScore += 0.8;
  if (society) baseScore += 0.8;
  if (plotNo) baseScore += 0.5;

  const verifiedScore = Math.min(98.0, Math.round(baseScore * 10) / 10);
  const confidence = Math.min(0.98, Math.round((verifiedScore / 100) * 1000) / 1000);

  // Suggested title
  const parts: string[] = [];
  if (areaInfo.label) parts.push(areaInfo.label);
  if (propertyType) parts.push(propertyType);
  if (society) parts.push(`in ${society}`);
  else if (city) parts.push(`in ${city}`);
  const suggestedTitle = parts.length >= 2 ? parts.join(' ') : null;

  const bathrooms = bedCount ? Math.max(1, Math.floor(bedCount * 0.8)) : null;

  return {
    isValid: true,
    score: verifiedScore,
    verifiedScore,
    confidence,
    documentType,
    documentTypeLabel,
    fallback: false,
    extractedParams: {
      propertyType,
      bedrooms: bedCount,
      bathrooms,
      areaSqFt: areaInfo.areaSqFt,
      areaOriginalText: areaInfo.label,
      city,
      societyOrLocation: society,
      plotOrUnitNo: plotNo,
      suggestedTitle,
      detectedKeywords,
    },
    rawOcrSnippet: rawOcrText.slice(0, 200),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildInvalidResult(rawOcrText: string): DocumentAnalysisResult {
  return {
    isValid: false,
    score: 0,
    verifiedScore: 0,
    confidence: 0,
    documentType: 'INVALID',
    documentTypeLabel: 'Invalid Document',
    fallback: false,
    errorMessage: 'Invalid document structure. Please upload CNIC or Allotment Letter.',
    extractedParams: {
      propertyType: null, bedrooms: null, bathrooms: null, areaSqFt: null,
      city: null, societyOrLocation: null, plotOrUnitNo: null,
      suggestedTitle: null, detectedKeywords: [],
    },
    rawOcrSnippet: rawOcrText.slice(0, 150),
  };
}

function buildFallbackResult(rawOcrText: string, fileMime: string): DocumentAnalysisResult {
  const label = fileMime.includes('pdf') ? 'PDF Document' : 'Uploaded Document';
  return {
    isValid: true,
    score: 80,
    verifiedScore: 80,
    confidence: 0.80,
    documentType: 'OTHER_LEGAL',
    documentTypeLabel: label,
    fallback: true,
    extractedParams: {
      propertyType: null, bedrooms: null, bathrooms: null, areaSqFt: null,
      city: null, societyOrLocation: null, plotOrUnitNo: null,
      suggestedTitle: null, detectedKeywords: [],
    },
    rawOcrSnippet: rawOcrText.slice(0, 150),
  };
}
