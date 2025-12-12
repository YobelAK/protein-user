import { NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { getSupabaseServerClient } from '@/lib/supabase/server';

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
    const { data: { user } } = await supa.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }
    const body = await request.json();
    const bookingId = String(body?.bookingId || '').trim();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }
    const prisma = db;
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: true },
    });
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

    // Reuse existing active QR if present
    if (booking.xenditInvoiceId && booking.invoiceExpiryDate && new Date(booking.invoiceExpiryDate as any).getTime() > Date.now()) {
      const existingId = String(booking.xenditInvoiceId);
      try {
        const getRes = await fetch(`https://api.xendit.co/qr_codes/${encodeURIComponent(existingId)}`, {
          method: 'GET',
          headers: { Authorization: `Basic ${basic}` },
        });
        if (getRes.ok) {
          const qr = await getRes.json();
          return NextResponse.json({
            bookingId: booking.id,
            xenditId: String(qr?.id || existingId),
            qrString: String(qr?.qr_string || ''),
            qrImageUrl: String(qr?.qr_image_url || ''),
            expiresAt: new Date(booking.invoiceExpiryDate as any).toISOString(),
          });
        }
      } catch {}
    }
    const fp = request.headers.get('x-forwarded-proto') || request.headers.get('X-Forwarded-Proto') || '';
    const fh = request.headers.get('x-forwarded-host') || request.headers.get('X-Forwarded-Host') || '';
    const hh = request.headers.get('host') || request.headers.get('Host') || '';
    const proto = fp ? fp : (request.url.startsWith('https') ? 'https' : 'http');
    const host = fh ? fh : hh;
    let baseUrl = '';
    const isLocal = (h: string) => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(h);
    if (host && /\./.test(host) && !isLocal(host)) {
      baseUrl = `${proto}://${host}`;
    } else {
      const envBase = process.env.XENDIT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '';
      if (envBase) baseUrl = envBase;
    }
    if (!baseUrl || !/^https?:\/\/.+\..+/.test(baseUrl)) {
      return NextResponse.json({ error: 'Invalid callback base URL' }, { status: 400 });
    }
    const callbackUrl = `${baseUrl.replace(/\/+$/, '')}/api/webhooks/xendit`;
    // Use unique external_id to avoid duplication
    const externalId = `${booking.id}-${Math.floor(now / 1000)}`;
    const payload = {
      external_id: externalId,
      amount,
      currency: 'IDR',
      type: 'DYNAMIC',
      expires_at: expiresAt.toISOString(),
      callback_url: callbackUrl,
      description: `Payment for booking ${booking.bookingCode || ''}`,
      metadata: { booking_code: booking.bookingCode || '', tenantId: booking.tenantId || '' },
    } as any;
    const res = await fetch('https://api.xendit.co/qr_codes', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        if (j?.error_code === 'DUPLICATE_ERROR' && j?.existing) {
          const existingId = String(j.existing);
          const getRes = await fetch(`https://api.xendit.co/qr_codes/${encodeURIComponent(existingId)}`, {
            method: 'GET',
            headers: { Authorization: `Basic ${basic}` },
          });
          if (getRes.ok) {
            const qr = await getRes.json();
            // Ensure booking keeps track of existing QR id
            try {
              await prisma.booking.update({
                where: { id: booking.id },
                data: {
                  paymentMethod: 'QRIS',
                  xenditPaymentChannel: 'QRIS',
                  xenditInvoiceId: String(qr?.id || existingId),
                  invoiceExpiryDate: expiresAt,
                  updatedAt: new Date(),
                },
              });
            } catch {}
            return NextResponse.json({
              bookingId: booking.id,
              xenditId: String(qr?.id || existingId),
              qrString: String(qr?.qr_string || ''),
              qrImageUrl: String(qr?.qr_image_url || ''),
              expiresAt: expiresAt.toISOString(),
            });
          }
        }
      } catch {}
      return NextResponse.json({ error: 'Failed to create QR', detail: text }, { status: 502 });
    }
    const qr = await res.json();
    const xid = String(qr?.id || '');
    const qrString = String(qr?.qr_string || '');
    const qrImageUrl = String(qr?.qr_image_url || '');
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentMethod: 'QRIS',
        xenditPaymentChannel: 'QRIS',
        xenditInvoiceId: xid || null,
        invoiceExpiryDate: expiresAt,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({
      bookingId: updated.id,
      xenditId: xid,
      qrString,
      qrImageUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 });
  }
}
