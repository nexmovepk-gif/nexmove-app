// src/app/api/agencies/top/route.ts
// GET /api/agencies/top?city=Lahore
// Returns top 3 verified agencies in a given city for private listing notifications

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city")?.trim();

    // Fetch verified active agencies
    const agencies = await prisma.agency.findMany({
      where: {
        verified: true,
        subscriptionStatus: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        phone: true,
        logo: true,
        address: true,
        verified: true,
        properties: city
          ? {
              where: { city: { contains: city, mode: "insensitive" } },
              select: { id: true },
            }
          : { select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Sort by properties in target city (most active first)
    let sorted = agencies
      .map((a) => ({
        id: a.id,
        name: a.name,
        phone: a.phone,
        logo: a.logo,
        address: a.address,
        verified: a.verified,
        propertyCount: a.properties.length,
      }))
      .sort((a, b) => b.propertyCount - a.propertyCount)
      .slice(0, 3);

    // If fewer than 3 verified agencies, fill with any agency
    if (sorted.length < 3) {
      const extra = await prisma.agency.findMany({
        where: { id: { notIn: sorted.map((a) => a.id) } },
        select: { id: true, name: true, phone: true, logo: true, address: true, verified: true },
        take: 3 - sorted.length,
        orderBy: { createdAt: "desc" },
      });
      sorted = [
        ...sorted,
        ...extra.map((a) => ({ ...a, propertyCount: 0 })),
      ];
    }

    return NextResponse.json({ success: true, agencies: sorted, count: sorted.length });
  } catch (err) {
    console.error("[Top Agencies API] Error:", err);
    return NextResponse.json(
      { success: false, agencies: [], error: "Failed to fetch top agencies" },
      { status: 500 }
    );
  }
}
