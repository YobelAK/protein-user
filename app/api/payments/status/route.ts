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
