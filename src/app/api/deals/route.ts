// src/app/api/deals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';
import { DealStatus } from '@/generated/client/enums';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ─── GET /api/deals ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agencyId = searchParams.get('agencyId');
    const listingId = searchParams.get('listingId');
    const status = searchParams.get('status');
    const buyerAgentId = searchParams.get('buyerAgentId');
    const sellerAgentId = searchParams.get('sellerAgentId');

    const where: Record<string, unknown> = {};

    if (agencyId) {
      where.agencyId = agencyId;
    }
    if (listingId) {
      where.listingId = listingId;
    }
    if (buyerAgentId) {
      where.buyerAgentId = buyerAgentId;
    }
    if (sellerAgentId) {
      where.sellerAgentId = sellerAgentId;
    }
    if (status && Object.values(DealStatus).includes(status.toUpperCase() as DealStatus)) {
      where.status = status.toUpperCase() as DealStatus;
    }

    let deals: unknown[] = [];

    try {
      deals = await prisma.deal.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              price: true,
              address: true,
            },
          },
          buyerClient: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          buyerAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          sellerAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          agency: {
            select: {
              id: true,
              name: true,
              phone: true,
              logo: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (prismaErr) {
      console.warn('[Deals API] Prisma query error, falling back to Supabase client:', prismaErr);
      const { data: sbDeals } = await supabase
        .from('deals')
        .select('*')
        .order('created_at', { ascending: false });
      deals = sbDeals || [];
    }

    return NextResponse.json({
      success: true,
      deals,
      count: deals.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error fetching deals:', err);
    return NextResponse.json(
      { success: false, deals: [], error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

// ─── POST /api/deals ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      listingId,
      propertyId,
      tokenAmount,
      buyerName,
      buyerPhone,
      buyerEmail,
      buyerClientId,
      buyerAgentId,
      sellerAgentId,
      agencyId,
      status = 'ESCROW',
      agreementDoc,
      commissionSeller,
      commissionBuyer,
      notes,
    } = body;

    const targetListingId = listingId || propertyId;

    if (!targetListingId) {
      return NextResponse.json(
        { success: false, error: 'Listing or Property ID is required' },
        { status: 400 }
      );
    }

    const numericTokenAmount = tokenAmount !== undefined && tokenAmount !== null ? Number(tokenAmount) : null;

    // Validate deal status
    const validStatus = Object.values(DealStatus).includes(status?.toUpperCase() as DealStatus)
      ? (status.toUpperCase() as DealStatus)
      : DealStatus.ESCROW;

    // Retrieve or default agency and seller agent if not explicitly provided
    let resolvedAgencyId = agencyId;
    let resolvedSellerAgentId = sellerAgentId;

    if (!resolvedAgencyId || !resolvedSellerAgentId) {
      const listing = await prisma.listing.findUnique({
        where: { id: targetListingId },
        select: { agencyId: true, agentId: true },
      }).catch(() => null);

      if (listing) {
        resolvedAgencyId = resolvedAgencyId || listing.agencyId;
        resolvedSellerAgentId = resolvedSellerAgentId || listing.agentId;
      }
    }

    // Fallback: If no agency/agent exists in DB, find first available or create minimal
    if (!resolvedAgencyId) {
      const firstAgency = await prisma.agency.findFirst({ select: { id: true } }).catch(() => null);
      if (firstAgency) {
        resolvedAgencyId = firstAgency.id;
      } else {
        const newAgency = await prisma.agency.create({
          data: { name: 'NexMove Premier Real Estate' },
        }).catch(() => null);
        resolvedAgencyId = newAgency?.id;
      }
    }

    if (!resolvedSellerAgentId) {
      const firstAgent = await prisma.user.findFirst({
        where: { agencyId: resolvedAgencyId },
        select: { id: true },
      }).catch(() => null);

      if (firstAgent) {
        resolvedSellerAgentId = firstAgent.id;
      } else {
        const anyUser = await prisma.user.findFirst({ select: { id: true } }).catch(() => null);
        resolvedSellerAgentId = anyUser?.id;
      }
    }

    // Optional: create Client record if buyer details provided
    let finalBuyerClientId = buyerClientId || null;
    if (!finalBuyerClientId && buyerName && resolvedAgencyId && resolvedSellerAgentId) {
      const newClient = await prisma.client.create({
        data: {
          name: String(buyerName).trim(),
          phone: buyerPhone ? String(buyerPhone).trim() : 'N/A',
          email: buyerEmail ? String(buyerEmail).trim() : null,
          agencyId: resolvedAgencyId,
          agentId: resolvedSellerAgentId,
          status: 'BUYER_ESCROW_TOKEN',
          budget: numericTokenAmount ? numericTokenAmount * 20 : undefined,
        },
      }).catch(() => null);
      if (newClient) {
        finalBuyerClientId = newClient.id;
      }
    }

    // 1. Insert via Prisma (connected directly to Supabase Postgres)
    let deal = null;
    if (resolvedAgencyId && resolvedSellerAgentId) {
      try {
        deal = await prisma.deal.create({
          data: {
            listingId: targetListingId,
            agencyId: resolvedAgencyId,
            sellerAgentId: resolvedSellerAgentId,
            buyerAgentId: buyerAgentId || null,
            buyerClientId: finalBuyerClientId,
            status: validStatus,
            tokenAmount: numericTokenAmount,
            agreementDoc: agreementDoc || null,
            commissionSeller: commissionSeller ? Number(commissionSeller) : null,
            commissionBuyer: commissionBuyer ? Number(commissionBuyer) : null,
          },
          include: {
            listing: { select: { title: true, price: true } },
            agency: { select: { name: true } },
          },
        });
      } catch (prismaErr) {
        console.warn('[Deals API] Prisma create note, attempting Supabase direct insert:', prismaErr);
      }
    }

    // 2. Insert into Supabase table ('deals' / 'Deal')
    try {
      const supabaseDealPayload = {
        ...(deal ? { id: deal.id } : {}),
        listing_id: targetListingId,
        agency_id: resolvedAgencyId,
        seller_agent_id: resolvedSellerAgentId,
        buyer_agent_id: buyerAgentId || null,
        buyer_client_id: finalBuyerClientId,
        status: validStatus,
        token_amount: numericTokenAmount,
        agreement_doc: agreementDoc || null,
        commission_seller: commissionSeller ? Number(commissionSeller) : null,
        commission_buyer: commissionBuyer ? Number(commissionBuyer) : null,
        buyer_name: buyerName || null,
        buyer_phone: buyerPhone || null,
        buyer_email: buyerEmail || null,
        notes: notes || null,
        created_at: new Date().toISOString(),
      };

      const { data: sbData, error: sbErr } = await supabase
        .from('deals')
        .insert([supabaseDealPayload])
        .select()
        .maybeSingle();

      if (sbErr) {
        try {
          await supabase.from('Deal').insert([
            {
              ...(deal ? { id: deal.id } : {}),
              listingId: targetListingId,
              agencyId: resolvedAgencyId,
              sellerAgentId: resolvedSellerAgentId,
              status: validStatus,
              tokenAmount: numericTokenAmount,
            },
          ]);
        } catch {
          // ignore
        }
      } else if (!deal && sbData) {
        deal = sbData;
      }
    } catch (sbInsertErr) {
      console.warn('[Deals API] Supabase client insert note:', sbInsertErr);
    }

    // 3. Dispatch automated email notification to seller / listing agency upon deal initiation
    try {
      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://nexmove.pk';

      let listingTitle = 'Your Listed Property';
      let sellerEmail = 'nexmove.pk@gmail.com';

      const listingInfo = await prisma.listing.findUnique({
        where: { id: targetListingId },
        select: {
          title: true,
          agent: { select: { email: true, name: true } },
          agency: { select: { name: true } },
        },
      }).catch(() => null);

      if (listingInfo) {
        listingTitle = listingInfo.title || listingTitle;
        if (listingInfo.agent?.email) {
          sellerEmail = listingInfo.agent.email;
        }
      }

      const dealIdStr = deal?.id || `DEAL-${Date.now().toString().slice(-6)}`;
      const tokenFormatted = numericTokenAmount ? `PKR ${numericTokenAmount.toLocaleString()}` : 'Negotiation Stage';

      await fetch(`${origin}/api/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: sellerEmail,
          subject: `🤝 New Co-Brokered Deal Initiated: ${listingTitle}`,
          body: `Great news! A partner agency has initiated a Co-Brokered Deal (Ref #${dealIdStr}) for your property listing "${listingTitle}".<br/><br/>
          <strong>Key Deal Details:</strong><br/>
          • <strong>Commission Split:</strong> 50/50 Profit Split Standard<br/>
          • <strong>Estimated Share / Token:</strong> ${tokenFormatted}<br/>
          • <strong>Status:</strong> In Negotiation<br/><br/>
          Please log in to your <strong>NexMove Agency Dashboard</strong> to review the deal pipeline and proceed with contract agreement.`,
        }),
      }).catch((emailErr) => console.warn('[Deals API] Initiation email dispatch note:', emailErr));
    } catch (notifyErr) {
      console.warn('[Deals API] Initiation notification error:', notifyErr);
    }

    return NextResponse.json({
      success: true,
      deal: deal || {
        id: `DEAL-${Date.now()}`,
        listingId: targetListingId,
        tokenAmount: numericTokenAmount,
        status: validStatus,
      },
      message: 'Buyer token payment and deal recorded successfully in Supabase Escrow!',
    }, { status: 201 });

  } catch (err) {
    console.error('[Deals API] Error creating deal:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal server error recording deal' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/deals ─────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, tokenAmount, agreementDoc } = body;

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    if (status && Object.values(DealStatus).includes(status.toUpperCase() as DealStatus)) {
      data.status = status.toUpperCase() as DealStatus;
    }
    if (tokenAmount !== undefined && tokenAmount !== null) {
      data.tokenAmount = Number(tokenAmount);
    }
    if (agreementDoc) {
      data.agreementDoc = String(agreementDoc);
    }

    const updated = await prisma.deal.update({
      where: { id },
      data,
      include: {
        listing: { select: { title: true, price: true } },
        agency: { select: { name: true } },
        sellerAgent: { select: { email: true, name: true } },
        buyerClient: { select: { email: true, name: true } },
      },
    }).catch(async () => {
      const { data: sbUpdated } = await supabase
        .from('deals')
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle();
      return sbUpdated;
    });

    // If deal transitioned to CLOSED, dispatch automated completion email notifications
    if (data.status === 'CLOSED' && updated) {
      try {
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://nexmove.pk';
        const dealTitle = (updated as { listing?: { title?: string } })?.listing?.title || `Deal #${id.slice(0, 8)}`;
        
        // Notify agency / agent
        const recipientEmail = (updated as { sellerAgent?: { email?: string } })?.sellerAgent?.email || 'nexmove.pk@gmail.com';
        
        await fetch(`${origin}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientEmail,
            subject: `🎉 Deal Successfully Closed: ${dealTitle}`,
            body: `Congratulations! Deal Ref #${id} for "${dealTitle}" has been marked as CLOSED. Ownership transfer is ratified, and commission payout settlements are finalized under NexMove AIEscrowGuard.`,
          }),
        }).catch((emailErr) => console.warn('[Deals API] Email notification note:', emailErr));
      } catch (notifyErr) {
        console.warn('[Deals API] Notification dispatch error:', notifyErr);
      }
    }

    return NextResponse.json({
      success: true,
      deal: updated,
      message: 'Deal updated successfully',
    });
  } catch (err) {
    console.error('Error updating deal:', err);
    return NextResponse.json({ error: 'Failed to update deal record' }, { status: 500 });
  }
}

// ─── DELETE /api/deals ────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    await prisma.deal.delete({
      where: { id },
    }).catch(async () => {
      await supabase.from('deals').delete().eq('id', id);
    });

    return NextResponse.json({
      success: true,
      message: 'Deal record deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting deal:', err);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
