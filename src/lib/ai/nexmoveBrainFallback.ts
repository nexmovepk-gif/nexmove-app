// src/lib/ai/nexmoveBrainFallback.ts
// NexMove Brain — Pakistani Real Estate Expert Fallback Engine

import prisma from '@/lib/prisma'

export interface ChatMessageInput {
 role: string
 content: string
}

function detectLanguage(text: string): 'ur' | 'roman_ur' | 'en' {
 // Check for Urdu script
 if (/[\u0600-\u06FF]/.test(text)) {
 return 'ur'
 }

 const romanKeywords = [
 'kya', 'kia', 'hai', 'hein', 'hain', 'mein', 'men', 'kitna', 'kitni', 'kitne',
 'hoga', 'hogi', 'hoge', 'kaise', 'kese', 'kesy', 'batao', 'btao', 'chahiye',
 'chahye', 'karein', 'karen', 'krna', 'kro', 'milega', 'mily', 'banaein', 'wala',
 'wali', 'mujhe', 'mjhe', 'hum', 'aap', 'ap', 'mera', 'meri', 'plot', 'ghar',
 'salam', 'assalam', 'wslm', 'wsalam', 'walaikum', 'walikum', 'shukriya',
 'theek', 'thik', 'lekin', 'kyun', 'kyu', 'konsa', 'konsi', 'pesa', 'paisa',
 'rupay', 'lakh', 'lac', 'crore', 'cr', 'marla', 'kanal', 'khareed', 'bech',
 'yr', 'yar', 'yaar', 'bhai', 'bro', 'baat', 'bat', 'suno', 'sono', 'bolo',
 'acha', 'achha', 'jee', 'ji', 'g', 'sun', 'sunen', 'sunain', 'kuch', 'bhi',
 'zarurat', 'masla', 'rate', 'price', 'bhae', 'dost'
 ]

 const lower = text.toLowerCase()
 const words = lower.split(/[\s,?.!]+/)
 const matches = words.filter(w => romanKeywords.includes(w))
 if (matches.length >= 1) {
 return 'roman_ur'
 }

 // Check English words
 const englishWords = ['what', 'how', 'when', 'where', 'why', 'who', 'which', 'is', 'are', 'can', 'you', 'please', 'tell', 'about', 'the', 'price', 'tax', 'cost']
 const engMatches = words.filter(w => englishWords.includes(w))
 if (engMatches.length >= 2) {
 return 'en'
 }

 // Default to Roman Urdu for Pakistani users
 return 'roman_ur'
}

function extractAmount(text: string): number | null {
 const lower = text.toLowerCase().replace(/,/g, '')

 // Match e.g. "5 crore", "2.5 crore", "5 cr", "5cr"
 const croreMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:crore|cr|karor)/)
 if (croreMatch) {
 return parseFloat(croreMatch[1]) * 10000000
 }

 // Match e.g. "50 lakh", "80 lac", "50 lacs"
 const lakhMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|lakhs|lacs)/)
 if (lakhMatch) {
 return parseFloat(lakhMatch[1]) * 100000
 }

 // Match e.g. "10 million", "25 million"
 const millionMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:million|m)\b/)
 if (millionMatch) {
 return parseFloat(millionMatch[1]) * 1000000
 }

 // Match raw number > 100,000
 const rawMatch = lower.match(/\b(\d{6,12})\b/)
 if (rawMatch) {
 return parseInt(rawMatch[1], 10)
 }

 return null
}

