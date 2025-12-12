import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function parseHHMM(dateStr: string, hhmm: string | null | undefined): Date | null {
  if (!hhmm) return null;
  try {
    const [h, m] = String(hhmm).split(':').map((x) => Number(x));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const d = new Date(dateStr);
    d.setHours(h, m, 0, 0);
    return d;
  } catch {
    return null;
  }
}

async function deactivateSchedulesSupabase(now: Date) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return { changedCount: 0, changedIds: [], error: 'Missing Supabase configuration' };
  }
  const dateStr = todayString();

  const schedRes = await fetch(`${supabaseUrl}/rest/v1/fastboat_schedules?select=${encodeURIComponent('id,productId,departure_time,isActive')}&isActive=eq.true`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: 'no-store',
  });
  if (!schedRes.ok) {
    const text = await schedRes.text();
    return { changedCount: 0, changedIds: [], error: `Failed to fetch schedules: ${text}` };
  }
  const schedules: Array<{ id: string; productId: string; departure_time: string; isActive: boolean }> = await schedRes.json();

  const productIds = Array.from(new Set(schedules.map((s) => s.productId).filter(Boolean)));
  const invUrl = `${supabaseUrl}/rest/v1/inventory?select=${encodeURIComponent('productId,inventoryDate')}&inventoryDate=eq.${encodeURIComponent(dateStr)}&productId=in.(${productIds.join(',')})`;
  const invRes = await fetch(invUrl, { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: 'no-store' });
  if (!invRes.ok) {
    const text = await invRes.text();
    return { changedCount: 0, changedIds: [], error: `Failed to fetch inventory: ${text}` };
  }
  const invRows: Array<{ productId: string; inventoryDate: string }> = await invRes.json();
  const invSet = new Set(invRows.map((r) => r.productId).filter(Boolean));

  const toDeactivate = schedules.filter((s) => {
    if (!invSet.has(s.productId)) return false;
    const departAt = parseHHMM(dateStr, s.departure_time);
    if (!departAt) return false;
    const diffMs = departAt.getTime() - now.getTime();
    return diffMs <= 20 * 60 * 1000;
  });

  const changedIds: string[] = [];
  for (const s of toDeactivate) {
    const patchUrl = `${supabaseUrl}/rest/v1/fastboat_schedules?id=eq.${encodeURIComponent(s.id)}`;
    const patchRes = await fetch(patchUrl, {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ isActive: false }),
    });
    if (patchRes.ok) {
      changedIds.push(s.id);
    }
  }

  return { changedCount: changedIds.length, changedIds };
}

export async function POST() {
  const now = new Date();
  const result = await deactivateSchedulesSupabase(now);

  const prisma = db;

  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'PAID',
      items: { some: { inventory: { inventoryDate: { gte: start, lt: end } } } },
    },
    include: {
      items: { include: { inventory: true, product: { include: { fastboatSchedule: true } } } },
    },
  });

  const updatedIds: string[] = [];
  for (const b of bookings) {
    let shouldComplete = false;
    for (const it of b.items) {
      const invDate = it.inventory?.inventoryDate || null;
      const arrTime = it.product?.fastboatSchedule?.arrivalTime || null;
      if (!invDate || !arrTime) continue;
      const [hh, mm] = String(arrTime).split(':').map((x) => Number(x));
      const when = new Date(invDate);
      when.setHours(hh || 0, mm || 0, 0, 0);
      if (when.getTime() <= now.getTime()) { shouldComplete = true; break; }
    }
    if (shouldComplete) {
      const u = await prisma.booking.update({ where: { id: b.id }, data: { status: 'COMPLETED', updatedAt: new Date() } });
      updatedIds.push(u.id);
    }
  }

  return NextResponse.json({ ok: true, now: now.toISOString(), deactivatedSchedules: result, completedBookings: { updatedCount: updatedIds.length, updatedIds } });
}

export async function GET() {
  return POST();
}
