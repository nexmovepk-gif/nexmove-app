/**
 * NexMove AI Chat Engine
 * Autonomous intent detection, language detection, and dynamic multi-language response generation.
 * Powered entirely by the NexMove platform knowledge base — no external API required.
 */

import { INTENT_KEYWORDS } from './nexmoveKnowledge'

export type Language = 'en' | 'roman_urdu' | 'urdu_script'
export type Intent = keyof typeof INTENT_KEYWORDS | 'unknown'

// ─── Language Detection ───────────────────────────────────────────────────────

/** Detect if text contains Urdu script (Unicode block U+0600–U+06FF) */
function hasUrduScript(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text)
}

/** Roman Urdu marker words — common Urdu words written in Latin script */
const ROMAN_URDU_MARKERS = [
  'kya', 'kaisy', 'kaise', 'karna', 'karo', 'karein', 'kar', 'mein',
  'aap', 'bhai', 'yaar', 'hain', 'hai', 'nahi', 'nai', 'hoga', 'hogi',
  'batao', 'bataiye', 'kitna', 'kitne', 'kahan', 'kab', 'kyun', 'kyunke',
  'please', 'plz', 'pls', 'acha', 'theek', 'shukriya', 'shukria', 'mehfuz',
  'mehfooz', 'bahar', 'kiraya', 'paisa', 'paise', 'ghar', 'plot', 'mujhe',
  'humein', 'hamara', 'ap', 'apka', 'inki', 'unka', 'jaise', 'tou', 'to',
  'bana', 'banana', 'dekhna', 'samajh', 'salam', 'aoa', 'bhejo', 'bhejein',
]

export function detectLanguage(text: string): Language {
  if (hasUrduScript(text)) return 'urdu_script'
  const lower = text.toLowerCase()
  const wordCount = lower.split(/\s+/).length
  const markerCount = ROMAN_URDU_MARKERS.filter((m) => lower.includes(m)).length
  // If 25%+ of words are Roman Urdu markers or at least 2 markers in short text
  if (markerCount >= 2 || (wordCount <= 6 && markerCount >= 1)) return 'roman_urdu'
  return 'en'
}

// ─── Intent Detection ─────────────────────────────────────────────────────────

export function detectIntent(text: string): Intent {
  const lower = text.toLowerCase()
  let bestIntent: Intent = 'unknown'
  let bestScore = 0

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const score = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0)
    if (score > bestScore) {
      bestScore = score
      bestIntent = intent as Intent
    }
  }

  return bestScore > 0 ? bestIntent : 'unknown'
}

// ─── Response Engine ──────────────────────────────────────────────────────────


type Responses = {
  en: string
  roman_urdu: string
  urdu_script: string
}

function fmt(responses: Responses, lang: Language): string {
  return responses[lang]
}

