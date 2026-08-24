import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/client/enums'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { agency: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const agencyId = user.agencyId || (user.agency ? user.agency.id : null)

    const agents = await prisma.user.findMany({
      where: agencyId
        ? {
            agencyId,
            role: { in: [Role.AGENCY_AGENT, Role.AGENCY_MANAGER] },
          }
        : {
            role: { in: [Role.AGENCY_AGENT, Role.AGENCY_MANAGER] },
          },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        accountRoleType: true,
        isKycVerified: true,
        profileImage: true,
        createdAt: true,
        _count: {
          select: {
            properties: true,
            listings: true,
            dealsSeller: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    const mapped = agents.map((a) => ({
      id: a.id,
      name: a.name || 'Unnamed Agent',
      email: a.email,
      phone: a.phone || 'N/A',
      role: a.role,
      isKycVerified: a.isKycVerified,
      profileImage: a.profileImage,
      listingsCount: Math.max(a._count.properties, a._count.listings),
      dealsCount: a._count.dealsSeller,
      joinedAt: a.createdAt,
    }))

    return NextResponse.json({ success: true, agents: mapped })
  } catch (error) {
    console.error('Failed to fetch agents:', error)
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { agency: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let targetAgencyId = user.agencyId || (user.agency ? user.agency.id : null)
    let agencyName = user.agency?.name || 'NexMove Partner Agency'

    if (!targetAgencyId) {
      const defaultAgency = await prisma.agency.findFirst()
      if (defaultAgency) {
        targetAgencyId = defaultAgency.id
        agencyName = defaultAgency.name
      } else {
        const createdAgency = await prisma.agency.create({
          data: {
            name: `${user.name || 'NexMove'} Agency`,
            verified: true,
          },
        })
        targetAgencyId = createdAgency.id
        agencyName = createdAgency.name
      }
    }

    const body = await request.json()
    const { name, email, phone, role, password } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const rawPassword = password && password.length >= 6 ? password : `NexAgent@${Math.floor(1000 + Math.random() * 9000)}`
    const hashedPassword = await bcrypt.hash(rawPassword, 12)

    const selectedRole = role === 'AGENCY_MANAGER' ? Role.AGENCY_MANAGER : Role.AGENCY_AGENT

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    let createdOrUpdatedAgent

    if (existingUser) {
      // Update role and link to agency
      createdOrUpdatedAgent = await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          name: name.trim(),
          phone: phone ? phone.trim() : existingUser.phone,
          role: selectedRole,
          accountRoleType: 'AGENCY_AGENT',
          agencyId: targetAgencyId,
        },
      })
    } else {
      // Create new agent user
      createdOrUpdatedAgent = await prisma.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          phone: phone ? phone.trim() : undefined,
          role: selectedRole,
          accountRoleType: 'AGENCY_AGENT',
          agencyId: targetAgencyId,
          isKycVerified: true,
        },
      })
    }

    // Send Welcome / Credentials Email
    const loginUrl = `${process.env.NEXTAUTH_URL || 'https://nexmove-app.vercel.app'}/login`
    const emailSubject = `🏢 Welcome to ${agencyName} on NexMove — Agent Portal Credentials`
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b,#059669);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">🏢 NexMove PropTech</h1>
              <p style="margin:6px 0 0;color:#a7f3d0;font-size:13px;font-weight:500;">Agency Staff Onboarding &amp; Agent Portal</p>
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">Welcome to the Team, ${name}!</h2>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                You have been officially invited by <strong>${agencyName}</strong> to join their verified agent network on NexMove.
              </p>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;">
                <h3 style="margin:0 0 12px;color:#0f172a;font-size:14px;font-weight:700;">🔐 Your Agent Sign-In Credentials</h3>
                <p style="margin:4px 0;color:#475569;font-size:13px;"><strong>Portal Email:</strong> ${normalizedEmail}</p>
                <p style="margin:4px 0;color:#475569;font-size:13px;"><strong>Temporary Password:</strong> <code style="background:#e2e8f0;padding:2px 6px;border-radius:4px;color:#0f172a;">${rawPassword}</code></p>
                <p style="margin:4px 0;color:#475569;font-size:13px;"><strong>Assigned Role:</strong> ${selectedRole === Role.AGENCY_MANAGER ? 'Agency Manager' : 'Property Agent'}</p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${loginUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;">
                      🚀 Sign In to Agent Portal
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                Once signed in, you can add and manage property listings, close verified deals, and track your performance on the Agency Leaderboard.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                © 2025 NexMove PropTech — Pakistan's Premier Real Estate Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `

    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
      })
      await transporter.sendMail({
        from: `"NexMove PropTech" <${smtpUser}>`,
        to: normalizedEmail,
        subject: emailSubject,
        html: emailHtml,
      })
      console.log(`[agency/agents] Welcome email dispatched via Gmail SMTP to: ${normalizedEmail}`)
    } else if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'NexMove PropTech <onboarding@resend.dev>',
        to: [normalizedEmail],
        subject: emailSubject,
        html: emailHtml,
      })
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: createdOrUpdatedAgent.id,
        name: createdOrUpdatedAgent.name,
        email: createdOrUpdatedAgent.email,
        phone: createdOrUpdatedAgent.phone,
        role: createdOrUpdatedAgent.role,
      },
    })
  } catch (error) {
    console.error('Failed to invite agent:', error)
    return NextResponse.json({ error: 'Failed to invite agent' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 })
    }

    // Change role back to PUBLIC_USER and remove agencyId
    await prisma.user.update({
      where: { id },
      data: {
        role: Role.PUBLIC_USER,
        accountRoleType: 'PUBLIC_USER',
        agencyId: null,
      },
    })

    return NextResponse.json({ success: true, message: 'Agent removed from agency' })
  } catch (error) {
    console.error('Failed to remove agent:', error)
    return NextResponse.json({ error: 'Failed to remove agent' }, { status: 500 })
  }
}
