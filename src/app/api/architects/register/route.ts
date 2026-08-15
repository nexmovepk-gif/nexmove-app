// src/app/api/architects/register/route.ts
// Handles architect/designer registration submissions.
// Persists user and ArchitectProfile to database and notifies super admin.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      name,
      email,
      password,
      phone,
      companyName,
      pcatpNo,
      councilLicenseNo,
      isOverseas,
      country,
      city,
      experienceYears,
      specialization,
      software,
      projectTypes,
      portfolioLinks,
      portfolioUrl,
      bio,
      title,
      location,
      experienceLevel,
      avatarInitials,
      avatarGradient,
    } = body;

    const actualName = (fullName || name || "").trim();
    const normalizedEmail = (email || "").toLowerCase().trim();
    const actualPhone = (phone || "").trim();

    // ── 1. Strict required field validation ──────────────────────────────────
    if (!actualName || !normalizedEmail || !actualPhone) {
      return NextResponse.json(
        { error: "Missing required fields: Name, Email Address, and Phone Number are required." },
        { status: 400 }
      );
    }

    if (isOverseas) {
      if (!country || !country.trim() || !city || !city.trim()) {
        return NextResponse.json(
          { error: "Country and City are required for Overseas Architects." },
          { status: 400 }
        );
      }
    }

    const finalPcatpNo = (pcatpNo || councilLicenseNo || "").trim() || null;
    const finalCountry = isOverseas ? country.trim() : (country?.trim() || "Pakistan");
    const finalCity = (city || "").trim();
    const finalLocation = location || (isOverseas ? `${finalCity}, ${finalCountry}` : (finalCity ? `${finalCity}, Pakistan` : "Pakistan"));
    const finalPortfolioUrl = portfolioUrl || (Array.isArray(portfolioLinks) && portfolioLinks.length > 0 ? portfolioLinks[0] : null);

    // ── 2. Database Insertion (User + ArchitectProfile) ─────────────────────
    let userId: string;

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: actualName || existingUser.name,
          phone: actualPhone || existingUser.phone,
          accountRoleType: "ARCHITECT",
          overseasCountry: isOverseas ? finalCountry : existingUser.overseasCountry,
          overseasCity: isOverseas ? finalCity : existingUser.overseasCity,
        },
      });
      userId = updatedUser.id;
    } else {
      const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: actualName,
          password: hashedPassword,
          phone: actualPhone,
          role: "PUBLIC_USER",
          accountRoleType: "ARCHITECT",
          overseasCountry: isOverseas ? finalCountry : null,
          overseasCity: isOverseas ? finalCity : null,
        },
      });
      userId = newUser.id;
    }

    // Check if profile exists for this userId or name+specialization
    const existingProfile = await prisma.architectProfile.findFirst({
      where: {
        OR: [
          { userId },
          { name: actualName, specialization: specialization || "Architecture" },
        ],
      },
    });

    let profile;
    if (existingProfile) {
      profile = await prisma.architectProfile.update({
        where: { id: existingProfile.id },
        data: {
          userId,
          name: actualName,
          title: title || "Architect",
          specialization: specialization || "Architecture",
          companyName: companyName || existingProfile.companyName || null,
          bio: bio || existingProfile.bio || null,
          phone: actualPhone || existingProfile.phone || null,
          isOverseas: Boolean(isOverseas),
          country: finalCountry,
          city: finalCity,
          pcatpNo: finalPcatpNo,
          status: "PENDING",
          verificationStatus: "PENDING",
          isVerified: false,
          experienceYears: Number(experienceYears) || existingProfile.experienceYears || 0,
          experienceLevel: experienceLevel ?? existingProfile.experienceLevel ?? null,
          location: finalLocation,
          software: Array.isArray(software) ? software : [],
          projectTypes: Array.isArray(projectTypes) ? projectTypes : [],
          portfolioLinks: Array.isArray(portfolioLinks) ? portfolioLinks.filter(Boolean) : [],
          portfolioUrl: finalPortfolioUrl,
          councilLicenseNo: finalPcatpNo,
        },
      });
    } else {
      profile = await prisma.architectProfile.create({
        data: {
          userId,
          name: actualName,
          title: title || "Architect",
          specialization: specialization || "Architecture",
          companyName: companyName || null,
          bio: bio || null,
          phone: actualPhone || null,
          isOverseas: Boolean(isOverseas),
          country: finalCountry,
          city: finalCity,
          pcatpNo: finalPcatpNo,
          status: "PENDING",
          verificationStatus: "PENDING",
          isVerified: false,
          experienceYears: Number(experienceYears) || 0,
          experienceLevel: experienceLevel ?? null,
          location: finalLocation,
          software: Array.isArray(software) ? software : [],
          projectTypes: Array.isArray(projectTypes) ? projectTypes : [],
          portfolioImages: [],
          portfolioLinks: Array.isArray(portfolioLinks) ? portfolioLinks.filter(Boolean) : [],
          portfolioUrl: finalPortfolioUrl,
          availableForProjects: true,
          councilLicenseNo: finalPcatpNo,
          avatarInitials: avatarInitials ?? (actualName.substring(0, 2).toUpperCase() || "AR"),
          avatarGradient: avatarGradient ?? "from-teal-500 to-emerald-600",
        },
      });
    }

    // ── 3. Email Notification to Super Admin (non-blocking) ──────────────────
    try {
      const apiKey = process.env.RESEND_API_KEY;
      const subject = `🚨 New Architect Verification Required - ${actualName}${companyName ? ` (${companyName})` : ""}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
          <h2 style="color: #14b8a6; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">🚨 New Architect Verification Required</h2>
          <p style="color: #cbd5e1; font-size: 14px;">A new architect profile application has been submitted and requires admin review.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px; font-weight: bold; color: #94a3b8;">Name:</td><td style="padding: 8px; color: #f8fafc;">${actualName}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px; font-weight: bold; color: #94a3b8;">Email:</td><td style="padding: 8px; color: #f8fafc;">${normalizedEmail}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px; font-weight: bold; color: #94a3b8;">Phone:</td><td style="padding: 8px; color: #f8fafc;">${actualPhone}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px; font-weight: bold; color: #94a3b8;">Company:</td><td style="padding: 8px; color: #f8fafc;">${companyName || "N/A"}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px; font-weight: bold; color: #94a3b8;">PCATP / License No:</td><td style="padding: 8px; color: #f8fafc;">${finalPcatpNo || "N/A"}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px; font-weight: bold; color: #94a3b8;">Overseas Status:</td><td style="padding: 8px; color: #f8fafc;">${isOverseas ? "🌐 YES (International Practice)" : "🇵🇰 NO (Pakistan)"}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px; font-weight: bold; color: #94a3b8;">Location:</td><td style="padding: 8px; color: #f8fafc;">${finalCity ? `${finalCity}, ` : ""}${finalCountry}</td></tr>
            <tr style="border-bottom: 1px solid #334155;"><td style="padding: 8px; font-weight: bold; color: #94a3b8;">Specialization:</td><td style="padding: 8px; color: #f8fafc;">${specialization || "Architecture"}</td></tr>
          </table>
          <p style="color: #64748b; font-size: 12px; margin-top: 20px;">Review and approve this application in the NexMove Admin Portal.</p>
        </div>
      `;

      if (apiKey) {
        const resend = new Resend(apiKey);
        await resend.emails.send({
          from: "NexMove PropTech <onboarding@resend.dev>",
          to: ["nexmove.pk@gmail.com"],
          subject,
          html: emailHtml,
        });
      } else {
        console.log(`[Super Admin Notification] Email to nexmove.pk@gmail.com logged (RESEND_API_KEY not configured):\n${subject}`);
      }
    } catch (emailErr) {
      console.warn("[Super Admin Email Notification Error - Non Blocking]:", emailErr);
    }

    return NextResponse.json(
      {
        message: "Application submitted successfully. Your profile is pending verification by the NexMove team.",
        architect: {
          id: profile.id,
          name: profile.name,
          email: normalizedEmail,
          phone: actualPhone,
          status: profile.status,
          verificationStatus: profile.verificationStatus,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Architect registration error:", error);
    const errMsg = error instanceof Error ? error.message : "An error occurred during registration";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pending = await prisma.architectProfile.findMany({
      where: {
        OR: [
          { status: "PENDING" },
          { verificationStatus: "PENDING" },
          { verificationStatus: "pending" },
          { isVerified: false },
        ],
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ pending, total: pending.length });
  } catch (error) {
    console.error("Architect GET error:", error);
    return NextResponse.json({ pending: [], total: 0 });
  }
}
