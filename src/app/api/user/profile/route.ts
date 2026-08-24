import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000 // 180 days in milliseconds

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      include: { agency: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 })
    }

    // Determine effective bank details timestamp (User or Agency)
    const effectiveBankUpdatedAt = user.agencyId && user.agency?.bankDetailsUpdatedAt
      ? user.agency.bankDetailsUpdatedAt
      : user.bankDetailsUpdatedAt

    let canEditBank = true
    let daysRemaining = 0
    let unlocksAt: string | null = null

    if (effectiveBankUpdatedAt) {
      const elapsedMs = Date.now() - new Date(effectiveBankUpdatedAt).getTime()
      if (elapsedMs < SIX_MONTHS_MS) {
        canEditBank = false
        const remainingMs = SIX_MONTHS_MS - elapsedMs
        daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
        const unlockDate = new Date(new Date(effectiveBankUpdatedAt).getTime() + SIX_MONTHS_MS)
        unlocksAt = unlockDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        accountRoleType: user.accountRoleType,
        profileImage: user.profileImage || user.liveSelfieUrl || user.agency?.logo || null,
        isKycVerified: user.isKycVerified || user.isOverseasVerified,
        cnicNumber: user.cnicNumber,
        nicopNumber: user.nicopNumber,
        passportNumber: user.passportNumber,
        overseasCountry: user.overseasCountry,
        overseasCity: user.overseasCity,
        // Banking info
        bankName: user.agency?.bankName || user.bankName || '',
        accountTitle: user.agency?.accountTitle || user.accountTitle || '',
        accountNumber: user.agency?.accountNumber || user.accountNumber || '',
        iban: user.agency?.iban || user.iban || '',
        swiftCode: user.agency?.swiftCode || '',
        bankDetailsUpdatedAt: effectiveBankUpdatedAt,
        canEditBank,
        daysRemaining,
        unlocksAt,
      },
      agency: user.agency
        ? {
            id: user.agency.id,
            name: user.agency.name,
            ntn: user.agency.ntn,
            phone: user.agency.phone,
            address: user.agency.address,
            logo: user.agency.logo,
            verified: user.agency.verified,
          }
        : null,
    })
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    return NextResponse.json({ error: 'Failed to fetch user profile.' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 })
    }

    const email = session.user.email.toLowerCase().trim()
    const user = await prisma.user.findUnique({
      where: { email },
      include: { agency: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User record not found.' }, { status: 404 })
    }

    const body = await req.json()
    const {
      name,
      phone,
      address,
      profileImage,
      bankName,
      accountTitle,
      accountNumber,
      iban,
      swiftCode,
      agencyName,
      logo,
    } = body

    // 1. Check if banking details are being changed
    const isAgencyUser = Boolean(user.agencyId)
    const currentBankName = (isAgencyUser ? user.agency?.bankName : user.bankName) || ''
    const currentAccountTitle = (isAgencyUser ? user.agency?.accountTitle : user.accountTitle) || ''
    const currentAccountNumber = (isAgencyUser ? user.agency?.accountNumber : user.accountNumber) || ''
    const currentIban = (isAgencyUser ? user.agency?.iban : user.iban) || ''
    const currentSwift = (isAgencyUser ? user.agency?.swiftCode : '') || ''

    const isBankDetailProvided =
      bankName !== undefined ||
      accountTitle !== undefined ||
      accountNumber !== undefined ||
      iban !== undefined ||
      swiftCode !== undefined

    const hasBankChanged =
      isBankDetailProvided &&
      ((bankName !== undefined && bankName !== currentBankName) ||
        (accountTitle !== undefined && accountTitle !== currentAccountTitle) ||
        (accountNumber !== undefined && accountNumber !== currentAccountNumber) ||
        (iban !== undefined && iban !== currentIban) ||
        (swiftCode !== undefined && swiftCode !== currentSwift))

    const effectiveBankUpdatedAt = isAgencyUser
      ? user.agency?.bankDetailsUpdatedAt
      : user.bankDetailsUpdatedAt

    if (hasBankChanged && effectiveBankUpdatedAt) {
      const elapsedMs = Date.now() - new Date(effectiveBankUpdatedAt).getTime()
      if (elapsedMs < SIX_MONTHS_MS) {
        const remainingMs = SIX_MONTHS_MS - elapsedMs
        const daysRemaining = Math.ceil(remainingMs / (1000 * 60 * 60 * 24))
        const unlockDate = new Date(new Date(effectiveBankUpdatedAt).getTime() + SIX_MONTHS_MS)
        const formattedDate = unlockDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        return NextResponse.json(
          {
            error: `Security Lock Active: Bank details cannot be modified until ${formattedDate} (${daysRemaining} days remaining) to protect your funds against unauthorized diversion.`,
          },
          { status: 403 }
        )
      }
    }

    const now = new Date()
    const updateBankTimestamp = hasBankChanged ? now : undefined

    // 2. Update User Record
    const userUpdateData: Record<string, unknown> = {}
    if (name !== undefined) userUpdateData.name = name
    if (phone !== undefined) userUpdateData.phone = phone
    if (address !== undefined) userUpdateData.address = address
    if (profileImage !== undefined) userUpdateData.profileImage = profileImage

    if (hasBankChanged && !isAgencyUser) {
      if (bankName !== undefined) userUpdateData.bankName = bankName
      if (accountTitle !== undefined) userUpdateData.accountTitle = accountTitle
      if (accountNumber !== undefined) userUpdateData.accountNumber = accountNumber
      if (iban !== undefined) userUpdateData.iban = iban
      userUpdateData.bankDetailsUpdatedAt = updateBankTimestamp
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: userUpdateData,
      include: { agency: true },
    })

    // 3. Update Agency Record if applicable
    if (user.agencyId) {
      const agencyUpdateData: Record<string, unknown> = {}
      if (agencyName !== undefined) agencyUpdateData.name = agencyName
      if (logo !== undefined) agencyUpdateData.logo = logo
      if (address !== undefined) agencyUpdateData.address = address
      if (phone !== undefined) agencyUpdateData.phone = phone

      if (hasBankChanged) {
        if (bankName !== undefined) agencyUpdateData.bankName = bankName
        if (accountTitle !== undefined) agencyUpdateData.accountTitle = accountTitle
        if (accountNumber !== undefined) agencyUpdateData.accountNumber = accountNumber
        if (iban !== undefined) agencyUpdateData.iban = iban
        if (swiftCode !== undefined) agencyUpdateData.swiftCode = swiftCode
        agencyUpdateData.bankDetailsUpdatedAt = updateBankTimestamp
      }

      if (Object.keys(agencyUpdateData).length > 0) {
        await prisma.agency.update({
          where: { id: user.agencyId },
          data: agencyUpdateData,
        })
      }
    }

    return NextResponse.json({
      message: 'Profile and security settings updated successfully.',
      bankUpdated: hasBankChanged,
    })
  } catch (error) {
    console.error('Failed to update user profile:', error)
    return NextResponse.json({ error: 'Failed to update profile settings.' }, { status: 500 })
  }
}