export async function generateFallbackResponse(
 userQuery: string,
 _history: ChatMessageInput[] = []
): Promise<string> {
 const q = userQuery.toLowerCase().trim()
 const lang = detectLanguage(userQuery)

 // 0. INFORMAL CASUAL CHIT-CHAT & GREETINGS
 // e.g. "wslm yr baat sono", "suno bhai", "ek baat suno", "yar ek baat btao"
 if (/^(wslm|wsalam|walaikum|walikum|slam|salam|aoa|hi|hello|hey)\b.*(baat|bat|suno|sono|bolo|yr|yar|yaar|bhai|bro)/i.test(q) ||
 /^(baat|bat)\s+(suno|sono)/i.test(q) ||
 /^(suno|sono|ek baat|ik baat|bhai suno|yar suno|yr suno)/i.test(q)) {
 return `Walaikum Assalam bhai! Haan haan bolo, main bilkul sun raha hoon.

Batao kya chal raha hai? Koi property ya plot dekh rahe ho, kisi society ka rate maloom karna hai, FBR tax ka masla hai ya koi deal final karni hai? Khul ke batao, main mukammal madad karunga!`
 }

 // General Chit-Chat: "kya haal hai", "kese ho", "kaise ho"
 if (/(kia hal|kese ho|kaise ho|kesy ho|kya hal|sab theek|sab kheriat)/i.test(q)) {
 return `Alhamdulillah bhai, main bilkul theek-thaak aur fit hoon! 

Aap sunao, aapka kya haal chaal hai? Aaj NexMove par real estate ke hawale se kis cheez par baat karni hai? Main hazir hoon!`
 }

 // "Shukriya", "thanks", "thank you"
 if (/(shukriya|thanks|thank you|thx|jazakallah)/i.test(q)) {
 return `Arey koi baat nahi bhai, welcome! Hamesha hazir hoon. Agar aage chalkar koi bhi property, tax ya documentation ka sawal ho to bina jhijhak pooch lena! `
 }

 // "Theek hai", "ok", "acha", "sahi hai"
 if (/^(ok|theek hai|thik hai|theek|thik|acha|achha|sahi hai|done|great|zabardast)$/i.test(q)) {
 return `Zabardast! Agar kisi bhi waqt kisi plot ka rate, FBR filer tax, NDC process ya Deal Room ke baray mein poochna ho to bata dena, main idhar hi hoon.`
 }

 // "Tum kon ho", "who are you", "kya kar sakte ho"
 if (/(tum kon ho|who are you|kya ho tum|ap kon ho|kya kar sakte ho|kya krty ho)/i.test(q)) {
 return `Main **NexMove Brain** hoon — Pakistan ka AI Real Estate Assistant! 

Aap mujhse aam doston ki tarha Roman Urdu ya English mein jo marzi poochein:
• Kisi bhi property ka FBR Filer ya Non-Filer tax calculate karwana ho
• DHA Lahore, Bahria Town, Islamabad ya Karachi ke rates janne hon
• NDC, Bayana token, registry, ya Overseas Power of Attorney ka tareeqa poochna ho
• Ya NexMove ke subscription plans aur safe escrow deals samajhni hon

Aap jo bhi poochenge, main foran clear aur seedha jawab doonga!`
 }

 // 1. STANDARD GREETINGS
 if (/^(salam|assalam|aoa|hi|hello|hey|hola|adaab|wslm|wsalam|walaikum)\b/i.test(q)) {
 if (lang === 'ur') {
 return `وعلیکم السلام! میں **NexMove Brain** ہوں — آپ کا ریئل اسٹیٹ AI اسسٹنٹ۔ 

فرمائیے، آج کس پراپرٹی، سوسائٹی یا FBR ٹیکس کے بارے میں معلومات درکار ہیں؟`
 }
 return `Walaikum Assalam bhai! Main hoon **NexMove Brain** .

Batao aaj kis mamlay mein rehnumai chahiye? Koi property dekh rahe ho, DHA/Bahria ke rates chahiyein ya FBR tax calculate karwana hai?`
 }

 // 2. FBR TAX CALCULATION (Section 236K / 236C)
 const isTaxQuery = /tax|fbr|filer|non-filer|nonfiler|236k|236c|iris|psid|cpr/i.test(q)
 if (isTaxQuery) {
 const amount = extractAmount(userQuery)
 const _isSeller = /seller|bech|frokt|sell/i.test(q)

 if (amount) {
 const buyerFilerRate = 0.03
 const buyerNonFilerRate = 0.105
 const buyerFilerTax = amount * buyerFilerRate
 const buyerNonFilerTax = amount * buyerNonFilerRate
 const buyerSavings = buyerNonFilerTax - buyerFilerTax

 const sellerFilerRate = 0.04
 const sellerNonFilerRate = 0.06
 const sellerFilerTax = amount * sellerFilerRate
 const sellerNonFilerTax = amount * sellerNonFilerRate
 const sellerSavings = sellerNonFilerTax - sellerFilerTax

 const formatPKR = (num: number) =>
 'PKR ' + Math.round(num).toLocaleString('en-PK')

 if (lang === 'roman_ur' || lang === 'ur') {
 return `### FBR Property Tax Calculation (FY 2026-27)
**Property Value:** ${formatPKR(amount)}

---
#### 1. Buyer Advance Tax (Section 236K):
• **Filer Rate (3%):** ${formatPKR(buyerFilerTax)}
• **Non-Filer Rate (10.5%):** ${formatPKR(buyerNonFilerTax)}
• **Filer banne par bachat:** **${formatPKR(buyerSavings)}**

---
#### 2. Seller Advance Tax (Section 236C):
• **Filer Rate (4%):** ${formatPKR(sellerFilerTax)}
• **Non-Filer Rate (6%):** ${formatPKR(sellerNonFilerTax)}
• **Filer Seller ki bachat:** **${formatPKR(sellerSavings)}**

---
#### Payment Process:
1. FBR IRIS portal se 17-digit **PSID** generate karein.
2. NBP ya online bank app se payment ada karein.
3. Bank se **CPR (Computerized Payment Receipt)** hasil karein jo DHA / Sub-Registrar transfer ke liye lazmi hai.

Kya aapko PSID generate karne ya Deal Room mein CPR upload karne ki detail chahiye?`
 }

 return `### FBR Property Tax Breakdown (FY 2026-27)
**Property Value:** ${formatPKR(amount)}

---
#### Buyer Advance Tax (Section 236K):
• **Active Filer (3%):** ${formatPKR(buyerFilerTax)}
• **Non-Filer (10.5%):** ${formatPKR(buyerNonFilerTax)}
• **Net Savings as Filer:** **${formatPKR(buyerSavings)}**

---
#### Seller Advance Tax (Section 236C):
• **Active Filer (4%):** ${formatPKR(sellerFilerTax)}
• **Non-Filer (6%):** ${formatPKR(sellerNonFilerTax)}
• **Net Savings as Filer:** **${formatPKR(sellerSavings)}**

---
#### FBR Compliance Steps:
1. Generate the 17-digit **PSID** via the FBR IRIS portal.
2. Pay through 1BILL or designated National Bank branches.
3. Obtain the **CPR (Computerized Payment Receipt)** required for registry/biometric transfer.

Need help submitting this in your **NexMove Deal Room**?`
 }

 // Tax general info
 return `### FBR Property Tax Rates Summary (Pakistan FY 2026-27)

| Tax Section | Category | Filer Rate | Non-Filer Rate |
|---|---|---|---|
| **Section 236K** | Buyer Advance Tax | **3.0%** | **10.5%** |
| **Section 236C** | Seller Advance Tax | **4.0%** | **6.0%** |
| **Section 7E** | Deemed Income Tax | Exemptions apply (1 primary residence exempt) | 20% on 5% fair market value |

 **Example Calculation:**
Agar aap **PKR 2 Crore** ka plot khareed rahe hain:
• **Filer Buyer (3%):** PKR 6,00,000
• **Non-Filer Buyer (10.5%):** PKR 21,00,000
• **Total Bachat:** **PKR 15,00,000!**

Aap kisi bhi property ki specific amount likhein (maslan *"5 crore plot tax"*), main exact calculation bana kar doonga!`
 }

 // 3. PRICING PLANS & HOW TO PAY
 if (/plan|pricing|subscription|meezan|bank|paisa|fees|charges|starter|enterprise|professional|upgrade/i.test(q)) {
 return `### NexMove Agency Subscription Plans

1. **Starter Plan — PKR 5,000 / month**
 • Up to 15 Active Marketplace Listings
 • Basic Deal Room Access
 • Standard Lead Management

2. **Professional Plan — PKR 15,000 / month** *(Most Popular)*
 • **Full AIEscrowGuard & Smart Escrow Vault**
 • **AI Legal SPA Contract Generator**
 • **50/50 Co-Brokering Network**
 • Verified Agency RERA Badge & Priority Indexing

3. **Enterprise Plan — PKR 40,000 / month**
 • Unlimited KYC Audits & Multi-Agent Seats
 • Zero Commission Escrow Capping
 • Dedicated 24/7 Account Executive & WhatsApp Concierge

---
### Official Bank Transfer Details (Meezan Bank):
• **Bank Name:** Meezan Bank Ltd
• **Account Title:** Sharafat Ali
• **IBAN:** \`PK67 MEZN 0011 3701 0985 0413\`

 **Next Step:** Raqam transfer karne ke baad transaction receipt ya screenshot **Agency Settings → Billing** mein upload karein ya support par share karein. Account 15 mint mein activate ho jayega!`
 }

 // 4. DHA & BAHRIA PROPERTY PRICES
 if (/price|rate|cost|dha|bahria|gulberg|islamabad|lahore|karachi|marla|kanal/i.test(q)) {
 return `### Real Estate Benchmark Rates (2025–2026)

#### DHA Lahore:
• **5 Marla Plot:** PKR 85 Lakh – 1.65 Crore (Phase 6, 7, 9 Town, 9 Prism)
• **10 Marla Plot:** PKR 1.75 Crore – 3.20 Crore (Phase 5, 6, 8)
• **1 Kanal Plot:** PKR 3.80 Crore – 8.50 Crore (Prime Phase 5/6: 6-8.5 Cr, Phase 7/8/9: 3.8-5.5 Cr)
• **1 Kanal Constructed House:** PKR 7.50 Crore – 14 Crore

#### Bahria Town (Lahore / Rawalpindi / Karachi):
• **5 Marla Plot:** PKR 60 Lakh – 1.15 Crore
• **10 Marla Plot:** PKR 1.20 Crore – 2.10 Crore
• **1 Kanal Plot:** PKR 2.30 Crore – 4.75 Crore

#### Islamabad & Rawalpindi:
• **DHA Islamabad (Phases 1-5):** 1 Kanal PKR 3.20 Crore – 6.80 Crore
• **Gulberg Greens:** 1 Kanal Plot PKR 2.80 Crore – 5.50 Crore

 *Actual prices depend on location (corner, facing park, main boulevard) and possession status.*
Aap NexMove [Marketplace](/marketplace) par ja kar live active listings bhi browse kar sakte hain!`
 }

 // 5. NDC (NO DEMAND CERTIFICATE)
 if (/ndc|no demand|transfer process|dha transfer/i.test(q)) {
 return `### DHA / Housing Authority NDC Clearance Process

**NDC (No Demand Certificate)** transfer se pehle housing authority se yeh tasdeeq karwane ke liye darkar hota hai ke property par koi dues baaqi nahi hain.

#### Step-by-Step NDC Steps:
1. **Application Submission:** Seller ya authorized agent DHA customer care center par NDC form jama karwata hai.
2. **Clearance of Outstanding Dues:**
 • Development charges
 • Sewerage & water dues
 • Transfer fee challan
3. **Site Inspection:** DHA field staff plot/house ka physical visit karta hai taake koi illegal construction ya encroachment na ho.
4. **Issuance:** Sab clearance ke baad 10 se 21 dinon ke andar official NDC issue hota hai (Urgent fee ada kar ke 5-7 din mein bhi mil sakta hai).

 **NexMove Protection:** NexMove Deal Room mein Bayana/Token Escrow tab tak hold rehta hai jab tak NDC officially clear na ho jaye!`
 }

 // 6. ESCROW VAULT & DEAL ROOM
 if (/escrow|vault|milestone|safe|security|token|bayana/i.test(q)) {
 return `### NexMove Smart Escrow Vault & 4 Milestones

NexMove fraud aur payment disputes ko khatam karne ke liye stage-gated escrow model use karta hai:

1. **Milestone 1 — Bayana / Token Deposit:**
 • Buyer token money NexMove Escrow account mein deposit karta hai.
 • Amount lock ho jati hai aur dono parties ko legally bind kar diya jata hai.

2. **Milestone 2 — NDC Verification:**
 • Housing society (DHA, Bahria etc.) se valid No Demand Certificate verify hota hai.

3. **Milestone 3 — FBR Tax CPR Verification:**
 • Buyer (236K) aur Seller (236C) ke 17-digit PSID aur CPR bank receipts AIEscrowGuard se match hoti hain.

4. **Milestone 4 — Final Biometric & Transfer Desk:**
 • Authority office mein biometric transfer mukammal hote hi escrow funds foran seller ke bank account mein release ho jate hain.

Dono parties ka sarmaya 100% mehfooz rehta hai!`
 }

 // 7. OVERSEAS PAKISTANIS & POA
 if (/overseas|poa|power of attorney|embassy|mofa|rda|bahir/i.test(q)) {
 return `### Overseas Pakistanis Property Buying & Selling Guide

Agar aap Pakistan se bahir muqeem hain, to aap baghair Pakistan aaye legal tareeqay se property deal kar sakte hain:

#### 1. Special Power of Attorney (POA):
• Property ke specific khasra/plot number ke sath Special POA draft karein.
• Apne mulk mein mojood **Pakistan Embassy / Consulate** se biometric tasdeeq aur attestation karwayein.
• POA document Pakistan bhaijein jahan **Ministry of Foreign Affairs (MOFA)** se counter-attestation lazmi hoti hai.

#### 2. Roshan Digital Account (RDA) & Roshan Apna Ghar:
• State Bank of Pakistan ke zareeye authorized remittance bhejein taake legal banking channel ka saboot mojood ho.

#### 3. Online Biometrics:
• Bohat si authorities (jaise DHA Lahore & NADRA) ab overseas residents ke liye online video biometric transfer ki sahulat bhi faraham kar rahi hain.

NexMove Brain overseas clients ke liye direct escrow aur legal contract verification ensure karta hai!`
 }

 // 8. INVESTMENT, ROI & RENTAL YIELDS
 if (/invest|roi|yield|rental|faida|munafa|return|kamai|rent/i.test(q)) {
 if (lang === 'ur' || lang === 'roman_ur') {
 return `### Pakistan Real Estate Investment & ROI Insights (2025–2026)

Pakistan mein property investment ke 2 bunyadi tareeqay hain:

#### 1. Rental Yield (Mahana Aamdani):
• **Commercial High-Rise / Plazas:** 7% se 10% annual rental return (sab se zyada munafabakhsh).
• **Residential Houses (DHA/Bahria):** 3.5% se 5% annual rental return.
• **Studio & 1-Bed Apartments:** 6% se 8% annual rental yield (overseas aur students ke liye high demand).

#### 2. Capital Appreciation (File & Plot Gains):
• **Developing Phases (e.g. DHA Phase 9 Prism, DHA Multan, Bahria Town):** 15% se 25% annual appreciation target.
• **Balloted vs Non-Balloted:** Ballot hone ke foran baad plot file ki value 20-30% jump karti hai.

 **Pro Tip:** Hamesha approved housing societies (LDA, CDA, RDA registered) mein invest karein taake apka sarmaya 100% mehfooz rahe.`
 }

 return `### Pakistan Real Estate Investment & Rental ROI Guide

#### 1. Rental Yield Benchmarks:
• **Commercial Retail & Offices:** 7% to 10% annual net yield (highest cashflow).
• **Residential Built Houses:** 3.5% to 5.0% annual yield.
• **Modern High-Rise Apartments:** 6.5% to 8.5% annual yield with fast tenant turnover.

#### 2. Capital Growth & Plot Investments:
• Developing phases (DHA Phase 9 Prism, Bahria Town extensions) offer 15–22% projected annual growth.
• Ready possession plots offer immediate construction security and steady 8–12% inflation-hedged appreciation.

Always ensure the housing authority (LDA/CDA/RDA) has issued an approved NOC before committing funds.`
 }

 // 9. LEGAL TERMS: FARD, INTIQAL, REGISTRY, AKS SHAJRA
 if (/fard|intiqal|inteqal|registry|shajra|mutation|patwari|khasra/i.test(q)) {
 return `### Pakistani Land Record & Legal Terms Explained

1. **Fard (فرد):**
 • Zameen ki milkiyat ka sarkari record jo Arazi Record Center (PLRA) ya Patwari se issue hota hai.
 • Bayana aur registry se pehle *Fard-e-Milkiyat (Baraye Bayi)* nikalwana lazmi hai.

2. **Intiqal / Mutation (انتقال):**
 • Revenue department ke register mein zameen ka naam naye khareeddar ke naam transfer hona. Registry ke baad Intiqal karwana qanoonan zaroori hai.

3. **Registry (رجسٹری / Sale Deed):**
 • Sub-Registrar office mein buyer aur seller ke darmiyan stamped agreement jis par biometrics aur official mohar lagti hai.

4. **Khasra & Khewat (خسرہ و کھیوٹ):**
 • Zameen ka survey number aur hissa jo khasra girdawari mein darj hota hai.

5. **Aks Shajra (عکس شجرہ):**
 • Revenue map jo plot/zameen ki physical location aur hadood-e-arbaa wazeh karta hai.`
 }

 // 10. HOUSING AUTHORITY APPROVALS & NOCs (LDA, CDA, RDA, SBCA)
 if (/noc|lda|cda|rda|sbca|approved|illegal|society/i.test(q)) {
 return `### ️ Housing Societies NOC & Legal Verification Guide

Kisi bhi housing project mein sarmayakari se pehle in idaron se **NOC Approval** zaroor check karein:

• **Lahore:** LDA (Lahore Development Authority) — check official website portal for illegal schemes.
• **Islamabad:** CDA (Capital Development Authority) — Zones 1 to 5 approval list.
• **Rawalpindi:** RDA (Rawalpindi Development Authority) — Ring Road & Chakri road societies verification.
• **Karachi:** SBCA (Sindh Building Control Authority) & KDA.

️ **Warning:** Non-approved ya TMA se adhoori approved societies mein file khareedne se bachein. NexMove par listed tamam projects verified hote hain!`
 }

 // 11. LIVE LISTINGS CHECK FROM PRISMA
 if (/listing|available|plots|buy|sell|ghar|makan|flat/i.test(q)) {
 try {
 const listings = await prisma.listing.findMany({
 take: 4,
 where: { status: 'ACTIVE' },
 select: { title: true, price: true, area: true, address: true },
 orderBy: { createdAt: 'desc' },
 })

 if (listings.length > 0) {
 let resp = `### Active Properties on NexMove Marketplace:\n\n`
 listings.forEach((l, idx) => {
 resp += `${idx + 1}. **${l.title}**\n`
 resp += ` • Location: ${l.address || 'Pakistan'}\n`
 resp += ` • Area: ${l.area ? l.area + ' sqft' : 'N/A'}\n`
 resp += ` • Price: PKR ${Number(l.price).toLocaleString('en-PK')}\n\n`
 })
 resp += ` Tamam properties dekhne ke liye [NexMove Marketplace](/marketplace) par visit karein!`
 return resp
 }
 } catch {
 // Ignore DB error
 }
 }

 // 12. GENERAL CONVERSATION, OPEN QUESTIONS, & ADVICE
 if (lang === 'ur') {
 return `آپ کا سوال موصول ہو گیا ہے۔ **NexMove Brain** آپ کے ہر سوال کا تفصیلی، سچا اور مستند جواب فراہم کرتا ہے۔

• اگر آپ کسی خاص شہر، سوسائٹی (DHA، بحریہ، گلبرگ) یا پلاٹ کا ریٹ معلوم کرنا چاہتے ہیں تو ضرور بتائیں۔
• اگر کسی مخصوص رقم پر FBR فائلر/نان فائلر ٹیکس کا حساب لگانا ہو تو رقم لکھیں۔
• پراپرٹی ٹرانسفر، بیعانہ، NDC، یا بیرون ملک مقیم پاکستانیوں کے لیے پاور آف اٹارنی کی مکمل معلومات حاضر ہیں۔

مزید تفصیلات کے لیے اپنا سوال لکھیں!`
 }

 if (lang === 'roman_ur') {
 return `Ji bhai, main bilkul sun raha hoon! Main aapka dost aur Pakistan real estate ka AI specialist hoon.

Aap mujhse bilkul aam doston ki tarha khul ke baat karein:
• Kisi bhi plot ya makan ka market rate poochna ho (DHA, Bahria, Islamabad, Lahore wagera)
• FBR Filer ya Non-Filer tax ka calculation karwana ho
• NDC, Bayana, registry, ya Overseas Power of Attorney ka mamla ho
• Ya koi deal aur payment safe tareeqay se karni ho

Batao, kis cheez par baat karni hai? Main hazir hoon!`
 }

 return `I'm listening! As your Pakistani real estate AI companion, I'm here to assist you conversationally.

Feel free to chat with me naturally:
• Ask about property valuations across DHA, Bahria Town, Islamabad, Karachi
• Calculate exact FBR 236K/236C buyer and seller taxes
• Clarify legal procedures like NDC clearance, Bayana agreements, or Overseas POA
• Or explore safe escrow milestones and subscription plans

What would you like to discuss? I'm right here!`
}
