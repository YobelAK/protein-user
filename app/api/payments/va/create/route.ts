import { NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const globalAny = globalThis as any;
const pgPool = globalAny.__btg_pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const pgAdapter = globalAny.__btg_pgAdapter ?? new PrismaPg(pgPool);
const db: PrismaClient = globalAny.__btg_prisma ?? new PrismaClient({ adapter: pgAdapter });
globalAny.__btg_pgPool = pgPool;
globalAny.__btg_pgAdapter = pgAdapter;
globalAny.__btg_prisma = db;

export async function POST(request: Request) {
  try {
    const supa = getSupabaseServerClient() as any;
    let { data: { user } } = await supa.auth.getUser();
    if (!user) {
      const authz = request.headers.get('authorization') || request.headers.get('Authorization') || '';
      const m = authz.match(/^Bearer\s+(.+)$/i);
      const token = m ? m[1].trim() : '';
      if (token) {
        try {
          const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '') as string;
          const anon = (
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
            process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
            process.env.SUPABASE_ANON_KEY ||
            process.env.SUPABASE_PUBLISHABLE_KEY ||
            ''
          ) as string;
          const supaDirect = createClient(url, anon);
          const ures = await supaDirect.auth.getUser(token);
          user = ures.data.user;
        } catch {}
      }
      if (!user) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
      }
    }
    const body = await request.json();
    const bookingId = String(body?.bookingId || '').trim();
    const bankCodeInput = String(body?.bankCode || '').toUpperCase();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }
    const prisma = db;
    const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { items: true } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const userEmail = String(user.email || '').trim().toLowerCase();
    let publicUserId: string | null = null;
    if (userEmail) {
      try {
        const u = await prisma.user.findFirst({ where: { email: userEmail }, select: { id: true } });
        publicUserId = u?.id || null;
      } catch {}
    }
    const isOwner = (
      booking.customerId === user.id ||
      (publicUserId && booking.customerId === publicUserId)
    );
    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    const amount = Number(booking.totalAmount || 0);
    const now = Date.now();
    const expiresAt = new Date(now + 15 * 60 * 1000);
    const apiKey = process.env.XENDIT_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Xendit configuration' }, { status: 500 });
    }
    const basic = Buffer.from(`${apiKey}:`).toString('base64');
    const bankCode = bankCodeInput || 'BCA';
    const name = String(booking.customerName || booking.customerEmail || 'Customer');
    const externalId = `${booking.id}-${Math.floor(now / 1000)}`;
    const payload = {
      external_id: externalId,
      bank_code: bankCode,
      name,
      is_closed: true,
      expected_amount: amount,
      is_single_use: true,
      expiration_date: expiresAt.toISOString(),
      metadata: { booking_code: booking.bookingCode || '', tenantId: booking.tenantId || '' },
    } as any;
    const res = await fetch('https://api.xendit.co/callback_virtual_accounts', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Failed to create VA', detail: text }, { status: 502 });
    }
    const va = await res.json();
    const xid = String(va?.id || '');
    const accountNumber = String(va?.account_number || '');
    const bank = String(va?.bank_code || bankCode);
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentMethod: 'VIRTUAL_ACCOUNT',
        xenditPaymentChannel: bank,
        xenditInvoiceId: xid || null,
        invoiceExpiryDate: expiresAt,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({
      bookingId: updated.id,
      xenditId: xid,
      accountNumber,
      bankCode: bank,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 });
  }
}
