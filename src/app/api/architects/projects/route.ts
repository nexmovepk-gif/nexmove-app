// src/app/api/architects/projects/route.ts
// Handles project creation and project fetching for Architects

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const architectId = searchParams.get("architectId");

    const session = await getServerSession(authOptions);

    let targetArchitectId = architectId;

    if (!targetArchitectId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { architectProfile: true },
      });
      targetArchitectId = user?.architectProfile?.id || null;
    }

    if (!targetArchitectId) {
      return NextResponse.json({ projects: [], total: 0 });
    }

    const projects = await prisma.architectProject.findMany({
      where: { architectId: targetArchitectId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects, total: projects.length });
  } catch (error) {
    console.error("[Architect Projects GET] Error:", error);
    return NextResponse.json({ projects: [], total: 0 }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const {
      architectId,
      title,
      description,
      category,
      software,
      imageUrl,
      imageUrls,
      completedYear,
    } = body;

    let targetArchitectId = architectId;

    if (!targetArchitectId && session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { architectProfile: true },
      });
      targetArchitectId = user?.architectProfile?.id || null;
    }

    // Fallback: If no session or direct link, check if profile exists by email/id
    if (!targetArchitectId) {
      const firstProfile = await prisma.architectProfile.findFirst({
        orderBy: { createdAt: "desc" },
      });
      targetArchitectId = firstProfile?.id || null;
    }

    if (!targetArchitectId) {
      return NextResponse.json(
        { error: "No architect profile found to associate this project with." },
        { status: 400 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Project Title is required." }, { status: 400 });
    }

    const formattedSoftware = Array.isArray(software)
      ? software
      : typeof software === "string" && software.trim()
      ? software.split(",").map((s) => s.trim())
      : [];

    const formattedImageUrls = Array.isArray(imageUrls)
      ? imageUrls.filter(Boolean)
      : typeof imageUrls === "string" && imageUrls.trim()
      ? imageUrls.split(",").map((u) => u.trim()).filter(Boolean)
      : imageUrl
      ? [imageUrl]
      : [];

    const primaryImageUrl = imageUrl || (formattedImageUrls.length > 0 ? formattedImageUrls[0] : null);

    const newProject = await prisma.architectProject.create({
      data: {
        architectId: targetArchitectId,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || "Residential",
        software: formattedSoftware,
        imageUrl: primaryImageUrl,
        imageUrls: formattedImageUrls,
        completedYear: Number(completedYear) || new Date().getFullYear(),
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    // Also sync images into the ArchitectProfile portfolioImages array
    if (primaryImageUrl) {
      const profile = await prisma.architectProfile.findUnique({
        where: { id: targetArchitectId },
        select: { portfolioImages: true },
      });
      if (profile && !profile.portfolioImages.includes(primaryImageUrl)) {
        await prisma.architectProfile.update({
          where: { id: targetArchitectId },
          data: {
            portfolioImages: [...profile.portfolioImages, primaryImageUrl],
          },
        });
      }
    }

    return NextResponse.json(
      {
        message: "Project uploaded successfully!",
        project: newProject,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("[Architect Projects POST] Error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to upload project";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    await prisma.architectProject.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("[Architect Projects DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
