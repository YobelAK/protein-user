import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
  }

  const select = [
    'id',
    'departure_time',
    'arrival_time',
    'capacity',
    'isActive',
    'product:products!fastboat_schedules_productId_fkey(id,name,price_idr,price_usd)',
    'departureRoute:routes!fastboat_schedules_departureRouteId_fkey(id,name)',
    'arrivalRoute:routes!fastboat_schedules_arrivalRouteId_fkey(id,name)',
    'boat:boats!fastboat_schedules_boatId_fkey(id,name,capacity)'
  ].join(',');

  const url = `${supabaseUrl}/rest/v1/fastboat_schedules?select=${encodeURIComponent(select)}&isActive=eq.true`;

  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: 'Failed to fetch schedules', detail: text }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json({ schedules: data });
}
