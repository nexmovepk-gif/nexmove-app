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
          status: isApproval ? "APPROVED" : "REJECTED",
          verificationStatus: isApproval ? "VERIFIED" : "REJECTED",
        },
        include: { user: true },
      });

      if (updated.userId && isApproval) {
        try {
          await prisma.user.update({
            where: { id: updated.userId },
            data: { isOverseasVerified: true },
          });
        } catch (uErr) {
          console.warn("[Admin Approve] Failed to update user model:", uErr);
        }
      }

      if (isApproval) {
        try {
          const recipientEmail = updated.user?.email || "bjarchitects.pk@gmail.com";
          const apiKey = process.env.RESEND_API_KEY;
          const subject = "🎉 Your NexMove Architect Profile is Approved!";
          const html = `
            <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
              <h2 style="color: #14b8a6; text-align: center;">🎉 Congratulations, ${updated.name}!</h2>
              <p style="color: #cbd5e1; font-size: 14px;">Your architect profile on <strong>NexMove PropTech</strong> is officially <strong>APPROVED</strong>!</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="https://nexmove.pk/login?role=architect" style="background: #0d9488; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px;">
                  Log In & Upload Projects →
                </a>
              </div>
            </div>
          `;
          if (apiKey) {
            const { Resend } = await import("resend");
            const resend = new Resend(apiKey);
            await resend.emails.send({
              from: "NexMove PropTech <onboarding@resend.dev>",
              to: [recipientEmail],
              subject,
              html,
            });
          }
        } catch (emailErr) {
          console.warn("[Admin Approve] Email send failed (non-blocking):", emailErr);
        }
      }

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