export function generateResponse(intent: Intent, lang: Language): string {
  switch (intent) {

    case 'greet':
      return fmt({
        en: `Hello! Welcome to NexMove — Pakistan's AI-Powered PropTech Ecosystem. 🏙️\n\nI'm your NexMove Support AI. I can assist you with:\n• Subscription plans & pricing\n• Agency / Investor / Architect registration\n• Escrow & KYC document verification\n• Meezan Bank payment process\n• Deal shielding & data privacy\n• Platform navigation & troubleshooting\n\nWhat can I help you with today?`,
        roman_urdu: `Assalam-o-Alaikum! NexMove mein khush aamdeed! 🏙️\n\nMein aapka NexMove Support AI hoon. Mein in cheezon mein madad kar sakta hoon:\n• Subscription plans aur pricing\n• Agency / Investor / Architect registration\n• Escrow aur KYC document verification\n• Meezan Bank payment ka tareeqa\n• Deal shielding aur data privacy\n\nAap kya jaanna chahte hain?`,
        urdu_script: `السلام علیکم! نیکس موو میں خوش آمدید! 🏙️\n\nمیں آپ کا NexMove Support AI ہوں۔ میں ان موضوعات میں مدد کر سکتا ہوں:\n• سبسکرپشن پلان اور قیمتیں\n• ایجنسی / سرمایہ کار / آرکیٹیکٹ رجسٹریشن\n• ایسکرو اور KYC دستاویز تصدیق\n• میزان بینک ادائیگی\n• ڈیل شیلڈنگ اور ڈیٹا پرائیویسی\n\nآپ کیا جاننا چاہتے ہیں؟`,
      }, lang)

    case 'subscription_pricing': {
      return fmt({
        en: `📦 NexMove Subscription Plans:\n\n🥈 Starter Plan — PKR 5,000/month\nFor individual agents: Basic listing indexing, standard marketplace visibility.\n\n🥇 Professional Plan — PKR 15,000/month ⭐ Most Popular\nFor growing agencies: Full AIEscrowGuard, Smart Escrow Vault, AI Legal SPA Contracts, 50/50 Co-Brokering, RERA badge.\n\n💎 Enterprise Plan — PKR 40,000/month\nFor large developers: Unlimited KYC audits, zero commission cap, dedicated account manager.\n\n✅ Public Marketplace, Architect Portal, and Public Listings are 100% FREE.\n\nVisit /pricing to subscribe via direct Meezan Bank transfer.`,
        roman_urdu: `📦 NexMove Subscription Plans:\n\n🥈 Starter Plan — PKR 5,000/maah\nIndividual agents ke liye: Basic listing indexing.\n\n🥇 Professional Plan — PKR 15,000/maah ⭐ Sab se Zyada Popular\nBarhti hui agencies ke liye: AIEscrowGuard, Smart Escrow Vault, AI Legal Contracts, 50/50 Co-Brokering.\n\n💎 Enterprise Plan — PKR 40,000/maah\nBaray developers ke liye: Unlimited KYC, zero commission cap.\n\n✅ Public Marketplace, Architect Portal aur Public Listings bilkul FREE hain.\n\n/pricing par ja kar Meezan Bank ke zariye subscribe karein.`,
        urdu_script: `📦 نیکس موو سبسکرپشن پلان:\n\n🥈 اسٹارٹر پلان — PKR 5,000/ماہ\nانفرادی ایجنٹس کے لیے: بنیادی لسٹنگ انڈیکسنگ۔\n\n🥇 پروفیشنل پلان — PKR 15,000/ماہ ⭐ سب سے مقبول\nبڑھتی ہوئی ایجنسیوں کے لیے: AIEscrowGuard، اسمارٹ ایسکرو والٹ، AI لیگل کنٹریکٹس۔\n\n💎 انٹرپرائز پلان — PKR 40,000/ماہ\nبڑے ڈویلپرز کے لیے: لامحدود KYC، صفر کمیشن کیپ۔\n\n✅ پبلک مارکیٹ پلیس، آرکیٹیکٹ پورٹل اور پبلک لسٹنگ بالکل مفت ہیں۔`,
      }, lang)
    }

    case 'payment_bank':
      return fmt({
        en: `🏦 NexMove Payment — Direct Meezan Bank Transfer:\n\n• Account Title: Sharafat Ali\n• Bank: Meezan Bank (PKR Current Account)\n• IBAN: PK67 MEZN 0011 3701 0985 0413\n\nHow to pay:\n1. Transfer your plan amount to the account above.\n2. Visit /pricing and click your selected plan.\n3. Upload your bank receipt screenshot.\n4. Enter your Transaction ID (TRX ID).\n5. Submit — admin verifies within 15–30 minutes.\n\nYour subscription is provisionally activated immediately after submission.`,
        roman_urdu: `🏦 NexMove Payment — Meezan Bank Direct Transfer:\n\n• Account Title: Sharafat Ali\n• Bank: Meezan Bank (PKR Current Account)\n• IBAN: PK67 MEZN 0011 3701 0985 0413\n\nPayment ka tareeqa:\n1. Apni plan ki raqam upar wale account mein transfer karein.\n2. /pricing par jayein aur apna plan select karein.\n3. Bank receipt ka screenshot upload karein.\n4. Apna Transaction ID (TRX ID) darj karein.\n5. Submit karein — admin 15–30 minute mein verify karega.\n\nSubmit ke baad subscription foran activate ho jata hai.`,
        urdu_script: `🏦 نیکس موو ادائیگی — میزان بینک براہ راست ٹرانسفر:\n\n• اکاؤنٹ ٹائٹل: شرافت علی\n• بینک: میزان بینک (PKR کرنٹ اکاؤنٹ)\n• IBAN: PK67 MEZN 0011 3701 0985 0413\n\nادائیگی کا طریقہ:\n1. اپنی پلان کی رقم اوپر والے اکاؤنٹ میں منتقل کریں۔\n2. /pricing پر جائیں اور اپنا پلان منتخب کریں۔\n3. بینک رسید کا اسکرین شاٹ اپ لوڈ کریں۔\n4. اپنا Transaction ID (TRX ID) درج کریں۔\n5. جمع کریں — ایڈمن 15–30 منٹ میں تصدیق کرے گا۔`,
      }, lang)

    case 'registration_agency':
      return fmt({
        en: `🏢 How to Register Your Agency on NexMove:\n\nGo to /register and complete:\n1. Full Name, Agency Brand Name, Email, and a strong password (8+ chars, 1 uppercase, 1 number).\n2. Optional: NICOP or Passport number for overseas KYC.\n3. NTN (National Tax Number), physical office address, and GPS coordinates.\n4. Upload Agency Logo, Storefront photo, and Owner identity photo (JPG/PNG/WEBP, max 5MB each).\n\n⚠️ The Register button stays disabled until all fields pass format validation. All photos must be real images — random files are rejected.\n\nNeed a plan? Visit /pricing to activate Agency KYC tools.`,
        roman_urdu: `🏢 Agency NexMove par kaise register karein:\n\n/register par jayein aur yeh steps follow karein:\n1. Full Name, Agency Name, Email aur strong password (8+ letters, 1 capital, 1 number).\n2. Optional: NICOP ya Passport number overseas KYC ke liye.\n3. NTN, office ka address, aur GPS coordinates.\n4. Agency Logo, Storefront photo, aur Owner ki photo upload karein (JPG/PNG, max 5MB).\n\n⚠️ Register button tab tak disable rehega jab tak sab fields sahi format mein nahi honge.\n\nPlan chahiye? /pricing par jayen subscription activate karne ke liye.`,
        urdu_script: `🏢 NexMove پر ایجنسی رجسٹر کیسے کریں:\n\n/register پر جائیں اور یہ اقدامات کریں:\n1. پورا نام، ایجنسی کا نام، ای میل اور مضبوط پاس ورڈ۔\n2. اختیاری: NICOP یا پاسپورٹ نمبر بیرون ملک KYC کے لیے۔\n3. NTN، دفتر کا پتہ اور GPS کوآرڈینیٹس۔\n4. ایجنسی لوگو، سٹور فرنٹ فوٹو اور مالک کی تصویر اپ لوڈ کریں (زیادہ سے زیادہ 5MB)۔\n\n⚠️ رجسٹر بٹن تب تک غیر فعال رہے گا جب تک تمام فیلڈز درست فارمیٹ میں نہ ہوں۔`,
      }, lang)

    case 'kyc_documents':
      return fmt({
        en: `🛡️ NexMove AI Document KYC Verification:\n\nSupported Documents:\n• NICOP (Overseas Pakistani)\n• Foreign Passport\n• Property Title Deed / Allotment Letter\n\nHow it works:\n1. Open the AIEscrowGuard scanner in your Investor or Agency dashboard.\n2. Select the correct document category from the left panel.\n3. Upload your document — the AI OCR engine validates it instantly.\n\n⚠️ Critical Rule: If you select "Foreign Passport" but upload a CNIC or wrong document, the system shows:\n"Validation Failed: Document type mismatch. Please upload a valid Passport document."\n\nOnly a correctly matched document unlocks "Escrow Secure" and "Risk Score: Low" status.`,
        roman_urdu: `🛡️ NexMove AI Document KYC Verification:\n\nSupported Documents:\n• NICOP (Overseas Pakistani)\n• Foreign Passport\n• Property Title Deed / Allotment Letter\n\nKaise kaam karta hai:\n1. Investor ya Agency dashboard mein AIEscrowGuard scanner kholen.\n2. Bayin taraf se sahi document category select karein.\n3. Document upload karein — AI OCR foran check karega.\n\n⚠️ Zaroori rule: Agar aap "Foreign Passport" select karen aur CNIC upload karein toh:\n"Validation Failed: Document type mismatch. Please upload a valid Passport document."\n\nSirf sahi document match hone par "Escrow Secure" status milta hai.`,
        urdu_script: `🛡️ نیکس موو AI دستاویز KYC تصدیق:\n\nقابل قبول دستاویزات:\n• NICOP (بیرون ملک پاکستانی)\n• غیر ملکی پاسپورٹ\n• پراپرٹی ٹائٹل ڈیڈ / الاٹمنٹ لیٹر\n\nکیسے کام کرتا ہے:\n1. Investor یا Agency ڈیش بورڈ میں AIEscrowGuard اسکینر کھولیں۔\n2. بائیں پینل سے صحیح دستاویز کیٹیگری منتخب کریں۔\n3. دستاویز اپ لوڈ کریں — AI OCR فوری تصدیق کرے گا۔\n\n⚠️ اہم اصول: اگر آپ غلط دستاویز اپ لوڈ کریں تو خودکار خامی پیغام آئے گا اور ایسکرو تصدیق بلاک ہو جائے گی۔`,
      }, lang)

    case 'escrow':
      return fmt({
        en: `🔒 NexMove Smart Escrow Vault:\n\nFunds are held securely in stage-gated milestones:\n• Stage 1: Legal Check — 20% released\n• Stage 2: Agreement Signing — 30% released\n• Stage 3: Property Handover — 50% released\n\n⚠️ Token Policy: When a buyer reserves a property, a Non-Refundable Token is placed in the Escrow Vault. If the buyer cancels, the token is NOT refunded.\n\n📄 AI Legal Contract: The system auto-generates a legally formatted "NexMove AI-Secured Escrow Contract" PDF with FBR FY2026-27 tax integration and SBP Trustee Protocol compliance.`,
        roman_urdu: `🔒 NexMove Smart Escrow Vault:\n\nFunds stage-by-stage release hoti hain:\n• Stage 1: Legal Check — 20% release\n• Stage 2: Agreement Signing — 30% release\n• Stage 3: Property Handover — 50% release\n\n⚠️ Token Policy: Jab buyer property reserve karta hai toh Non-Refundable Token Escrow Vault mein jata hai. Cancel karne par token wapis NAHI hoga.\n\n📄 AI Legal Contract: System khud "NexMove AI-Secured Escrow Contract" PDF banata hai jis mein FBR FY2026-27 tax aur SBP Trustee Protocol shamil hai.`,
        urdu_script: `🔒 نیکس موو اسمارٹ ایسکرو والٹ:\n\nفنڈز مرحلہ وار جاری ہوتے ہیں:\n• مرحلہ 1: قانونی جانچ — 20% جاری\n• مرحلہ 2: معاہدہ دستخط — 30% جاری\n• مرحلہ 3: جائیداد کی حوالگی — 50% جاری\n\n⚠️ ٹوکن پالیسی: جب خریدار جائیداد محفوظ کرتا ہے تو نان ریفنڈ ایبل ٹوکن ایسکرو والٹ میں جاتا ہے۔ منسوخی پر ٹوکن واپس نہیں ہوگا۔\n\n📄 AI قانونی کنٹریکٹ: سسٹم خود بخود "NexMove AI-Secured Escrow Contract" PDF تیار کرتا ہے۔`,
      }, lang)

    case 'deal_shield':
      return fmt({
        en: `🛡️ NexMove Deal Shielding & Privacy:\n\nAll active deals, buyer identities, and private negotiations are 100% encrypted and isolated:\n\n• Client names and phone numbers are replaced with alias codes (e.g., Buyer #408).\n• Only authorized agency admins can unmask confidential deal notes.\n• Deal rooms are end-to-end encrypted — competing agencies have ZERO access.\n• Multi-tenant data isolation is enforced at the database level.\n• Compliance: SBP Trustee Protocols + FBR data privacy regulations.\n\nYour deals, client lists, and negotiations are NEVER visible to other agencies on the platform.`,
        roman_urdu: `🛡️ NexMove Deal Shielding aur Privacy:\n\nSare active deals, buyer ki identity, aur private negotiations 100% encrypted aur alag hain:\n\n• Client ke naam aur phone number alias codes se chhup jate hain (e.g., Buyer #408).\n• Sirf authorized agency admin hi confidential notes dekh sakta hai.\n• Deal rooms end-to-end encrypted hain — koi competing agency access NAHI kar sakti.\n• Database level par multi-tenant data isolation hai.\n\nAapke deals kabhi bhi doosri agencies ko nazar NAHI aate.`,
        urdu_script: `🛡️ نیکس موو ڈیل شیلڈنگ اور پرائیویسی:\n\nتمام فعال ڈیلز، خریداروں کی شناخت اور نجی مذاکرات 100% خفیہ اور محفوظ ہیں:\n\n• کلائنٹ کے نام اور فون نمبر عرفی ناموں سے چھپے رہتے ہیں۔\n• صرف مجاز ایجنسی ایڈمن ہی خفیہ نوٹس دیکھ سکتا ہے۔\n• ڈیل رومز اینڈ ٹو اینڈ خفیہ ہیں — کوئی مقابل ایجنسی رسائی حاصل نہیں کر سکتی۔\n\nآپ کی ڈیلز کبھی بھی دوسری ایجنسیوں کو نظر نہیں آتیں۔`,
      }, lang)

    case 'investor_portal':
      return fmt({
        en: `🌐 NexMove Investor Portal (/investors):\n\nDesigned for Overseas Pakistanis (NRPs), foreign nationals, and diaspora investors. Features:\n\n• AI KYC Document Scanner (NICOP / Foreign Passport / Title Deed)\n• Portfolio & Contracts Dashboard\n• Financial Ledger (FBR-compliant transaction history)\n• Smart Escrow Wallet (stage-gated milestone releases)\n• FBR Tax Calculator (rental income / capital gains)\n• AI Legal SPA Contract Generator\n• Private Deal Rooms with overseas investor scheduling\n\n📋 Access requires an active Professional (PKR 15,000) or Enterprise (PKR 40,000) subscription.\n\nPayment via Meezan Bank — visit /pricing to subscribe.`,
        roman_urdu: `🌐 NexMove Investor Portal (/investors):\n\nOverseas Pakistanis (NRPs), foreign investors, aur diaspora ke liye:\n\n• AI KYC Document Scanner (NICOP / Foreign Passport / Title Deed)\n• Portfolio aur Contracts Dashboard\n• Financial Ledger (FBR-compliant transactions)\n• Smart Escrow Wallet (stage-by-stage fund release)\n• FBR Tax Calculator (rental income / capital gains)\n• AI Legal SPA Contract Generator\n• Private Deal Rooms\n\n📋 Access ke liye Professional (PKR 15,000) ya Enterprise (PKR 40,000) subscription chahiye.\n\n/pricing par jayein subscribe karne ke liye.`,
        urdu_script: `🌐 نیکس موو انوسٹر پورٹل (/investors):\n\nبیرون ملک پاکستانیوں اور غیر ملکی سرمایہ کاروں کے لیے:\n\n• AI KYC دستاویز اسکینر\n• پورٹ فولیو اور کنٹریکٹس ڈیش بورڈ\n• مالی لیجر (FBR تعمیل)\n• اسمارٹ ایسکرو والٹ\n• FBR ٹیکس کیلکولیٹر\n• AI قانونی SPA کنٹریکٹ\n• نجی ڈیل رومز\n\n📋 رسائی کے لیے پروفیشنل (PKR 15,000) یا انٹرپرائز (PKR 40,000) سبسکرپشن درکار ہے۔`,
      }, lang)

    case 'architect':
      return fmt({
        en: `🏛️ NexMove Architecture & Design Portal (/architects):\n\n100% FREE — No subscription required. Open to:\n• 3D Visualizers, BIM Specialists, Revit Technicians\n• Interior Designers, Landscape Architects\n\nTo join, go to /architects/register and provide:\n• Full Name, Email, Password (8+ chars)\n• PCATP / PEC / PILA / IAPD council license number\n• Experience years (0–60)\n• Primary specialization and software stack\n• Portfolio links (must be valid https:// URLs)\n\nYour verified profile will be listed in the NexMove Architect Directory for agencies to discover and send Design Proposal Requests.`,
        roman_urdu: `🏛️ NexMove Architecture & Design Portal (/architects):\n\n100% MUFT — Koi subscription nahi chahiye. In ke liye open hai:\n• 3D Visualizers, BIM Specialists, Revit Technicians\n• Interior Designers, Landscape Architects\n\nJoin karne ke liye /architects/register par jayein:\n• Full Name, Email, Password (8+ characters)\n• PCATP / PEC / PILA / IAPD license number\n• Experience years\n• Specialization aur portfolio links (sahi https:// URL honi chahiye)\n\nVerified profile agencies ko mil jayega aur woh Design Proposals bhej sakte hain.`,
        urdu_script: `🏛️ نیکس موو آرکیٹیکچر پورٹل (/architects):\n\n100% مفت — کوئی سبسکرپشن نہیں۔ ان کے لیے کھلا ہے:\n• 3D ویژوالائزرز، BIM ماہرین، Revit ٹیکنیشن\n• انٹیریر ڈیزائنرز، لینڈ اسکیپ آرکیٹیکٹس\n\n/architects/register پر جائیں اور درج کریں:\n• پورا نام، ای میل، پاس ورڈ\n• PCATP / PEC کونسل لائسنس نمبر\n• تجربے کے سال اور پورٹ فولیو لنکس\n\nتصدیق شدہ پروفائل ایجنسیوں کو نظر آئے گی۔`,
      }, lang)

    case 'marketplace':
      return fmt({
        en: `🏘️ NexMove Public Marketplace (/marketplace):\n\n100% FREE — No account or subscription needed.\n\n• Browse and search properties by city, type, price range\n• View AI-extracted property details (bedrooms, sqft, price)\n• Send direct WhatsApp inquiries to listing agencies\n• Submit your own property for free at /submit-listing\n\nPremium listings with verified agency badges and priority placement are available to Professional and Enterprise plan subscribers.`,
        roman_urdu: `🏘️ NexMove Public Marketplace (/marketplace):\n\n100% MUFT — Koi account ya subscription nahi chahiye.\n\n• Properties search karein city, type, price ke mutabiq\n• AI-extracted property details dekhein (rooms, sqft, qeemat)\n• Agency ko seedha WhatsApp inquiry bhejein\n• Apni property free mein /submit-listing par daalein\n\nProfessional aur Enterprise plan subscribers ko priority listing placement milti hai.`,
        urdu_script: `🏘️ نیکس موو پبلک مارکیٹ پلیس (/marketplace):\n\n100% مفت — کوئی اکاؤنٹ یا سبسکرپشن نہیں چاہیے۔\n\n• شہر، قسم اور قیمت کے مطابق جائیدادیں تلاش کریں\n• AI سے نکالی گئی تفصیلات دیکھیں\n• ایجنسی کو براہ راست WhatsApp پر رابطہ کریں\n• /submit-listing پر مفت اپنی جائیداد پوسٹ کریں`,
      }, lang)

    case 'form_errors':
      return fmt({
        en: `⚠️ Troubleshooting Form Validation Errors on NexMove:\n\nCommon issues and fixes:\n\n• "Incorrect format detected" in Name field → Remove numbers or special characters. Only letters, spaces, and hyphens allowed.\n• Email error → Ensure format is user@domain.com.\n• Password error → Must be 8+ characters, include 1 uppercase letter and 1 number.\n• Phone error → 10–15 digits only. No letters. You can include +, spaces, dashes.\n• CNIC/NICOP error → Must be exactly 13 digits (e.g., 35201-1234567-1).\n• File upload error → Only JPG, PNG, WEBP images accepted. Random files (EXE, TXT, etc.) are blocked.\n• Submit button disabled → All required fields must pass validation before the button activates.\n• Coordinates error → Latitude: -90 to 90. Longitude: -180 to 180.`,
        roman_urdu: `⚠️ NexMove Form Errors ka hal:\n\nCommon masail aur unka hal:\n\n• Name mein "Incorrect format detected" → Sirf letters, spaces, aur hyphens likhen. Numbers allowed nahi.\n• Email error → Format hona chahiye: user@domain.com.\n• Password error → 8+ characters, 1 capital letter, aur 1 number zaroor ho.\n• Phone error → Sirf 10–15 digits. Koi letters nahi. +, spaces, dashes theek hain.\n• CNIC/NICOP error → Bilkul 13 digits hone chahiye (e.g., 35201-1234567-1).\n• File upload error → Sirf JPG, PNG, WEBP images qabool hoti hain. Random files reject ho jati hain.\n• Submit button disable → Sab fields sahi hone chahiye pehle.`,
        urdu_script: `⚠️ نیکس موو فارم غلطیوں کا حل:\n\nعام مسائل اور ان کا حل:\n\n• نام میں "Incorrect format detected" → صرف حروف، خالی جگہ اور ہائفن لکھیں۔\n• ای میل خامی → فارمیٹ ہونا چاہیے: user@domain.com۔\n• پاس ورڈ خامی → 8+ حروف، 1 بڑا حرف اور 1 نمبر ضروری۔\n• فون خامی → صرف 10–15 ہندسے۔\n• CNIC خامی → بالکل 13 ہندسے ہونے چاہئیں۔\n• فائل اپ لوڈ خامی → صرف JPG، PNG، WEBP تصاویر قبول ہیں۔\n• سبمٹ بٹن غیر فعال → تمام فیلڈز درست ہونی چاہئیں پہلے۔`,
      }, lang)

    case 'dashboard_access':
      return fmt({
        en: `🔑 Accessing Your NexMove Dashboard:\n\n• Agency Dashboard: /agency/dashboard — Manage listings, deals, KYC, co-brokering, and subscriptions.\n• Investor Portal: /investors — Portfolio, escrow wallet, tax calculator, private deal rooms.\n• Admin Panel: /admin/dashboard — Platform management (admin accounts only).\n\nTo log in: Go to /login with your registered email and password.\nNew agency? Register at /register.\n\nIf your account is suspended or access is blocked, it may be due to an expired or unverified subscription. Visit /pricing to renew.`,
        roman_urdu: `🔑 NexMove Dashboard kaise access karein:\n\n• Agency Dashboard: /agency/dashboard — Listings, deals, KYC, aur subscriptions manage karein.\n• Investor Portal: /investors — Portfolio, escrow wallet, tax calculator.\n• Admin Panel: /admin/dashboard — Sirf admin accounts ke liye.\n\nLogin ke liye /login par jayein apni email aur password se.\nNaya account? /register par jayein.\n\nAgar access block hai, subscription expire ho sakti hai. /pricing par jayein renew karne ke liye.`,
        urdu_script: `🔑 نیکس موو ڈیش بورڈ تک رسائی:\n\n• ایجنسی ڈیش بورڈ: /agency/dashboard\n• انوسٹر پورٹل: /investors\n• ایڈمن پینل: /admin/dashboard (صرف ایڈمن)\n\nلاگ ان کے لیے /login پر جائیں۔\nنیا اکاؤنٹ؟ /register پر جائیں۔\n\nاگر رسائی بلاک ہے تو سبسکرپشن ختم ہو سکتی ہے۔ /pricing پر جائیں۔`,
      }, lang)

    case 'cobroker':
      return fmt({
        en: `🤝 NexMove Co-Brokering Network:\n\nAgencies on the Professional or Enterprise plan can access the Co-Brokering Network:\n\n• Search and view partner agency listings\n• Collaborate on joint deals across the platform\n• When a co-brokered deal closes, commission is automatically split 50/50 between the listing and selling agencies\n\n✅ Available on: Professional Plan (PKR 15,000/month) and Enterprise Plan (PKR 40,000/month).\n\nNote: All co-brokered deal communications remain shielded — no personal client data is shared between agencies.`,
        roman_urdu: `🤝 NexMove Co-Brokering Network:\n\nProfessional ya Enterprise plan wali agencies Co-Brokering Network use kar sakti hain:\n\n• Partner agencies ki listings dekh sakte hain\n• Joint deals par collaborate kar sakte hain\n• Deal close hone par commission 50/50 automatic split hoti hai\n\n✅ Available hai: Professional (PKR 15,000/maah) aur Enterprise (PKR 40,000/maah) par.\n\nNote: Co-brokered deals mein bhi client ki identity shield rahti hai — doosri agency ko client ka data nahi milta.`,
        urdu_script: `🤝 نیکس موو کو-بروکرنگ نیٹ ورک:\n\nپروفیشنل یا انٹرپرائز پلان والی ایجنسیاں Co-Brokering Network استعمال کر سکتی ہیں:\n\n• پارٹنر ایجنسیوں کی لسٹنگ دیکھ سکتے ہیں\n• مشترکہ ڈیلز پر تعاون کر سکتے ہیں\n• ڈیل بند ہونے پر کمیشن 50/50 خودبخود تقسیم ہوتی ہے\n\n✅ دستیاب: پروفیشنل (PKR 15,000/ماہ) اور انٹرپرائز (PKR 40,000/ماہ)۔`,
      }, lang)

    case 'rent':
      return fmt({
        en: `🏠 NexMove Rent Collection Module:\n\nAvailable in your Agency Dashboard under Rent Collection:\n\n• Record monthly rent payments for each tenant\n• Generate official PDF invoices branded with your agency logo\n• Send instant WhatsApp or SMS payment reminders to tenants\n• Track payment history and overdue amounts per property\n\nThis module is available to all subscribed agency accounts.`,
        roman_urdu: `🏠 NexMove Rent Collection Module:\n\nAgency Dashboard ke Rent Collection section mein:\n\n• Har tenant ke monthly rent payments record karein\n• Agency logo ke sath official PDF invoices generate karein\n• Tenants ko WhatsApp ya SMS payment reminders bhejein\n• Payment history aur baqi rakam track karein\n\nYeh module sab subscribed agencies ke liye available hai.`,
        urdu_script: `🏠 نیکس موو کرایہ وصولی ماڈیول:\n\nایجنسی ڈیش بورڈ میں کرایہ وصولی سیکشن میں:\n\n• ہر کرایہ دار کی ماہانہ ادائیگیاں ریکارڈ کریں\n• آفیشل PDF انوائسز بنائیں\n• WhatsApp یا SMS یاد دہانیاں بھیجیں\n• ادائیگی کی تاریخ ٹریک کریں`,
      }, lang)

    case 'legal_contract':
      return fmt({
        en: `📄 AI Legal SPA Contract Generator:\n\nNexMove automatically generates a legally formatted PDF titled:\n"NexMove AI-Secured Escrow Contract"\n\nIncludes:\n• Buyer and Seller identity fields\n• Property description and agreed price\n• FBR FY2026-27 tax withholding integration\n• Currency conversion rates (PKR / USD / AED / GBP)\n• SBP Trustee Protocol compliance clauses\n• Escrow milestone payment schedule\n\nAvailable to Professional and Enterprise plan subscribers in the Investor Portal and Agency Dashboard.`,
        roman_urdu: `📄 AI Legal SPA Contract Generator:\n\nNexMove khud-ba-khud ek legally formatted PDF banata hai:\n"NexMove AI-Secured Escrow Contract"\n\nIs mein shamil hai:\n• Buyer aur Seller ki identity\n• Property ka description aur agreed price\n• FBR FY2026-27 tax withholding\n• Currency conversion (PKR / USD / AED / GBP)\n• SBP Trustee Protocol\n• Escrow milestone payment schedule\n\nProfessional aur Enterprise plan subscribers ke liye available hai.`,
        urdu_script: `📄 AI قانونی SPA کنٹریکٹ جنریٹر:\n\nنیکس موو خودبخود قانونی طور پر فارمیٹ شدہ PDF تیار کرتا ہے:\n"NexMove AI-Secured Escrow Contract"\n\nاس میں شامل ہے:\n• خریدار اور فروخت کنندہ کی شناخت\n• جائیداد کی تفصیل اور متفقہ قیمت\n• FBR FY2026-27 ٹیکس ودہولڈنگ\n• کرنسی کنورژن\n• SBP ٹرسٹی پروٹوکول`,
      }, lang)

    case 'fbr_tax':
      return fmt({
        en: `🧮 FBR Tax Integration (FY2026-27):\n\nNexMove is fully integrated with FBR (Federal Board of Revenue) tax rates:\n\n• Rental Income Withholding Tax — calculated automatically in the Investor Tax Calculator\n• Capital Gains Tax — estimated on property resale transactions\n• Property Transfer Tax — embedded in AI Legal Contracts\n• FBR-Compliant Transaction Ledger — all investor transactions are recorded with FBR reference\n\nAccess the Tax Calculator in your Investor Portal (/investors) under the Tax Calculator tab.`,
        roman_urdu: `🧮 FBR Tax Integration (FY2026-27):\n\nNexMove FBR ke sath fully integrated hai:\n\n• Rental Income Withholding Tax — Investor Tax Calculator mein automatic calculate hota hai\n• Capital Gains Tax — property sale par estimate milta hai\n• Property Transfer Tax — AI Legal Contracts mein shamil hai\n• FBR-Compliant Transaction Ledger — sab transactions FBR reference ke sath record hoti hain\n\nInvestor Portal (/investors) ke Tax Calculator tab mein access karein.`,
        urdu_script: `🧮 FBR ٹیکس انٹیگریشن (FY2026-27):\n\nنیکس موو FBR کے ساتھ مکمل طور پر مربوط ہے:\n\n• کرایہ آمدن ودہولڈنگ ٹیکس\n• سرمایہ کاری فوائد ٹیکس\n• جائیداد منتقلی ٹیکس\n• FBR تعمیل لین دین لیجر\n\nانوسٹر پورٹل (/investors) میں ٹیکس کیلکولیٹر ٹیب میں رسائی حاصل کریں۔`,
      }, lang)

    case 'privacy':
      return fmt({
        en: `🔐 NexMove Privacy & Data Security:\n\n• All personal data is encrypted at rest and in transit (TLS/AES-256).\n• Client identities within deal pipelines are masked behind alias codes.\n• Personal data is NEVER shared with competing agencies.\n• GDPR-aligned data deletion rights — contact support to request deletion.\n• SBP (State Bank of Pakistan) Trustee Protocols govern all escrow and financial data.\n• FBR data privacy regulations are strictly followed for all tax records.\n\nYour data, deals, and client information are safe, private, and secure on NexMove.`,
        roman_urdu: `🔐 NexMove Privacy aur Data Security:\n\n• Sab personal data encrypted hai (TLS/AES-256).\n• Deal pipelines mein client ki identity alias codes se chhupti hai.\n• Personal data kabhi bhi doosri agencies ke sath share NAHI hoti.\n• GDPR rights — data deletion ke liye support se contact karein.\n• SBP Trustee Protocols escrow aur financial data ko govern karte hain.\n\nAapka data, deals, aur client information NexMove par bilkul mehfooz hain.`,
        urdu_script: `🔐 نیکس موو پرائیویسی اور ڈیٹا سیکیورٹی:\n\n• تمام ذاتی ڈیٹا خفیہ ہے۔\n• ڈیل پائپ لائنز میں کلائنٹ کی شناخت عرفی ناموں سے چھپتی ہے۔\n• ذاتی ڈیٹا کبھی بھی دوسری ایجنسیوں کے ساتھ شیئر نہیں ہوتا۔\n• GDPR حقوق — حذف کرنے کے لیے سپورٹ سے رابطہ کریں۔\n• SBP ٹرسٹی پروٹوکولز ایسکرو ڈیٹا کو کنٹرول کرتے ہیں۔`,
      }, lang)

    default:
      return fmt({
        en: `I'm here to help with any NexMove platform question. Here are topics I can assist with:\n\n🏦 Subscription & Pricing (PKR 5k / 15k / 40k)\n🏦 Meezan Bank payment process\n🏢 Agency, Investor, Architect registration\n🛡️ AIEscrowGuard & KYC verification\n🔒 Smart Escrow Vault & milestone releases\n🛡️ Deal Shielding & data privacy\n🌐 Investor Portal (NRPs & overseas Pakistanis)\n🤝 Co-Brokering Network\n🧮 FBR Tax Calculator\n📄 AI Legal Contract Generator\n⚠️ Form validation troubleshooting\n\nPlease rephrase your question or choose one of the quick topics above.`,
        roman_urdu: `Mein NexMove ke baare mein kisi bhi sawaal mein madad kar sakta hoon. Yeh topics hain jin mein mein assist kar sakta hoon:\n\n🏦 Subscription & Pricing (PKR 5k / 15k / 40k)\n🏦 Meezan Bank payment\n🏢 Agency, Investor, Architect registration\n🛡️ AIEscrowGuard & KYC verification\n🔒 Smart Escrow Vault\n🛡️ Deal Shielding & privacy\n🌐 Investor Portal (overseas Pakistanis ke liye)\n🤝 Co-Brokering Network\n🧮 FBR Tax Calculator\n📄 AI Legal Contract\n⚠️ Form errors ka hal\n\nApna sawaal dobara poochhein ya upar se topic choose karein.`,
        urdu_script: `میں نیکس موو کے بارے میں کسی بھی سوال میں مدد کر سکتا ہوں:\n\n🏦 سبسکرپشن اور قیمتیں (PKR 5k / 15k / 40k)\n🏦 میزان بینک ادائیگی\n🏢 ایجنسی، انوسٹر، آرکیٹیکٹ رجسٹریشن\n🛡️ AIEscrowGuard اور KYC\n🔒 اسمارٹ ایسکرو والٹ\n🛡️ ڈیل شیلڈنگ اور پرائیویسی\n🌐 انوسٹر پورٹل\n🤝 کو-بروکرنگ نیٹ ورک\n\nاپنا سوال دوبارہ پوچھیں یا اوپر سے موضوع منتخب کریں۔`,
      }, lang)
  }
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export interface ChatEngineResult {
  response: string
  detectedLanguage: Language
  intent: Intent
}

export function processQuery(text: string): ChatEngineResult {
  const detectedLanguage = detectLanguage(text)
  const intent = detectIntent(text)
  const response = generateResponse(intent, detectedLanguage)
  return { response, detectedLanguage, intent }
}
