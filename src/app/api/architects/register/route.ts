// src/app/api/architects/register/route.ts
// Handles architect/designer PCATP registration submissions.
// Uses prisma.$transaction for atomic User + ArchitectProfile creation.
// Phone is stored on the User model; PCATP / profile data on ArchitectProfile.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      password,
      phone,
      councilLicenseNo,
      degrees,
      experienceYears,
      specialization,
      software,
      projectTypes,
      portfolioLinks,
      bio,
      title,
      location,
      experienceLevel,
      avatarInitials,
      avatarGradient,
    } = body;

    // ── Required field validation ─────────────────────────────────────────────
    if (!fullName || !email || !specialization) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, email, and specialization are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ── Duplicate guard: check by normalised email first ─────────────────────
    const existingProfile = await prisma.architectProfile.findFirst({
      where: {
        OR: [
          { name: fullName, specialization }, // name+spec fallback
        ],
      },
    });

    // Also check if a User with this email already has an ARCHITECT accountRoleType
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser?.accountRoleType === "ARCHITECT") {
      return NextResponse.json(
        { error: "An architect application with this email has already been submitted. Please contact support if you need to update your profile." },
        { status: 409 }
      );
    }

    if (existingProfile && !existingUser) {
      return NextResponse.json(
        { error: "A profile with this name and specialization has already been submitted." },
        { status: 409 }
      );
    }

    // ── Atomic transaction: create/update User + create ArchitectProfile ─────
    const result = await prisma.$transaction(async (tx) => {
      let userId: string | null = null;

      if (existingUser) {
        // Link existing user to architect role
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            accountRoleType: "ARCHITECT",
            phone: phone ?? existingUser.phone,
          },
        });
        userId = existingUser.id;
      } else if (password) {
        // Create new User account with hashed password
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            name: fullName,
            password: hashedPassword,
            phone: phone ?? null,
            role: "PUBLIC_USER",
            accountRoleType: "ARCHITECT",
          },
        });
        userId = newUser.id;
      }

      // Create ArchitectProfile record with PENDING verification status
      const profile = await tx.architectProfile.create({
        data: {
          name: fullName,
          title: title ?? null,
          specialization,
          bio: bio ?? null,
          isVerified: false,
          verificationStatus: "PENDING",
          experienceYears: Number(experienceYears) || 0,
          experienceLevel: experienceLevel ?? null,
          location: location ?? null,
          software: Array.isArray(software) ? software : [],
          projectTypes: Array.isArray(projectTypes) ? projectTypes : [],
          portfolioImages: [],
          portfolioLinks: Array.isArray(portfolioLinks) ? portfolioLinks.filter(Boolean) : [],
          availableForProjects: true,
          councilLicenseNo: councilLicenseNo ?? null,
          avatarInitials:
            avatarInitials ?? (fullName?.substring(0, 2).toUpperCase() || "AR"),
          avatarGradient: avatarGradient ?? "from-teal-500 to-emerald-600",
        },
      });

      return { profile, userId };
    });

    return NextResponse.json(
      {
        message:
          "Application submitted successfully. Your profile is pending verification by the NexMove team.",
        architect: {
          id: result.profile.id,
          name: result.profile.name,
          email: normalizedEmail,
          phone: phone ?? null,
          councilLicenseNo: result.profile.councilLicenseNo,
          verificationStatus: result.profile.verificationStatus,
          submittedAt: result.profile.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Architect registration error:", error);
    const errMsg =
      error instanceof Error ? error.message : "An error occurred during registration";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function GET() {
  // Admin-accessible: returns all non-verified architect profiles from DB
  try {
    const pending = await prisma.architectProfile.findMany({
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
        bio: true,
        experienceYears: true,
        experienceLevel: true,
        location: true,
        councilLicenseNo: true,
        software: true,
        projectTypes: true,
        portfolioLinks: true,
        verificationStatus: true,
        isVerified: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ pending, total: pending.length });
  } catch (error) {
    console.error("Architect GET error:", error);
    return NextResponse.json({ pending: [], total: 0 });
  }
}
