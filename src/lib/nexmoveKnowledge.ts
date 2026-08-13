/**
 * NexMove Platform Knowledge Base
 * Complete, factual platform context used by the AI chat engine.
 * All answers are drawn from actual platform capabilities, pricing, and policies.
 */

export const NEXMOVE_CONTEXT = {
  platform: {
    name: 'NexMove',
    tagline: 'Pakistan\'s AI-Powered PropTech Ecosystem',
    description:
      'NexMove is a full-stack real estate SaaS platform for agencies, overseas investors, architects, and property buyers in Pakistan. It combines AI document verification, smart escrow vaults, KYC/NICOP authentication, and a co-brokering network.',
  },

  subscription: {
    tiers: [
      {
        name: 'Starter Plan',
        pricePKR: 5000,
        audience: 'Individual agents and solo brokers',
        features: [
          'Trade License Verified Badge',
          'Basic Property Listing Indexing',
          'Standard Marketplace Visibility',
          'Single User Account',
          'Standard Support',
        ],
      },
      {
        name: 'Professional Plan',
        pricePKR: 15000,
        audience: 'Growing agencies needing AI Escrow & KYC tools',
        popular: true,
        features: [
          'Full AIEscrowGuard Document Verification',
          'Smart Escrow Milestone & Vault Tracker',
          'AI Legal SPA Contract Generator (PDF)',
          'Multi-Tenant Data Shielding (Shielded Deals)',
          'Co-Brokering Network & 50/50 Profit Split',
          'RERA / DLD Verified Agency Badge',
          'Priority Support',
        ],
      },
      {
        name: 'Enterprise Plan',
        pricePKR: 40000,
        audience: 'Large developers and enterprise real estate firms',
        features: [
          'Unlimited AI Document OCR & KYC Audits',
          'Custom Escrow Milestone Workflow Builder',
          'Priority AI Lead Cross-Matching Engine',
          'Zero Commission Cap on Co-Brokered Sales',
          'Dedicated Account Manager & API Access',
          'Custom Multi-Agency Franchise Ledger',
          '24/7 SLA Guarantee',
        ],
      },
    ],
    freePortals: [
      'Public Property Marketplace (/marketplace) — 100% free forever',
      'Architecture & Design Portal (/architects) — 100% free and open',
      'Public Property Listing Submission (/submit-listing) — 100% free',
    ],
    paidAccess: [
      'Investor Escrow Vault & Dashboard (/investors)',
      'Agency KYC & Escrow Management (/agency/dashboard)',
      'AIEscrowGuard Premium Document Scanning',
    ],
  },

  payment: {
    method: 'Direct Meezan Bank Transfer',
    accountTitle: 'Sharafat Ali',
    bank: 'Meezan Bank (PKR Current Account)',
    iban: 'PK67 MEZN 0011 3701 0985 0413',
    process: [
      '1. Select your subscription plan on /pricing or the Agency Dashboard.',
      '2. Transfer the PKR amount directly to the Meezan Bank account above.',
      '3. Upload your bank transfer screenshot (receipt) in the checkout modal.',
      '4. Enter your Transaction ID (TRX ID) from the bank transfer.',
      '5. Submit — admin verifies your receipt within 15–30 minutes.',
    ],
  },

  kyc: {
    supportedDocuments: ['NICOP (Overseas Pakistani)', 'Foreign Passport', 'Property Title Deed / Allotment Letter'],
    process:
      'The AIEscrowGuard scanner uses AI OCR to validate document authenticity. Uploading a document that does not match the selected category (e.g., a CNIC when Foreign Passport is selected) will trigger an instant Validation Failed error and block escrow certification.',
    crossValidation:
      'Document cross-validation is enforced. If category and document type mismatch, the system blocks verification with: "Validation Failed: Document type mismatch. Please upload the correct document."',
    statusTypes: ['Verification in Progress', 'Risk Score: Low', 'Escrow Secure', 'Validation Failed: Document Mismatch'],
  },

  escrow: {
    description:
      'The NexMove Smart Escrow Vault securely holds buyer funds in stage-gated milestones. Funds are released only when each milestone is verified and confirmed.',
    milestones: [
      { name: 'Stage 1: Legal Check', percentage: 20 },
      { name: 'Stage 2: Agreement Signing', percentage: 30 },
      { name: 'Stage 3: Property Handover', percentage: 50 },
    ],
    tokenPolicy:
      'When a buyer reserves a property, a Non-Refundable Token is placed in the NexMove Escrow Vault. Token payments are strictly non-refundable if the buyer cancels the deal.',
    legalContract:
      'The AI Legal Contract Generator produces a legally formatted PDF titled "NexMove AI-Secured Escrow Contract" with FBR FY2026-27 tax withholding integration, currency conversion details, and SBP Trustee Protocol compliance.',
  },

  dealShielding: {
    description:
      'All active deals, client communications, buyer identities, and private agency negotiations are 100% encrypted and isolated. Competing agencies cannot view, access, or intercept live deal pipelines.',
    mechanics: [
      'Client names and phone numbers are replaced with alias codes (e.g., Buyer #408).',
      'Only authorized agency admin accounts can unmask and view confidential deal notes.',
      'Deal rooms are end-to-end encrypted and never shared across agencies.',
      'Multi-tenant data isolation is enforced at the database level.',
    ],
    compliance: 'All deal shielding follows SBP (State Bank of Pakistan) Trustee Protocols and FBR data privacy regulations.',
  },

  agencyRegistration: {
    route: '/register',
    steps: [
      'Account Credentials: Full name, agency brand name, email, and a strong password (min 8 chars, 1 uppercase, 1 number).',
      'Overseas KYC (optional): NICOP number or Passport number for overseas Pakistani identity verification.',
      'Legal & Location: NTN (National Tax Number), physical address, and GPS coordinates (latitude/longitude).',
      'Branding Photos: Upload Agency Logo, Storefront front-facade photo, and Owner Identity photo.',
    ],
    requirements: [
      'NTN is required for AI legal contract generation and FBR compliance.',
      'Storefront and Owner photos must be real images (JPG/PNG/WEBP, max 5MB).',
      'Latitude must be between -90 and 90. Longitude between -180 and 180.',
      'Password requires at least 8 characters, 1 uppercase letter, and 1 number.',
    ],
    note: 'The Register button is disabled until all required fields pass strict format validation.',
  },

  investorPortal: {
    route: '/investors',
    description:
      'The Investor Portal serves overseas Pakistanis (NRPs), foreign nationals, and diaspora investors. It provides AI-powered escrow vaults, KYC verification, ROI tracking, tax calculators, and private deal rooms.',
    features: [
      'Portfolio & Contracts Dashboard',
      'Financial Ledger with FBR-compliant transaction history',
      'Smart Escrow Wallet with stage-gated milestone releases',
      'FBR Tax Calculator for property income (rental/capital gains)',
      'AI Document KYC Scanner (NICOP / Foreign Passport / Title Deed)',
      'AI Legal SPA Contract Generator',
      'Private Deal Room Scheduling with overseas investors',
    ],
    access: 'Requires active NexMove Professional or Enterprise subscription.',
  },

  architectPortal: {
    route: '/architects',
    description:
      '100% free and open portal for professional architects, 3D visualizers, BIM specialists, interior designers, and landscape architects to register and connect with agencies.',
    registration: '/architects/register',
    registrationRequirements: [
      'Full Name (letters only, no numbers)',
      'Email and Password (min 8 chars)',
      'Optional Phone in valid format (+92-300-XXXXXXX)',
      'PCATP / PEC / PILA / IAPD council license number',
      'Experience Years (0–60, numeric)',
      'Primary specialization (3D Visualizer, BIM Specialist, etc.)',
      'Portfolio Links (must be valid https:// URLs)',
    ],
    note: 'Architecture portal has zero paywall. No subscription required.',
  },

  marketplace: {
    route: '/marketplace',
    description: 'Public property marketplace — 100% free for all users. Browse, search, and inquire on properties without any account or subscription.',
    features: [
      'Search and filter properties by city, type, price',
      'View detailed property listings with AI-extracted specs',
      'Send direct WhatsApp inquiries to agencies',
      'Submit public property listings for free at /submit-listing',
    ],
  },

  formValidation: {
    description: 'NexMove enforces strict input validation across all forms to prevent garbage data.',
    rules: [
      'Name fields: letters, spaces, hyphens only — no numbers or special characters.',
      'Email: must follow standard format (user@domain.com).',
      'Phone: 10–15 digits, may include +, spaces, dashes — no letters.',
      'CNIC/NICOP: exactly 13 digits (XXXXX-XXXXXXX-X format accepted).',
      'Passport: 6–12 alphanumeric characters.',
      'NTN: 7–8 digits.',
      'Latitude: -90 to 90 numeric range.',
      'Longitude: -180 to 180 numeric range.',
      'Investment amount: minimum PKR 100,000.',
      'File uploads: must be valid image (JPG/PNG/WEBP) or document (PDF) — no random files.',
    ],
    submitLock: 'All submit buttons remain disabled until every required field passes its format validation check.',
  },

  coBrokering: {
    description:
      'The NexMove Co-Brokering Network allows agencies to share and access partner listings. When a deal closes jointly, commission is automatically split 50/50 between the listing and selling agencies.',
    access: 'Available on Professional Plan (PKR 15,000/month) and above.',
  },

  rentCollection: {
    description:
      'The Rent Collection module lets agencies generate official PDF invoices, record monthly payments, and send instant WhatsApp/SMS payment reminders to tenants.',
  },

  agencyDashboard: {
    route: '/agency/dashboard',
    features: [
      'Active and Archived Property Listings Management',
      'Shielded Deal Engine (client identity masking)',
      'AI Escrow Guard — Agency KYC & RERA License Verification',
      'Subscription Upgrade (Starter / Professional / Enterprise)',
      'Activity Center & Notifications',
    ],
  },

  privacy: {
    policy: '/privacy',
    summary: [
      'All personal data is encrypted at rest and in transit.',
      'Client identities within deal pipelines are masked behind alias codes.',
      'Data is never shared with competing agencies.',
      'GDPR-aligned data deletion rights are available on request.',
      'SBP Trustee Protocols govern all escrow and financial data.',
    ],
  },

  fbr: {
    year: 'FY2026-27',
    description: 'NexMove integrates FBR (Federal Board of Revenue) tax withholding rates for all rental income, capital gains, and property transfer transactions.',
    features: [
      'AI Tax Calculator for rental income withholding',
      'FBR-compliant transaction ledger for investors',
      'Capital gains tax estimation on property sales',
      'Automatic FBR tax fields embedded in AI legal contracts',
    ],
  },
}

