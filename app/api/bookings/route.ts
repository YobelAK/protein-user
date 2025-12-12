import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const prisma = db;

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const action = String(body?.action || '').toLowerCase();
    if (action === 'review') {
      try {
        const prisma = db;
        const bookingId = String(body?.bookingId || '').trim();
        const rating = Number(body?.rating || 0);
        const title = body?.title != null ? String(body.title) : undefined;
        const comment = body?.comment != null ? String(body.comment) : undefined;
        const serviceRating = body?.serviceRating != null ? Number(body.serviceRating) : undefined;
        const valueRating = body?.valueRating != null ? Number(body.valueRating) : undefined;
        const locationRating = body?.locationRating != null ? Number(body.locationRating) : undefined;

        if (!bookingId) {
          return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
        }
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
          return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
        }

        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            items: true,
          },
        });
        if (!booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }
        if (booking.status !== 'COMPLETED') {
          return NextResponse.json({ error: 'Only completed bookings can be reviewed' }, { status: 400 });
        }

        const existing = await prisma.review.findUnique({ where: { bookingId } });
        if (existing) {
          return NextResponse.json({ review: existing }, { status: 200 });
        }

        const firstItem = booking.items[0];
        const productId = firstItem?.productId || undefined;
        const tenantId = booking.tenantId;
        const customerId = booking.customerId;
        if (!productId) {
          return NextResponse.json({ error: 'No product found for booking' }, { status: 400 });
        }

        const included: number[] = [rating,
          typeof serviceRating === 'number' ? serviceRating : undefined,
          typeof valueRating === 'number' ? valueRating : undefined,
          typeof locationRating === 'number' ? locationRating : undefined,
        ].filter((x): x is number => typeof x === 'number');
        const avg = included.reduce((a, c) => a + c, 0) / (included.length || 1);
        const score = (avg / 5) * 2 - 1;
        const label = score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

        const review = await prisma.review.create({
          data: {
            bookingId,
            tenantId,
            productId,
            customerId,
            rating,
            title,
            comment,
            serviceRating,
            valueRating,
            locationRating,
            scoreSentiment: String(Number(score.toFixed(3))),
            sentimentLabel: label,
          },
        });
        try {
          await prisma.product.update({
            where: { id: productId },
            data: { reviewCount: { increment: 1 } },
          });
        } catch {}
        return NextResponse.json({ review }, { status: 201 });
      } catch (e: any) {
        return NextResponse.json({ error: 'Failed to create review', detail: e?.message || String(e) }, { status: 500 });
      }
    }
    const scheduleId = String(body?.scheduleId || '');
    const guestCount = Number(body?.guestCount || 1);
    const priceIdr = Number(body?.priceIdr || 0);
    const portFee = Number(body?.portFee || 0);
    const contact = body?.contact || {};
    const passengers = Array.isArray(body?.passengers) ? body.passengers : [];
    const ownerId = String(body?.ownerId || '');
    const ownerEmail = String(body?.ownerEmail || '').trim().toLowerCase();
    const departureDate = String(body?.departureDate || '');
    const inventoryIdFromClient = String(body?.inventoryId || '');

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

    let inventoryId: string | null = inventoryIdFromClient || null;

    const userEmail = String(contact?.email || '').trim().toLowerCase();
    const userFullName = String(contact?.fullName || '').trim();

    if (!ownerId) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const checkUserRes = await fetch(`${supabaseUrl}/rest/v1/users?select=id&id=eq.${encodeURIComponent(ownerId)}&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store',
    });
    if (!checkUserRes.ok) {
      const text = await checkUserRes.text();
      return NextResponse.json({ error: 'Failed to verify user', detail: text }, { status: 500 });
    }
    const checkUserData = await checkUserRes.json();
    const hasUserRecord = Array.isArray(checkUserData) && checkUserData.length > 0;
    let customerId: string = ownerId;
    if (!hasUserRecord) {
      if (!ownerEmail) {
        return NextResponse.json({ error: 'User not found', detail: 'Please login with a registered account' }, { status: 400 });
      }
      const byEmailRes = await fetch(`${supabaseUrl}/rest/v1/users?select=id&email=eq.${encodeURIComponent(ownerEmail)}&limit=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: 'no-store',
      });
      if (!byEmailRes.ok) {
        const text = await byEmailRes.text();
        return NextResponse.json({ error: 'Failed to verify user by email', detail: text }, { status: 500 });
      }
      const byEmailData = await byEmailRes.json();
      const foundByEmail = Array.isArray(byEmailData) && byEmailData.length > 0 ? String(byEmailData[0].id || '') : '';
      if (!foundByEmail) {
        return NextResponse.json({ error: 'User not found', detail: 'Please login with a registered account' }, { status: 400 });
      }
      customerId = foundByEmail;
    }

    const bookingId = crypto.randomUUID();
    const bookingCode = `BKG-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const unitPriceFor = (ageCat: any) => {
      const ac = String(ageCat || '').toLowerCase();
      return (ac === 'child' || ac === 'infant') ? Math.round(priceIdr * 0.75) : priceIdr;
    };
    const itemsPayload = passengers.map((p: any) => ({
      id: crypto.randomUUID(),
      bookingId,
      productId,
      inventoryId: inventoryId || null,
      unit_price: unitPriceFor(p?.ageCategory),
      quantity: 1,
      item_date: nowIso,
      subtotal: unitPriceFor(p?.ageCategory),
      participant_name: `${String(p.firstName || '').trim()} ${String(p.lastName || '').trim()}`.trim() || null,
      participant_email: null,
      participant_phone: null,
      special_requirements: JSON.stringify({
        title: String(p.title || ''),
        firstName: String(p.firstName || ''),
        lastName: String(p.lastName || ''),
        nationality: String(p.nationality || ''),
        identityType: String(p.identityType || ''),
        idNumber: String(p.idNumber || ''),
        ageCategory: String(p.ageCategory || ''),
        notes: String(contact?.specialRequests || ''),
      }),
    }));
    const passengerTotal = itemsPayload.reduce((acc: number, it: any) => acc + Number(it.subtotal || 0), 0);
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

    if (!inventoryId && productId && departureDate) {
      const invSelect = ['id','productId','inventoryDate','availableUnits','bookedUnits'].join(',');
      const invRes = await fetch(`${supabaseUrl}/rest/v1/inventory?select=${encodeURIComponent(invSelect)}&productId=eq.${encodeURIComponent(productId)}&inventoryDate=eq.${encodeURIComponent(departureDate)}&is_available=eq.true&limit=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: 'no-store',
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        const inv = Array.isArray(invData) && invData.length > 0 ? invData[0] : null;
        if (inv) {
          inventoryId = String(inv.id || '');
        }
      }
    }

    if (inventoryId && itemsPayload.length > 0) {
      const qty = itemsPayload.length;
      const invGetRes = await fetch(`${supabaseUrl}/rest/v1/inventory?select=${encodeURIComponent('id,availableUnits,bookedUnits')}&id=eq.${encodeURIComponent(inventoryId)}`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: 'no-store',
      });
      if (invGetRes.ok) {
        const invArr = await invGetRes.json();
        const inv = Array.isArray(invArr) && invArr.length > 0 ? invArr[0] : null;
        if (inv) {
          const newAvailable = Math.max(0, Number(inv.availableUnits || 0) - qty);
          const newBooked = Number(inv.bookedUnits || 0) + qty;
          const updateRes = await fetch(`${supabaseUrl}/rest/v1/inventory?id=eq.${encodeURIComponent(inventoryId)}`, {
            method: 'PATCH',
            headers: {
              apikey: serviceKey,
              Authorization: `Bearer ${serviceKey}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation',
            },
            body: JSON.stringify({ availableUnits: newAvailable, bookedUnits: newBooked, updatedAt: new Date().toISOString() }),
          });
          if (!updateRes.ok) {
            const text = await updateRes.text();
            return NextResponse.json({ error: 'Failed to update inventory', detail: text }, { status: 500 });
          }
        }
      }
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

    const prisma = db;

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
      const items = await prisma.bookingItem.findMany({
        where: { bookingId: updated.id, inventoryId: { not: null } },
        select: { inventoryId: true, quantity: true },
      });
      const map = new Map<string, number>();
      for (const it of items) {
        const id = String(it.inventoryId || '');
        if (!id) continue;
        const qty = Number(it.quantity || 0);
        map.set(id, (map.get(id) || 0) + qty);
      }
      for (const [invId, qty] of map.entries()) {
        const inv = await prisma.inventory.findUnique({ where: { id: invId } });
        if (!inv) continue;
        const newAvail = Math.min(inv.totalCapacity || 0, (inv.availableUnits || 0) + qty);
        const newBooked = Math.max(0, (inv.bookedUnits || 0) - qty);
        await prisma.inventory.update({ where: { id: invId }, data: { availableUnits: newAvail, bookedUnits: newBooked, updatedAt: new Date() } });
      }
      return NextResponse.json({ booking: updated });
    }

    if (action === 'expire') {
      const updated = await prisma.booking.update({
        where,
        data: {
          status: 'EXPIRED',
          cancelledAt: new Date(),
          cancellationReason: 'Expired payment deadline',
        },
      });
      const items = await prisma.bookingItem.findMany({
        where: { bookingId: updated.id, inventoryId: { not: null } },
        select: { inventoryId: true, quantity: true },
      });
      const map = new Map<string, number>();
      for (const it of items) {
        const id = String(it.inventoryId || '');
        if (!id) continue;
        const qty = Number(it.quantity || 0);
        map.set(id, (map.get(id) || 0) + qty);
      }
      for (const [invId, qty] of map.entries()) {
        const inv = await prisma.inventory.findUnique({ where: { id: invId } });
        if (!inv) continue;
        const newAvail = Math.min(inv.totalCapacity || 0, (inv.availableUnits || 0) + qty);
        const newBooked = Math.max(0, (inv.bookedUnits || 0) - qty);
        await prisma.inventory.update({ where: { id: invId }, data: { availableUnits: newAvail, bookedUnits: newBooked, updatedAt: new Date() } });
      }
      return NextResponse.json({ booking: updated });
    }

  if (action === 'refund') {
      const reason = String(body?.reason || '').trim();
      const updated = await prisma.booking.update({
        where,
        data: {
          status: 'PENDING',
          invoiceExpiryDate: null,
          cancellationReason: reason ? `Refund requested - ${reason}` : 'Refund requested',
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ booking: updated });
    }

    if (action === 'complete') {
      const updated = await prisma.booking.update({
        where,
        data: {
          status: 'COMPLETED',
          updatedAt: new Date(),
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
  const reviewOf = urlObj.searchParams.get('reviewOf') || '';
  const topReviews = urlObj.searchParams.get('topReviews') || '';
  const topFastboatRoutes = urlObj.searchParams.get('topFastboatRoutes') || '';

  if (reviewOf) {
    const prisma = db;
    const review = await prisma.review.findUnique({ where: { bookingId: reviewOf } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    return NextResponse.json({ review });
  }

  if (topReviews) {
    const prisma = db;
    const reviews = await prisma.review.findMany({
      orderBy: [{ scoreSentiment: 'desc' }, { reviewDate: 'desc' }],
      take: 5,
      include: {
        customer: { select: { fullName: true, nationality: true, avatarUrl: true } },
      },
    });
    const normalized = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      text: r.comment || r.title || '',
      name: r.customer?.fullName || 'Anonymous',
      country: r.customer?.nationality || '',
      avatar: r.customer?.avatarUrl || '',
    }));
    return NextResponse.json({ reviews: normalized });
  }

  if (topFastboatRoutes) {
    const prisma = db;
    const since = new Date();
    since.setDate(since.getDate() - 90);
    const items = await prisma.bookingItem.findMany({
      where: {
        isCancelled: false,
        itemDate: { gte: since },
        booking: { status: { in: ['PAID', 'COMPLETED'] } },
        product: { productType: 'BOAT_ROUTE' },
      },
      include: {
        product: {
          select: {
            id: true,
            fastboatSchedule: {
              include: { departureRoute: true, arrivalRoute: true },
            },
          },
        },
      },
    });
    type RouteAgg = {
      depId: string;
      arrId: string;
      depName: string;
      arrName: string;
      passengers: number;
      productIds: Set<string>;
    };
    const routes = new Map<string, RouteAgg>();
    for (const it of items) {
      const p = it.product as any;
      const depId = p?.fastboatSchedule?.departureRoute?.id || '';
      const arrId = p?.fastboatSchedule?.arrivalRoute?.id || '';
      const depName = p?.fastboatSchedule?.departureRoute?.name || '';
      const arrName = p?.fastboatSchedule?.arrivalRoute?.name || '';
      if (!depId || !arrId) continue;
      const key = `${depId}:${arrId}`;
      const prev = routes.get(key);
      const qty = Number(it.quantity || 0);
      if (prev) {
        prev.passengers += qty;
        prev.productIds.add(p.id);
      } else {
        routes.set(key, {
          depId, arrId, depName, arrName, passengers: qty, productIds: new Set([p.id])
        });
      }
    }

    const sortedRoutes = Array.from(routes.values()).sort((a, b) => b.passengers - a.passengers);
    const maxResults = 8;
    const destinations = [] as Array<{ id: string; depId: string; arrId: string; title: string; type: string; priceIdr: number; image: string | null; popularity: number; date: string }>;
    for (const r of sortedRoutes) {
      const schedules = await prisma.fastboatSchedule.findMany({
        where: {
          departureRouteId: r.depId,
          arrivalRouteId: r.arrId,
          isActive: true,
          product: { is: { isActive: true } },
        },
        include: {
          product: { select: { id: true, priceIdr: true, featuredImage: true, isActive: true } },
          arrivalRoute: true,
        },
      });
      if (!Array.isArray(schedules) || schedules.length === 0) {
        if (destinations.length >= maxResults) break;
        continue;
      }
      const products = schedules
        .map((s) => s.product)
        .filter(Boolean) as Array<{ id: string; priceIdr: any; featuredImage: string | null }>;
      let bestPrice = Number.MAX_SAFE_INTEGER;
      let bestImage: string | null = null;
      let cheapestProductId: string | null = null;
      for (const p of products) {
        const priceNum = Number(p.priceIdr || 0);
        if (priceNum < bestPrice) {
          bestPrice = priceNum;
          bestImage = p.featuredImage || null;
          cheapestProductId = p.id;
        }
      }
      if (!cheapestProductId) {
        if (destinations.length >= maxResults) break;
        continue;
      }
      const routeImage = (schedules[0]?.arrivalRoute as any)?.image || null;
      const inv = cheapestProductId ? await prisma.inventory.findFirst({
        where: { productId: cheapestProductId, isAvailable: true, availableUnits: { gt: 0 } },
        orderBy: { inventoryDate: 'asc' },
        select: { inventoryDate: true },
      }) : null;
      const dateStr = inv?.inventoryDate ? new Date(inv.inventoryDate as any).toISOString().slice(0, 10) : (() => {
        const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2,'0'); const da = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${da}`;
      })();

      destinations.push({
        id: `${r.depId}:${r.arrId}`,
        depId: r.depId,
        arrId: r.arrId,
        title: `${r.depName} ➔ ${r.arrName}`,
        type: 'Speedboat',
        priceIdr: bestPrice === Number.MAX_SAFE_INTEGER ? 0 : bestPrice,
        image: routeImage || bestImage,
        popularity: r.passengers,
        date: dateStr,
      });
      if (destinations.length >= maxResults) break;
    }
    return NextResponse.json({ destinations });
  }

  if (id) {
    const prisma = db;
  const b = await prisma.booking.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              fastboatSchedule: {
                include: { departureRoute: true, arrivalRoute: true, boat: true },
              },
            },
          },
          inventory: true,
        },
      },
      tenant: true,
    },
  });
    if (!b) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const emailLower = (email || '').trim().toLowerCase();
    let publicUserId: string | null = null;
    if (emailLower) {
      try {
        const u = await prisma.user.findFirst({ where: { email: emailLower }, select: { id: true } });
        publicUserId = u?.id || null;
      } catch {}
    }
    const allowed = (!!userId && b.customerId === userId)
      || (emailLower && ((b as any)?.customerEmail || '').trim().toLowerCase() === emailLower)
      || (!!publicUserId && b.customerId === publicUserId);
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ booking: b });
  }

  if (code) {
    const prisma = db;
  const b = await prisma.booking.findFirst({
    where: { bookingCode: code },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              fastboatSchedule: {
                include: { departureRoute: true, arrivalRoute: true, boat: true },
              },
            },
          },
          inventory: true,
        },
      },
      tenant: true,
    },
  });
    if (!b) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ booking: b });
  }

  if (!userId && !email) {
    return NextResponse.json({ error: 'Missing user identifier' }, { status: 400 });
  }

  const prisma = db;
  let publicUserId: string | null = null;
  if (email) {
    try {
      const u = await prisma.user.findFirst({ where: { email }, select: { id: true } });
      publicUserId = u?.id || null;
    } catch {}
  }

  await prisma.booking.updateMany({
    where: {
      OR: [
        userId ? { customerId: userId } : undefined,
        email ? { customerEmail: email } : undefined,
        publicUserId ? { customerId: publicUserId } : undefined,
      ].filter(Boolean) as any,
      status: 'PENDING',
      invoiceExpiryDate: { lte: new Date() },
    },
    data: {
      status: 'EXPIRED',
      cancelledAt: new Date(),
      cancellationReason: 'Expired payment deadline',
    },
  });

  const bookings = await prisma.booking.findMany({
    where: {
      OR: [
        userId ? { customerId: userId } : undefined,
        email ? { customerEmail: email } : undefined,
        publicUserId ? { customerId: publicUserId } : undefined,
      ].filter(Boolean) as any,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
              fastboatSchedule: {
                include: { departureRoute: true, arrivalRoute: true, boat: true },
              },
            },
          },
          inventory: true,
        },
      },
      tenant: true,
    },
  });

  function toCardStatus(status: string, paidAt?: Date | null) {
    if (status === 'PENDING') return 'Pending';
    if (status === 'PAID') return 'Booked';
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'CANCELLED') return 'Cancelled';
    if (status === 'EXPIRED') return 'Expired';
    if (status === 'REFUNDED') return 'Refunded';
    if (paidAt) return 'Booked';
    return 'Pending';
  }

  const cards = bookings.map((b) => {
    const firstItem = b.items[0];
    const dateObj = firstItem?.itemDate || b.bookingDate;
    const qty = b.items.reduce((acc, it) => acc + (it.quantity || 0), 0);
    const sched = firstItem?.product?.fastboatSchedule || null;
    const boatName = sched?.boat?.name || null;
    const vendorName = (b as any)?.tenant?.vendorName || null;
    let title = [boatName, vendorName].filter(Boolean).join(' \u2022 ') || firstItem?.product?.name || 'Unknown Product';
    try {
      const notesRaw = (b as any)?.customerNotes ?? (b as any)?.customer_notes ?? '';
      let rtType: string | null = null;
      if (notesRaw) {
        try {
          const meta = JSON.parse(String(notesRaw));
          const t = String(meta?.rtType || '').toUpperCase();
          rtType = t || null;
        } catch {}
      }
      if (!rtType) {
        const sr = (firstItem as any)?.specialRequirements || null;
        if (sr) {
          try {
            const obj = JSON.parse(String(sr));
            const notesField = obj?.notes || '';
            if (notesField) {
              try {
                const inner = JSON.parse(String(notesField));
                const t2 = String(inner?.rtType || '').toUpperCase();
                rtType = t2 || rtType;
              } catch {}
            }
          } catch {}
        }
      }
      const suffix = rtType === 'OUTBOUND' ? 'Pergi' : rtType === 'INBOUND' ? 'Pulang' : '';
      if (suffix) title = `${title} \u2022 ${suffix}`;
    } catch {}
    const featured = firstItem?.product?.featuredImage || null;
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
    const isPendingPayment = b.status === 'PENDING' && (b.paidAmount == null);
    const pendingType = b.status === 'PENDING' ? (isPendingPayment ? 'payment' : 'refund') : undefined;
    const deadlineAt = isPendingPayment && bd ? new Date(bd.getTime() + 15 * 60 * 1000) : null;
    const paymentDeadline = deadlineAt ? deadlineAt.toLocaleString('id-ID', { hour12: false }) : null;
    const dateStr = dateObj ? new Date(dateObj).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const invDate = firstItem?.inventory?.inventoryDate ? new Date(firstItem.inventory.inventoryDate as any) : null;
    const departureDate = invDate ? invDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    const departureTime = (sched as any)?.departureTime ?? null;
    const arrivalTime = (sched as any)?.arrivalTime ?? null;
    let arrivalAt: string | null = null;
    try {
      if (invDate && arrivalTime) {
        const parts = String(arrivalTime).split(':');
        const hh = Number(parts[0] || 0);
        const mm = Number(parts[1] || 0);
        const d = new Date(invDate);
        d.setHours(hh, mm, 0, 0);
        arrivalAt = d.toISOString();
      }
    } catch {}
    return {
      id: b.id,
      initials,
      title,
      location,
      date: dateStr,
      bookingDate: bd ? bd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
      departureDate,
      departureTime,
      arrivalTime,
      arrivalAt,
      passengers: qty,
      bookingCode: b.bookingCode,
      status,
      image: featured,
      paymentDeadline,
      deadlineAt: deadlineAt ? deadlineAt.toISOString() : null,
      pendingType,
      cancellationReason: (b as any)?.cancellationReason ?? (b as any)?.cancellation_reason ?? null,
    };
  });

  return NextResponse.json({ bookings: cards });
}
