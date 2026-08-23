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

// ─── Strict Word Boundary Pattern Matcher ────────────────────────────────────

export function countWordMatches(text: string, signatures: string[]): string[] {
  if (!text) return [];
  return signatures.filter((sig) => {
    const escaped = sig.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
    return regex.test(text);
  });
}

// ─── Signatures Categorization ───────────────────────────────────────────────

export const ID_SIGNATURES = [
  'cnic',
  'identity card',
  'national identity',
  'national identity card',
  'nicop',
  'snic',
  'smart national',
  'poc',
  'pakistan origin card',
  'nadra',
  'government of pakistan',
  'islamic republic of pakistan',
  'father name',
  'husband name',
  'date of birth',
  'date of issue',
  'date of expiry',
  'country of stay',
];

// Tier 1: Primary Core Legal / Ownership / Technical Signatures (Must have at least one to verify)
export const PRIMARY_LEGAL_SIGNATURES = [
  // Allotment & Transfer Instruments
  'allotment letter',
  'allotment',
  'allottee',
  'allotment certificate',
  'transfer letter',
  'transfer order',
  'transfer deed',
  'transfer slip',
  'possession order',
  'possession certificate',
  'possession letter',
  'authority letter',

  // Title Deeds & Legal Instruments
  'title deed',
  'sale deed',
  'conveyance deed',
  'gift deed',
  'relinquishment deed',
  'trust deed',
  'registry',
  'bainama',
  'bayana',
  'agreement to sell',
  'power of attorney',
  'general power of attorney',
  'special power of attorney',
  'mukhtarnama',
  'mukhtar nama',
  'stamp paper',
  'affidavit',

  // Land Revenue, Fard, Intiqal & Records
  'fard malkiat',
  'fard jamabandi',
  'fard',
  'malkiat',
  'jamabandi',
  'khasra',
  'khewat',
  'khatooni',
  'intiqal',
  'mutation order',
  'mutation',
  'aks shajra',
  'tatima',
  'halqa patwari',
  'patwari',
  'girdawar',
  'tehsildar',
  'naib tehsildar',
  'sub registrar',
  'sub-registrar',
  'district collector',
  'revenue department',

  // Blueprints, Architecture & Plans
  'blueprint',
  'floor plan',
  'site plan',
  'layout plan',
  'master plan',
  'architectural drawing',
  'architectural plan',
  'structural drawing',
  'building plan',
  'sanctioned plan',
  'completion certificate',
  'cad drawing',
  'cadastral',
  'pcatp',
  'town planning',

  // Clearances & Official Tax Records
  'no objection certificate',
  'no objection',
  'noc',
  'property tax challan',
  'excise and taxation',
  'holding no',
  'pt-10',
  'pt10',
];

// Tier 2: Secondary Property & Locational Context Signatures
export const SECONDARY_PROPERTY_SIGNATURES = [
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
  'square feet',
  'sqft',
  'square yards',
  'sq yds',
  'first party',
  'second party',
  'vendee',
  'vendor',
  'purchaser',
  'seller',
  'witness',
  'oath commissioner',
  'notary public',
  'advocate',
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
];

// Explicit non-document rejection terms (vehicles, proposals, food, selfie, pets, random stock photos)
export const NON_DOC_SIGNALS = [
  'toyota', 'honda', 'suzuki', 'hyundai', 'kia', 'mercedes', 'bmw', 'audi',
  'ford', 'tesla', 'nissan', 'volkswagen', 'mitsubishi',
  'car', 'cars', 'vehicle', 'vehicles', 'van', 'vans', 'suv', 'sedan', 'truck', 'trucks', 'automobile', 'automobiles',
  'motorcycle', 'motorbike', 'bike', 'bikes', 'scooter',
  'cat', 'dog', 'animal', 'animals', 'pet', 'pets', 'wildlife', 'elephant', 'lion',
  'selfie', 'food', 'meal', 'dinner', 'restaurant', 'pizza', 'burger',
  'scenery', 'sunset', 'beach', 'forest', 'mountain',
  'marriage proposal', 'business proposal', 'proposal', 'resume', 'cv', 'curriculum vitae',
  'invoice', 'receipt', 'shopping', 'menu', 'fashion', 'clothing', 'shoe', 'shoes', 'dress', 'shirt',
  'istockphoto', 'shutterstock', 'gettyimages',
];

