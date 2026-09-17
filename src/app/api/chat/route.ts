import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Full Pakistani real estate system prompt
const NEXMOVE_SYSTEM_PROMPT = `You are "NexMove Brain" — the official AI assistant of NexMove, Pakistan's most advanced PropTech SaaS platform. You are embedded as a floating chat widget inside the NexMove web app.

## YOUR IDENTITY
- Name: NexMove Brain
- Role: AI Real Estate Specialist for Pakistani market
- Personality: Friendly, knowledgeable, professional yet conversational. Like a senior property expert who also knows tech.

## LANGUAGE BEHAVIOR (CRITICAL)
- Detect the user language automatically from their message.
- If they write in English, respond in English.
- If they write in Roman Urdu (e.g., "kitna tax dena hoga"), respond in Roman Urdu.
- If they write in Urdu script (Arabic characters), respond in Urdu script.
- Always match the user's language naturally.

## NEXMOVE PLATFORM KNOWLEDGE

### Subscription Plans:
- Starter Plan: PKR 5,000/month — Basic listing indexing, standard marketplace visibility
- Professional Plan: PKR 15,000/month (Most Popular) — Full AIEscrowGuard, Smart Escrow Vault, AI Legal SPA Contracts, 50/50 Co-Brokering, RERA badge
- Enterprise Plan: PKR 40,000/month — Unlimited KYC audits, zero commission cap, dedicated account manager
- Payment Method: Meezan Bank direct transfer — IBAN: PK67 MEZN 0011 3701 0985 0413, Account Title: Sharafat Ali

### FBR Tax System (Pakistan, FY2026-27):
- Section 236K (Buyer Tax): Filer = 3%, Non-Filer = 10.5% of property value
- Section 236C (Seller Tax): Filer = 4% of gain, Non-Filer = 6% of gain
- PSID is 17-digit payment slip from FBR IRIS portal
- CPR (Computerized Payment Receipt) issued after bank payment

### Deal Room Milestones:
1. Bayana/Token — Initial deposit locked in NexMove Escrow
2. DHA/Society NDC Clearance — No Demand Certificate from housing authority
3. FBR Tax CPR Verification — Tax payment receipts verified
4. Final Transfer Desk & Biometric Appointment — Property registry transfer

### Property Prices (Approximate 2025-26):
- DHA Lahore 1 Kanal Plot: 4-8 Crore PKR
- DHA Lahore 5 Marla Plot: 80L-1.5 Cr PKR
- Bahria Town 1 Kanal: 2.5-5 Crore PKR
- DHA Islamabad 1 Kanal: 3-7 Crore PKR
- DHA Karachi 500 Sqyd: 3-6 Crore PKR

### Legal Processes:
- NDC: Required from DHA/society before transfer, takes 2-4 weeks
- Bayana: Non-refundable token/advance payment to reserve property
- MOU: Agreement between buyer and seller before SPA
- SPA: Sale and Purchase Agreement — final legal document
- Biometric Transfer: At DHA/society office with CNIC/thumbprint

### Overseas Pakistanis:
- RDA (Roshan Digital Account) for overseas remittances
- MOFA attestation required for foreign documents
- Special Power of Attorney from Pakistan Embassy abroad
- NICOP (National Identity Card for Overseas Pakistanis)

### NexMove Features:
- AIEscrowGuard: AI-powered document verification and KYC
- Smart Escrow Vault: Stage-gated fund release
- Co-Brokering: 50/50 commission split between agencies
- Deal Shielding: All parties anonymous until deal confirmed
- Private Seller Flow: List without public visibility, WhatsApp OTP verification
- Document Watermarking: Confidential watermarks on uploaded docs
- Rent Collection Module: In agency dashboard

## FBR TAX CALCULATION
When asked to calculate tax:
- Ask if Filer or Non-Filer if not mentioned
- Show full math with PKR amounts
- Calculate savings of becoming filer
- Example: 5 Crore property, Non-Filer Buyer: 5,00,00,000 x 10.5% = 52,50,000 PKR
- Filer Buyer: 5,00,00,000 x 3% = 15,00,000 PKR. Savings = 37,50,000 PKR

## RESPONSE STYLE
- Clear, structured, helpful
- Use bullet points and emojis appropriately
- Always end with actionable next step
- Show full math for calculations
- Be honest when you don't know something

Always be helpful and representative of NexMove's premium brand.`

