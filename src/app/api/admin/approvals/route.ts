// src/app/api/admin/approvals/route.ts
// GET all pending applications: architect profiles + agencies + user KYC
// Handles case-insensitive and boolean fallback matching for all non-verified states

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function checkSuperAdmin(session: { user?: { role?: string | null; email?: string | null } } | null): boolean {
  return (
    session?.user?.role === "SUPER_ADMIN" ||
    session?.user?.email?.toLowerCase() === "nexmove.pk@gmail.com"
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!checkSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
  }

  try {
    // Fetch ALL pending/unverified architect profiles
    // Matches: verificationStatus = 'PENDING' | 'pending' | isVerified = false
    const pendingArchitects = await prisma.architectProfile.findMany({
      where: {
        OR: [
          { verificationStatus: "PENDING" },
          { verificationStatus: "pending" },
          { isVerified: false },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        title: true,
        specialization: true,
        experienceLevel: true,
        location: true,
        councilLicenseNo: true,
        verificationStatus: true,
        isVerified: true,
        bio: true,
        software: true,
        projectTypes: true,
        createdAt: true,
      },
    });

    // Fetch unverified agencies (pending approval)
    const pendingAgencies = await prisma.agency.findMany({
      where: { verified: false },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        licenseNumber: true,
        phone: true,
        address: true,
        ntn: true,
        cnicNumber: true,
        verified: true,
        verifiedLicense: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    });

    // Fetch users with submitted KYC docs (selfie uploaded) but not yet overseas-verified
    // Also include users with accountRoleType set (any non-null role registration intent)
    const pendingUserKYC = await prisma.user.findMany({
      where: {
        NOT: { accountRoleType: null },
        OR: [
          { liveSelfieUrl: { not: null } },
          { cnicFrontUrl: { not: null } },
        ],
        isOverseasVerified: false,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        accountRoleType: true,
        cnicNumber: true,
        cnicFrontUrl: true,
        liveSelfieUrl: true,
        isOverseasVerified: true,
        overseasCountry: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      pendingArchitects,
      pendingAgencies,
      pendingUserKYC,
    });
  } catch (error) {
    console.error("[Admin Approvals GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
