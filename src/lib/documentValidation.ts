// src/lib/documentValidation.ts
// Document Type Image & OCR Validation Engine for NexMove

export interface DocumentAnalysisResult {
  isValid: boolean;
  documentType: 'ALLOTMENT_LETTER' | 'REGISTRY_SALE_DEED' | 'CNIC_NICOP' | 'TITLE_DEED' | 'BLUEPRINT_PLAN' | 'OTHER_LEGAL' | 'INVALID';
  documentTypeLabel: string;
  verifiedScore: number; // 0 for invalid, dynamic 85.0 – 99.5 for valid
  confidence: number;   // 0.0 – 1.0
  errorMessage?: string;
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

// ─── Pakistani Legal & Property Vocabularies ──────────────────────────────────

const ALLOTMENT_KEYWORDS = [
  'allotment',
  'allotment letter',
  'transfer letter',
  'allocation',
  'possession order',
  'membership no',
  'allottee',
  'allotted',
  'intimation letter',
  'society',
  'authority',
  'cda',
  'lda',
  'fda',
  'kda',
  'rda',
  'dha',
  'defence housing',
  'bahria',
  'bahria town',
  'gulberg greens',
  'fazaia',
  'naval anchorage',
  'wapda town',
  'park view',
];

const REGISTRY_KEYWORDS = [
  'registry',
  'sale deed',
  'bainama',
  'sub-registrar',
  'sub registrar',
  'stamp paper',
  'fard',
  'fard malkiat',
  'intiqal',
  'mutation',
  'khasra',
  'khewat',
  'khatooni',
  'mauza',
  'tehsil',
  'district',
  'patwari',
  'halqa',
  'court fee',
  'title deed',
  'conveyance deed',
  'gift deed',
  'power of attorney',
  'mukhtar nama',
  'purchaser',
  'vendor',
  'deed of transfer',
];

const CNIC_NICOP_KEYWORDS = [
  'cnic',
  'nicop',
  'national identity card',
  'identity card',
  'nadra',
  'government of pakistan',
  'islamic republic of pakistan',
  'father name',
  'country of stay',
  'date of birth',
  'date of expiry',
  'date of issue',
  'family no',
  'identity number',
  'cardholder',
];

const BLUEPRINT_KEYWORDS = [
  'blueprint',
  'floor plan',
  'site plan',
  'architectural drawing',
  'master plan',
  'layout plan',
  'sanctioned plan',
  'elevation',
  'structural drawing',
  'key plan',
  'ground floor',
  'first floor',
  'basement plan',
  'approved plan',
];

const GENERAL_PROPERTY_KEYWORDS = [
  'plot',
  'plot no',
  'plot #',
  'street',
  'sector',
  'phase',
  'block',
  'marla',
  'kanal',
  'sq ft',
  'sqft',
  'sq yards',
  'square yards',
  'square feet',
  'residential',
  'commercial',
  'boulevard',
  'corner',
  'frontage',
  'boundary',
  'measuring',
  'dimensions',
  'demarcation',
];

// Non-document rejection keywords
const EXPLICIT_INVALID_KEYWORDS = [
  'car', 'cars', 'vehicle', 'van', 'suv', 'sedan', 'automobile', 'toyota', 'honda', 'suzuki',
  'hyundai', 'kia', 'mercedes', 'bmw', 'audi', 'bike', 'motorcycle', 'truck', 'auto',
  'cat', 'dog', 'pet', 'animal', 'scenery', 'sunset', 'selfie', 'food', 'meal', 'dinner',
  'clothing', 'shirt', 'dress', 'shoes', 'screenshot_game', 'meme', 'receipt_groceries',
];

const CITY_MAPPINGS: Record<string, string[]> = {
  Islamabad: ['islamabad', 'cda', 'f-6', 'f-7', 'f-8', 'f-10', 'f-11', 'g-11', 'g-13', 'i-8', 'e-11', 'd-12', 'gulberg greens', 'b-17'],
  Rawalpindi: ['rawalpindi', 'pindi', 'bahria', 'bahria town', 'chaklala', 'adiala', 'satellite town', 'rda', 'dha rawalpindi'],
  Lahore: ['lahore', 'dha lahore', 'gulberg', 'johar town', 'model town', 'cantt', 'lda', 'bahria orchard', 'wapda town', 'lake city'],
  Karachi: ['karachi', 'clifton', 'defence', 'dha karachi', 'gulshan', 'pechs', 'north nazimabad', 'scheme 33', 'bahria karachi', 'kda'],
  Peshawar: ['peshawar', 'hayatabad', 'university town', 'warsak', 'regi model town'],
  Faisalabad: ['faisalabad', 'madina town', 'fda', 'peoples colony', 'canal road'],
  Multan: ['multan', 'mda', 'bosan road', 'cantt multan', 'dha multan'],
  Quetta: ['quetta', 'cantt quetta', 'samungli', 'jinnah town'],
};

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
  const kanalMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kanal|kanals)\b/i);
  if (kanalMatch) {
    const kanals = parseFloat(kanalMatch[1]);
    const sqft = Math.round(kanals * 4356);
    return { areaSqFt: sqft, label: `${kanals} Kanal` };
  }

  const marlaMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:marla|marlas)\b/i);
  if (marlaMatch) {
    const marlas = parseFloat(marlaMatch[1]);
    const sqft = Math.round(marlas * 272);
    return { areaSqFt: sqft, label: `${marlas} Marla` };
  }

  const sqYardsMatch = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq(?:uare)?\s*(?:yards?|yds?))\b/i);
  if (sqYardsMatch) {
    const yards = parseFloat(sqYardsMatch[1].replace(/,/g, ''));
    const sqft = Math.round(yards * 9);
    return { areaSqFt: sqft, label: `${yards} Sq Yds` };
  }

  const sqftMatch = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq(?:uare)?\s*(?:ft|feet)?|sqft)\b/i);
  if (sqftMatch) {
    const sqft = parseFloat(sqftMatch[1].replace(/,/g, ''));
    return { areaSqFt: Math.round(sqft), label: `${sqft} Sq Ft` };
  }

  return { areaSqFt: null };
}

