import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const prisma = db;

export async function GET(request: Request) {
  try {
    const urlObj = new URL(request.url);
    const bookingId = urlObj.searchParams.get('bookingId') || '';
    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }
    const prisma = db;
    const b = await prisma.booking.findUnique({ where: { id: bookingId }, select: { status: true, paidAmount: true, paidAt: true } });
    if (!b) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ status: b.status, paidAmount: b.paidAmount ?? null, paidAt: b.paidAt ? new Date(b.paidAt).toISOString() : null });
  } catch (e: any) {
    return NextResponse.json({ error: 'Unexpected error', detail: e?.message || String(e) }, { status: 500 });
  }
}
