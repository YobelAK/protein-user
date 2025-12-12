import React, { Suspense } from 'react';
import { headers } from 'next/headers';
import SpeedboatPageContent from '@/components/speedboat/page-content';

export default async function SpeedboatPage({ searchParams }: { searchParams?: { [key: string]: string | undefined } }) {
  const initialFrom = searchParams?.from || '';
  const initialTo = searchParams?.to || '';
  const today = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  })();
  const initialDeparture = searchParams?.departure || today;
  let initialProviders: string[] = [];
  let initialResults: Array<{
    id?: string | number;
    provider: string;
    vendorName?: string;
    logo: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    origin: string;
    destination: string;
    prices: {
      indonesian: { adult: number; child: number };
      foreigner: { adult: number; child: number };
    };
    capacity?: number;
    available?: number;
  }> = [];
  let initialOriginOptions: Array<{ value: string; label: string }> = [];
  let initialDestinationOptions: Array<{ value: string; label: string }> = [];

  function toMinutes(t: string | null | undefined) {
    if (!t) return null;
    const parts = t.split(':');
    if (parts.length < 2) return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }

  const params = new URLSearchParams();
  if (initialFrom) params.set('from', initialFrom);
  if (initialTo) params.set('to', initialTo);
  if (initialDeparture) params.set('date', initialDeparture);
  const hdrs = await headers();
  const host = hdrs.get('host') || `localhost:${process.env.PORT || 3000}`;
  const proto = hdrs.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;
  const apiRes = await fetch(`${origin}/api/speedboat/schedules?${params.toString()}`, { cache: 'no-store' });
  if (apiRes.ok) {
    const json = await apiRes.json();
    const items: any[] = Array.isArray(json.schedules) ? json.schedules : [];
    const useData = items;
    const set = new Set<string>();
    initialResults = useData.map((s: any) => {
      const depMin = toMinutes(s?.departure_time ?? null);
      const arrMin = toMinutes(s?.arrival_time ?? null);
      const duration = depMin != null && arrMin != null && arrMin >= depMin ? `${arrMin - depMin} min` : '';
      const baseIdr = Number(s?.product?.price_idr ?? 0);
      const providerName = s?.boat?.name ?? s?.product?.name ?? 'Unknown';
      if (providerName) set.add(providerName);
      const inv = s?.inventory;
      const capacity = Number(inv?.totalCapacity ?? s?.capacity ?? s?.boat?.capacity ?? 0);
      const available = Number(inv?.availableUnits ?? Math.max(0, (inv?.totalCapacity ?? s?.capacity ?? s?.boat?.capacity ?? 0) - (inv?.bookedUnits ?? 0)));
      return {
        id: s?.id,
        provider: providerName,
        vendorName: s?.product?.tenant?.vendor_name ?? undefined,
        logo: (
          (s?.product?.featured_image ? String(s.product.featured_image) : undefined)
          ?? (Array.isArray(s?.boat?.image_urls) && s.boat.image_urls.length > 0 ? String(s.boat.image_urls[0]) : undefined)
          ?? 'https://via.placeholder.com/60'
        ),
        departureTime: s?.departure_time ?? '',
        arrivalTime: s?.arrival_time ?? '',
        duration,
        origin: s?.departureRoute?.name ?? '',
        destination: s?.arrivalRoute?.name ?? '',
        prices: {
          indonesian: { adult: baseIdr, child: Math.round(baseIdr * 0.75) },
          foreigner: { adult: baseIdr, child: Math.round(baseIdr * 0.75) },
        },
        capacity,
        available,
      };
    });
    initialProviders = Array.from(set).sort();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey) {
    const select = [
      'departureRoute:routes!fastboat_schedules_departureRouteId_fkey(id,name)',
      'arrivalRoute:routes!fastboat_schedules_arrivalRouteId_fkey(id,name)'
    ].join(',');
    const url = `${supabaseUrl}/rest/v1/fastboat_schedules?select=${encodeURIComponent(select)}&isActive=eq.true`;
    const res = await fetch(url, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store',
    });
    if (res.ok) {
      const items: any[] = await res.json();
      const fromMap = new Map<string, string>();
      const toMap = new Map<string, string>();
      for (const it of Array.isArray(items) ? items : []) {
        const dr = it?.departureRoute;
        const ar = it?.arrivalRoute;
        if (dr?.id && dr?.name) fromMap.set(dr.id, dr.name);
        if (ar?.id && ar?.name) toMap.set(ar.id, ar.name);
      }
      initialOriginOptions = Array.from(fromMap.entries()).map(([value, label]) => ({ value, label }));
      initialDestinationOptions = Array.from(toMap.entries()).map(([value, label]) => ({ value, label }));
    }
  }

  return (
    <Suspense fallback={null}>
      <SpeedboatPageContent
        initialFrom={initialFrom}
        initialTo={initialTo}
        initialDeparture={initialDeparture}
        initialProviders={initialProviders}
        initialResults={initialResults}
        initialOriginOptions={initialOriginOptions}
        initialDestinationOptions={initialDestinationOptions}
      />
    </Suspense>
  );
}
