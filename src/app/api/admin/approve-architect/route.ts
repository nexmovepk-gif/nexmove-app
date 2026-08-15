// src/app/api/admin/approve-architect/route.ts
// Dedicated endpoint to approve or reject an architect profile
// Sets verificationStatus = VERIFIED | REJECTED and isVerified = true | false

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
    const { id, action } = body as { id: string; action: "approve" | "reject" };

    if (!id || !action) {
      return NextResponse.json(
        { error: "Missing required fields: id and action (approve|reject)" },
        { status: 400 }
      );
    }

    const isApproval = action === "approve";

    const updated = await prisma.architectProfile.update({
      where: { id },
      data: {
        isVerified: isApproval,
        verificationStatus: isApproval ? "VERIFIED" : "REJECTED",
      },
      select: {
        id: true,
        name: true,
        verificationStatus: true,
        isVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Architect profile ${isApproval ? "approved" : "rejected"} successfully.`,
      architect: updated,
    });
  } catch (error) {
    console.error("[Admin Approve Architect] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