// All platform topics and synonyms for fuzzy intent matching
export const INTENT_KEYWORDS = {
  subscription_pricing: ['plan', 'plans', 'pricing', 'price', 'subscription', 'tier', 'pkr', '5000', '15000', '40000', 'starter', 'professional', 'enterprise', 'upgrade', 'monthly', 'subscribe', 'plan kya', 'qeemat', 'kitna', 'kitne', 'price kya', 'subscription kya'],
  payment_bank: ['meezan', 'bank', 'transfer', 'iban', 'payment', 'receipt', 'trx', 'transaction', 'pay', 'bayment', 'paisa', 'paise', 'payment kaise', 'bank transfer', 'send money', 'bhejo'],
  registration_agency: ['register', 'signup', 'sign up', 'create account', 'agency register', 'registration', 'ntn', 'agency kaise', 'agency kaisy', 'register karna', 'account banana', 'new account', 'join'],
  kyc_documents: ['kyc', 'passport', 'nicop', 'cnic', 'document', 'verify', 'upload', 'scan', 'ocr', 'id', 'identity', 'document upload', 'doc', 'verification', 'nicop upload', 'passport upload', 'papers'],
  escrow: ['escrow', 'token', 'vault', 'milestone', 'stage', 'release', 'fund', 'reserve', 'refund', 'non-refundable', 'payment stage', 'escrow kya', 'token kya', 'funds', 'rukna', 'payment hold'],
  deal_shield: ['deal', 'shield', 'privacy', 'confidential', 'hidden', 'secret', 'mask', 'alias', 'encrypt', 'competing', 'rival', 'competitor', 'deal shield', 'deal kya', 'deal privacy', 'safe', 'secure deal', 'mehfooz'],
  investor_portal: ['investor', 'overseas', 'foreign', 'nrp', 'diaspora', 'abroad', 'uk', 'uae', 'usa', 'canada', 'dubai', 'investment', 'invest', 'invest karna', 'bahar sy', 'videshi', 'overseas investor'],
  architect: ['architect', 'designer', 'portfolio', 'bim', '3d', 'pcatp', 'pec', 'interior', 'landscape', 'visualization', 'render', 'revit', 'autocad'],
  marketplace: ['marketplace', 'property', 'listing', 'browse', 'search', 'buy', 'plot', 'house', 'apartment', 'villa', 'commercial', 'property dekhna', 'ghar', 'plot dekhna', 'property search'],
  form_errors: ['error', 'validation', 'incorrect format', 'format', 'field error', 'not working', 'button disabled', 'submit', 'form nahi', 'kyu nahi', 'issue', 'problem', 'galat'],
  dashboard_access: ['dashboard', 'login', 'access', 'panel', 'account', 'sign in', 'log in', 'portal', 'kaise login', 'dashboard access'],
  cobroker: ['co-broker', 'cobroker', 'partner', 'commission', 'split', '50/50', 'network', 'share listing', 'commission split', 'hissa'],
  rent: ['rent', 'tenant', 'invoice', 'collection', 'rental', 'monthly rent', 'kiraya', 'kiraya collection'],
  legal_contract: ['contract', 'agreement', 'legal', 'spa', 'pdf', 'agreement generate', 'contract generate', 'dastawez', 'contract banana'],
  fbr_tax: ['fbr', 'tax', 'withholding', 'capital gains', 'tax calculator', 'tax kya', 'kitna tax', 'property tax'],
  privacy: ['privacy', 'data', 'gdpr', 'personal data', 'security', 'safe', 'data safe', 'data protection', 'mera data', 'information safe'],
  greet: ['hello', 'hi', 'hey', 'salam', 'salaam', 'aoa', 'assalamu', 'good morning', 'good evening', 'namaste', 'help', 'assist'],
}
