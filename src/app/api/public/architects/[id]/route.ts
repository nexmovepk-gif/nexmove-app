import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const arch = await prisma.architectProfile.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        projects: { orderBy: { createdAt: 'desc' } },
        reviews: { orderBy: { createdAt: 'desc' } },
      },
    })

    if (!arch) {
      return NextResponse.json({ error: 'Architect profile not found' }, { status: 404 })
    }

    const avgRating =
      arch.reviews.length > 0
        ? parseFloat((arch.reviews.reduce((acc, r) => acc + r.rating, 0) / arch.reviews.length).toFixed(1))
        : 0

    const images =
      arch.portfolioImages.length > 0
        ? arch.portfolioImages
        : arch.portfolioUrl
        ? [arch.portfolioUrl]
        : []

    const isVerified = Boolean(
      arch.isVerified ||
      arch.status === 'APPROVED' ||
      arch.verificationStatus === 'VERIFIED' ||
      arch.user?.isKycVerified ||
      arch.user?.isOverseasVerified
    )

    const architect = {
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
      avatarUrl: arch.avatarUrl || null,
      coverImage: arch.coverBannerUrl || arch.coverImage || null,
      coverBannerUrl: arch.coverBannerUrl || arch.coverImage || null,
      councilLicenseNo: arch.pcatpNo || arch.councilLicenseNo || 'VERIFIED-PCATP',
      verificationStatus: isVerified ? 'VERIFIED' : arch.verificationStatus || 'PENDING',
      verified: isVerified,
      experienceYears: arch.experienceYears || 5,
      experienceLevel: arch.experienceLevel || 'Senior',
      software: arch.software.length > 0 ? arch.software : ['Revit', 'AutoCAD', 'SketchUp', '3ds Max'],
      projectTypes: arch.projectTypes.length > 0 ? arch.projectTypes : ['Residential', 'Commercial'],
      portfolioLinks: arch.portfolioLinks,
      portfolioImages: images,
      projects: arch.projects,
      avgRating,
      reviewCount: arch.reviews.length,
      completedProjects: arch.projects.length,
      location: arch.location || (arch.city ? `${arch.city}, ${arch.country || 'Pakistan'}` : 'Pakistan'),
      availableForProjects: arch.availableForProjects,
      joinedAt: arch.createdAt.toISOString(),
    }

    return NextResponse.json({ architect })
  } catch (error) {
    console.error('[Public Architect Detail GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
