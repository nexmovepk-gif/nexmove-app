import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export interface Architect {
  id: string
  name: string
  title: string
  specialization: string
  companyName?: string | null
  isOverseas?: boolean
  country?: string | null
  city?: string | null
  pcatpNo?: string | null
  phone?: string | null
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const specialization = searchParams.get('specialization')
    const software = searchParams.get('software')
    const experienceLevel = searchParams.get('experienceLevel')
    const projectType = searchParams.get('projectType')
    const verifiedOnly = searchParams.get('verifiedOnly') === 'true'

    // Fetch approved architect profiles from Prisma database
    const dbArchitects = await prisma.architectProfile.findMany({
      where: {
        OR: [
          { status: 'APPROVED' },
          { verificationStatus: 'VERIFIED' },
          { isVerified: true },
        ],
      },
      include: {
        user: true,
        projects: true,
        reviews: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Map Prisma models to output DTO
    let mapped: Architect[] = dbArchitects.map((arch) => {
      const avgRating =
        arch.reviews.length > 0
          ? arch.reviews.reduce((acc, r) => acc + r.rating, 0) / arch.reviews.length
          : 4.8 // high default rating for verified professionals

      const images = arch.portfolioImages.length > 0
        ? arch.portfolioImages
        : arch.portfolioUrl ? [arch.portfolioUrl] : []

      return {
        id: arch.id,
        name: arch.name,
        title: arch.title || arch.specialization || 'Architect',
        specialization: arch.specialization,
        companyName: arch.companyName,
        isOverseas: arch.isOverseas,
        country: arch.country,
        city: arch.city,
        pcatpNo: arch.pcatpNo || arch.councilLicenseNo,
        phone: arch.phone || arch.user?.phone,
        bio: arch.bio || 'Verified Architect on NexMove PropTech Platform.',
        avatarInitials: arch.avatarInitials || arch.name.substring(0, 2).toUpperCase(),
        avatarGradient: arch.avatarGradient || 'from-teal-600 to-emerald-700',
        councilLicenseNo: arch.pcatpNo || arch.councilLicenseNo || 'VERIFIED-PCATP',
        verificationStatus: (arch.verificationStatus as unknown as Architect['verificationStatus']) || 'VERIFIED',
        verified: arch.isVerified || arch.status === 'APPROVED' || arch.verificationStatus === 'VERIFIED',
        experienceYears: arch.experienceYears || 5,
        experienceLevel: (arch.experienceLevel as unknown as Architect['experienceLevel']) || 'Senior',
        software: arch.software.length > 0 ? arch.software : ['Revit', 'AutoCAD', 'SketchUp', '3ds Max'],
        projectTypes: arch.projectTypes.length > 0 ? arch.projectTypes : ['Residential', 'Commercial'],
        portfolioLinks: arch.portfolioLinks,
        portfolioImages: images,
        avgRating,
        reviewCount: arch.reviews.length,
        completedProjects: arch.projects.length,
        location: arch.location || (arch.city ? `${arch.city}, ${arch.country || 'Pakistan'}` : 'Pakistan'),
        availableForProjects: arch.availableForProjects,
        joinedAt: arch.createdAt.toISOString(),
      }
    })

    if (verifiedOnly) {
      mapped = mapped.filter((a) => a.verified)
    }

    if (specialization && specialization !== 'All') {
      mapped = mapped.filter((a) =>
        a.specialization.toLowerCase().includes(specialization.toLowerCase())
      )
    }

    if (software) {
      mapped = mapped.filter((a) =>
        a.software.some((s) => s.toLowerCase().includes(software.toLowerCase()))
      )
    }

    if (experienceLevel && experienceLevel !== 'All') {
      mapped = mapped.filter((a) =>
        a.experienceLevel.toLowerCase() === experienceLevel.toLowerCase()
      )
    }

    if (projectType && projectType !== 'All') {
      mapped = mapped.filter((a) =>
        a.projectTypes.some((p) => p.toLowerCase().includes(projectType.toLowerCase()))
      )
    }

    // Compute aggregate stats across all approved architects
    const uniqueSpecs = new Set(dbArchitects.map((a) => a.specialization)).size
    const totalProjects = dbArchitects.reduce((acc, a) => acc + a.projects.length, 0)
    const overallAvgRating =
      mapped.length > 0
        ? mapped.reduce((acc, a) => acc + a.avgRating, 0) / mapped.length
        : 4.9

    const stats = {
      verifiedCount: mapped.length,
      specializationsCount: uniqueSpecs,
      avgRating: Number(overallAvgRating.toFixed(1)),
      completedProjectsCount: totalProjects,
    }

    return NextResponse.json({ architects: mapped, total: mapped.length, stats })
  } catch (error) {
    console.error('[Public Architects GET] Error:', error)
    return NextResponse.json({ architects: [], total: 0, stats: { verifiedCount: 0, specializationsCount: 0, avgRating: 0, completedProjectsCount: 0 } })
  }
}
