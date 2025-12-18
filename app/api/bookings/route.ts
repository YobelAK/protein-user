import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const prisma = db;

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const useSupabase = !!(supabaseUrl && serviceKey);

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
    const totalAmountFromClient = Number(body?.totalAmount || 0);
    const currencyRaw = String(body?.currency || 'IDR').toUpperCase();
    const currency = currencyRaw === 'USD' ? 'USD' : 'IDR';
    const legs = Array.isArray((body as any)?.legs) ? (body as any).legs : [];
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

    let productId: string = '';
    let tenantId: string = '';
    type LegInput = { scheduleId: string; departureDate?: string; priceIdr?: number; inventoryId?: string; notes?: string; rtType?: string };
    type LegInfo = { scheduleId: string; productId: string; tenantId: string; departureDate: string; priceIdr: number; inventoryId?: string | null; notes?: string; rtType?: string };
    const legInputs: LegInput[] = legs
      .filter((lg: any) => lg && typeof lg === 'object' && lg.scheduleId)
      .map((lg: any) => ({
        scheduleId: String(lg.scheduleId || ''),
        departureDate: String(lg.departureDate || ''),
        priceIdr: Number(lg.priceIdr || 0),
        inventoryId: lg.inventoryId ? String(lg.inventoryId) : undefined,
        notes: typeof lg.notes === 'string' ? lg.notes : undefined,
        rtType: typeof lg.rtType === 'string' ? lg.rtType : undefined,
      }));

    const legInfos: LegInfo[] = [];
    if (legInputs.length > 0) {
      for (const lg of legInputs) {
        let pid = '';
        let tid = '';
        if (useSupabase) {
          try {
            const scheduleRes = await fetch(`${supabaseUrl}/rest/v1/fastboat_schedules?select=${encodeURIComponent(scheduleSelect)}&id=eq.${encodeURIComponent(lg.scheduleId)}`, {
              headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
              cache: 'no-store',
            });
            if (scheduleRes.ok) {
              const scheduleData = await scheduleRes.json();
              const schedule = Array.isArray(scheduleData) && scheduleData.length > 0 ? scheduleData[0] : null;
              if (schedule) {
                pid = String(schedule.productId || schedule.product?.id || '');
                tid = String(schedule.product?.tenantId || '');
              }
            }
          } catch {}
        }
        if (!pid || !tid) {
          const fs = await prisma.fastboatSchedule.findUnique({
            where: { id: lg.scheduleId },
            include: { product: true },
          });
          if (!fs) {
            return NextResponse.json({ error: 'Schedule not found', detail: `Leg schedule not found: ${lg.scheduleId}` }, { status: 404 });
          }
          pid = String(fs.productId || fs.product?.id || '');
          tid = String(fs.product?.tenantId || '');
        }
        legInfos.push({
          scheduleId: lg.scheduleId,
          productId: pid,
          tenantId: tid,
          departureDate: lg.departureDate || departureDate || new Date().toISOString().slice(0, 10),
          priceIdr: Number.isFinite(lg.priceIdr || 0) && (lg.priceIdr || 0) > 0 ? (lg.priceIdr as number) : priceIdr,
          inventoryId: lg.inventoryId ?? null,
          notes: lg.notes,
          rtType: lg.rtType,
        });
      }
    } else {
      if (useSupabase) {
        try {
          const scheduleRes = await fetch(`${supabaseUrl}/rest/v1/fastboat_schedules?select=${encodeURIComponent(scheduleSelect)}&id=eq.${encodeURIComponent(scheduleId)}`, {
            headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
            cache: 'no-store',
          });
          if (scheduleRes.ok) {
            const scheduleData = await scheduleRes.json();
            const schedule = Array.isArray(scheduleData) && scheduleData.length > 0 ? scheduleData[0] : null;
            if (schedule) {
              productId = String(schedule.productId || schedule.product?.id || '');
              tenantId = String(schedule.product?.tenantId || '');
            }
          }
        } catch {}
      }
      if (!productId || !tenantId) {
        const fs = await prisma.fastboatSchedule.findUnique({
          where: { id: scheduleId },
          include: { product: true },
        });
        if (!fs) {
          return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }
        productId = String(fs.productId || fs.product?.id || '');
        tenantId = String(fs.product?.tenantId || '');
      }
    }

    let inventoryId: string | null = inventoryIdFromClient || null;

    const userEmail = String(contact?.email || '').trim().toLowerCase();
    const userFullName = String(contact?.fullName || '').trim();

    if (!ownerId) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    let customerId: string = ownerId;
    if (useSupabase) {
      const checkUserRes = await fetch(`${supabaseUrl}/rest/v1/users?select=id&id=eq.${encodeURIComponent(ownerId)}&limit=1`, {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: 'no-store',
      });
      let hasUserRecord = false;
      if (checkUserRes.ok) {
        const checkUserData = await checkUserRes.json();
        hasUserRecord = Array.isArray(checkUserData) && checkUserData.length > 0;
      }
      if (!hasUserRecord) {
        if (!ownerEmail) {
          return NextResponse.json({ error: 'User not found', detail: 'Please login with a registered account' }, { status: 400 });
        }
        const byEmailRes = await fetch(`${supabaseUrl}/rest/v1/users?select=id&email=eq.${encodeURIComponent(ownerEmail)}&limit=1`, {
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
          cache: 'no-store',
        });
        if (byEmailRes.ok) {
          const byEmailData = await byEmailRes.json();
          const foundByEmail = Array.isArray(byEmailData) && byEmailData.length > 0 ? String(byEmailData[0].id || '') : '';
          if (!foundByEmail) {
            return NextResponse.json({ error: 'User not found', detail: 'Please login with a registered account' }, { status: 400 });
          }
          customerId = foundByEmail;
        } else {
          const byEmail = await prisma.user.findFirst({ where: { email: ownerEmail } });
          if (!byEmail) {
            return NextResponse.json({ error: 'User not found', detail: 'Please login with a registered account' }, { status: 400 });
          }
          customerId = String(byEmail.id || '');
        }
      }
    } else {
      const u = await prisma.user.findFirst({ where: { id: ownerId } });
      if (!u) {
        if (!ownerEmail) {
          return NextResponse.json({ error: 'User not found', detail: 'Please login with a registered account' }, { status: 400 });
        }
        const byEmail = await prisma.user.findFirst({ where: { email: ownerEmail } });
        if (!byEmail) {
          return NextResponse.json({ error: 'User not found', detail: 'Please login with a registered account' }, { status: 400 });
        }
        customerId = String(byEmail.id || '');
      }
    }

    const bookingId = crypto.randomUUID();
    const bookingCode = `BKG-${Math.random().toString(36).slice(2,6).toUpperCase()}-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const unitPriceFor = (ageCat: any, basePrice: number) => {
      const ac = String(ageCat || '').toLowerCase();
      return (ac === 'child' || ac === 'infant') ? Math.round(basePrice * 0.75) : basePrice;
    };
    let itemsPayload: any[] = [];
    if (legInfos.length > 0) {
      for (const lg of legInfos) {
        for (const p of passengers) {
          const basePrice = Number(lg.priceIdr || 0);
          const price = unitPriceFor(p?.ageCategory, basePrice);
          const notesBase = typeof lg.notes === 'string' && lg.notes ? lg.notes : String(contact?.specialRequests || '');
          const metaNotes = (() => {
            try {
              const obj = notesBase ? JSON.parse(notesBase) : {};
              if (lg.rtType && !obj.rtType) obj.rtType = lg.rtType;
              return JSON.stringify(obj);
            } catch {
              return JSON.stringify({ rtType: lg.rtType || undefined, userNotes: notesBase || '' });
            }
          })();
          itemsPayload.push({
            id: crypto.randomUUID(),
            bookingId,
            productId: lg.productId,
            inventoryId: lg.inventoryId ?? inventoryId ?? null,
            unit_price: price,
            quantity: 1,
            item_date: lg.departureDate || nowIso,
            subtotal: price,
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
              notes: metaNotes,
            }),
          });
        }
      }
      // Set main tenantId/productId based on first leg for booking linkage
      tenantId = legInfos[0]?.tenantId || tenantId;
    } else {
      itemsPayload = passengers.map((p: any) => {
        const price = unitPriceFor(p?.ageCategory, priceIdr);
        return ({
          id: crypto.randomUUID(),
          bookingId,
          productId,
          inventoryId: inventoryId || null,
          unit_price: price,
          quantity: 1,
          item_date: departureDate || nowIso,
          subtotal: price,
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
        });
      });
    }
    const passengerTotal = itemsPayload.reduce((acc: number, it: any) => acc + Number(it.subtotal || 0), 0);
    const totalAmount = (Number.isFinite(totalAmountFromClient) && totalAmountFromClient > 0) ? totalAmountFromClient : (passengerTotal + portFee);

    const phoneInput = String(contact?.phone || '').trim();
    const ccInput = String(contact?.countryCode || '').trim();
    const phoneCombined = (() => {
      const ccRaw = ccInput.replace(/[^\d+]/g, '');
      const ccDigits = ccRaw.startsWith('+') ? ccRaw.slice(1).replace(/\D/g, '') : ccRaw.replace(/\D/g, '');
      const rawDigits = phoneInput.replace(/\D/g, '');
      let localDigits = rawDigits;
      if (ccDigits && localDigits.startsWith(ccDigits)) {
        localDigits = localDigits.slice(ccDigits.length);
      }
      localDigits = localDigits.replace(/^0+/, '');
      if (ccDigits) {
        return localDigits ? ('+' + ccDigits + localDigits) : '';
      }
      const keep = phoneInput.replace(/[^\d+]/g, '');
      if (keep.startsWith('+')) {
        const q = '+' + keep.replace(/^\+/, '').replace(/\D/g, '');
        return q;
      }
      return localDigits ? ('+62' + localDigits) : '';
    })();
    const notes = String(contact?.specialRequests || '');

    let booking: any = null;
    if (useSupabase) {
      try {
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
            currency,
            total_amount: totalAmount,
            status: 'PENDING',
            booking_date: (() => {
              if (legInfos.length > 0) {
                try {
                  const dates = legInfos.map((lg) => lg.departureDate).filter(Boolean);
                  const min = dates.sort()[0];
                  return min || nowIso;
                } catch { return nowIso; }
              }
              return departureDate || nowIso;
            })(),
            customer_name: userFullName,
            customer_email: userEmail,
            customer_phone: phoneCombined || null,
            customer_notes: notes || null,
            updatedAt: new Date().toISOString(),
          }),
        });
        if (createBookingRes.ok) {
          const createdBookings = await createBookingRes.json();
          booking = createdBookings?.[0];
        }
      } catch {}
      if (!booking) {
        booking = await prisma.booking.create({
          data: {
            id: bookingId,
            tenantId,
            customerId,
            bookingCode,
            currency,
            totalAmount: String(totalAmount),
            status: 'PENDING',
            bookingDate: (() => {
              if (legInfos.length > 0) {
                try {
                  const dates = legInfos.map((lg) => lg.departureDate).filter(Boolean);
                  const min = dates.sort()[0];
                  return new Date(min || nowIso);
                } catch { return new Date(nowIso); }
              }
              return departureDate ? new Date(departureDate) : new Date(nowIso);
            })(),
            customerName: userFullName,
            customerEmail: userEmail,
            customerPhone: phoneCombined || null,
            customerNotes: notes || null,
          },
        });
      }
    } else {
      booking = await prisma.booking.create({
        data: {
          id: bookingId,
          tenantId,
          customerId,
          bookingCode,
          currency,
          totalAmount: String(totalAmount),
          status: 'PENDING',
          bookingDate: (() => {
            if (legInfos.length > 0) {
              try {
                const dates = legInfos.map((lg) => lg.departureDate).filter(Boolean);
                const min = dates.sort()[0];
                return new Date(min || nowIso);
              } catch { return new Date(nowIso); }
            }
            return departureDate ? new Date(departureDate) : new Date(nowIso);
          })(),
          customerName: userFullName,
          customerEmail: userEmail,
          customerPhone: phoneCombined || null,
          customerNotes: notes || null,
        },
      });
    }

    let items: any[] = [];
    if (itemsPayload.length > 0) {
      if (useSupabase) {
        try {
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
          if (createItemsRes.ok) {
            items = await createItemsRes.json();
          }
        } catch {}
        if (!items.length) {
          for (const it of itemsPayload) {
            const created = await prisma.bookingItem.create({
              data: {
                id: it.id,
                bookingId: it.bookingId,
                productId: it.productId,
                inventoryId: it.inventoryId || null,
                unitPrice: String(it.unit_price || 0),
                quantity: Number(it.quantity || 0),
                itemDate: it.item_date ? new Date(it.item_date) : new Date(nowIso),
                subtotal: String(it.subtotal || 0),
                participantName: it.participant_name || null,
                participantEmail: it.participant_email || null,
                participantPhone: it.participant_phone || null,
                specialRequirements: it.special_requirements || null,
              },
            });
            items.push(created);
          }
        }
      } else {
        for (const it of itemsPayload) {
          const created = await prisma.bookingItem.create({
            data: {
              id: it.id,
              bookingId: it.bookingId,
              productId: it.productId,
              inventoryId: it.inventoryId || null,
              unitPrice: String(it.unit_price || 0),
              quantity: Number(it.quantity || 0),
              itemDate: it.item_date ? new Date(it.item_date) : new Date(nowIso),
              subtotal: String(it.subtotal || 0),
              participantName: it.participant_name || null,
              participantEmail: it.participant_email || null,
              participantPhone: it.participant_phone || null,
              specialRequirements: it.special_requirements || null,
            },
          });
          items.push(created);
        }
      }
    }

    if (!inventoryId && productId && departureDate) {
      if (useSupabase) {
        try {
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
        } catch {}
      } else {
        const inv = await prisma.inventory.findFirst({ where: { productId, inventoryDate: new Date(`${departureDate}T00:00:00.000Z`), isAvailable: true } });
        if (inv) inventoryId = String(inv.id || '');
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
    const simulateFlag = String(body?.simulate || '').toLowerCase();
    const isSimulate = simulateFlag === 'true';
    const isDev = (process.env.NODE_ENV || '').toLowerCase() !== 'production';
    const simulateEnabled = isDev || String(process.env.SIMULATE_PUBLIC_PAY || '').toLowerCase() === 'true';
    const paymentMethod = body?.paymentMethod as string | undefined;
    const paidAmount = body?.paidAmount as number | string | undefined;
    const xenditInvoiceId = body?.xenditInvoiceId as string | undefined;
    const xenditPaymentChannel = body?.xenditPaymentChannel as string | undefined;
    const invoiceExpiryDate = body?.invoiceExpiryDate ? new Date(String(body.invoiceExpiryDate)) : undefined;

    const prisma = db;

    const where: any = id ? { id } : code ? { bookingCode: code } : null;
    if (!where) {
      return NextResponse.json({ error: 'Missing booking identifier' }, { status: 400 });
    }

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
    }
    if (!user && !(isSimulate && simulateEnabled && action === 'pay')) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    if (action === 'pay') {
      const existing = await prisma.booking.findUnique({ where });
      if (!existing) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      const userEmail = String(user?.email || '').trim().toLowerCase();
      let publicUserId: string | null = null;
      if (userEmail) {
        try {
          const u = await prisma.user.findFirst({ where: { email: userEmail }, select: { id: true } });
          publicUserId = u?.id || null;
        } catch {}
      }
      const isOwner = (
        (!!user && existing.customerId === user.id) ||
        (publicUserId && existing.customerId === publicUserId) ||
        (userEmail && ((existing as any)?.customerEmail || '').trim().toLowerCase() === userEmail)
      );
      const simulateAllowed = isSimulate && simulateEnabled;
      if (!isOwner && !simulateAllowed) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (simulateAllowed) {
        if (existing.status !== 'PENDING') {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        const expected = Number((existing as any)?.totalAmount ?? (existing as any)?.total_amount ?? 0);
        const amt = Number(paidAmount ?? 0);
        if (!Number.isFinite(expected) || !Number.isFinite(amt) || amt !== expected) {
          return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }
      }
      if (existing.status === 'PAID' || existing.status === 'COMPLETED') {
        const updated = await prisma.booking.update({
          where,
          data: {
            paymentMethod: paymentMethod || existing.paymentMethod || 'unknown',
            paidAmount: paidAmount !== undefined ? (typeof paidAmount === 'string' ? paidAmount : String(paidAmount)) : existing.paidAmount,
            xenditInvoiceId: xenditInvoiceId || existing.xenditInvoiceId || undefined,
            xenditPaymentChannel: xenditPaymentChannel || existing.xenditPaymentChannel || undefined,
            invoiceExpiryDate: invoiceExpiryDate || existing.invoiceExpiryDate || undefined,
            updatedAt: new Date(),
          },
        });
        return NextResponse.json({ booking: updated });
      }
      if (existing.status !== 'PENDING') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
          where,
          data: {
            status: 'PAID',
            paymentMethod: paymentMethod || 'unknown',
            paidAmount: paidAmount !== undefined ? (typeof paidAmount === 'string' ? paidAmount : String(paidAmount)) : undefined,
            paidAt: new Date(),
            xenditInvoiceId: xenditInvoiceId || undefined,
            xenditPaymentChannel: xenditPaymentChannel || undefined,
            invoiceExpiryDate: invoiceExpiryDate || undefined,
          },
        });

        const b = await tx.booking.findUnique({
          where: { id: updated.id },
          include: {
            items: {
              include: {
                product: { include: { fastboatSchedule: true } },
              },
            },
          },
        });
        if (!b) return { booking: updated };

        const groupMap = new Map<string, { productId: string; tenantId: string; qty: number; capacity: number; dateStr: string }>();
        for (const it of b.items) {
          const productId = String(it.productId || '');
          if (!productId) continue;
          const d = it.itemDate ? new Date(it.itemDate as any) : null;
          const dateStr = d ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
          const tenantId = (it.product as any)?.tenantId || b.tenantId;
          const capacity = Number((it.product as any)?.fastboatSchedule?.capacity ?? 0);
          const key = `${productId}:${dateStr}`;
          const prev = groupMap.get(key);
          const qty = Number(it.quantity || 0) || 0;
          if (prev) {
            prev.qty += qty;
          } else {
            groupMap.set(key, { productId, tenantId, qty, capacity, dateStr });
          }
        }

        for (const [, g] of groupMap) {
          const ledgerDate = new Date(`${g.dateStr}T00:00:00.000Z`);
          let inv = await tx.inventory.findFirst({ where: { productId: g.productId, inventoryDate: ledgerDate } });
          if (inv) {
            const newAvail = Math.max(0, (inv.availableUnits || 0) - g.qty);
            const newBooked = (inv.bookedUnits || 0) + g.qty;
            inv = await tx.inventory.update({ where: { id: inv.id }, data: { availableUnits: newAvail, bookedUnits: newBooked, updatedAt: new Date() } });
          } else {
            const cap = Number(g.capacity || 0);
            const totalCap = cap > 0 ? cap : g.qty;
            const availableUnits = Math.max(0, totalCap - g.qty);
            inv = await tx.inventory.create({
              data: {
                tenantId: g.tenantId,
                productId: g.productId,
                inventoryDate: ledgerDate,
                totalCapacity: totalCap,
                bookedUnits: g.qty,
                availableUnits,
                isAvailable: true,
              },
            });
          }
          await tx.bookingItem.updateMany({
            where: {
              bookingId: b.id,
              productId: g.productId,
              itemDate: {
                gte: new Date(`${g.dateStr}T00:00:00.000Z`),
                lt: new Date(`${g.dateStr}T23:59:59.999Z`),
              },
            },
            data: { inventoryId: inv.id },
          });
          await tx.product.update({ where: { id: g.productId }, data: { totalBookings: inv.bookedUnits } });
        }

        return { booking: updated };
      });
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceKey) {
          const b = await prisma.booking.findUnique({
            where,
            include: {
              items: {
                include: { product: { include: { fastboatSchedule: true } } },
              },
            },
          });
          if (b) {
            const groupMap = new Map<string, { productId: string; tenantId: string; qty: number; capacity: number; dateStr: string }>();
            for (const it of b.items) {
              const pid = String(it.productId || '');
              if (!pid) continue;
              const d = it.itemDate ? new Date(it.itemDate as any) : null;
              const dateStr = d ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
              const tenantId = (it.product as any)?.tenantId || b.tenantId;
              const capacity = Number((it.product as any)?.fastboatSchedule?.capacity ?? 0);
              const key = `${pid}:${dateStr}`;
              const qty = Number(it.quantity || 0) || 0;
              const prev = groupMap.get(key);
              if (prev) prev.qty += qty; else groupMap.set(key, { productId: pid, tenantId, qty, capacity, dateStr });
            }
            for (const [, g] of groupMap) {
              const invSel = ['id','productId','inventoryDate','totalCapacity','bookedUnits','availableUnits'].join(',');
              const getUrl = `${supabaseUrl}/rest/v1/inventory?select=${encodeURIComponent(invSel)}&productId=eq.${encodeURIComponent(g.productId)}&inventoryDate=eq.${encodeURIComponent(g.dateStr)}&limit=1`;
              const getRes = await fetch(getUrl, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' });
              let invId: string | null = null;
              let bookedUnits = 0;
              if (getRes.ok) {
                const arr = await getRes.json();
                const row = Array.isArray(arr) && arr.length ? arr[0] : null;
                if (row) {
                  invId = String(row.id || '');
                  bookedUnits = Number(row.bookedUnits || 0);
                }
              }
              if (invId) {
                const patchItemsUrl = `${supabaseUrl}/rest/v1/booking_items?bookingId=eq.${encodeURIComponent(b.id)}&productId=eq.${encodeURIComponent(g.productId)}&item_date=gte.${encodeURIComponent(`${g.dateStr}T00:00:00.000Z`)}&item_date=lt.${encodeURIComponent(`${g.dateStr}T23:59:59.999Z`)}`;
                await fetch(patchItemsUrl, { method: 'PATCH', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ inventoryId: invId }) });
                const patchProdUrl = `${supabaseUrl}/rest/v1/products?id=eq.${encodeURIComponent(g.productId)}`;
                await fetch(patchProdUrl, { method: 'PATCH', headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ total_bookings: bookedUnits }) });
              }
            }
          }
        }
      } catch {}
      return NextResponse.json(result);
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

    if (action === 'refund-item') {
      const itemId = String(body?.itemId || '');
      const reason = String(body?.reason || '').trim();
      if (!itemId) {
        return NextResponse.json({ error: 'Missing itemId' }, { status: 400 });
      }
      const booking = await prisma.booking.findUnique({ where, include: { items: true } });
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      const targetItem = booking.items.find((it) => String(it.id) === itemId);
      if (!targetItem) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 });
      }
      if (targetItem.isCancelled) {
        return NextResponse.json({ booking });
      }
      const updatedItem = await prisma.bookingItem.update({
        where: { id: targetItem.id },
        data: { isCancelled: true, cancelledAt: new Date() },
      });
      if (updatedItem.inventoryId) {
        const inv = await prisma.inventory.findUnique({ where: { id: String(updatedItem.inventoryId) } });
        if (inv) {
          const qty = Number(updatedItem.quantity || 0);
          const newAvail = Math.min(inv.totalCapacity || 0, (inv.availableUnits || 0) + qty);
          const newBooked = Math.max(0, (inv.bookedUnits || 0) - qty);
          await prisma.inventory.update({ where: { id: inv.id }, data: { availableUnits: newAvail, bookedUnits: newBooked, updatedAt: new Date() } });
        }
      }
      const updatedBooking = await prisma.booking.update({
        where,
        data: {
          status: 'PENDING',
          cancellationReason: reason ? `Partial refund: ${reason}` : 'Partial refund requested',
          updatedAt: new Date(),
        },
        include: {
          items: {
            include: {
              product: { include: { fastboatSchedule: true } },
              inventory: true,
            },
          },
          tenant: true,
        },
      });
      return NextResponse.json({ booking: updatedBooking });
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
  const simulateQ = (urlObj.searchParams.get('simulate') || '').toLowerCase();
  const isSimulate = simulateQ === 'true';
  const isDev = (process.env.NODE_ENV || '').toLowerCase() !== 'production';
  const simulateEnabled = isDev || String(process.env.SIMULATE_PUBLIC_PAY || '').toLowerCase() === 'true';
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
    let b = await prisma.booking.findUnique({
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
        review: true,
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
    if (!allowed && !(isSimulate && simulateEnabled)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    try {
      if (b.status === 'PAID') {
        const firstItem = b.items[0];
        const invDate = firstItem?.inventory?.inventoryDate as any;
        const arrivalTime = (firstItem?.product as any)?.fastboatSchedule?.arrivalTime ?? null;
        if (invDate && arrivalTime) {
          const parts = String(arrivalTime).split(':');
          const hh = Number(parts[0] || 0);
          const mm = Number(parts[1] || 0);
          const d = new Date(invDate as any);
          d.setHours(hh, mm, 0, 0);
          if (d.getTime() <= Date.now()) {
            await prisma.booking.update({ where: { id: b.id }, data: { status: 'COMPLETED', updatedAt: new Date() } });
            b = { ...b, status: 'COMPLETED' } as any;
          }
        }
      }
    } catch {}
    return NextResponse.json({ booking: b });
  }

  if (code) {
    const prisma = db;
  let b = await prisma.booking.findFirst({
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
        review: true,
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
    if (!allowed && !(isSimulate && simulateEnabled)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    try {
      if (b.status === 'PAID') {
        const firstItem = b.items[0];
        const invDate = firstItem?.inventory?.inventoryDate as any;
        const arrivalTime = (firstItem?.product as any)?.fastboatSchedule?.arrivalTime ?? null;
        if (invDate && arrivalTime) {
          const parts = String(arrivalTime).split(':');
          const hh = Number(parts[0] || 0);
          const mm = Number(parts[1] || 0);
          const d = new Date(invDate as any);
          d.setHours(hh, mm, 0, 0);
          if (d.getTime() <= Date.now()) {
            await prisma.booking.update({ where: { id: b.id }, data: { status: 'COMPLETED', updatedAt: new Date() } });
            b = { ...b, status: 'COMPLETED' } as any;
          }
        }
      }
    } catch {}
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

  let bookings = await prisma.booking.findMany({
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
      review: true,
    },
  });
  try {
    const idsToComplete: string[] = [];
    const now = Date.now();
    for (const b of bookings) {
      if (b.status !== 'PAID') continue;
      const firstItem = b.items[0];
      const invDate = firstItem?.inventory?.inventoryDate as any;
      const arrivalTime = (firstItem?.product as any)?.fastboatSchedule?.arrivalTime ?? null;
      if (!invDate || !arrivalTime) continue;
      const parts = String(arrivalTime).split(':');
      const hh = Number(parts[0] || 0);
      const mm = Number(parts[1] || 0);
      const d = new Date(invDate as any);
      d.setHours(hh, mm, 0, 0);
      if (d.getTime() <= now) idsToComplete.push(b.id);
    }
    for (const id of idsToComplete) {
      await prisma.booking.update({ where: { id }, data: { status: 'COMPLETED', updatedAt: new Date() } });
    }
    if (idsToComplete.length > 0) {
      bookings = await prisma.booking.findMany({
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
          review: true,
        },
      });
    }
  } catch {}

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
      // Do not append trip direction suffix to title anymore
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
    const createdRaw = (b as any)?.createdAt ?? (b as any)?.created_at ?? (b as any)?.createdDate ?? (b as any)?.createdate ?? null;
    const createdDate = createdRaw ? new Date(createdRaw) : null;
    const isPendingPayment = b.status === 'PENDING' && (b.paidAmount == null);
    const pendingType = b.status === 'PENDING' ? (isPendingPayment ? 'payment' : 'refund') : undefined;
    const deadlineAt = isPendingPayment && createdDate ? new Date(createdDate.getTime() + 15 * 60 * 1000) : null;
    const paymentDeadline = deadlineAt ? deadlineAt.toLocaleString('id-ID', { hour12: false }) : null;
    const dateStr = dateObj ? new Date(dateObj).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
    const invDate = firstItem?.inventory?.inventoryDate ? new Date(firstItem.inventory.inventoryDate as any) : null;
    const depDateRaw = b.bookingDate ?? null;
    const departureDate = depDateRaw ? new Date(depDateRaw).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    const departureTime = (sched as any)?.departureTime ?? null;
    const arrivalTime = (sched as any)?.arrivalTime ?? null;
    let arrivalAt: string | null = null;
    let returnLocation: string | null = null;
    let returnDate: string | null = null;
    let returnDepartureTime: string | null = null;
    let returnArrivalTime: string | null = null;
    let returnBoatName: string | null = null;
    let returnVendorName: string | null = null;
    let departurePassengers: number | null = null;
    let returnPassengers: number | null = null;
    let isDoubleTrip: boolean = false;
    try {
      if (invDate && arrivalTime) {
        const parts = String(arrivalTime).split(':');
        const hh = Number(parts[0] || 0);
        const mm = Number(parts[1] || 0);
        const d = new Date(invDate);
        d.setHours(hh, mm, 0, 0);
        arrivalAt = d.toISOString();
      }
      try {
        const arrItems = Array.isArray(b?.items) ? b.items : [];
        let outQty = 0;
        let inQty = 0;
        let hasOut = false;
        let hasIn = false;
        for (const it of arrItems) {
          try {
            const sr = (it as any)?.specialRequirements || '';
            const obj = sr ? JSON.parse(String(sr)) : {};
            const notesField = obj?.notes || '';
            if (typeof notesField === 'string' && notesField) {
              try {
                const inner = JSON.parse(String(notesField));
                const t = String(inner?.rtType || '').toUpperCase();
                if (t === 'INBOUND') {
                  const rs = (it as any)?.product?.fastboatSchedule || null;
                  const depRoute = (rs as any)?.departureRoute?.name || '';
                  const arrRoute = (rs as any)?.arrivalRoute?.name || '';
                  if (!returnLocation) {
                    returnLocation = depRoute && arrRoute ? `${depRoute} → ${arrRoute}` : null;
                  }
                  const itDate = (it as any)?.itemDate || ((it as any)?.inventory?.inventoryDate ?? null);
                  if (!returnDate) {
                    returnDate = itDate ? new Date(itDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
                  }
                  if (!returnDepartureTime) {
                    returnDepartureTime = (rs as any)?.departureTime ?? null;
                  }
                  if (!returnArrivalTime) {
                    returnArrivalTime = (rs as any)?.arrivalTime ?? null;
                  }
                  if (!returnBoatName) {
                    const bn = (rs as any)?.boat?.name || '';
                    returnBoatName = bn || null;
                  }
                  if (!returnVendorName) {
                    const vn = (b as any)?.tenant?.vendorName || null;
                    returnVendorName = vn;
                  }
                  inQty += Number((it as any)?.quantity || 0);
                  hasIn = true;
                } else if (t === 'OUTBOUND') {
                  outQty += Number((it as any)?.quantity || 0);
                  hasOut = true;
                }
              } catch {}
            }
          } catch {}
        }
        if (outQty === 0 && inQty === 0) {
          outQty = qty;
          inQty = 0;
        }
        departurePassengers = outQty || null;
        returnPassengers = inQty || null;
        isDoubleTrip = hasOut && hasIn;
      } catch {}
    } catch {}
    return {
      id: b.id,
      initials,
      title,
      location,
      date: dateStr,
      bookingDate: createdDate ? createdDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
      departureDate,
      departureTime,
      arrivalTime,
      returnLocation,
      returnDate,
      returnDepartureTime,
      returnArrivalTime,
      returnBoatName,
      returnVendorName,
      arrivalAt,
      passengers: qty,
      departurePassengers,
      returnPassengers,
      isDoubleTrip,
      bookingCode: b.bookingCode,
      status,
      image: featured,
      paymentDeadline,
      deadlineAt: deadlineAt ? deadlineAt.toISOString() : null,
      pendingType,
      cancellationReason: (b as any)?.cancellationReason ?? (b as any)?.cancellation_reason ?? null,
      hasReview: !!(b as any)?.review,
    };
  });

  return NextResponse.json({ bookings: cards });
}
