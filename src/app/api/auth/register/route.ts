import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { REGISTERED_USERS } from '@/lib/auth'
import { Role } from '@/generated/client/enums'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      agencyName,
      email,
      password,
      role,
      ntn,
      address,
      latitude,
      longitude,
      logo,
      storefrontPhoto,
      ownerPhoto,
      passportNumber,
      nicopNumber,
      cnicNumber,
      cnicFrontPhoto,
      cnicBackPhoto,
      overseasCountry,
      overseasCity,
      overseasPostalCode,
      overseasDocNumber,
      overseasDocPhoto,
    } = body

    const isAgencyRole = ['AGENCY_ADMIN', 'AGENCY_AGENT', 'AGENCY_MANAGER', 'OVERSEAS_AGENCY'].includes(role)
    const isLocalRole = ['BUYER', 'LOCAL_PUBLIC'].includes(role)
    const isOverseasRole = ['OVERSEAS_BUYER', 'OVERSEAS_INVESTOR', 'OVERSEAS_AGENCY', 'OVERSEAS_LOCAL_PUBLIC'].includes(role)

    // Mandatory base fields
    const missingFields: string[] = []
    if (!name) missingFields.push('Full Name')
    if (!email) missingFields.push('Email Address')
    if (!password) missingFields.push('Password')

    // Conditional role fields
    if (isAgencyRole) {
      if (!agencyName) missingFields.push('Agency Brand Name')
      if (!ntn) missingFields.push('NTN / Tax Registration Number')
      if (!address) missingFields.push('Complete Physical Address')
      if (latitude === undefined || latitude === null || latitude === '') missingFields.push('Latitude Coordinate')
      if (longitude === undefined || longitude === null || longitude === '') missingFields.push('Longitude Coordinate')
      if (!logo) missingFields.push('Agency Brand Logo')
      if (!storefrontPhoto) missingFields.push('Agency Storefront Photo')
      if (!ownerPhoto) missingFields.push('Agency Owner Identity Photo')
    }

    if (isLocalRole) {
      if (!cnicNumber) missingFields.push('CNIC Number')
      if (!cnicFrontPhoto) missingFields.push('CNIC Front Photo')
      if (!cnicBackPhoto) missingFields.push('CNIC Back Photo')
    }

    if (isOverseasRole) {
      if (!overseasCountry) missingFields.push('Country')
      if (!overseasCity) missingFields.push('City')
      if (!overseasPostalCode) missingFields.push('Postal Code')
      if (!overseasDocNumber && !passportNumber && !nicopNumber) missingFields.push('Overseas NICOP / Passport Number')
      if (!overseasDocPhoto) missingFields.push('Overseas Identity Document Photo')
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required mandatory registration fields: ${missingFields.join(', ')}.`,
        },
        { status: 400 }
      )
    }

    // Map incoming role string to valid system Role enum
    let assignedRole: Role = 'PUBLIC_USER'
    if (['AGENCY_ADMIN', 'AGENCY_MANAGER', 'OVERSEAS_AGENCY'].includes(role)) {
      assignedRole = 'AGENCY_MANAGER'
    } else if (role === 'AGENCY_AGENT') {
      assignedRole = 'AGENCY_AGENT'
    } else if (['OVERSEAS_BUYER', 'OVERSEAS_INVESTOR'].includes(role)) {
      assignedRole = 'PUBLIC_USER'
    }

    const newUserId = `usr_${Date.now()}`
    const newAgencyId = `ag_${Date.now()}`
    const finalAgencyName = agencyName || (isOverseasRole ? `${name}'s Overseas Agency` : `${name}'s Portfolio`)
    const finalNtn = ntn || 'N/A'
    const finalAddress = address || (isOverseasRole ? `${overseasCity}, ${overseasCountry}` : 'Pakistan')
    const parsedLat = latitude ? parseFloat(latitude) : 33.7215
    const parsedLng = longitude ? parseFloat(longitude) : 73.0565
    const finalLogo = logo || cnicFrontPhoto || overseasDocPhoto || ''
    const finalStorefrontPhoto = storefrontPhoto || cnicBackPhoto || overseasDocPhoto || ''
    const finalOwnerPhoto = ownerPhoto || cnicFrontPhoto || overseasDocPhoto || ''

    let userObj = {
      id: newUserId,
      email: email.toLowerCase(),
      name,
      password,
      role: assignedRole,
      accountRoleType: role,
      agencyId: newAgencyId,
      agencyName: finalAgencyName,
      ntn: finalNtn,
      address: finalAddress,
      latitude: parsedLat,
      longitude: parsedLng,
      logo: finalLogo,
      storefrontPhoto: finalStorefrontPhoto,
      ownerPhoto: finalOwnerPhoto,
      passportNumber: passportNumber || overseasDocNumber || null,
      nicopNumber: nicopNumber || cnicNumber || overseasDocNumber || null,
      overseasCountry: overseasCountry || null,
      overseasCity: overseasCity || null,
      overseasPostalCode: overseasPostalCode || null,
    }

    // Try persisting to Prisma DB if accessible
    try {
      const createdAgency = await prisma.agency.create({
        data: {
          name: finalAgencyName,
          verified: true,
          verifiedLicense: true,
          address: finalAddress,
          logo: finalLogo,
          ntn: finalNtn,
          latitude: parsedLat,
          longitude: parsedLng,
          storefrontPhoto: finalStorefrontPhoto,
          ownerPhoto: finalOwnerPhoto,
        },
      })

      const createdUser = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password,
          role: assignedRole,
          agencyId: createdAgency.id,
        },
      })

      userObj = {
        ...userObj,
        id: createdUser.id,
        agencyId: createdAgency.id,
      }
    } catch (dbError) {
      console.warn('Database insert skipped or failed during register, using in-memory store:', dbError)
    }

    // Push to REGISTERED_USERS cache for instant NextAuth credential validation
    const existingIndex = REGISTERED_USERS.findIndex((u) => u.email.toLowerCase() === email.toLowerCase())
    if (existingIndex >= 0) {
      REGISTERED_USERS[existingIndex] = userObj
    } else {
      REGISTERED_USERS.push(userObj)
    }

    return NextResponse.json(
      {
        message: 'Account registered successfully with role-based verification metadata',
        user: {
          id: userObj.id,
          name: userObj.name,
          email: userObj.email,
          role: userObj.role,
          accountRoleType: userObj.accountRoleType,
          agencyId: userObj.agencyId,
          agencyName: userObj.agencyName,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Registration handler error:', error)
    const errMsg = error instanceof Error ? error.message : 'An error occurred during registration'
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}
