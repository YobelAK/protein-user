import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const urlObj = new URL(request.url);
  const onlyProviders = urlObj.searchParams.get('onlyProviders') === 'true';
  const from = urlObj.searchParams.get('from') || '';
  const to = urlObj.searchParams.get('to') || '';
  const windowParam = urlObj.searchParams.get('window') || '';
  const windows = windowParam ? windowParam.split(',').map((v) => v.trim().toLowerCase()).filter(Boolean) : [];
  const dateParam = urlObj.searchParams.get('date') || '';

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
    'product:products!fastboat_schedules_productId_fkey(id,name,price_idr,price_usd,featured_image,category:categories!products_categoryId_fkey(id,name),tenant:tenants!products_tenantId_fkey(vendor_name))',
    'departureRoute:routes!fastboat_schedules_departureRouteId_fkey(id,name)',
    'arrivalRoute:routes!fastboat_schedules_arrivalRouteId_fkey(id,name)',
    'boat:boats!fastboat_schedules_boatId_fkey(id,name,capacity,image_urls)'
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

  const toMinutes = (t: string | null) => {
    if (!t) return null;
    const [h, m] = String(t).split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  };
  const inWindow = (depMin: number | null) => {
    if (!depMin || windows.length === 0) return true;
    const ranges: any = {
      morning: [0, 12 * 60],
      afternoon: [12 * 60, 18 * 60],
      evening: [18 * 60, 24 * 60],
    };
    return windows.some((w) => {
      const r = ranges[w];
      return Array.isArray(r) && depMin >= r[0] && depMin < r[1];
    });
  };

  const filtered = data.filter((s: any) => {
    const depOk = from ? (s?.departureRoute?.id === from) : true;
    const arrOk = to ? (s?.arrivalRoute?.id === to) : true;
    const winOk = inWindow(toMinutes(s?.departure_time ?? null));
    return depOk && arrOk && winOk;
  });

  const today = (() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  })();
  const invDate = dateParam || today;
  const productIds = Array.from(new Set(filtered.map((s: any) => s?.product?.id).filter(Boolean)));
  let invMap: Record<string, any> = {};
  if (productIds.length) {
    const ids = productIds.join(',');
    const invSelect = ['id', 'productId', 'inventoryDate', 'totalCapacity', 'bookedUnits', 'availableUnits', 'is_available'].join(',');
    const invUrl = `${supabaseUrl}/rest/v1/inventory?select=${encodeURIComponent(invSelect)}&productId=in.(${ids})&inventoryDate=eq.${encodeURIComponent(invDate)}&is_available=eq.true`;
    const invRes = await fetch(invUrl, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: 'no-store',
    });
    if (invRes.ok) {
      const invData: any[] = await invRes.json();
      for (const it of invData) {
        const pid = it?.productId;
        if (pid) invMap[pid] = it;
      }
    }
  }

  const filteredByDate = invDate ? filtered.filter((s: any) => !!invMap[s?.product?.id ?? '']) : filtered;

  if (onlyProviders) {
    const set = new Set<string>();
    for (const s of filteredByDate) {
      const name = s?.boat?.name ?? s?.product?.name ?? '';
      if (name) set.add(name);
    }
    return NextResponse.json({ providers: Array.from(set).sort() });
  }

  const schedules = filteredByDate.map((s: any) => {
    const inv = invMap[s?.product?.id ?? ''];
    return {
      ...s,
      inventory: inv ? {
        id: inv.id,
        productId: inv.productId,
        inventoryDate: inv.inventoryDate,
        totalCapacity: Number(inv.totalCapacity ?? 0),
        bookedUnits: Number(inv.bookedUnits ?? 0),
        availableUnits: Number(inv.availableUnits ?? Math.max(0, Number(inv.totalCapacity ?? 0) - Number(inv.bookedUnits ?? 0))),
        is_available: !!inv.is_available,
      } : undefined,
    };
  });

  const parseHHMMToDate = (dateStr: string, hhmm: string | null | undefined): Date | null => {
    if (!hhmm) return null;
    const [h, m] = String(hhmm).split(':').map((x) => Number(x));
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const d = new Date(dateStr);
    d.setHours(h, m, 0, 0);
    return d;
  };
  const now = new Date();
  const safeSchedules = schedules.filter((s: any) => {
    const dateStr = invDate;
    const depTime = s?.departure_time ?? null;
    const depAt = parseHHMMToDate(dateStr, depTime);
    if (!depAt) return true;
    const diffMs = depAt.getTime() - now.getTime();
    return diffMs > 20 * 60 * 1000;
  });

  return NextResponse.json({ schedules: safeSchedules });
}