function extractBedrooms(text: string): number | null {
  const bedPatterns: [RegExp, number][] = [
    [/\b(studio)\b/i, 1],
    [/\b1\s*(?:bed|bedroom|br)\b/i, 1],
    [/\b2\s*(?:bed|bedroom|br|beds)\b/i, 2],
    [/\b3\s*(?:bed|bedroom|br|beds)\b/i, 3],
    [/\b4\s*(?:bed|bedroom|br|beds)\b/i, 4],
    [/\b5\s*(?:bed|bedroom|br|beds)\b/i, 5],
    [/\b6\s*(?:bed|bedroom|br|beds)\b/i, 6],
  ];

  for (const [pat, count] of bedPatterns) {
    if (pat.test(text)) return count;
  }
  return null;
}

function extractCityAndSociety(text: string): { city: string | null; society: string | null } {
  const lower = text.toLowerCase();
  let matchedCity: string | null = null;

  for (const [cityName, aliases] of Object.entries(CITY_MAPPINGS)) {
    if (aliases.some((alias) => lower.includes(alias))) {
      matchedCity = cityName;
      break;
    }
  }

  const societyMatches = [
    'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 5', 'DHA Phase 6', 'DHA Phase 7', 'DHA Phase 8', 'DHA Phase 9', 'DHA',
    'Bahria Town Phase 1', 'Bahria Town Phase 4', 'Bahria Town Phase 7', 'Bahria Town Phase 8', 'Bahria Town', 'Bahria Orchard',
    'Gulberg Greens', 'Gulberg Residencia', 'Gulberg', 'CDA Sector F-6', 'CDA Sector F-7', 'CDA Sector F-8', 'CDA Sector F-10',
    'CDA Sector F-11', 'CDA Sector G-11', 'CDA Sector G-13', 'CDA Sector I-8', 'CDA Sector D-12', 'CDA Sector B-17',
    'Model Town', 'Johar Town', 'Lake City', 'Wapda Town', 'Clifton', 'PECHS', 'Hayatabad',
  ];

  let matchedSociety: string | null = null;
  for (const s of societyMatches) {
    if (lower.includes(s.toLowerCase())) {
      matchedSociety = s;
      break;
    }
  }

  return { city: matchedCity, society: matchedSociety };
}

