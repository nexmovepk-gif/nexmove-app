// src/app/api/admin/approvals/route.ts
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
    const pendingArchitects = await prisma.architectProfile.findMany({
      where: { verificationStatus: "PENDING" },
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
        createdAt: true,
      },
    });

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

    const pendingUserKYC = await prisma.user.findMany({
      where: {
        role: "PUBLIC_USER",
        NOT: { accountRoleType: null },
        liveSelfieUrl: { not: null },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        accountRoleType: true,
        cnicNumber: true,
        isOverseasVerified: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ pendingArchitects, pendingAgencies, pendingUserKYC });
  } catch (error) {
    console.error("[Admin Approvals GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
