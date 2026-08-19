// src/app/api/admin/approve-architect/route.ts
// Dedicated endpoint to approve or reject an architect profile
// Sets verificationStatus = VERIFIED | REJECTED and isVerified = true | false

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
        status: isApproval ? "APPROVED" : "REJECTED",
        verificationStatus: isApproval ? "VERIFIED" : "REJECTED",
      },
      include: {
        user: true,
      },
    });

    if (updated.userId) {
      try {
        await prisma.user.update({
          where: { id: updated.userId },
          data: {
            isKycVerified: isApproval,
            isOverseasVerified: isApproval,
          },
        });
      } catch (uErr) {
        console.warn("[Admin Approve Architect] Failed to update user model:", uErr);
      }
    }

    // ── Automated Dual Email Notification on Approval ───────────────────────
    if (isApproval) {
      try {
        const recipientEmail = updated.user?.email || "bjarchitects.pk@gmail.com";
        const apiKey = process.env.RESEND_API_KEY;
        const subject = "🎉 Your NexMove Architect Profile is Approved!";
        const html = `
          <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <span style="background: rgba(20, 184, 166, 0.15); color: #14b8a6; border: 1px solid rgba(20, 184, 166, 0.3); padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
                Verified Professional
              </span>
            </div>
            <h2 style="color: #14b8a6; text-align: center; margin-top: 10px;">🎉 Congratulations, ${updated.name}!</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Your professional architect profile on <strong>NexMove PropTech</strong> has been reviewed and officially <strong>APPROVED</strong>!
            </p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
              Your profile is now live in our Public Architects Directory with an active <strong>Verified Architect Badge</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://nexmove.pk/login?role=architect" style="background: linear-gradient(135deg, #0d9488 0%, #059669 100%); color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);">
                Log In & Upload Projects →
              </a>
            </div>
            <div style="background: rgba(30, 41, 59, 0.6); border: 1px solid #334155; padding: 16px; border-radius: 12px; margin-top: 20px;">
              <h4 style="color: #94a3b8; margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase;">What you can do now:</h4>
              <ul style="color: #cbd5e1; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Access your Architect Portal Dashboard at <code>/architects/dashboard</code></li>
                <li>Upload portfolio projects (Residential, Commercial, 3D Renders, BIM models)</li>
                <li>Receive direct Design Proposal Requests from property developers and agencies</li>
              </ul>
            </div>
            <hr style="border: none; border-top: 1px solid #334155; margin-top: 24px;" />
            <p style="color: #64748b; font-size: 11px; text-align: center;">NexMove PropTech Engine · Islamabad, Pakistan</p>
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
        } else {
          console.log(`[Approval Email Notification] Sent to ${recipientEmail}:\n${subject}`);
        }
      } catch (emailErr) {
        console.warn("[Admin Approve Architect] Approval email failed (non-blocking):", emailErr);
      }
    }

    try {
      revalidatePath('/', 'layout');
      revalidatePath('/architects');
      revalidatePath('/architects/dashboard');
      revalidatePath('/admin/dashboard');
    } catch (revErr) {
      console.warn('[Admin Approve Architect] Revalidate error:', revErr);
    }

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
