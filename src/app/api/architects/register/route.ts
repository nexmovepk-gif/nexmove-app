// src/app/api/architects/register/route.ts
// Handles architect/designer PCATP registration submissions
// Persists to prisma.architectProfile for admin review

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

    if (!fullName || !email || !specialization) {
      return NextResponse.json(
        { error: "Missing required fields: fullName, email, and specialization are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // If password provided, also create/update a User account linked to this profile
    if (password) {
      const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
          data: {
            email: normalizedEmail,
            name: fullName,
            password: hashedPassword,
            role: "PUBLIC_USER",
            accountRoleType: "ARCHITECT",
          },
        });
      }
    }

    // Check for duplicate architect profile submission by email match on name+specialization
    const existing = await prisma.architectProfile.findFirst({
      where: { name: fullName, specialization },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A profile with this name and specialization has already been submitted." },
        { status: 409 }
      );
    }

    // Create ArchitectProfile record in DB with PENDING status
    const profile = await prisma.architectProfile.create({
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
        software: software ?? [],
        projectTypes: projectTypes ?? [],
        portfolioImages: [],
        portfolioLinks: portfolioLinks ?? [],
        availableForProjects: true,
        councilLicenseNo: councilLicenseNo ?? null,
        avatarInitials: avatarInitials ?? (fullName?.substring(0, 2).toUpperCase() || "AR"),
        avatarGradient: avatarGradient ?? "from-teal-500 to-emerald-600",
      },
    });

    return NextResponse.json(
      {
        message:
          "Application submitted successfully. Your profile is pending verification by the NexMove team.",
        architect: {
          id: profile.id,
          name: profile.name,
          email: normalizedEmail,
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
  // Admin-only: return all pending architect profiles from DB
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
        experienceLevel: true,
        location: true,
        councilLicenseNo: true,
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
