import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json()

    // Basic validation
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Reset token is missing or invalid.' }, { status: 400 })
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    // Find the token record
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has already been used.' },
        { status: 400 }
      )
    }

    // Check if token has expired
    if (new Date() > resetRecord.expiresAt) {
      // Delete the expired token
      await prisma.passwordResetToken.delete({ where: { token } })
      return NextResponse.json(
        { error: 'This reset link has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: resetRecord.userId },
      select: { id: true },
    })

    if (!user) {
      await prisma.passwordResetToken.delete({ where: { token } })
      return NextResponse.json(
        { error: 'Account not found. Please contact support.' },
        { status: 404 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Delete the used token (one-time use)
    await prisma.passwordResetToken.delete({ where: { token } })

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.',
    })
  } catch (error) {
    console.error('[reset-password] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
