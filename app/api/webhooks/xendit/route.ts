import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const prisma = db;

export async function POST(request: Request) {
  try {
    const token = request.headers.get('X-CALLBACK-TOKEN') || request.headers.get('x-callback-token') || '';
    const expected = process.env.XENDIT_WEBHOOK_TOKEN || '';
    if (!expected || token !== expected) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  const payload = await request.json();
  const data = payload?.data || payload;
  const statusRaw = String(data?.status || '').toUpperCase();
  const qrCode = (data?.qr_code || data?.qrCode || null) as any;
  const qrId = qrCode ? String(qrCode?.id || '') : String(data?.qr_code_id || '');
  const vaObj = (data?.virtual_account || data?.virtualAccount || null) as any;
  const vaId = vaObj ? String(vaObj?.id || '') : String(data?.virtual_account_id || '');
  const externalIdRaw = qrCode ? String(qrCode?.external_id || '') : (vaObj ? String(vaObj?.external_id || '') : String(data?.external_id || ''));
  const xidPayment = String(data?.id || '');
  const amount = Number(data?.amount || data?.transaction_amount || data?.payment_amount || 0);
    const prisma = db;
    let booking: any = null;
  if (qrId) {
    try { booking = await prisma.booking.findFirst({ where: { xenditInvoiceId: qrId } }); } catch {}
  }
  if (!booking && vaId) {
    try { booking = await prisma.booking.findFirst({ where: { xenditInvoiceId: vaId } }); } catch {}
  }
    // Fallback: external_id may be booking.id with suffix; normalize first 5 UUID parts
    if (!booking && externalIdRaw) {
      const parts = externalIdRaw.split('-');
      if (parts.length >= 5) {
        const maybeId = [parts[0], parts[1], parts[2], parts[3], parts[4]].join('-');
        try { booking = await prisma.booking.findUnique({ where: { id: maybeId } }); } catch {}
      }
      if (!booking) {
        try { booking = await prisma.booking.findUnique({ where: { id: externalIdRaw } }); } catch {}
      }
    }
  if (!booking && xidPayment) {
    try { booking = await prisma.booking.findFirst({ where: { xenditInvoiceId: xidPayment } }); } catch {}
  }
    if (!booking) {
      return NextResponse.json({ ok: true });
    }
    let newStatus = booking.status;
    if (statusRaw === 'SUCCEEDED' || statusRaw === 'COMPLETED' || statusRaw === 'PAID') {
      newStatus = 'PAID';
    } else if (statusRaw === 'EXPIRED') {
      newStatus = 'EXPIRED';
    }
    if (newStatus === 'PAID' && String(booking.status || '') !== 'PAID') {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'PAID',
            paidAmount: amount ? String(amount) : booking.paidAmount,
            paidAt: new Date(),
            xenditCallbackData: payload,
            updatedAt: new Date(),
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
        if (b) {
          const map = new Map<string, { productId: string; tenantId: string; qty: number; capacity: number; dateStr: string }>();
          for (const it of b.items) {
            const productId = String(it.productId || '');
            if (!productId) continue;
            const d = it.itemDate ? new Date(it.itemDate as any) : null;
            const dateStr = d ? d.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
            const tenantId = (it.product as any)?.tenantId || b.tenantId;
            const capacity = Number((it.product as any)?.fastboatSchedule?.capacity ?? 0);
            const key = `${productId}:${dateStr}`;
            const prev = map.get(key);
            const qty = Number(it.quantity || 0) || 0;
            if (prev) prev.qty += qty; else map.set(key, { productId, tenantId, qty, capacity, dateStr });
          }
          for (const [, g] of map) {
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
                itemDate: { gte: new Date(`${g.dateStr}T00:00:00.000Z`), lt: new Date(`${g.dateStr}T23:59:59.999Z`) },
              },
              data: { inventoryId: inv.id },
            });
            await tx.product.update({ where: { id: g.productId }, data: { totalBookings: inv.bookedUnits } });
          }
        }
        return { booking: updated };
      });
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceKey) {
          const b = await prisma.booking.findUnique({
            where: { id: booking.id },
            include: { items: { include: { product: { include: { fastboatSchedule: true } } } } },
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
      return NextResponse.json({ ok: true, bookingId: booking.id, status: 'PAID' });
    }
    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: newStatus,
        paidAmount: amount ? String(amount) : booking.paidAmount,
        paidAt: newStatus === 'PAID' ? new Date() : booking.paidAt,
        xenditCallbackData: payload,
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true, bookingId: updated.id, status: updated.status });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 });
  }
}