// ─── City & Society Lists ───────────────────────────────────────────────────

const CITY_MAPPINGS: Record<string, string[]> = {
  Islamabad: ['islamabad', 'cda', 'f-6', 'f-7', 'f-8', 'f-10', 'f-11', 'g-11', 'g-13', 'i-8', 'e-11', 'd-12', 'b-17', 'gulberg greens', 'mumtaz city', 'top city'],
  Rawalpindi: ['rawalpindi', 'pindi', 'bahria town', 'bahria', 'chaklala', 'adiala', 'satellite town', 'rda', 'dha rawalpindi'],
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

// ─── Fast Buffer String Extractor (Only for text-based PDF/Docs, NOT binary images) ───

export function extractBufferStrings(buffer: Buffer): string {
  try {
    const raw = buffer.toString('utf-8');
    const matches = raw.match(/[a-zA-Z0-9_\-\.]{3,}/g) || [];
    return matches.slice(0, 500).join(' ');
  } catch {
    return '';
  }
}

// ─── Param Extraction Helpers ───────────────────────────────────────────────

function extractArea(text: string): { areaSqFt: number | null; label?: string } {
  const kanalMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:kanal|kanals)\b/);
  if (kanalMatch) {
    const k = parseFloat(kanalMatch[1]);
    return { areaSqFt: Math.round(k * 4356), label: `${k} Kanal` };
  }
  const marlaMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:marla|marlas)\b/);
  if (marlaMatch) {
    const m = parseFloat(marlaMatch[1]);
    return { areaSqFt: Math.round(m * 272), label: `${m} Marla` };
  }
  const sqYardsMatch = text.match(/\b(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq(?:uare)?\s*(?:yards?|yds?)|gaj|ghaz)\b/);
  if (sqYardsMatch) {
    const y = parseFloat(sqYardsMatch[1].replace(/,/g, ''));
    return { areaSqFt: Math.round(y * 9), label: `${y} Sq Yds` };
  }
  const sqftMatch = text.match(/\b(\d+(?:,\d+)?(?:\.\d+)?)\s*(?:sq(?:uare)?\s*(?:ft|feet)?|sqft)\b/);
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
    if (aliases.some((a) => {
      const escaped = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(text);
    })) {
      matchedCity = cityName;
      break;
    }
  }
  let matchedSociety: string | null = null;
  for (const s of SOCIETY_LIST) {
    const escaped = s.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i').test(text)) {
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

// ─── Main Strict Document Analysis ───────────────────────────────────────────

export function analyzeDocumentContent(
  rawOcrText: string,
  fileName: string = ''
): DocumentAnalysisResult {
  const normOcr = normalizeText(rawOcrText);
  const normFile = normalizeText(fileName);
  const combinedNorm = `${normFile} ${normOcr}`.trim();

  // 1. If OCR extracted virtually nothing (less than 15 chars of readable text), reject immediately.
  if (normOcr.length < 15) {
    return buildInvalidResult(rawOcrText, 'No readable text detected. Please upload a clear legal document or scan.');
  }

  // 2. Detect non-document signals (cars, proposals, animals, food, selfies, scenery, stock photos)
  const nonDocHits = countWordMatches(combinedNorm, NON_DOC_SIGNALS);

  // 3. Strict Signature Matches with word boundaries
  const primaryHits = countWordMatches(normOcr, PRIMARY_LEGAL_SIGNATURES);
  const idHits = countWordMatches(normOcr, ID_SIGNATURES);
  const secondaryHits = countWordMatches(normOcr, SECONDARY_PROPERTY_SIGNATURES);

  const detectedKeywords = Array.from(new Set([...primaryHits, ...idHits, ...secondaryHits]));

  // Strict Rule 1: If non-doc keywords found (e.g. car, van, vehicle, proposal, resume) AND no primary legal signatures -> Reject
  if (nonDocHits.length > 0 && primaryHits.length === 0 && idHits.length === 0) {
    return buildInvalidResult(rawOcrText, `Non-document detected (${nonDocHits.join(', ')}). Please upload a valid legal property document.`);
  }

  // Strict Rule 2: Must have at least ONE Primary Legal Signature (e.g. Allotment Letter, Sale Deed, Fard, Blueprint, CNIC, etc.)
  // OR at least 2 secondary signatures with high confidence.
  const hasPrimaryLegal = primaryHits.length >= 1;
  const hasIdentity = idHits.length >= 1;
  const hasStrongSecondary = secondaryHits.length >= 3;

  if (!hasPrimaryLegal && !hasIdentity && !hasStrongSecondary) {
    return buildInvalidResult(rawOcrText, 'Document does not contain recognized legal property signatures or allotment credentials.');
  }

  // 4. Classify Document Type
  let documentType: DocumentAnalysisResult['documentType'] = 'PROPERTY_DOCUMENT';
  let documentTypeLabel = 'Property Document';

  if (hasIdentity) {
    documentType = 'CNIC_NICOP';
    documentTypeLabel = 'CNIC / National Identity Card';
  } else if (
    primaryHits.some((k) => [
      'blueprint',
      'floor plan',
      'site plan',
      'layout plan',
      'architectural drawing',
      'architectural plan',
      'structural drawing',
      'building plan',
      'sanctioned plan',
      'pcatp',
    ].includes(k))
  ) {
    documentType = 'BLUEPRINT_PLAN';
    documentTypeLabel = 'Architectural Blueprint / Layout Plan';
  } else if (
    primaryHits.some((k) => [
      'allotment letter',
      'allotment',
      'allottee',
      'allotment certificate',
      'transfer letter',
      'transfer order',
    ].includes(k))
  ) {
    documentType = 'ALLOTMENT_LETTER';
    documentTypeLabel = 'Allotment Letter / Transfer Order';
  } else if (
    primaryHits.some((k) => [
      'registry',
      'sale deed',
      'conveyance deed',
      'gift deed',
      'relinquishment deed',
      'bainama',
      'bayana',
      'agreement to sell',
      'power of attorney',
      'mukhtarnama',
      'stamp paper',
      'fard',
      'fard malkiat',
      'fard jamabandi',
      'jamabandi',
      'khasra',
      'khewat',
      'khatooni',
      'intiqal',
      'mutation',
      'mutation order',
    ].includes(k))
  ) {
    documentType = 'REGISTRY_SALE_DEED';
    documentTypeLabel = 'Registry / Sale Deed / Fard';
  } else if (
    primaryHits.some((k) => [
      'title deed',
      'possession order',
      'possession certificate',
      'possession letter',
      'no objection certificate',
      'noc',
    ].includes(k))
  ) {
    documentType = 'TITLE_DEED';
    documentTypeLabel = 'Property Transfer / Title Deed';
  } else {
    documentType = 'OTHER_LEGAL';
    documentTypeLabel = 'Legal Property Document';
  }

  // 5. Dynamic Confidence Score Calculation (85% – 98%)
  let baseScore = 85.0;
  const totalRelevantHits = primaryHits.length + idHits.length + secondaryHits.length;

  // Signature depth bonus (+1.2% per extra signature hit, up to +7%)
  baseScore += Math.min(7.0, Math.max(0, (totalRelevantHits - 1) * 1.2));

  // Authority & Government endorsement bonus (+2%)
  if (/\b(dha|nadra|cda|bahria|rda|lda|kda|gda|mda|pcatp|sub registrar|patwari|tehsildar|excise|revenue)\b/i.test(normOcr)) {
    baseScore += 2.0;
  }

  // Extract property specs
  const areaInfo = extractArea(normOcr);
  const bedCount = extractBedrooms(normOcr);
  const { city, society } = extractCityAndSociety(normOcr);
  const plotNo = extractPlotNumber(normOcr);
  const propertyType = classifyPropertyType(normOcr, documentType);

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

function buildInvalidResult(rawOcrText: string, customError?: string): DocumentAnalysisResult {
  const errorMsg = customError || 'Invalid Document Structure Uploaded';
  return {
    isValid: false,
    valid: false,
    score: 0,
    verifiedScore: 0,
    confidence: 0,
    documentType: 'INVALID',
    documentTypeLabel: 'Invalid Document',
    errorMessage: errorMsg,
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

