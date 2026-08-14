import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export interface Architect {
  id: string
  name: string
  title: string
  specialization: string
  bio: string
  avatarInitials: string
  avatarGradient: string
  councilLicenseNo: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  verified: boolean
  experienceYears: number
  experienceLevel: 'Junior' | 'Mid-Level' | 'Senior' | 'Principal'
  software: string[]
  projectTypes: string[]
  portfolioLinks: string[]
  portfolioImages: string[]
  avgRating: number
  reviewCount: number
  completedProjects: number
  location: string
  availableForProjects: boolean
  joinedAt: string
}

// ─── Production Data (fetched from database — initially empty) ───────────────
const ARCHITECTS_DB: Architect[] = []


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const specialization = searchParams.get('specialization')
  const software = searchParams.get('software')
  const experienceLevel = searchParams.get('experienceLevel')
  const projectType = searchParams.get('projectType')
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true'

  let results = ARCHITECTS_DB.filter((a) => a.verificationStatus === 'VERIFIED')

  if (verifiedOnly) {
    results = results.filter((a) => a.verified)
  }

  if (specialization) {
    results = results.filter((a) =>
      a.specialization.toLowerCase().includes(specialization.toLowerCase())
    )
  }

  if (software) {
    results = results.filter((a) =>
      a.software.some((s) => s.toLowerCase().includes(software.toLowerCase()))
    )
  }

  if (experienceLevel) {
    results = results.filter((a) =>
      a.experienceLevel.toLowerCase() === experienceLevel.toLowerCase()
    )
  }

  if (projectType) {
    results = results.filter((a) =>
      a.projectTypes.some((p) => p.toLowerCase().includes(projectType.toLowerCase()))
    )
  }

  return NextResponse.json({ architects: results, total: results.length })
}
