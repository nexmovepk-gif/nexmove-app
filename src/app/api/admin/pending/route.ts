// src/app/api/admin/pending/route.ts
// Returns ALL pending architect profiles AND unverified agencies for admin review

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
    // ── Pending architect profiles (not yet verified, includes user) ─────────
    const pendingArchitects = await prisma.architectProfile.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { verificationStatus: "PENDING" },
          { verificationStatus: "pending" },
          { isVerified: false },
        ],
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // ── Users with accountRoleType = ARCHITECT (to cross-reference email/phone) ─
    const architectUsers = await prisma.user.findMany({
      where: { accountRoleType: "ARCHITECT" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        accountRoleType: true,
        isOverseasVerified: true,
        createdAt: true,
      },
    });

    // ── Unverified agencies ────────────────────────────────────────────────────
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

    // ── Pending user KYC ───────────────────────────────────────────────────────
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
      architectUsers,
      pendingAgencies,
      pendingUserKYC,
      totals: {
        architects: pendingArchitects.length,
        agencies: pendingAgencies.length,
        kyc: pendingUserKYC.length,
      },
    });
  } catch (error) {
    console.error("[Admin Pending GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
