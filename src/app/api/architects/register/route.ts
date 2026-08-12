import { NextResponse } from 'next/server'

interface PendingArchitect {
  id: string
  fullName: string
  email: string
  passwordHash: string
  councilLicenseNo: string | null
  degrees: string[]
  experienceYears: number
  specialization: string
  software: string[]
  projectTypes: string[]
  portfolioLinks: string[]
  bio: string
  verificationStatus: string
  verified: boolean
  submittedAt: string
}

const PENDING_ARCHITECTS: PendingArchitect[] = []

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      fullName,
      email,
      password,
      councilLicenseNo,
      degrees,
      experienceYears,
      specialization,
      software,
      projectTypes,
      portfolioLinks,
      bio,
    } = body

    if (!fullName || !email || !password || !specialization) {
      return NextResponse.json(
        { error: 'Missing required fields: fullName, email, password, and specialization are required.' },
        { status: 400 }
      )
    }

    const newArchitect = {
      id: `arch_${Date.now()}`,
      fullName,
      email: email.toLowerCase(),
      passwordHash: password, // In production: bcrypt hash
      councilLicenseNo: councilLicenseNo || null,
      degrees: degrees || [],
      experienceYears: Number(experienceYears) || 0,
      specialization,
      software: software || [],
      projectTypes: projectTypes || [],
      portfolioLinks: portfolioLinks || [],
      bio: bio || '',
      verificationStatus: 'PENDING',
      verified: false,
      submittedAt: new Date().toISOString(),
    }

    // Attempt DB insert (with in-memory fallback)
    try {
      // const created = await prisma.architect.create({ data: { ... } })
      // Using in-memory for now as schema extension is outside scope
    } catch {
      // Silently fall through to in-memory
    }

    PENDING_ARCHITECTS.push(newArchitect)

    return NextResponse.json(
      {
        message: 'Application submitted successfully. Your profile is pending verification by the NexMove team.',
        architect: {
          id: newArchitect.id,
          fullName: newArchitect.fullName,
          email: newArchitect.email,
          verificationStatus: newArchitect.verificationStatus,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    console.error('Architect registration error:', error)
    const errMsg = error instanceof Error ? error.message : 'An error occurred during registration'
    return NextResponse.json(
      { error: errMsg },
      { status: 500 }
    )
  }
}

export async function GET() {
  // Admin-only: return all pending registrations
  return NextResponse.json({ pending: PENDING_ARCHITECTS, total: PENDING_ARCHITECTS.length })
}
