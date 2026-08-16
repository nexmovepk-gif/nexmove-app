// src/app/api/architects/projects/route.ts
// Handles project creation, fetching, liking, and deletion for Architects

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
      videoUrl,
      tags,
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

    // Fallback: If no session or direct link, check if profile exists
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
      ? software.split(",").map((s: string) => s.trim())
      : [];

    const formattedTags = Array.isArray(tags)
      ? tags
      : typeof tags === "string" && tags.trim()
      ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [];

    const formattedImageUrls = Array.isArray(imageUrls)
      ? imageUrls.filter(Boolean)
      : typeof imageUrls === "string" && imageUrls.trim()
      ? imageUrls.split(",").map((u: string) => u.trim()).filter(Boolean)
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
        videoUrl: videoUrl || null,
        tags: formattedTags,
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

// PATCH: Handle like toggle (increment or decrement likesCount)
export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action"); // 'like' | 'unlike'

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const increment = action === "unlike" ? -1 : 1;

    const updated = await prisma.architectProject.update({
      where: { id },
      data: {
        likesCount: {
          increment,
        },
      },
      select: { id: true, likesCount: true },
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error) {
    console.error("[Architect Projects PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update like count" }, { status: 500 });
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
