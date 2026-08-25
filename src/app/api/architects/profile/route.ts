// src/app/api/architects/profile/route.ts
// Handles Architect Profile retrieval and updates (PUT) with strict user isolation

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const architectId = searchParams.get("id");

    let profile = null;

    if (architectId) {
      profile = await prisma.architectProfile.findUnique({
        where: { id: architectId },
        include: { user: true, projects: true, reviews: true },
      });
    } else if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { architectProfile: { include: { user: true, projects: true, reviews: true } } },
      });
      profile = user?.architectProfile || null;

      // If user is authenticated as an architect but profile not created yet, auto-provision
      if (!profile && user) {
        try {
          profile = await prisma.architectProfile.create({
            data: {
              userId: user.id,
              name: user.name || "Architect",
              specialization: "Architectural Designer",
              bio: "Welcome to my architectural portfolio on NexMove.",
              location: "Pakistan",
              software: ["AutoCAD", "Revit", "SketchUp"],
              projectTypes: ["Residential", "Commercial"],
            },
            include: { user: true, projects: true, reviews: true },
          });
        } catch (createErr) {
          console.warn("[Architect Profile GET] Auto-create notice:", createErr);
        }
      }
    }

    if (!profile) {
      return NextResponse.json({ profile: null }, { status: 200 });
    }

    const avgRating =
      profile.reviews && profile.reviews.length > 0
        ? parseFloat((profile.reviews.reduce((acc, r) => acc + r.rating, 0) / profile.reviews.length).toFixed(1))
        : 0;
    const reviewCount = profile.reviews ? profile.reviews.length : 0;

    const profileUser = (profile as Record<string, unknown>).user as { isKycVerified?: boolean; isOverseasVerified?: boolean } | undefined;

    const isVerified = Boolean(
      profileUser
        ? (profileUser.isKycVerified || profileUser.isOverseasVerified) && profile.isVerified
        : profile.isVerified && profile.verificationStatus === "VERIFIED"
    );

    return NextResponse.json({
      profile: {
        ...profile,
        isVerified,
        verificationStatus: isVerified ? "VERIFIED" : profile.verificationStatus || "PENDING",
        avgRating,
        reviewCount,
      },
    });
  } catch (error) {
    console.error("[Architect Profile GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { architectProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const body = await req.json();
    const {
      id,
      name,
      phone,
      bio,
      companyName,
      specialization,
      experienceYears,
      pcatpNo,
      isOverseas,
      country,
      city,
      software,
      projectTypes,
      avatarUrl,
      coverImage,
      coverBannerUrl,
    } = body;

    const resolvedAvatar = (avatarUrl ?? body.avatar ?? "").trim();
    const resolvedCover = (coverBannerUrl ?? coverImage ?? "").trim();

    const finalCountry = isOverseas ? (country || "").trim() : "Pakistan";
    const finalCity = (city || "").trim();
    const finalLocation = isOverseas
      ? `${finalCity}, ${finalCountry}`
      : finalCity
      ? `${finalCity}, Pakistan`
      : "Pakistan";

    let updatedProfile;

    if (user.architectProfile) {
      updatedProfile = await prisma.architectProfile.update({
        where: { id: user.architectProfile.id },
        data: {
          ...(name && { name: name.trim() }),
          ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
          ...(bio !== undefined && { bio: bio ? bio.trim() : null }),
          ...(companyName !== undefined && { companyName: companyName ? companyName.trim() : null }),
          ...(specialization && { specialization: specialization.trim() }),
          ...(experienceYears !== undefined && { experienceYears: Number(experienceYears) || 0 }),
          ...(pcatpNo !== undefined && { pcatpNo: pcatpNo ? pcatpNo.trim() : null }),
          ...(isOverseas !== undefined && { isOverseas: Boolean(isOverseas) }),
          ...(country !== undefined && { country: finalCountry }),
          ...(city !== undefined && { city: finalCity }),
          location: finalLocation,
          ...(Array.isArray(software) && { software }),
          ...(Array.isArray(projectTypes) && { projectTypes }),
          ...(resolvedAvatar ? { avatarUrl: resolvedAvatar } : {}),
          ...(resolvedCover ? { coverImage: resolvedCover, coverBannerUrl: resolvedCover } : {}),
        },
      });
    } else {
      updatedProfile = await prisma.architectProfile.create({
        data: {
          userId: user.id,
          name: (name || user.name || "Architect").trim(),
          phone: (phone || user.phone || "").trim(),
          bio: (bio || "").trim(),
          companyName: companyName ? companyName.trim() : null,
          specialization: specialization || "Architectural Designer",
          experienceYears: Number(experienceYears) || 0,
          pcatpNo: pcatpNo ? pcatpNo.trim() : null,
          isOverseas: Boolean(isOverseas),
          country: finalCountry,
          city: finalCity,
          location: finalLocation,
          software: Array.isArray(software) ? software : ["AutoCAD", "Revit"],
          projectTypes: Array.isArray(projectTypes) ? projectTypes : ["Residential"],
          avatarUrl: resolvedAvatar || null,
          coverImage: resolvedCover || null,
          coverBannerUrl: resolvedCover || null,
        },
      });
    }

    // Also update linked user phone / name if available
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(name && { name: name.trim() }),
          ...(phone && { phone: phone.trim() }),
        },
      });
    } catch (uErr) {
      console.warn("[Architect Profile PUT] User update notice:", uErr);
    }

    return NextResponse.json({
      message: "Architect profile updated successfully!",
      profile: updatedProfile,
    });
  } catch (error: unknown) {
    console.error("[Architect Profile PUT] Error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