import { generateFallbackResponse } from '@/lib/ai/nexmoveBrainFallback'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const lastMessage = messages[messages.length - 1]
    const history = messages.slice(0, -1)

    // Helper to stream text smoothly
    const streamText = (fullText: string) => {
      const encoder = new TextEncoder()
      const words = fullText.split(' ')
      let index = 0

      const stream = new ReadableStream({
        async start(controller) {
          const sendChunk = () => {
            if (index >= words.length) {
              controller.close()
              return
            }
            const chunk = words.slice(index, index + 3).join(' ') + ' '
            index += 3
            controller.enqueue(encoder.encode(chunk))
            setTimeout(sendChunk, 25)
          }
          sendChunk()
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Try live Gemini streaming if API key is present
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 10) {
      const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-lite']
      for (const modelName of candidateModels) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: NEXMOVE_SYSTEM_PROMPT,
          })

          const geminiHistory = history.map((msg: { role: string; content: string }) => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          }))

          // Live listing context
          let liveContext = ''
          const propertyKeywords = ['listing', 'property', 'plot', 'kanal', 'marla', 'ghar', 'makan', 'flat', 'apartment', 'dha', 'bahria', 'gulberg', 'milega', 'buy', 'sell', 'price']
          const isPropertyQuery = propertyKeywords.some(kw => lastMessage.content.toLowerCase().includes(kw))

          if (isPropertyQuery) {
            try {
              const recentListings = await prisma.listing.findMany({
                take: 5,
                where: { status: 'ACTIVE' },
                select: { title: true, price: true, area: true, address: true },
                orderBy: { createdAt: 'desc' },
              })
              if (recentListings.length > 0) {
                liveContext = `\n\n[LIVE NEXMOVE DATABASE - ${new Date().toLocaleDateString('en-PK')}]\nRecent active listings:\n`
                recentListings.forEach((l, i) => {
                  liveContext += (i + 1) + '. ' + l.title + ' | ' + l.address + ' | PKR ' + Number(l.price).toLocaleString() + '\n'
                })
                liveContext += `\nMore listings: /marketplace`
              }
            } catch {
              // Silently continue
            }
          }

          const userMessage = liveContext ? `${lastMessage.content}${liveContext}` : lastMessage.content
          const chat = model.startChat({ history: geminiHistory })
          const result = await chat.sendMessageStream(userMessage)

          const encoder = new TextEncoder()
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of result.stream) {
                  const text = chunk.text()
                  if (text) controller.enqueue(encoder.encode(text))
                }
                controller.close()
              } catch (err) {
                controller.error(err)
              }
            },
          })

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Transfer-Encoding': 'chunked',
              'Cache-Control': 'no-cache',
            },
          })
        } catch {
          // Try next model if candidate fails
        }
      }
    }

    // Step 2: Live Real-Time AI LLM Engine (Answers ANY human query naturally in Roman Urdu/English)
    try {
      const llmMessages = [
        {
          role: 'system',
          content: `${NEXMOVE_SYSTEM_PROMPT}\n\nIMPORTANT: Be conversational, friendly, and human-like! Match the user's language (Roman Urdu, Urdu, or English). If they ask about login/password recovery, explain that NexMove has a 'Forgot Password' link on the login page which sends a password reset link to their registered email via Google SMTP (nexmove.pk@gmail.com). Never sound like a robotic brochure.`
        },
        ...history.map((m: { role: string; content: string }) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
        { role: 'user', content: lastMessage.content },
      ]

      const aiRes = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: llmMessages,
          model: 'openai',
          temperature: 0.7,
        }),
      })

      if (aiRes.ok) {
        const liveAiText = await aiRes.text()
        if (liveAiText && liveAiText.trim().length > 10) {
          return streamText(liveAiText.trim())
        }
      }
    } catch (llmErr) {
      console.warn('Live LLM connection failed, using local engine:', llmErr)
    }

    // Step 3: High-precision Native Pakistani Real Estate Expert Fallback
    const fallbackText = await generateFallbackResponse(lastMessage.content, history)
    return streamText(fallbackText)
  } catch (error) {
    console.error('NexMove Brain API Error:', error)
    return new Response(
      JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

