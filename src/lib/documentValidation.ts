// src/lib/documentValidation.ts
// Strict Local Document & Title Verification Engine for NexMove (No External Paid API Required)

export interface DocumentAnalysisResult {
  isValid: boolean;
  valid: boolean; // alias for API response consistency
  score: number; // 0 for invalid, dynamic 85.0 – 98.0 for valid
  verifiedScore: number;
  confidence: number; // 0.0 – 1.0
  documentType:
    | 'CNIC_NICOP'
    | 'ALLOTMENT_LETTER'
    | 'REGISTRY_SALE_DEED'
    | 'TITLE_DEED'
    | 'BLUEPRINT_PLAN'
    | 'PROPERTY_DOCUMENT'
    | 'OTHER_LEGAL'
    | 'INVALID';
  documentTypeLabel: string;
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

// ─── Text Normalizer ─────────────────────────────────────────────────────────

export function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Strict Signatures ───────────────────────────────────────────────────────

export const ID_SIGNATURES = [
  'cnic',
  'identity',
  'identity card',
  'national identity',
  'republic',
  'pakistan',
  'nadra',
  'father',
  'father name',
  'nicop',
  'cardholder',
  'husband',
  'husband name',
  'date of birth',
  'date of issue',
  'date of expiry',
  'smart national',
  'snic',
  'country of stay',
  'overseas',
  'poc',
  'pakistan origin',
  'government of pakistan',
  'islamic republic',
  'citizen',
  'id number',
];

export const LEGAL_SIGNATURES = [
  // Primary Legal Instruments & Deeds
  'allotment',
  'allotment letter',
  'allottee',
  'registry',
  'deed',
  'title deed',
  'sale deed',
  'conveyance deed',
  'gift deed',
  'relinquishment deed',
  'trust deed',
  'agreement to sell',
  'agreement',
  'affidavit',
  'stamp paper',
  'stamp',
  'bayana',
  'bainama',
  'power of attorney',
  'mukhtarnama',
  'mukhtar nama',
  'general power of attorney',
  'special power of attorney',
  'gpa',
  'spa',

  // Land Revenue, Fard, Intiqal & Records
  'khasra',
  'khewat',
  'khatooni',
  'fard',
  'fard malkiat',
  'malkiat',
  'jamabandi',
  'fard jamabandi',
  'aks shajra',
  'tatima',
  'intiqal',
  'mutation',
  'mutation order',
  'halqa patwari',
  'patwari',
  'girdawar',
  'tehsildar',
  'naib tehsildar',
  'sub registrar',
  'sub-registrar',
  'registrar',
  'district collector',
  'deputy commissioner',
  'revenue department',

  // Transfer, Possession & Clearances
  'transfer',
  'transfer order',
  'transfer letter',
  'transfer slip',
  'possession order',
  'possession certificate',
  'possession letter',
  'authority letter',
  'undertaking',
  'attested',
  'oath commissioner',
  'notary public',
  'advocate',
  'witness',
  'vendee',
  'vendor',
  'purchaser',
  'seller',
  'first party',
  'second party',

  // Blueprints, Architecture & Cadastral Plans
  'blueprint',
  'floor plan',
  'site plan',
  'layout plan',
  'master plan',
  'architectural drawing',
  'architectural plan',
  'architect',
  'pcatp',
  'structural drawing',
  'building plan',
  'approval letter',
  'sanctioned plan',
  'completion certificate',
  'cad drawing',
  'cadastral',
  'elevation',
  'ground floor',
  'first floor',
  'dimensions',
  'town planning',

  // Development Authorities & Societies
  'society',
  'housing society',
  'dha',
  'cda',
  'lda',
  'rda',
  'fda',
  'kda',
  'gda',
  'mda',
  'bahria',
  'bahria town',
  'gulberg',
  'gulberg greens',
  'lake city',
  'model town',
  'johar town',
  'wapda town',
  'citi housing',
  'fazaia',
  'askari',
  'naval anchorage',
  'top city',
  'mumtaz city',
  'b-17',
  'g-13',
  'f-11',
  'f-10',
  'f-8',
  'f-7',
  'f-6',
  'd-12',

  // Taxes, Utilities & NOC
  'noc',
  'no objection',
  'no objection certificate',
  'property tax',
  'excise and taxation',
  'holding no',
  'tax challan',
  'challan',
  'token',
  'pt-10',
  'pt10',
  'fbr',

  // Property Units & Dimensions in Document
  'residential plot',
  'commercial plot',
  'plot no',
  'plot number',
  'unit no',
  'flat no',
  'house no',
  'street no',
  'sector',
  'phase',
  'block',
  'kanal',
  'marla',
  'sqft',
  'square feet',
  'square yards',
  'sq yds',
];

// Explicit non-document rejection terms (vehicles, proposals, food, selfie, pets, random objects)
export const NON_DOC_SIGNALS = [
  'toyota', 'honda', 'suzuki', 'hyundai', 'kia', 'mercedes', 'bmw', 'audi',
  'ford', 'tesla', 'nissan', 'volkswagen', 'mitsubishi',
  'car', 'cars', 'vehicle', 'van', 'suv', 'sedan', 'truck', 'automobile',
  'motorcycle', 'motorbike', 'bike', 'scooter',
  'cat', 'dog', 'animal', 'pet', 'wildlife', 'elephant', 'lion',
  'selfie', 'food', 'meal', 'dinner', 'restaurant', 'pizza', 'burger',
  'scenery', 'sunset', 'beach', 'forest', 'mountain',
  'proposal', 'marriage proposal', 'business proposal', 'resume', 'cv', 'curriculum vitae',
  'invoice', 'receipt', 'shopping', 'menu', 'fashion', 'clothing', 'shoe', 'shoes', 'dress', 'shirt',
];

// ─── City & Society Lists ───────────────────────────────────────────────────

const CITY_MAPPINGS: Record<string, string[]> = {
  Islamabad: ['islamabad', 'cda', 'f-6', 'f-7', 'f-8', 'f-10', 'f-11', 'g-11', 'g-13', 'i-8', 'e-11', 'd-12', 'b-17', 'gulberg greens', 'mumtaz city', 'top city'],
  Rawalpindi: ['rawalpindi', 'pindi', 'bahria', 'bahria town', 'chaklala', 'adiala', 'satellite town', 'rda', 'dha rawalpindi', 'dha phase 2'],
  Lahore: ['lahore', 'dha lahore', 'gulberg', 'johar town', 'model town', 'cantt', 'lda', 'bahria orchard', 'wapda town', 'lake city', 'valancia'],
  Karachi: ['karachi', 'clifton', 'defence', 'dha karachi', 'gulshan', 'pechs', 'north nazimabad', 'scheme 33', 'bahria karachi', 'kda', 'malir cantt'],
  Peshawar: ['peshawar', 'hayatabad', 'university town', 'warsak', 'regi model town'],
  Faisalabad: ['faisalabad', 'madina town', 'fda', 'peoples colony', 'canal road', 'kohinoor city'],
  Multan: ['multan', 'mda', 'bosan road', 'cantt multan', 'dha multan', 'royal orchard'],
  Quetta: ['quetta', 'cantt quetta', 'samungli', 'jinnah town'],
  Gujranwala: ['gujranwala', 'dha gujranwala', 'dc colony', 'master city', 'gda'],
  Sialkot: ['sialkot', 'cantt sialkot', 'citi housing', 'sambrial'],
};

const SOCIETY_LIST = [
  'DHA Phase 1', 'DHA Phase 2', 'DHA Phase 3', 'DHA Phase 4', 'DHA Phase 5',
  'DHA Phase 6', 'DHA Phase 7', 'DHA Phase 8', 'DHA Phase 9', 'DHA',
  'Bahria Town Phase 1', 'Bahria Town Phase 2', 'Bahria Town Phase 3', 'Bahria Town Phase 4',
  'Bahria Town Phase 7', 'Bahria Town Phase 8', 'Bahria Town', 'Bahria Orchard', 'Bahria Town Karachi',
  'Gulberg Greens', 'Gulberg Residencia', 'Gulberg',
  'CDA Sector F-6', 'CDA Sector F-7', 'CDA Sector F-8', 'CDA Sector F-10',
  'CDA Sector F-11', 'CDA Sector G-11', 'CDA Sector G-13', 'CDA Sector I-8',
  'CDA Sector D-12', 'CDA Sector B-17', 'Top City-1', 'Mumtaz City',
  'Model Town', 'Johar Town', 'Lake City', 'Wapda Town', 'Valencia Town',
  'Clifton', 'PECHS', 'North Nazimabad', 'Hayatabad', 'Citi Housing',
];

// ─── Fast Buffer String Extractor ───────────────────────────────────────────

export function extractBufferStrings(buffer: Buffer): string {
  try {
    const raw = buffer.toString('utf-8');
    const matches = raw.match(/[a-zA-Z0-9_\-\.\s]{3,}/g) || [];
    return matches.slice(0, 1000).join(' ');
  } catch {
    return '';
  }
}

// ─── Param Extraction Helpers ───────────────────────────────────────────────

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
  const sqYardsMatch = text.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq(?:uare)?\s*(?:yards?|yds?)|gaj|ghaz)\b/);
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
    [/\b7\s*(?:bed|bedroom|br|beds)\b/, 7],
    [/\b8\s*(?:bed|bedroom|br|beds)\b/, 8],
  ];
  for (const [p, n] of patterns) if (p.test(text)) return n;
  return null;
}

