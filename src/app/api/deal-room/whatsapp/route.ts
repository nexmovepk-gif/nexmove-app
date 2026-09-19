// src/app/api/deal-room/whatsapp/route.ts
// Digital Deal Room WhatsApp Notification Dispatcher

import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppUniversalAlert, formatPhoneNumber } from '@/lib/whatsapp'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { dealRoomId, recipientPhone, recipientRole, messageText, title, summary, details } = await req.json()

    if (!recipientPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    if (!messageText) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(recipientPhone)

    const alertTitle = title || (recipientRole ? `Deal Room Alert (${recipientRole})` : 'Deal Room Status Update')
    const alertMessage = summary || 'Aapki transaction deal room ki official update digitally generate ho chuki hai.'
    const alertDetails = details || (dealRoomId ? `Deal Ref: NX-${dealRoomId.slice(-6).toUpperCase()}` : 'NexMove Closing Desk')

    // Attempt to send via Meta WhatsApp Business Cloud API (Universal Template or fallback)
    const apiResult = await sendWhatsAppUniversalAlert({
      to: formattedPhone,
      title: alertTitle,
      message: alertMessage,
      details: alertDetails,
      fallbackText: messageText,
    })

    // Prepare client-side web WhatsApp direct fallback link
    const encodedText = encodeURIComponent(messageText)
    const directWebLink = `https://wa.me/${formattedPhone}?text=${encodedText}`

    return NextResponse.json({
      success: apiResult.success,
      apiResult,
      directWebLink,
      formattedPhone,
      message: apiResult.success
        ? `WhatsApp message successfully dispatched to ${formattedPhone}`
        : `Cloud API note: ${apiResult.error || 'Opening WhatsApp Web fallback'}`,
    })
  } catch (error: any) {
    console.error('WhatsApp dispatch error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch WhatsApp notification' },
      { status: 500 }
    )
  }
}
