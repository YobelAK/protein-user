import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const prisma = db;

export async function POST(request: Request) {
  try {
    const supa = await getSupabaseServerClient() as any;
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
    const cardNumber = String(body?.cardNumber || '').replace(/\s+/g, '');
    const cardExpMonth = Number(body?.cardExpMonth || 0);
    const cardExpYear = Number(body?.cardExpYear || 0);
    const cardCvn = String(body?.cardCvn || '').trim();
    const cardName = String(body?.cardName || '').trim();
    const cardEmail = String(body?.cardEmail || '').trim();
    const cardPhone = String(body?.cardPhone || '').trim();
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }
    if (!cardNumber || !cardExpMonth || !cardExpYear || !cardCvn) {
      return NextResponse.json({ error: 'Missing card data' }, { status: 400 });
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
    const fp = request.headers.get('x-forwarded-proto') || request.headers.get('X-Forwarded-Proto') || '';
    const fh = request.headers.get('x-forwarded-host') || request.headers.get('X-Forwarded-Host') || '';
    const hh = request.headers.get('host') || request.headers.get('Host') || '';
    const proto = fp ? fp : (request.url.startsWith('https') ? 'https' : 'http');
    const host = fh || hh || '';
    const origin = host ? `${proto}://${host}` : (request.url.startsWith('http') ? new URL(request.url).origin : '');
    const mid = process.env.XENDIT_MID_LABEL || '';
    const name = String(cardName || '').trim();
    const first = name.split(/\s+/).filter(Boolean)[0] || String(booking.customerName || '').split(/\s+/).filter(Boolean)[0] || '';
    const rest = name.split(/\s+/).filter(Boolean).slice(1).join(' ');
    const last = rest || String(booking.customerName || '').split(/\s+/).filter(Boolean).slice(1).join(' ');
    const normalizePhone = (v: string) => {
      const s = String(v || '').trim();
      if (!s) return undefined;
      const keep = s.replace(/[^\d+]/g, '');
      if (!keep) return undefined;
      if (keep.startsWith('+')) {
        const q = '+' + keep.replace(/^\+/, '').replace(/\D/g, '');
        if (/^\+[0-9]\d{1,14}$/.test(q)) return q;
        return undefined;
      }
      const d = keep.replace(/\D/g, '');
      if (!d) return undefined;
      if (d.startsWith('0')) {
        const r = '+62' + d.slice(1);
        if (/^\+[0-9]\d{1,14}$/.test(r)) return r;
        return undefined;
      }
      if (d.startsWith('62')) {
        const r = '+' + d;
        if (/^\+[0-9]\d{1,14}$/.test(r)) return r;
        return undefined;
      }
      const r = '+62' + d;
      if (/^\+[0-9]\d{1,14}$/.test(r)) return r;
      return undefined;
    };
    const phoneE164 = normalizePhone(cardPhone || String(booking.customerPhone || ''));
    const prPayload = {
      reference_id: `${booking.id}-${Math.floor(now / 1000)}`,
      type: 'PAY',
      country: 'ID',
      currency: 'IDR',
      request_amount: amount,
      capture_method: 'AUTOMATIC',
      channel_code: 'CARDS',
      channel_properties: {
        ...(mid ? { mid_label: mid } : {}),
        card_details: {
          cvn: cardCvn,
          card_number: cardNumber,
          expiry_year: String(cardExpYear),
          expiry_month: String(cardExpMonth).padStart(2, '0'),
          cardholder_first_name: first || '',
          cardholder_last_name: last || '',
          cardholder_email: cardEmail || String(booking.customerEmail || ''),
          cardholder_phone_number: phoneE164 || undefined,
        },
        skip_three_ds: false,
        failure_return_url: origin ? `${origin}/speedboat/book/payment?status=failed` : undefined,
        success_return_url: origin ? `${origin}/speedboat/book/payment?status=success` : undefined,
      },
      description: `Payment for booking ${booking.bookingCode || ''}`,
      metadata: { booking_id: booking.id },
    } as any;
    const prRes = await fetch('https://api.xendit.co/v3/payment_requests', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json', 'api-version': '2024-11-11' },
      body: JSON.stringify(prPayload),
    });
    if (!prRes.ok) {
      const text = await prRes.text();
      return NextResponse.json({ error: 'Failed to create payment', detail: text }, { status: 502 });
    }
    const pr = await prRes.json();
    const pid = String(pr?.id || '');
    const status = String(pr?.status || '').toUpperCase();
    let redirectUrl = '';
    const acts = Array.isArray(pr?.actions) ? pr.actions : [];
    if (acts && acts.length > 0) {
      const a = acts[0] as any;
      redirectUrl = String(a?.url || a?.redirect_url || '');
    }
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentMethod: 'CARD',
        xenditPaymentChannel: 'CARDS',
        xenditInvoiceId: pid || null,
        invoiceExpiryDate: expiresAt,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({
      bookingId: booking.id,
      xenditId: pid,
      status,
      requiresAction: status === 'REQUIRES_ACTION' || !!redirectUrl,
      redirectUrl,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 });
  }
}
