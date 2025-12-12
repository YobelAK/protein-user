import { NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const globalAny = globalThis as any;
const pgPool = globalAny.__btg_pgPool ?? new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
const pgAdapter = globalAny.__btg_pgAdapter ?? new PrismaPg(pgPool);
const db: PrismaClient = globalAny.__btg_prisma ?? new PrismaClient({ adapter: pgAdapter });
globalAny.__btg_pgPool = pgPool;
globalAny.__btg_pgAdapter = pgAdapter;
globalAny.__btg_prisma = db;

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
