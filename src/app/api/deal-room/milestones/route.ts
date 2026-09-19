// src/app/api/deal-room/milestones/route.ts
// Digital Deal Room & 4 Milestones Progress Tracker

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendWhatsAppUniversalAlert } from '@/lib/whatsapp'

const DEFAULT_MILESTONES = [
  { step: 1, title: 'Bayana / Token Escrow Locker' },
  { step: 2, title: 'DHA / Society NDC Clearance' },
  { step: 3, title: 'FBR Tax Challans & CPR Receipts' },
  { step: 4, title: 'Final Transfer Desk & Biometric Appointment' },
]

export async function POST(req: NextRequest) {
  try {
    const {
      action,
      dealRoomId,
      milestoneId,
      proofUrl,
      cprNumber,
      psidNumber,
      appointmentDate,
      totalAgreedPrice,
      buyerName,
      sellerName,
      agencyName,
      propertyId,
    } = await req.json()

    // ACTION: INITIALIZE A NEW DEAL ROOM
    if (action === 'create') {
      const dealNumber = `NX-DEAL-${Date.now().toString().slice(-6)}`
      const price = totalAgreedPrice ? parseFloat(totalAgreedPrice) : 35000000

      const dealRoom = await prisma.dealRoom.create({
        data: {
          dealNumber,
          totalAgreedPrice: price,
          buyerName: buyerName || 'Hamza Tariq (Buyer)',
          sellerName: sellerName || 'Kamran Ali (Seller)',
          agencyName: agencyName || 'NexMove Premier Agency',
          propertyId: propertyId || undefined,
          status: 'ACTIVE',
          currentMilestone: 1,
          milestones: {
            create: DEFAULT_MILESTONES.map((m) => ({
              stepNumber: m.step,
              title: m.title,
              status: m.step === 1 ? 'IN_PROGRESS' : 'PENDING',
            })),
          },
        },
        include: {
          milestones: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      })

      return NextResponse.json({
        success: true,
        dealRoom,
        message: 'Digital Deal Room initialized with 4 interactive milestones',
      })
    }

    // ACTION: UPDATE A MILESTONE STATUS
    if (action === 'update_milestone') {
      if (!milestoneId) {
        return NextResponse.json({ error: 'milestoneId is required' }, { status: 400 })
      }

      const updatedMilestone = await prisma.dealMilestone.update({
        where: { id: milestoneId },
        data: {
          status: 'COMPLETED',
          proofAttachmentUrl: proofUrl || undefined,
          cprNumber: cprNumber || undefined,
          psidNumber: psidNumber || undefined,
          appointmentDate: appointmentDate ? new Date(appointmentDate) : undefined,
          completedAt: new Date(),
        },
      })

      // Advance deal room to next milestone
      if (dealRoomId) {
        const nextStep = updatedMilestone.stepNumber + 1
        const isNowClosed = nextStep > 4
        const updatedDeal = await prisma.dealRoom.update({
          where: { id: dealRoomId },
          data: {
            currentMilestone: Math.min(nextStep, 4),
            status: isNowClosed ? 'CLOSED' : 'ACTIVE',
          },
        })

        if (nextStep <= 4) {
          await prisma.dealMilestone.updateMany({
            where: {
              dealRoomId,
              stepNumber: nextStep,
            },
            data: { status: 'IN_PROGRESS' },
          })
        }

        // ── DISPATCH AUTOMATED WHATSAPP NOTIFICATION ──────────────────────────
        try {
          let targetPhone: string | null = null
          if (updatedDeal.propertyId) {
            const prop = await prisma.property.findUnique({
              where: { id: updatedDeal.propertyId },
              select: { contactPhone: true },
            })
            if (prop?.contactPhone) targetPhone = prop.contactPhone
          }
          if (!targetPhone && updatedDeal.agencyId) {
            const ag = await prisma.agency.findUnique({
              where: { id: updatedDeal.agencyId },
              select: { phone: true },
            })
            if (ag?.phone) targetPhone = ag.phone
          }

          if (targetPhone) {
            if (isNowClosed) {
              await sendWhatsAppUniversalAlert({
                to: targetPhone,
                title: 'Deal Closed & Payout Ready',
                message: `Mubarik ho! Deal #${updatedDeal.dealNumber} completely CLOSE ho chuki hai. Final registry transfer aur escrow verify ho chuka hai.`,
                details: `Ref: ${updatedDeal.dealNumber} | Buyer: ${updatedDeal.buyerName} | Seller: ${updatedDeal.sellerName}`,
                fallbackText: `🎉 *NexMove — Deal Successfully Closed!*\n\nDeal #${updatedDeal.dealNumber} has been officially closed and ratified.\n\nThank you for choosing NexMove!`,
              })
            } else {
              await sendWhatsAppUniversalAlert({
                to: targetPhone,
                title: 'Milestone Completed',
                message: `Milestone ${updatedMilestone.stepNumber} (${updatedMilestone.title}) mukammal ho gaya hai. Agla marhala progress mein hai.`,
                details: `Deal Ref: ${updatedDeal.dealNumber} | Milestone: ${updatedMilestone.stepNumber}/4`,
                fallbackText: `📋 *NexMove Deal Update*\n\nMilestone ${updatedMilestone.stepNumber} (${updatedMilestone.title}) marked COMPLETED for Deal #${updatedDeal.dealNumber}.`,
              })
            }
          }
        } catch (waErr) {
          console.warn('[Milestones API] Automated WhatsApp alert note:', waErr)
        }
      }

      return NextResponse.json({
        success: true,
        milestone: updatedMilestone,
        message: `Milestone ${updatedMilestone.stepNumber} marked as completed`,
      })
    }

    return NextResponse.json({ error: 'Invalid action. Use "create" or "update_milestone"' }, { status: 400 })
  } catch (error) {
    console.error('Deal room milestone error:', error)
    return NextResponse.json({ error: 'Failed to process milestone request' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const dealRoomId = searchParams.get('dealRoomId')
    const listOnly = searchParams.get('list') === 'true'

    if (listOnly) {
      const deals = await prisma.dealRoom.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          milestones: { orderBy: { stepNumber: 'asc' } },
          overseasPoa: true,
        },
      })

      // If no deals exist, seed a sample deal so the list is not empty
      if (deals.length === 0) {
        const sampleDeal = await prisma.dealRoom.create({
          data: {
            dealNumber: 'NX-DEAL-782914',
            totalAgreedPrice: 45000000,
            currentMilestone: 2,
            buyerName: 'Hamza Tariq (Lahore)',
            sellerName: 'Kamran Ali (Overseas - UK)',
            agencyName: 'Zameen Experts & Associates',
            milestones: {
              create: [
                {
                  stepNumber: 1,
                  title: 'Bayana / Token Escrow Locker',
                  status: 'COMPLETED',
                  cprNumber: 'CPR-2026-981723',
                  completedAt: new Date(),
                },
                {
                  stepNumber: 2,
                  title: 'DHA / Society NDC Clearance',
                  status: 'IN_PROGRESS',
                },
                {
                  stepNumber: 3,
                  title: 'FBR Tax Challans & CPR Receipts',
                  status: 'PENDING',
                },
                {
                  stepNumber: 4,
                  title: 'Final Transfer Desk & Biometric Appointment',
                  status: 'PENDING',
                },
              ],
            },
          },
          include: {
            milestones: { orderBy: { stepNumber: 'asc' } },
            overseasPoa: true,
          },
        })
        return NextResponse.json({ success: true, deals: [sampleDeal] })
      }

      return NextResponse.json({ success: true, deals })
    }

    if (dealRoomId) {
      const dealRoom = await prisma.dealRoom.findUnique({
        where: { id: dealRoomId },
        include: {
          milestones: { orderBy: { stepNumber: 'asc' } },
          overseasPoa: true,
        },
      })
      if (!dealRoom) {
        return NextResponse.json({ error: 'Deal Room not found' }, { status: 404 })
      }
      return NextResponse.json({ success: true, dealRoom })
    }

    // Return the latest active deal room or create initial demo deal room
    let latestDeal = await prisma.dealRoom.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        milestones: { orderBy: { stepNumber: 'asc' } },
        overseasPoa: true,
      },
    })

    if (!latestDeal) {
      latestDeal = await prisma.dealRoom.create({
        data: {
          dealNumber: 'NX-DEAL-782914',
          totalAgreedPrice: 45000000,
          currentMilestone: 2,
          buyerName: 'Hamza Tariq (Lahore)',
          sellerName: 'Kamran Ali (Overseas - UK)',
          agencyName: 'Zameen Experts & Associates',
          milestones: {
            create: [
              {
                stepNumber: 1,
                title: 'Bayana / Token Escrow Locker',
                status: 'COMPLETED',
                cprNumber: 'CPR-2026-981723',
                completedAt: new Date(),
              },
              {
                stepNumber: 2,
                title: 'DHA / Society NDC Clearance',
                status: 'IN_PROGRESS',
              },
              {
                stepNumber: 3,
                title: 'FBR Tax Challans & CPR Receipts',
                status: 'PENDING',
              },
              {
                stepNumber: 4,
                title: 'Final Transfer Desk & Biometric Appointment',
                status: 'PENDING',
              },
            ],
          },
        },
        include: {
          milestones: { orderBy: { stepNumber: 'asc' } },
          overseasPoa: true,
        },
      })
    }

    return NextResponse.json({ success: true, dealRoom: latestDeal })
  } catch (error) {
    console.error('Fetch deal room error:', error)
    return NextResponse.json({ error: 'Failed to fetch deal room' }, { status: 500 })
  }
}
