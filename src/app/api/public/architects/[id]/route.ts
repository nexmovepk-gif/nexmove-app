import { NextResponse } from 'next/server'

// ─── Production Data (initially empty — populated from database) ──────────────
const ARCHITECTS_DB: {
  id: string; name: string; title: string; specialization: string; bio: string;
  avatarInitials: string; avatarGradient: string; councilLicenseNo: string;
  verificationStatus: string; verified: boolean; experienceYears: number;
  experienceLevel: string; degrees?: string[]; software: string[]; projectTypes: string[];
  portfolioLinks: string[]; portfolioImages: string[]; avgRating: number;
  reviewCount: number; completedProjects: number; location: string;
  phone?: string; availableForProjects: boolean; joinedAt: string;
}[] = []


export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const architect = ARCHITECTS_DB.find((a) => a.id === params.id)

  if (!architect) {
    return NextResponse.json({ error: 'Architect not found' }, { status: 404 })
  }

  if (architect.verificationStatus !== 'VERIFIED') {
    return NextResponse.json({ error: 'Profile not publicly available' }, { status: 403 })
  }

  return NextResponse.json({ architect })
}
