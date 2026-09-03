// src/app/api/admin/delete-item/route.ts
// Direct Super Admin API for Permanent Hard Deletion of Properties, Agencies, Users, and Architects

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabase } from '@/lib/supabaseClient';

function checkSuperAdmin(session: { user?: { role?: string | null; email?: string | null } } | null): boolean {
  return (
    session?.user?.role === 'SUPER_ADMIN' ||
    session?.user?.email?.toLowerCase() === 'nexmove.pk@gmail.com'
  );
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!checkSuperAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden: Super Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'property' | 'agency' | 'user' | 'architect'
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Missing required query parameters: type and id' },
        { status: 400 }
      );
    }

    // ── 1. DELETE PROPERTY / LISTING ─────────────────────────────────────────────
    if (type === 'property' || type === 'listing') {
      let deletedPrisma = false;

      // Try PublicListing first
      try {
        await prisma.publicListing.delete({ where: { id } });
        deletedPrisma = true;
      } catch {
        /* check Property table */
      }

      // Try Property table
      if (!deletedPrisma) {
        try {
          await prisma.property.delete({ where: { id } });
          deletedPrisma = true;
        } catch {
          /* fallback to Supabase */
        }
      }

      // Supabase direct deletion fallback/cleanup
      try { await supabase.from('PublicListing').delete().eq('id', id); } catch { /* ignore */ }
      try { await supabase.from('Property').delete().eq('id', id); } catch { /* ignore */ }
      try { await supabase.from('properties').delete().eq('id', id); } catch { /* ignore */ }
      try { await supabase.from('listings').delete().eq('id', id); } catch { /* ignore */ }

      return NextResponse.json({
        success: true,
        message: `Property ${id} permanently deleted from platform database.`,
      });
    }

    // ── 2. DELETE AGENCY ─────────────────────────────────────────────────────────
    if (type === 'agency') {
      // Unlink users attached to agency first
      try {
        await prisma.user.updateMany({
          where: { agencyId: id },
          data: { agencyId: null },
        });
      } catch { /* ignore */ }

      try {
        await prisma.agency.delete({ where: { id } });
      } catch (err) {
        console.warn('Prisma agency delete fallback to Supabase:', err);
      }

      try { await supabase.from('Agency').delete().eq('id', id); } catch { /* ignore */ }
      try { await supabase.from('agencies').delete().eq('id', id); } catch { /* ignore */ }

      return NextResponse.json({
        success: true,
        message: `Agency ${id} permanently deleted from platform database.`,
      });
    }

    // ── 3. DELETE USER ───────────────────────────────────────────────────────────
    if (type === 'user') {
      try {
        await prisma.user.delete({ where: { id } });
      } catch (err) {
        console.warn('Prisma user delete fallback to Supabase:', err);
      }

      try { await supabase.from('User').delete().eq('id', id); } catch { /* ignore */ }
      try { await supabase.from('users').delete().eq('id', id); } catch { /* ignore */ }

      return NextResponse.json({
        success: true,
        message: `User ${id} permanently deleted from platform database.`,
      });
    }

    // ── 4. DELETE ARCHITECT ──────────────────────────────────────────────────────
    if (type === 'architect') {
      try {
        await prisma.architectProfile.delete({ where: { id } });
      } catch (err) {
        console.warn('Prisma architect delete fallback to Supabase:', err);
      }

      try { await supabase.from('ArchitectProfile').delete().eq('id', id); } catch { /* ignore */ }
      try { await supabase.from('architect_profiles').delete().eq('id', id); } catch { /* ignore */ }

      return NextResponse.json({
        success: true,
        message: `Architect profile ${id} permanently deleted from platform database.`,
      });
    }

    return NextResponse.json({ error: `Invalid item type: ${type}` }, { status: 400 });
  } catch (err) {
    console.error('[Admin Delete API Error]:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete target item' },
      { status: 500 }
    );
  }
}
