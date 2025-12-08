import { NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const scheduleId = String(body?.scheduleId || '');
    const guestCount = Number(body?.guestCount || 1);
    const priceIdr = Number(body?.priceIdr || 0);
    const portFee = Number(body?.portFee || 0);
    const contact = body?.contact || {};
    const passengers = Array.isArray(body?.passengers) ? body.passengers : [];

    const scheduleSelect = [
      'id',
      'productId',
      'product:products!fastboat_schedules_productId_fkey(id,tenantId,price_idr)'
    ].join(',');

    const scheduleRes = await fetch(`${supabaseUrl}/rest/v1/fastboat_schedules?select=${encodeURIComponent(scheduleSelect)}&id=eq.${encodeURIComponent(scheduleId)}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store',
    });
    if (!scheduleRes.ok) {
      const text = await scheduleRes.text();
      return NextResponse.json({ error: 'Failed to fetch schedule', detail: text }, { status: 500 });
    }
    const scheduleData = await scheduleRes.json();
    const schedule = Array.isArray(scheduleData) && scheduleData.length > 0 ? scheduleData[0] : null;
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const productId: string = schedule.productId || schedule.product?.id;
    const tenantId: string = schedule.product?.tenantId;

    const userEmail = String(contact?.email || '').toLowerCase();
    const userFullName = String(contact?.fullName || '');

    let customerId: string | null = null;
    if (userEmail) {
      const userRes = await fetch(`${supabaseUrl}/rest/v1/users?select=id,email&email=eq.${encodeURIComponent(userEmail)}&limit=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: 'no-store',
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        if (Array.isArray(userData) && userData.length > 0) {
          customerId = userData[0].id as string;
        }
      }
    }

    if (!customerId) {
      const newUserId = crypto.randomUUID();
      const nowIso = new Date().toISOString();
      const createUserRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          id: newUserId,
          email: userEmail,
          role: 'CUSTOMER',
          full_name: userFullName,
          isActive: true,
          updatedAt: nowIso,
        }),
      });
      if (!createUserRes.ok) {
        const text = await createUserRes.text();
        return NextResponse.json({ error: 'Failed to create user', detail: text }, { status: 500 });
      }
      const createdUser = await createUserRes.json();
      customerId = createdUser?.[0]?.id || newUserId;
    }

    const bookingId = crypto.randomUUID();
    const bookingCode = `BKG-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Date.now()}`;
    const passengerTotal = priceIdr * guestCount;
    const totalAmount = passengerTotal + portFee;

    const phoneCombined = `${String(contact?.countryCode || '')} ${String(contact?.phone || '')}`.trim();
    const notes = String(contact?.specialRequests || '');

    const createBookingRes = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id: bookingId,
        tenantId,
        customerId,
        booking_code: bookingCode,
        currency: 'IDR',
        total_amount: totalAmount,
        status: 'PENDING',
        customer_name: userFullName,
        customer_email: userEmail,
        customer_phone: phoneCombined || null,
        customer_notes: notes || null,
        updatedAt: new Date().toISOString(),
      }),
    });
    if (!createBookingRes.ok) {
      const text = await createBookingRes.text();
      return NextResponse.json({ error: 'Failed to create booking', detail: text }, { status: 500 });
    }
    const createdBookings = await createBookingRes.json();
    const booking = createdBookings?.[0];

    const nowIso = new Date().toISOString();
    const itemsPayload = passengers.map((p: any) => ({
      id: crypto.randomUUID(),
      bookingId: booking.id,
      productId,
      unit_price: priceIdr,
      quantity: 1,
      item_date: nowIso,
      subtotal: priceIdr,
      participant_name: `${String(p.firstName || '').trim()} ${String(p.lastName || '').trim()}`.trim() || null,
      participant_email: null,
      participant_phone: null,
      special_requirements: notes || null,
    }));

    let items: any[] = [];
    if (itemsPayload.length > 0) {
      const createItemsRes = await fetch(`${supabaseUrl}/rest/v1/booking_items`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(itemsPayload),
      });
      if (!createItemsRes.ok) {
        const text = await createItemsRes.text();
        return NextResponse.json({ error: 'Failed to create booking items', detail: text }, { status: 500 });
      }
      items = await createItemsRes.json();
    }

    return NextResponse.json({ booking, items });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id || '');
    const code = String(body?.code || '');
    const action = String(body?.action || '').toLowerCase();
    const paymentMethod = body?.paymentMethod as string | undefined;
    const paidAmount = body?.paidAmount as number | string | undefined;

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const where: any = id ? { id } : code ? { bookingCode: code } : null;
    if (!where) {
      return NextResponse.json({ error: 'Missing booking identifier' }, { status: 400 });
    }

    if (action === 'pay') {
      const updated = await prisma.booking.update({
        where,
        data: {
          status: 'PAID',
          paymentMethod: paymentMethod || 'unknown',
          paidAmount: paidAmount !== undefined ? (typeof paidAmount === 'string' ? paidAmount : String(paidAmount)) : undefined,
          paidAt: new Date(),
        },
      });
      return NextResponse.json({ booking: updated });
    }

    if (action === 'cancel') {
      const updated = await prisma.booking.update({
        where,
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: body?.reason || 'User cancelled',
        },
      });
      return NextResponse.json({ booking: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const code = urlObj.searchParams.get('code') || '';
  const id = urlObj.searchParams.get('id') || '';
  const userId = urlObj.searchParams.get('userId') || '';
  const email = urlObj.searchParams.get('email') || '';

  if (id) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    const b = await prisma.booking.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                fastboatSchedule: {
                  include: { departureRoute: true, arrivalRoute: true },
                },
              },
            },
          },
        },
      },
    });
    if (!b) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ booking: b });
  }

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
    }
    const select = ['*', 'booking_items(*)'].join(',');
    const res = await fetch(`${supabaseUrl}/rest/v1/bookings?select=${encodeURIComponent(select)}&booking_code=eq.${encodeURIComponent(code)}&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Failed to fetch booking', detail: text }, { status: 500 });
    }
    const data = await res.json();
    const booking = Array.isArray(data) && data.length > 0 ? data[0] : null;
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ booking });
  }

  if (!userId && !email) {
    return NextResponse.json({ error: 'Missing user identifier' }, { status: 400 });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.booking.updateMany({
    where: {
      OR: [
        userId ? { customerId: userId } : undefined,
        email ? { customerEmail: email } : undefined,
      ].filter(Boolean) as any,
      status: 'PENDING',
      invoiceExpiryDate: { lte: new Date() },
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: 'Expired payment deadline',
    },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        userId ? { customerId: userId } : undefined,
        email ? { customerEmail: email } : undefined,
      ].filter(Boolean) as any,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            include: {
              fastboatSchedule: {
                include: { departureRoute: true, arrivalRoute: true },
              },
            },
          },
        },
      },
    },
  });

  function toCardStatus(status: string, paidAt?: Date | null) {
    if (status === 'PENDING') return 'Pending';
    if (status === 'PAID') return 'Booked';
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'CANCELLED' || status === 'EXPIRED' || status === 'REFUNDED') return 'Cancelled';
    if (paidAt) return 'Booked';
    return 'Pending';
  }

  const cards = bookings.map((b) => {
    const firstItem = b.items[0];
    const dateObj = firstItem?.itemDate || b.bookingDate;
    const qty = b.items.reduce((acc, it) => acc + (it.quantity || 0), 0);
    const title = firstItem?.product?.name || 'Unknown Product';
    const featured = firstItem?.product?.featuredImage || null;
    const sched = firstItem?.product?.fastboatSchedule || null;
    const location = sched && sched.departureRoute && sched.arrivalRoute
      ? `${sched.departureRoute.name} → ${sched.arrivalRoute.name}`
      : '';
    const initials = title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
    const status = toCardStatus(b.status, b.paidAt);
    const bd = b.bookingDate ? new Date(b.bookingDate) : null;
    const deadlineAt = bd ? new Date(bd.getTime() + 15 * 60 * 1000) : null;
    const paymentDeadline = deadlineAt ? deadlineAt.toLocaleString('id-ID', { hour12: false }) : null;
    const dateStr = dateObj ? new Date(dateObj).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    return {
      id: b.id,
      initials,
      title,
      location,
      date: dateStr,
      passengers: qty,
      bookingCode: b.bookingCode,
      status,
      image: featured,
      paymentDeadline,
      deadlineAt: deadlineAt ? deadlineAt.toISOString() : null,
    };
  });

  return NextResponse.json({ bookings: cards });
}
