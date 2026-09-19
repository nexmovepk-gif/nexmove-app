// src/app/api/notify-agencies/route.ts
// POST /api/notify-agencies
// Creates in-DB notification records for top 3 agencies when a private property is listed.
// Uses raw Supabase insert since we do not have a dedicated Notification model in Prisma schema.

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppUniversalAlert } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

interface NotifyAgenciesBody {
  propertyId: string;
  city?: string;
  sellerName?: string;
  propertyTitle?: string;
  price?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: NotifyAgenciesBody = await req.json();
    const { propertyId, city, sellerName, propertyTitle, price } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
    }

    // 1. Fetch top 3 agencies for this city
    const agencyWhere: Record<string, unknown> = { verified: true, subscriptionStatus: "ACTIVE" };
    const agencies = await prisma.agency.findMany({
      where: agencyWhere,
      select: {
        id: true,
        name: true,
        phone: true,
        properties: city
          ? { where: { city: { contains: city, mode: "insensitive" } }, select: { id: true } }
          : { select: { id: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Sort by local property count, pick top 3
    let topAgencies = agencies
      .map((a) => ({ id: a.id, name: a.name, phone: a.phone, count: a.properties.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // Fill to 3 if needed
    if (topAgencies.length < 3) {
      const extra = await prisma.agency.findMany({
        where: { id: { notIn: topAgencies.map((a) => a.id) } },
        select: { id: true, name: true, phone: true },
        take: 3 - topAgencies.length,
        orderBy: { createdAt: "desc" },
      });
      topAgencies = [...topAgencies, ...extra.map((a) => ({ ...a, count: 0 }))];
    }

    if (topAgencies.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No agencies found to notify",
        notifiedCount: 0,
      });
    }

    // 2. Insert notification records into Supabase "agency_notifications" table (raw insert)
    const notifications = topAgencies.map((agency) => ({
      agency_id: agency.id,
      agency_name: agency.name,
      property_id: propertyId,
      property_title: propertyTitle || "New Private Listing",
      city: city || null,
      seller_name: sellerName || "Seller",
      price_pkr: price || null,
      message: `New private property listed in ${city || "your area"}: "${propertyTitle || "Property"}" by ${sellerName || "a seller"}. PKR ${price ? price.toLocaleString() : "N/A"}. Please review in your agency dashboard.`,
      is_read: false,
      notification_type: "PRIVATE_LISTING",
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("agency_notifications")
      .insert(notifications);

    if (insertError) {
      // Table might not exist yet -- log but do not crash the listing flow
      console.warn("[NotifyAgencies] Supabase insert warning:", insertError.message);
    }

    // 3. Dispatch WhatsApp Notification to Agencies with valid phone numbers
    const whatsappResults: { agencyName: string; phone: string | null; sent: boolean; error?: string }[] = [];
    for (const agency of topAgencies) {
      if (agency.phone) {
        try {
          const waText = `🔔 *NexMove Private Property Alert!*\n\nAssalam-o-Alaikum *${agency.name}*,\n\nEk nayi private property list hui hai:\n📍 *Area / City:* ${city || "Pakistan"} - ${propertyTitle || "Property"}\n🏷️ *Demand:* PKR ${price ? Number(price).toLocaleString() : "Contact for Price"}\n👤 *Seller:* ${sellerName || "Direct Seller"}\n🔒 *Status:* Off-Market (Exclusive to Top 3 Verified Agencies)\n\n👉 Lead claim karein: https://nexmove.pk/agency/dashboard`;

          const waRes = await sendWhatsAppUniversalAlert({
            to: agency.phone,
            title: 'Exclusive Property Alert',
            message: `Assalam-o-Alaikum ${agency.name}, ek nayi private property "${propertyTitle || 'Property'}" list hui hai. Exclusive to Verified Agencies.`,
            details: `Area: ${city || 'Pakistan'} | Price: PKR ${price ? Number(price).toLocaleString() : 'N/A'} | Seller: ${sellerName || 'Direct Seller'}`,
            fallbackText: waText,
          });
          whatsappResults.push({
            agencyName: agency.name,
            phone: agency.phone,
            sent: waRes.success,
            error: waRes.success ? undefined : waRes.error,
          });
          console.log(`[NotifyAgencies] WhatsApp to ${agency.name} (${agency.phone}):`, waRes.success ? 'SENT' : waRes.error);
        } catch (waErr) {
          const errMsg = waErr instanceof Error ? waErr.message : 'Unknown WhatsApp error';
          whatsappResults.push({ agencyName: agency.name, phone: agency.phone, sent: false, error: errMsg });
          console.warn(`[NotifyAgencies] WhatsApp error for ${agency.name}:`, errMsg);
        }
      } else {
        whatsappResults.push({ agencyName: agency.name, phone: null, sent: false, error: 'No phone number configured' });
      }
    }

    return NextResponse.json({
      success: true,
      notifiedCount: topAgencies.length,
      agencies: topAgencies.map((a) => ({ id: a.id, name: a.name })),
      whatsappResults,
      message: `${topAgencies.length} agencies have been notified about this private listing.`,
    });
  } catch (err) {
    console.error("[NotifyAgencies] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to notify agencies" },
      { status: 500 }
    );
  }
}

// GET /api/notify-agencies?agencyId=xxx -- fetch notifications for an agency dashboard
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get("agencyId");

    if (!agencyId) {
      return NextResponse.json({ error: "agencyId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("agency_notifications")
      .select("*")
      .eq("agency_id", agencyId)
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: true, notifications: [], count: 0 });
    }

    return NextResponse.json({
      success: true,
      notifications: data || [],
      count: (data || []).length,
    });
  } catch (err) {
    console.error("[NotifyAgencies GET] Error:", err);
    return NextResponse.json({ success: false, notifications: [], error: "Failed to fetch" }, { status: 500 });
  }
}
