// src/app/api/admin/approve/route.ts
// Generalized approval endpoint — sets APPROVED/VERIFIED status for:
//   type: "architect"  => ArchitectProfile
//   type: "agency"     => Agency
//   type: "user"       => User (KYC verification)

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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!checkSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden: Super Admin access required" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, id, action } = body as {
      type: "architect" | "agency" | "user";
      id: string;
      action: "approve" | "reject";
    };

    if (!type || !id || !action) {
      return NextResponse.json(
        { error: "Missing required fields: type, id, and action (approve|reject)" },
        { status: 400 }
      );
    }

    const isApproval = action === "approve";

    if (type === "architect") {
      const updated = await prisma.architectProfile.update({
        where: { id },
        data: {
          isVerified: isApproval,
          // Store as APPROVED for admin readability, VERIFIED for public API compatibility
          verificationStatus: isApproval ? "VERIFIED" : "REJECTED",
        },
        select: { id: true, name: true, verificationStatus: true, isVerified: true },
      });
      return NextResponse.json({
        success: true,
        message: `Architect ${isApproval ? "approved" : "rejected"} successfully.`,
        record: updated,
      });
    }

    if (type === "agency") {
      const updated = await prisma.agency.update({
        where: { id },
        data: {
          verified: isApproval,
          verifiedLicense: isApproval,
        },
        select: { id: true, name: true, verified: true },
      });
      return NextResponse.json({
        success: true,
        message: `Agency ${isApproval ? "approved" : "rejected"} successfully.`,
        record: updated,
      });
    }

    if (type === "user") {
      const updated = await prisma.user.update({
        where: { id },
        data: { isOverseasVerified: isApproval },
        select: { id: true, email: true, isOverseasVerified: true },
      });
      return NextResponse.json({
        success: true,
        message: `User KYC ${isApproval ? "approved" : "rejected"} successfully.`,
        record: updated,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("[Admin Approve] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH alias for REST-style callers
export { POST as PATCH };
