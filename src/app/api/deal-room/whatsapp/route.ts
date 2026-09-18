// src/app/api/deal-room/whatsapp/route.ts
// Digital Deal Room WhatsApp Notification Dispatcher

import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppTextMessage, formatPhoneNumber } from '@/lib/whatsapp'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { dealRoomId, recipientPhone, recipientRole, messageText } = await req.json()

    if (!recipientPhone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    if (!messageText) {
      return NextResponse.json({ error: 'Message text is required' }, { status: 400 })
    }

    const formattedPhone = formatPhoneNumber(recipientPhone)

    // Attempt to send via Meta WhatsApp Business Cloud API if configured
    const apiResult = await sendWhatsAppTextMessage({
      to: formattedPhone,
      text: messageText,
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
