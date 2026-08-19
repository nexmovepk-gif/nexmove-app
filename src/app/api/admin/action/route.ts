// src/app/api/admin/action/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
      return NextResponse.json({ error: "Missing required fields: type, id, action" }, { status: 400 });
    }

    if (type === "architect") {
      const updated = await prisma.architectProfile.update({
        where: { id },
        data: {
          verificationStatus: action === "approve" ? "VERIFIED" : "REJECTED",
          isVerified: action === "approve",
        },
      });
      try {
        revalidatePath('/architects');
        revalidatePath('/architects/dashboard');
        revalidatePath('/admin/dashboard');
      } catch (revErr) {
        console.warn('[Admin Action] Revalidate error:', revErr);
      }
      return NextResponse.json({ success: true, architect: updated });
    }

    if (type === "agency") {
      const updated = await prisma.agency.update({
        where: { id },
        data: {
          verified: action === "approve",
          verifiedLicense: action === "approve",
        },
      });
      try {
        revalidatePath('/agencies');
        revalidatePath('/agency/dashboard');
        revalidatePath('/admin/dashboard');
      } catch (revErr) {
        console.warn('[Admin Action] Revalidate error:', revErr);
      }
      return NextResponse.json({ success: true, agency: updated });
    }

    if (type === "user") {
      const updated = await prisma.user.update({
        where: { id },
        data: {
          isOverseasVerified: action === "approve",
        },
      });
      try {
        revalidatePath('/dashboard');
        revalidatePath('/admin/dashboard');
      } catch (revErr) {
        console.warn('[Admin Action] Revalidate error:', revErr);
      }
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (error) {
    console.error("[Admin Action POST] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
