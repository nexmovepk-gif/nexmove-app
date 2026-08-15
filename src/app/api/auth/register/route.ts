import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@/generated/client/enums'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      agencyName,
      email,
      password,
      role,
      phone,
      liveSelfiePhoto,
      liveSelfieUrl,
      ntn,
      address,
      latitude,
      longitude,
      logo,
      storefrontPhoto,
      ownerPhoto,
      commercialLicenseDoc,
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
      taxIdNumber,
    } = body

    const isAgencyRole = ['AGENCY_ADMIN', 'AGENCY_AGENT', 'AGENCY_MANAGER', 'OVERSEAS_AGENCY'].includes(role)
    const isLocalRole = ['BUYER', 'LOCAL_PUBLIC'].includes(role)
    const isOverseasRole = ['OVERSEAS_BUYER', 'OVERSEAS_INVESTOR', 'OVERSEAS_AGENCY', 'OVERSEAS_LOCAL_PUBLIC'].includes(role)

    const finalLiveSelfie = liveSelfiePhoto || liveSelfieUrl || null

    // Mandatory base fields for ALL roles
    const missingFields: string[] = []
    if (!name) missingFields.push('Full Name')
    if (!email) missingFields.push('Email Address')
    if (!password) missingFields.push('Password')
    if (!phone) missingFields.push('Phone Number')
    if (!finalLiveSelfie) missingFields.push('Live Identity Selfie Snapshot')

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
      if (role === 'OVERSEAS_AGENCY' && !commercialLicenseDoc) {
        missingFields.push('Agency Commercial License / Tax Registration Document')
      }
    }

    if (isLocalRole) {
      if (!cnicNumber) missingFields.push('CNIC Number')
      if (!cnicFrontPhoto) missingFields.push('CNIC Front Photo')
      if (!cnicBackPhoto) missingFields.push('CNIC Back Photo')
    }

    if (isOverseasRole) {
      if (!overseasCountry) missingFields.push('Country of Residence')
      if (!overseasCity) missingFields.push('City')
      if (!overseasDocNumber && !passportNumber && !nicopNumber && !cnicNumber) {
        missingFields.push('Overseas NICOP / Passport Number')
      }
      if (!overseasDocPhoto && !cnicFrontPhoto) {
        missingFields.push('Overseas Identity Document / Passport Photo')
      }
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required mandatory registration fields: ${missingFields.join(', ')}.`,
        },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Ensure user does not already exist in Supabase DB
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists. Please log in or use a different email.' },
        { status: 409 }
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

    const parsedLat = latitude ? parseFloat(latitude) : 33.7215
    const parsedLng = longitude ? parseFloat(longitude) : 73.0565

    let createdAgencyId: string | null = null
    let createdAgencyName: string | null = null

    if (isAgencyRole) {
      const finalAgencyName = agencyName || `${name}'s Agency`
      const finalAddress = address || (isOverseasRole ? `${overseasCity}, ${overseasCountry}` : 'Pakistan')

      const createdAgency = await prisma.agency.create({
        data: {
          name: finalAgencyName,
          verified: true,
          verifiedLicense: true,
          address: finalAddress,
          phone: phone || null,
          logo: logo || null,
          ntn: ntn || null,
          cnicNumber: cnicNumber || null,
          cnicFrontUrl: cnicFrontPhoto || null,
          cnicBackUrl: cnicBackPhoto || null,
          latitude: parsedLat,
          longitude: parsedLng,
          storefrontPhoto: storefrontPhoto || null,
          ownerPhoto: ownerPhoto || null,
          commercialLicenseDoc: commercialLicenseDoc || null,
        },
      })
      createdAgencyId = createdAgency.id
      createdAgencyName = createdAgency.name
    }

    const finalPassport = passportNumber || (isOverseasRole ? overseasDocNumber : null)
    const finalNicop = nicopNumber || (isOverseasRole ? overseasDocNumber : null)
    const finalDocPhoto = overseasDocPhoto || cnicFrontPhoto || null

    // Hash the password with bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10)

    const createdUser = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone || null,
        role: assignedRole,
        accountRoleType: role,
        cnicNumber: cnicNumber || null,
        cnicFrontUrl: cnicFrontPhoto || null,
        cnicBackUrl: cnicBackPhoto || null,
        nicopNumber: finalNicop,
        passportNumber: finalPassport,
        overseasCountry: overseasCountry || null,
        overseasCity: overseasCity || null,
        overseasPostalCode: overseasPostalCode || null,
        overseasDocPhoto: finalDocPhoto,
        liveSelfieUrl: finalLiveSelfie,
        taxIdNumber: taxIdNumber || null,
        isOverseasVerified: isOverseasRole ? true : false,
        address: address || null,
        agencyId: createdAgencyId,
      },
      include: {
        agency: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Account registered successfully with direct database persistence',
        user: {
          id: createdUser.id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
          accountRoleType: createdUser.accountRoleType,
          agencyId: createdUser.agencyId,
          agencyName: createdUser.agency?.name || createdAgencyName || null,
          cnicFrontUrl: createdUser.cnicFrontUrl,
          cnicBackUrl: createdUser.cnicBackUrl,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Registration database transaction error:', error)
    const errMsg = error instanceof Error ? error.message : 'An error occurred during registration'
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}