function extractCityAndSociety(text: string): { city: string | null; society: string | null } {
  let matchedCity: string | null = null;
  for (const [cityName, aliases] of Object.entries(CITY_MAPPINGS)) {
    if (aliases.some((a) => text.includes(a))) {
      matchedCity = cityName;
      break;
    }
  }
  let matchedSociety: string | null = null;
  for (const s of SOCIETY_LIST) {
    if (text.includes(s.toLowerCase())) {
      matchedSociety = s;
      break;
    }
  }
  return { city: matchedCity, society: matchedSociety };
}

function extractPlotNumber(text: string): string | null {
  const m = text.match(/\b(?:plot|flat|unit|house|shop|office)\s*(?:no\.?|#|number)?\s*([a-z0-9\/-]+)/i);
  if (m && m[1]) {
    const v = m[1].trim();
    if (v.length <= 15 && !['is', 'and', 'the', 'of', 'for', 'with', 'in', 'to'].includes(v.toLowerCase())) {
      return `Plot ${v.toUpperCase()}`;
    }
  }
  return null;
}

function classifyPropertyType(
  text: string,
  docType: DocumentAnalysisResult['documentType']
): DocumentAnalysisResult['extractedParams']['propertyType'] {
  if (/\b(commercial|shop|plaza|office|building)\b/.test(text)) return 'Commercial Plot';
  if (/\b(flat|apartment|studio|penthouse)\b/.test(text)) return 'Flat / Apartment';
  if (/\b(villa|farmhouse|farm house)\b/.test(text)) return 'Villa / Farmhouse';
  if (/\b(plot|allocation)\b/.test(text) || docType === 'ALLOTMENT_LETTER') {
    if (/\b(house|constructed|bungalow)\b/.test(text)) return 'House';
    return 'Residential Plot';
  }
  if (/\b(house|home|bungalow|kothi)\b/.test(text)) return 'House';
  return 'House';
}

function countHits(text: string, signatures: string[]): string[] {
  return signatures.filter((sig) => {
    const idx = text.indexOf(sig);
    if (idx === -1) return false;
    return true;
  });
}

// ─── Main Strict Document Analysis ───────────────────────────────────────────

export function analyzeDocumentContent(
  rawOcrText: string,
  fileName: string = ''
): DocumentAnalysisResult {
  const norm = normalizeText(`${fileName} ${rawOcrText}`);

  // 1. Detect non-document signals (cars, proposals, animals, food, selfies, scenery)
  const nonDocHits = NON_DOC_SIGNALS.filter((kw) => {
    const idx = norm.indexOf(kw);
    if (idx === -1) return false;
    const before = idx === 0 ? ' ' : norm[idx - 1];
    const after = idx + kw.length >= norm.length ? ' ' : norm[idx + kw.length];
    return /[\s\-]/.test(before) || /[\s\-,.]/.test(after) || idx === 0;
  });

  // 2. Count strict ID and Legal signatures
  const idHits = countHits(norm, ID_SIGNATURES);
  const legalHits = countHits(norm, LEGAL_SIGNATURES);
  const totalHits = idHits.length + legalHits.length;
  const detectedKeywords = Array.from(new Set([...idHits, ...legalHits]));

  // Strict Rule: If non-doc signals match and document signatures are missing/negligible -> Reject immediately
  if (nonDocHits.length >= 1 && totalHits === 0) {
    return buildInvalidResult(rawOcrText);
  }

  // Strict Rule: If ZERO document signatures match -> Return HTTP 400 (score 0, valid false)
  if (totalHits === 0) {
    return buildInvalidResult(rawOcrText);
  }

  // 3. Classify Document Type
  let documentType: DocumentAnalysisResult['documentType'] = 'PROPERTY_DOCUMENT';
  let documentTypeLabel = 'Property Document';

  if (idHits.some((k) => ['cnic', 'identity', 'identity card', 'national identity', 'national', 'nadra', 'nicop', 'snic', 'poc'].includes(k))) {
    documentType = 'CNIC_NICOP';
    documentTypeLabel = 'CNIC / National Identity Card';
  } else if (
    legalHits.includes('blueprint') ||
    legalHits.includes('floor plan') ||
    legalHits.includes('site plan') ||
    legalHits.includes('layout plan') ||
    legalHits.includes('architectural drawing') ||
    legalHits.includes('building plan')
  ) {
    documentType = 'BLUEPRINT_PLAN';
    documentTypeLabel = 'Architectural Blueprint / Layout Plan';
  } else if (legalHits.includes('allotment') || legalHits.includes('allotment letter') || legalHits.includes('allottee')) {
    documentType = 'ALLOTMENT_LETTER';
    documentTypeLabel = 'Allotment Letter / Transfer Order';
  } else if (
    legalHits.includes('registry') ||
    legalHits.includes('deed') ||
    legalHits.includes('sale deed') ||
    legalHits.includes('conveyance deed') ||
    legalHits.includes('khasra') ||
    legalHits.includes('khewat') ||
    legalHits.includes('khatooni') ||
    legalHits.includes('jamabandi') ||
    legalHits.includes('fard') ||
    legalHits.includes('fard malkiat') ||
    legalHits.includes('bainama') ||
    legalHits.includes('intiqal') ||
    legalHits.includes('mutation') ||
    legalHits.includes('stamp paper')
  ) {
    documentType = 'REGISTRY_SALE_DEED';
    documentTypeLabel = 'Registry / Sale Deed / Fard';
  } else if (
    legalHits.includes('transfer') ||
    legalHits.includes('transfer letter') ||
    legalHits.includes('transfer order') ||
    legalHits.includes('title deed') ||
    legalHits.includes('possession order') ||
    legalHits.includes('possession certificate')
  ) {
    documentType = 'TITLE_DEED';
    documentTypeLabel = 'Property Transfer / Title Deed';
  } else {
    documentType = 'OTHER_LEGAL';
    documentTypeLabel = 'Legal Property Document';
  }

  // 4. Dynamic Confidence Score Calculation (85% – 98%)
  let baseScore = 85.0;

  // Signature depth bonus (+1.2% per extra signature hit, up to +7%)
  baseScore += Math.min(7.0, (totalHits - 1) * 1.2);

  // Authority & Government endorsement bonus (+2%)
  if (/\b(dha|nadra|cda|bahria|rda|lda|kda|gda|mda|pcatp|sub registrar|patwari|tehsildar|excise|revenue)\b/.test(norm)) {
    baseScore += 2.0;
  }

  // Extract property specs
  const areaInfo = extractArea(norm);
  const bedCount = extractBedrooms(norm);
  const { city, society } = extractCityAndSociety(norm);
  const plotNo = extractPlotNumber(norm);
  const propertyType = classifyPropertyType(norm, documentType);

  if (areaInfo.areaSqFt) baseScore += 1.5;
  if (city) baseScore += 1.0;
  if (society) baseScore += 1.0;
  if (plotNo) baseScore += 0.5;

  const verifiedScore = Math.min(98.0, Math.max(85.0, Math.round(baseScore * 10) / 10));
  const confidence = Math.min(0.98, Math.round((verifiedScore / 100) * 1000) / 1000);

  // Suggested title auto-construction
  const titleParts: string[] = [];
  if (areaInfo.label) titleParts.push(areaInfo.label);
  if (propertyType) titleParts.push(propertyType);
  if (society) titleParts.push(`in ${society}`);
  else if (city) titleParts.push(`in ${city}`);
  const suggestedTitle = titleParts.length >= 2 ? titleParts.join(' ') : null;

  const bathrooms = bedCount ? Math.max(1, Math.floor(bedCount * 0.8)) : null;

  return {
    isValid: true,
    valid: true,
    score: verifiedScore,
    verifiedScore,
    confidence,
    documentType,
    documentTypeLabel,
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

// ─── Invalid Helper ──────────────────────────────────────────────────────────

function buildInvalidResult(rawOcrText: string): DocumentAnalysisResult {
  return {
    isValid: false,
    valid: false,
    score: 0,
    verifiedScore: 0,
    confidence: 0,
    documentType: 'INVALID',
    documentTypeLabel: 'Invalid Document',
    errorMessage: 'Invalid Document Structure Uploaded',
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
    rawOcrSnippet: rawOcrText.slice(0, 150),
  };
}
