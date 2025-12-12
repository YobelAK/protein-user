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
    const pmPayload = {
      type: 'CARD',
      reusability: 'ONE_TIME',
      card: {
        number: cardNumber,
        exp_month: cardExpMonth,
        exp_year: cardExpYear,
        cvn: cardCvn,
      },
      billing_details: {
        given_names: cardName || String(booking.customerName || ''),
        email: cardEmail || String(booking.customerEmail || ''),
        mobile_number: cardPhone || String(booking.customerPhone || ''),
      },
    } as any;
    const pmRes = await fetch('https://api.xendit.co/payment_methods', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(pmPayload),
    });
    if (!pmRes.ok) {
      const text = await pmRes.text();
      return NextResponse.json({ error: 'Failed to create payment method', detail: text }, { status: 502 });
    }
    const pm = await pmRes.json();
    const paymentPayload = {
      amount,
      currency: 'IDR',
      capture_method: 'AUTOMATIC',
      payment_method_id: String(pm?.id || ''),
      reference_id: `${booking.id}-${Math.floor(now / 1000)}`,
      description: `Payment for booking ${booking.bookingCode || ''}`,
    } as any;
    const payRes = await fetch('https://api.xendit.co/payments', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentPayload),
    });
    if (!payRes.ok) {
      const text = await payRes.text();
      return NextResponse.json({ error: 'Failed to create payment', detail: text }, { status: 502 });
    }
    const payment = await payRes.json();
    const pid = String(payment?.id || '');
    const status = String(payment?.status || '').toUpperCase();
    let redirectUrl = '';
    const acts = Array.isArray(payment?.actions) ? payment.actions : [];
    if (acts && acts.length > 0) {
      const a = acts[0] as any;
      redirectUrl = String(a?.url || a?.redirect_url || '');
    }
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paymentMethod: 'CARD',
        xenditPaymentChannel: 'CARD',
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