function extractPlotNumber(text: string): string | null {
  const plotMatch = text.match(/\b(?:plot|flat|unit|house)\s*(?:no\.?|#|number)?\s*([A-Za-z0-9\/-]+)/i);
  if (plotMatch && plotMatch[1]) {
    const val = plotMatch[1].trim();
    if (val.length <= 15 && !['is', 'and', 'the', 'of', 'for'].includes(val.toLowerCase())) {
      return `Plot ${val.toUpperCase()}`;
    }
  }
  return null;
}

function classifyPropertyType(
  text: string,
  docType: DocumentAnalysisResult['documentType']
): DocumentAnalysisResult['extractedParams']['propertyType'] {
  const lower = text.toLowerCase();

  if (lower.includes('commercial') || lower.includes('shop') || lower.includes('plaza') || lower.includes('office')) {
    return 'Commercial Plot';
  }
  if (lower.includes('flat') || lower.includes('apartment') || lower.includes('studio') || lower.includes('penthouse')) {
    return 'Flat / Apartment';
  }
  if (lower.includes('villa') || lower.includes('farmhouse')) {
    return 'Villa / Farmhouse';
  }
  if (lower.includes('plot') || lower.includes('allocation') || docType === 'ALLOTMENT_LETTER') {
    if (lower.includes('house') || lower.includes('constructed') || lower.includes('bungalow')) {
      return 'House';
    }
    return 'Residential Plot';
  }
  if (lower.includes('house') || lower.includes('home') || lower.includes('bungalow') || lower.includes('kothi')) {
    return 'House';
  }

  return 'House';
}

// ─── Main Document Validation Function ────────────────────────────────────────

/**
 * Analyzes OCR-extracted text and document metadata against Pakistani legal & property document schemas.
 */
export function analyzeDocumentContent(
  ocrText: string,
  fileName: string = ''
): DocumentAnalysisResult {
  const combinedText = `${fileName} ${ocrText}`.toLowerCase().replace(/[\r\n\t]+/g, ' ');

  // Quick check for explicit invalid keywords without strong legal context
  const invalidHits = EXPLICIT_INVALID_KEYWORDS.filter((kw) => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(combinedText);
  });

  // Count keyword hits
  const allotmentHits = ALLOTMENT_KEYWORDS.filter((kw) => combinedText.includes(kw));
  const registryHits = REGISTRY_KEYWORDS.filter((kw) => combinedText.includes(kw));
  const cnicHits = CNIC_NICOP_KEYWORDS.filter((kw) => combinedText.includes(kw));
  const blueprintHits = BLUEPRINT_KEYWORDS.filter((kw) => combinedText.includes(kw));
  const propertyHits = GENERAL_PROPERTY_KEYWORDS.filter((kw) => combinedText.includes(kw));

  const totalLegalHits = allotmentHits.length + registryHits.length + cnicHits.length + blueprintHits.length;
  const totalPropertyHits = propertyHits.length;

  const detectedKeywords = Array.from(
    new Set([...allotmentHits, ...registryHits, ...cnicHits, ...blueprintHits, ...propertyHits])
  );

  // If prominent invalid hits exist (e.g. car, van) and no strong legal presence, reject immediately
  if (invalidHits.length > 0 && totalLegalHits === 0 && totalPropertyHits <= 1) {
    return {
      isValid: false,
      documentType: 'INVALID',
      documentTypeLabel: 'Invalid Document',
      verifiedScore: 0,
      confidence: 0,
      errorMessage: 'Invalid document uploaded. Please upload an Allotment Letter, CNIC, or Registry.',
      extractedParams: {
        propertyType: null,
        bedrooms: null,
        bathrooms: null,
        areaSqFt: null,
        city: null,
        societyOrLocation: null,
        plotOrUnitNo: null,
        suggestedTitle: null,
        detectedKeywords: [],
      },
      rawOcrSnippet: ocrText.slice(0, 150),
    };
  }

  // Determine document type
  let documentType: DocumentAnalysisResult['documentType'] = 'INVALID';
  let documentTypeLabel = 'Unrecognized Document';

  if (allotmentHits.length >= 2 || (allotmentHits.length >= 1 && totalPropertyHits >= 1)) {
    documentType = 'ALLOTMENT_LETTER';
    documentTypeLabel = 'Allotment Letter / Transfer Order';
  } else if (registryHits.length >= 2 || (registryHits.length >= 1 && totalPropertyHits >= 1)) {
    documentType = 'REGISTRY_SALE_DEED';
    documentTypeLabel = 'Registry / Sale Deed / Fard';
  } else if (cnicHits.length >= 2 || (cnicHits.length >= 1 && combinedText.includes('pakistan'))) {
    documentType = 'CNIC_NICOP';
    documentTypeLabel = 'National ID / NICOP';
  } else if (blueprintHits.length >= 1 && totalPropertyHits >= 1) {
    documentType = 'BLUEPRINT_PLAN';
    documentTypeLabel = 'Architectural Blueprint / Layout Plan';
  } else if (totalLegalHits >= 1 && totalPropertyHits >= 2) {
    documentType = 'TITLE_DEED';
    documentTypeLabel = 'Property Title Document';
  } else if (totalLegalHits >= 1 || totalPropertyHits >= 3) {
    documentType = 'OTHER_LEGAL';
    documentTypeLabel = 'Verified Legal Document';
  }

  // Check validity: If it's a random image, car, landscape, receipt, etc., total matches will be 0 or insufficient
  const isValid = documentType !== 'INVALID' && (totalLegalHits >= 1 || totalPropertyHits >= 2);

  if (!isValid) {
    return {
      isValid: false,
      documentType: 'INVALID',
      documentTypeLabel: 'Invalid Document',
      verifiedScore: 0,
      confidence: 0,
      errorMessage: 'Invalid document uploaded. Please upload an Allotment Letter, CNIC, or Registry.',
      extractedParams: {
        propertyType: null,
        bedrooms: null,
        bathrooms: null,
        areaSqFt: null,
        city: null,
        societyOrLocation: null,
        plotOrUnitNo: null,
        suggestedTitle: null,
        detectedKeywords: [],
      },
      rawOcrSnippet: ocrText.slice(0, 150),
    };
  }

  // ── Compute Dynamic Verified Score (88.0% – 99.4%) ───────────────────────────
  let baseScore = 88.0;

  baseScore += Math.min(6.0, totalLegalHits * 1.5);
  baseScore += Math.min(3.5, totalPropertyHits * 0.8);

  if (
    combinedText.includes('dha') ||
    combinedText.includes('nadra') ||
    combinedText.includes('sub-registrar') ||
    combinedText.includes('cda') ||
    combinedText.includes('bahria')
  ) {
    baseScore += 1.8;
  }

  const areaInfo = extractArea(combinedText);
  const bedCount = extractBedrooms(combinedText);
  const { city, society } = extractCityAndSociety(combinedText);
  const plotNo = extractPlotNumber(combinedText);
  const propertyType = classifyPropertyType(combinedText, documentType);

  if (areaInfo.areaSqFt) baseScore += 1.0;
  if (city) baseScore += 0.8;
  if (society) baseScore += 0.8;
  if (plotNo) baseScore += 0.5;

  const verifiedScore = Math.min(99.4, Math.round(baseScore * 10) / 10);
  const confidence = Math.min(0.99, Math.round((verifiedScore / 100) * 100) / 100);

  // Suggested Title Builder
  let suggestedTitle: string | null = null;
  const parts: string[] = [];
  if (areaInfo.label) parts.push(areaInfo.label);
  if (propertyType) parts.push(propertyType);
  if (society) parts.push(`in ${society}`);
  else if (city) parts.push(`in ${city}`);

  if (parts.length >= 2) {
    suggestedTitle = parts.join(' ');
  }

  const bathrooms = bedCount ? Math.max(1, Math.floor(bedCount * 0.8)) : null;

  return {
    isValid: true,
    documentType,
    documentTypeLabel,
    verifiedScore,
    confidence,
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
    rawOcrSnippet: ocrText.slice(0, 200),
  };
}
