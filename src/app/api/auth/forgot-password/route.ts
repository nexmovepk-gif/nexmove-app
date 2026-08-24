import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Find user — but always return success to prevent email enumeration attacks
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      // Security: don't reveal whether email exists or not
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a reset link has been sent.',
      })
    }

    // Delete any existing tokens for this user (only one active at a time)
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Generate a secure random token (64 hex chars = 256-bit entropy)
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    // Save token to DB
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Build reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'https://nexmove.vercel.app'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      await resend.emails.send({
        from: 'NexMove PropTech <onboarding@resend.dev>',
        to: [user.email],
        subject: '🔐 NexMove — Password Reset Request',
        html: `
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
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#064e3b,#059669);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">🏢 NexMove</h1>
              <p style="margin:6px 0 0;color:#a7f3d0;font-size:13px;font-weight:500;">Pakistan's Premier PropTech Platform</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">Password Reset Request</h2>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                Hello ${user.name || 'NexMove User'},<br/><br/>
                We received a request to reset the password for your account associated with <strong>${user.email}</strong>.
                Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 28px;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:linear-gradient(135deg,#059669,#047857);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.2px;">
                      🔐 Reset My Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security Note -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin-bottom:20px;">
                <p style="margin:0;color:#475569;font-size:12px;line-height:1.7;">
                  <strong style="color:#0f172a;">🛡️ Security Notice:</strong><br/>
                  • This link will <strong>expire in 1 hour</strong><br/>
                  • If you did not request this reset, please <strong>ignore this email</strong> — your account remains secure<br/>
                  • Never share this link with anyone
                </p>
              </div>

              <!-- Fallback URL -->
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">
                If the button above doesn't work, copy and paste this URL into your browser:<br/>
                <span style="color:#059669;word-break:break-all;">${resetUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                © 2025 NexMove PropTech — Pakistan's Verified Real Estate Platform<br/>
                This is an automated security email. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      })
    } else {
      console.warn('[forgot-password] RESEND_API_KEY not set — email skipped (dev mode)')
    }

    return NextResponse.json({
      success: true,
      message: 'If this email is registered, a reset link has been sent.',
    })
  } catch (error) {
    console.error('[forgot-password] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
