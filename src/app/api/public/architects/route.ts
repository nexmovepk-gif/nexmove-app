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

// ─── Mock Seed Data ───────────────────────────────────────────────────────────
const ARCHITECTS_DB: Architect[] = [
  {
    id: 'arch_001',
    name: 'Aisha Rahman',
    title: 'Principal Architect & BIM Specialist',
    specialization: 'BIM Specialist',
    bio: 'Award-winning architect with 12+ years in high-rise and mixed-use commercial developments. Certified BIM Manager with expertise in Revit MEP coordination.',
    avatarInitials: 'AR',
    avatarGradient: 'from-violet-500 to-purple-600',
    councilLicenseNo: 'PCATP-2014-04821',
    verificationStatus: 'VERIFIED',
    verified: true,
    experienceYears: 12,
    experienceLevel: 'Principal',
    software: ['Revit', 'AutoCAD', 'Navisworks', 'Dynamo'],
    projectTypes: ['Commercial', 'High-Rise', 'Mixed-Use'],
    portfolioLinks: ['https://behance.net/aisharahman', 'https://archinect.com/aisharahman'],
    portfolioImages: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=80',
    ],
    avgRating: 4.9,
    reviewCount: 47,
    completedProjects: 38,
    location: 'Karachi, Pakistan',
    availableForProjects: true,
    joinedAt: '2024-01-15',
  },
  {
    id: 'arch_002',
    name: 'Omar Siddiqui',
    title: '3D Visualization & Rendering Artist',
    specialization: '3D Visualizer',
    bio: 'Hyper-realistic 3D architectural visualizations for residential and luxury developments. Specialised in photorealistic night renders and virtual walkthroughs.',
    avatarInitials: 'OS',
    avatarGradient: 'from-amber-500 to-orange-600',
    councilLicenseNo: 'PEC-2018-09234',
    verificationStatus: 'VERIFIED',
    verified: true,
    experienceYears: 7,
    experienceLevel: 'Senior',
    software: ['3ds Max', 'Lumion', 'V-Ray', 'Enscape', 'Photoshop'],
    projectTypes: ['Residential', 'Commercial', 'Luxury Villas'],
    portfolioLinks: ['https://behance.net/omarsiddiqui3d'],
    portfolioImages: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80',
    ],
    avgRating: 4.8,
    reviewCount: 63,
    completedProjects: 94,
    location: 'Lahore, Pakistan',
    availableForProjects: true,
    joinedAt: '2024-02-20',
  },
  {
    id: 'arch_003',
    name: 'Zara Malik',
    title: 'Interior Designer & Space Planner',
    specialization: 'Interior Designer',
    bio: 'Boutique interior design studio specializing in luxury residential and hospitality spaces. Expert in biophilic design and sustainable material selection.',
    avatarInitials: 'ZM',
    avatarGradient: 'from-rose-500 to-pink-600',
    councilLicenseNo: 'IAPD-2019-11032',
    verificationStatus: 'VERIFIED',
    verified: true,
    experienceYears: 8,
    experienceLevel: 'Senior',
    software: ['SketchUp', 'AutoCAD', 'Enscape', '3ds Max', 'Adobe Suite'],
    projectTypes: ['Residential', 'Hospitality', 'Luxury Villas'],
    portfolioLinks: ['https://zaramalikdesign.com', 'https://instagram.com/zaramalikinteriors'],
    portfolioImages: [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80',
      'https://images.unsplash.com/photo-1615529162924-f8605388461d?w=400&q=80',
    ],
    avgRating: 4.95,
    reviewCount: 82,
    completedProjects: 61,
    location: 'Islamabad, Pakistan',
    availableForProjects: false,
    joinedAt: '2024-01-28',
  },
  {
    id: 'arch_004',
    name: 'Hamid Nawaz',
    title: 'Revit Technician & Architectural Draughtsman',
    specialization: 'Revit Technician',
    bio: 'Production-focused BIM technician handling complex Revit models, documentation sets, and shop drawings for large-scale contractors and developers.',
    avatarInitials: 'HN',
    avatarGradient: 'from-teal-500 to-cyan-600',
    councilLicenseNo: 'PEC-2020-17654',
    verificationStatus: 'VERIFIED',
    verified: true,
    experienceYears: 5,
    experienceLevel: 'Mid-Level',
    software: ['Revit', 'AutoCAD', 'BIM 360', 'Navisworks'],
    projectTypes: ['Commercial', 'High-Rise', 'Industrial'],
    portfolioLinks: ['https://linkedin.com/in/hamidnawaz'],
    portfolioImages: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    ],
    avgRating: 4.6,
    reviewCount: 29,
    completedProjects: 42,
    location: 'Karachi, Pakistan',
    availableForProjects: true,
    joinedAt: '2024-03-10',
  },
  {
    id: 'arch_005',
    name: 'Fatima Khurshid',
    title: 'Landscape Architect & Urban Designer',
    specialization: 'Landscape Architect',
    bio: 'Sustainable landscape architecture and urban planning expert. Projects include master plans, parks, rooftop gardens, and golf course design across South Asia.',
    avatarInitials: 'FK',
    avatarGradient: 'from-green-500 to-emerald-600',
    councilLicenseNo: 'PILA-2016-06721',
    verificationStatus: 'VERIFIED',
    verified: true,
    experienceYears: 10,
    experienceLevel: 'Principal',
    software: ['AutoCAD', 'SketchUp', 'Lumion', 'ArcGIS', 'Rhino'],
    projectTypes: ['Residential', 'Commercial', 'Urban Planning'],
    portfolioLinks: ['https://fatimakhurshid.pk'],
    portfolioImages: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80',
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80',
    ],
    avgRating: 4.75,
    reviewCount: 38,
    completedProjects: 27,
    location: 'Lahore, Pakistan',
    availableForProjects: true,
    joinedAt: '2024-02-05',
  },
  {
    id: 'arch_006',
    name: 'Ali Zaidi',
    title: 'Junior Architect & AutoCAD Draughtsman',
    specialization: '3D Visualizer',
    bio: 'Fresh talent with strong AutoCAD and Revit skills. Currently seeking collaborative projects in residential and commercial sectors.',
    avatarInitials: 'AZ',
    avatarGradient: 'from-blue-500 to-indigo-600',
    councilLicenseNo: '',
    verificationStatus: 'PENDING',
    verified: false,
    experienceYears: 2,
    experienceLevel: 'Junior',
    software: ['AutoCAD', 'SketchUp', 'Revit'],
    projectTypes: ['Residential'],
    portfolioLinks: [],
    portfolioImages: [],
    avgRating: 0,
    reviewCount: 0,
    completedProjects: 5,
    location: 'Faisalabad, Pakistan',
    availableForProjects: true,
    joinedAt: '2024-04-01',
  },
  {
    id: 'arch_007',
    name: 'Nadia Hassan',
    title: 'BIM Manager & Project Coordinator',
    specialization: 'BIM Specialist',
    bio: 'Dual-qualified architect and BIM manager with international project experience in UAE and UK. Expert in federated BIM models and clash detection workflows.',
    avatarInitials: 'NH',
    avatarGradient: 'from-indigo-500 to-violet-600',
    councilLicenseNo: 'PCATP-2013-03142',
    verificationStatus: 'VERIFIED',
    verified: true,
    experienceYears: 13,
    experienceLevel: 'Principal',
    software: ['Revit', 'Navisworks', 'BIM 360', 'AutoCAD', 'Dynamo'],
    projectTypes: ['High-Rise', 'Commercial', 'Mixed-Use'],
    portfolioLinks: ['https://linkedin.com/in/nadiahassan'],
    portfolioImages: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80',
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=80',
      'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80',
    ],
    avgRating: 4.85,
    reviewCount: 54,
    completedProjects: 71,
    location: 'Karachi, Pakistan',
    availableForProjects: true,
    joinedAt: '2024-01-08',
  },
]

// ─── Route Handler ─────────────────────────────────────────────────────────────
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
