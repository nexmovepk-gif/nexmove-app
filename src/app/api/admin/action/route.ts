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
          status: action === "approve" ? "APPROVED" : "REJECTED",
          isVerified: action === "approve",
        },
      });

      if (updated.userId) {
        try {
          await prisma.user.update({
            where: { id: updated.userId },
            data: {
              isKycVerified: action === "approve",
              isOverseasVerified: action === "approve",
            },
          });
        } catch (uErr) {
          console.warn("[Admin Action] Failed to update user model:", uErr);
        }
      }

      try {
        revalidatePath('/', 'layout');
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
          isKycVerified: action === "approve",
        },
      });

      try {
        await prisma.user.updateMany({
          where: { agencyId: id },
          data: { isKycVerified: action === "approve" },
        });
      } catch (cascadeErr) {
        console.warn('[Admin Action] Agency user cascade error:', cascadeErr);
      }

      try {
        revalidatePath('/', 'layout');
        revalidatePath('/agencies');
        revalidatePath('/agency/dashboard');
        revalidatePath('/admin/dashboard');
      } catch (revErr) {
        console.warn('[Admin Action] Revalidate error:', revErr);
      }
      return NextResponse.json({ success: true, agency: updated });
    }

    if (type === "user") {
      const existingUser = await prisma.user.findUnique({
        where: { id },
        include: { architectProfile: true },
      });

      const updated = await prisma.user.update({
        where: { id },
        data: {
          isKycVerified: action === "approve",
          isOverseasVerified: action === "approve",
        },
      });

      if (existingUser?.architectProfile) {
        try {
          await prisma.architectProfile.update({
            where: { id: existingUser.architectProfile.id },
            data: {
              isVerified: action === "approve",
              status: action === "approve" ? "APPROVED" : "PENDING",
              verificationStatus: action === "approve" ? "VERIFIED" : "PENDING",
            },
          });
        } catch (archErr) {
          console.warn('[Admin Action] User architect profile sync warning:', archErr);
        }
      }

      try {
        revalidatePath('/', 'layout');
        revalidatePath('/architects');
        revalidatePath('/architects/dashboard');
        revalidatePath('/dashboard');
        revalidatePath('/overseas/dashboard');
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
