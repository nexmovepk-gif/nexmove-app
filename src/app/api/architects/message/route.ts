// src/app/api/architects/message/route.ts
// Handles in-portal Direct Messaging (Inbox) for architects (LinkedIn-style messaging)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST: Public users / clients send an in-portal message to an architect
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      architectId,
      senderName,
      senderEmail,
      senderPhone,
      subject,
      message,
    } = body

    if (!architectId || !senderName || !senderEmail || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: architectId, senderName, senderEmail, and message are required.' },
        { status: 400 }
      )
    }

    // Verify architect exists
    const architect = await prisma.architectProfile.findUnique({
      where: { id: architectId },
      select: { id: true, name: true },
    })

    if (!architect) {
      return NextResponse.json({ error: 'Architect profile not found.' }, { status: 404 })
    }

    const newMessage = await prisma.architectMessage.create({
      data: {
        architectId,
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim().toLowerCase(),
        senderPhone: senderPhone ? senderPhone.trim() : null,
        subject: subject ? subject.trim() : 'Project Inquiry via NexMove',
        message: message.trim(),
        isRead: false,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: `Your message has been delivered directly to ${architect.name}'s NexMove Inbox.`,
        data: {
          id: newMessage.id,
          createdAt: newMessage.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('[Architect Message POST] Error:', error)
    const errMsg = error instanceof Error ? error.message : 'Failed to send message'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

// GET: Authenticated architect views their in-portal messages
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const queryArchitectId = searchParams.get('architectId')

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { architectProfile: true },
    })

    const isSuperAdmin =
      session.user.email?.toLowerCase() === 'nexmove.pk@gmail.com' ||
      session.user.role === 'SUPER_ADMIN'

    let targetArchitectId = queryArchitectId

    if (!targetArchitectId && user?.architectProfile) {
      targetArchitectId = user.architectProfile.id
    }

    const whereClause: Record<string, unknown> = {}
    if (!isSuperAdmin) {
      if (!targetArchitectId) {
        return NextResponse.json({ messages: [], total: 0, unreadCount: 0 })
      }
      whereClause.architectId = targetArchitectId
    } else if (targetArchitectId) {
      whereClause.architectId = targetArchitectId
    }

    const messages = await prisma.architectMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    })

    const unreadCount = messages.filter((m) => !m.isRead).length

    return NextResponse.json({
      messages,
      total: messages.length,
      unreadCount,
    })
  } catch (error) {
    console.error('[Architect Message GET] Error:', error)
    return NextResponse.json({ messages: [], total: 0, unreadCount: 0 }, { status: 500 })
  }
}

// PATCH: Mark message as read or update replied status
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const body = await req.json()
    const { isRead, replied } = body

    if (!id) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 })
    }

    const updated = await prisma.architectMessage.update({
      where: { id },
      data: {
        ...(isRead !== undefined && { isRead: Boolean(isRead) }),
        ...(replied ? { repliedAt: new Date() } : {}),
      },
    })

    return NextResponse.json({ success: true, message: updated })
  } catch (error) {
    console.error('[Architect Message PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update message status' }, { status: 500 })
  }
}
