// src/app/api/architects/profile/route.ts
// Handles Architect Profile retrieval and updates (PUT)

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
        include: { architectProfile: { include: { projects: true, reviews: true } } },
      });
      profile = user?.architectProfile || null;
    }

    if (!profile) {
      // Fallback: Return first profile or empty object
      profile = await prisma.architectProfile.findFirst({
        include: { user: true, projects: true, reviews: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!profile) {
      return NextResponse.json({ error: "Architect profile not found" }, { status: 404 });
    }

    const avgRating =
      profile.reviews && profile.reviews.length > 0
        ? parseFloat((profile.reviews.reduce((acc, r) => acc + r.rating, 0) / profile.reviews.length).toFixed(1))
        : 0;
    const reviewCount = profile.reviews ? profile.reviews.length : 0;

    return NextResponse.json({ profile: { ...profile, avgRating, reviewCount } });
  } catch (error) {
    console.error("[Architect Profile GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
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

    let targetProfileId = id;

    if (!targetProfileId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { architectProfile: true },
      });
      targetProfileId = user?.architectProfile?.id;
    }

    if (!targetProfileId) {
      const firstProfile = await prisma.architectProfile.findFirst({
        orderBy: { createdAt: "desc" },
      });
      targetProfileId = firstProfile?.id;
    }

    if (!targetProfileId) {
      return NextResponse.json(
        { error: "No architect profile found to update." },
        { status: 400 }
      );
    }

    const finalCountry = isOverseas ? (country || "").trim() : "Pakistan";
    const finalCity = (city || "").trim();
    const finalLocation = isOverseas
      ? `${finalCity}, ${finalCountry}`
      : finalCity
      ? `${finalCity}, Pakistan`
      : "Pakistan";

    const updatedProfile = await prisma.architectProfile.update({
      where: { id: targetProfileId },
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

    // Also update linked user phone / name if available
    if (updatedProfile.userId) {
      try {
        await prisma.user.update({
          where: { id: updatedProfile.userId },
          data: {
            ...(name && { name: name.trim() }),
            ...(phone && { phone: phone.trim() }),
          },
        });
      } catch (uErr) {
        console.warn("[Architect Profile PUT] User update warning:", uErr);
      }
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
