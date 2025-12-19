"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Container, Box, Title, Text, Group, Stack, Drawer, Button, Affix, Paper, Divider, Modal } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SearchBar } from '@/components/speedboat/search-bar';
import { FilterSidebar } from '@/components/speedboat/filter-sidebar';
import { ResultsSection } from '@/components/speedboat/results-section';
import type { ResultCardProps } from '@/components/speedboat/result-card';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

function toMinutes(t: string | null) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function inWindow(depMin: number | null, windows: Array<'morning' | 'afternoon' | 'evening'>) {
  if (!depMin || windows.length === 0) return true;
  const ranges: Record<'morning' | 'afternoon' | 'evening', [number, number]> = {
    morning: [0, 12 * 60],
    afternoon: [12 * 60, 18 * 60],
    evening: [18 * 60, 24 * 60],
  };
  return windows.some((w) => depMin >= ranges[w][0] && depMin < ranges[w][1]);
}

function parseHHMMToDate(dateStr: string, hhmm: string | null | undefined): Date | null {
  if (!hhmm) return null;
  const parts = String(hhmm).split(':');
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const [yStr, moStr, daStr] = String(dateStr).split('-');
  const y = Number(yStr);
  const mo = Number(moStr);
  const da = Number(daStr);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(da)) return null;
  const ms = Date.UTC(y, mo - 1, da, h - 7, m, 0, 0);
  return new Date(ms);
}

function isTooSoon(dateStr: string, hhmm: string | null | undefined): boolean {
  const depAt = parseHHMMToDate(dateStr, hhmm);
  if (!depAt) return false;
  return depAt.getTime() - Date.now() <= 20 * 60 * 1000;
}

function mapScheduleToResult(s: any, requestedPassengers?: number, departureDate?: string): ResultCardProps {
  const depMin = toMinutes(s?.departure_time ?? null);
  const arrMin = toMinutes(s?.arrival_time ?? null);
  const duration = depMin != null && arrMin != null && arrMin >= depMin
    ? `${arrMin - depMin} min`
    : '';
  const priceIdr = Number(s?.product?.price_idr ?? 0);
  const priceUsd = Number(s?.product?.price_usd ?? 0);
  const inv = s?.inventory;
  const capacity = Number(inv?.totalCapacity ?? s?.capacity ?? s?.boat?.capacity ?? 0);
  const available = Number(inv?.availableUnits ?? Math.max(0, (inv?.totalCapacity ?? s?.capacity ?? s?.boat?.capacity ?? 0) - (inv?.bookedUnits ?? 0)));
  return {
    id: s?.id,
    provider: s?.boat?.name ?? s?.product?.name ?? 'Unknown',
    vendorName: s?.product?.tenant?.vendor_name ?? s?.tenant?.vendor_name ?? undefined,
    logo: (s?.product?.tenant?.image_url ? String(s.product.tenant.image_url) : ''),
    departureTime: s?.departure_time ?? '',
    departureDate,
    arrivalTime: s?.arrival_time ?? '',
    duration,
    origin: s?.departureRoute?.name ?? '',
    destination: s?.arrivalRoute?.name ?? '',
    prices: {
      indonesian: { adult: priceIdr, child: Math.round(priceIdr * 0.75) },
      foreigner: { adult: priceUsd, child: Math.round(priceUsd * 0.75) },
    },
    capacity,
    available,
    requestedPassengers,
  } as ResultCardProps;
}

export default function SpeedboatPageContent(props: { initialFrom?: string | null; initialTo?: string | null; initialDeparture?: string; initialProviders?: string[]; initialResults?: ResultCardProps[]; initialOriginOptions?: Array<{ value: string; label: string }>; initialDestinationOptions?: Array<{ value: string; label: string }> }) {
  const [sidebarOpened, { open, close }] = useDisclosure(false);
  const [results, setResults] = useState<ResultCardProps[]>(props.initialResults || []);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [providers, setProviders] = useState<string[]>(props.initialProviders || []);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedWindows, setSelectedWindows] = useState<Array<'morning' | 'afternoon' | 'evening'>>([]);
  const [sortBy, setSortBy] = useState<'lower-price' | 'earliest-departure' | 'latest-departure' | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentFrom, setCurrentFrom] = useState<string | null>(null);
  const [currentTo, setCurrentTo] = useState<string | null>(null);
  const [inboundMode, setInboundMode] = useState<boolean>(false);
  const [cartOpened, { open: openCart, close: closeCart }] = useDisclosure(false);
  const [outboundSel, setOutboundSel] = useState<any | null>(null);
  const [inboundSel, setInboundSel] = useState<any | null>(null);
  const [routeOrigins, setRouteOrigins] = useState<Array<{ value: string; label: string }>>([]);
  const [routeDestinations, setRouteDestinations] = useState<Array<{ value: string; label: string }>>([]);
  const isMobile = useMediaQuery('(max-width: 48em)');
  const [hasOpenedCartOnce, setHasOpenedCartOnce] = useState(false);
  const [touchStartFilter, setTouchStartFilter] = useState<{ x: number; y: number } | null>(null);
  const [touchStartCart, setTouchStartCart] = useState<{ x: number; y: number } | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [hasShownOutboundPopup, setHasShownOutboundPopup] = useState(false);
  const [hasShownReturnPopup, setHasShownReturnPopup] = useState(false);
  const [infoOpened, { open: openInfo, close: closeInfo }] = useDisclosure(false);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (infoOpened) {
      const t = setTimeout(() => {
        closeInfo();
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [infoOpened]);

  useEffect(() => {
    const load = async () => {
      setResultsLoading(true);
      const from = searchParams.get('from') ?? (props.initialFrom ?? '') ?? '';
      const to = searchParams.get('to') ?? (props.initialTo ?? '') ?? '';
      const departure = searchParams.get('departure') ?? (props.initialDeparture ?? '');
      const todayStr = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      })();
      const date = departure || todayStr;
      try {
        const r = await fetch(`/api/speedboat/schedules?onlyRoutes=true`, { cache: 'no-store' });
        if (r.ok) {
          const j = await r.json();
          setRouteOrigins(Array.isArray(j?.origins) ? j.origins : []);
          setRouteDestinations(Array.isArray(j?.destinations) ? j.destinations : []);
        }
      } catch {}
      const urlParams = new URLSearchParams();
      if (from) urlParams.set('from', from);
      if (to) urlParams.set('to', to);
      if (date) urlParams.set('date', date);
      const res = await fetch(`/api/speedboat/schedules?${urlParams.toString()}`, { cache: 'no-store' });
      if (!res.ok) { setResultsLoading(false); return; }
      const json = await res.json();
      const items = Array.isArray(json.schedules) ? json.schedules : [];
      setSchedules(items);
      setCurrentFrom(from);
      setCurrentTo(to);
      const filtered = items.filter((s: any) => {
        const depOk = from ? (s?.departureRoute?.id === from) : true;
        const arrOk = to ? (s?.arrivalRoute?.id === to) : true;
        const tenantActive = (s?.product?.tenant?.isActive ?? s?.tenant?.isActive ?? true) ? true : false;
        const productActive = (s?.product?.isActive ?? true) ? true : false;
        const tooSoon = isTooSoon(date, s?.departure_time ?? null);
        return depOk && arrOk && tenantActive && productActive && !tooSoon;
      });
      const passengers = Number(searchParams.get('passengers') ?? '2') || 2;
      setResults((filtered.length ? filtered : items).map((s: any) => mapScheduleToResult(s, passengers, date)));
      try {
        const w = selectedWindows.join(',');
        const url = `/api/speedboat/schedules?onlyProviders=true${from ? `&from=${encodeURIComponent(from)}` : ''}${to ? `&to=${encodeURIComponent(to)}` : ''}${w ? `&window=${encodeURIComponent(w)}` : ''}${date ? `&date=${encodeURIComponent(date)}` : ''}`;
        const pr = await fetch(url, { cache: 'no-store' });
        if (pr.ok) {
          const pj = await pr.json();
          if (Array.isArray(pj.providers)) setProviders(pj.providers);
        }
      } catch {}
      setResultsLoading(false);
    };
    load();
  }, [searchParams]);

  useEffect(() => {
    const from = searchParams.get('from') ?? '';
    const to = searchParams.get('to') ?? '';
    const ret = searchParams.get('return') ?? '';
    let inbound = false;
    try {
      const raw = typeof window !== 'undefined' ? (localStorage.getItem('rt_outbound_selected') || '') : '';
      if (ret && raw) {
        const out = JSON.parse(raw || '{}');
        if (String(out.to || '') === from && String(out.from || '') === to) inbound = true;
      }
    } catch {}
    setInboundMode(inbound);
  }, [searchParams]);

  useEffect(() => {
    try {
      const outRaw = typeof window !== 'undefined' ? (localStorage.getItem('rt_outbound_selected') || '') : '';
      const inRaw = typeof window !== 'undefined' ? (localStorage.getItem('rt_inbound_selected') || '') : '';
      setOutboundSel(outRaw ? JSON.parse(outRaw) : null);
      setInboundSel(inRaw ? JSON.parse(inRaw) : null);
      const pending = typeof window !== 'undefined' ? (sessionStorage.getItem('rt_popup_outbound_pending') || '') : '';
      if (outRaw && pending === '1') {
        setInfoMessage('Ticket added to cart');
        openInfo();
        setHasShownOutboundPopup(true);
        try { sessionStorage.setItem('rt_popup_outbound_pending', '0'); } catch {}
      }
    } catch {}
  }, [searchParams, hasOpenedCartOnce]);

  useEffect(() => {
    const onInboundSelected = () => {
      try {
        const inRaw = typeof window !== 'undefined' ? (localStorage.getItem('rt_inbound_selected') || '') : '';
        setInboundSel(inRaw ? JSON.parse(inRaw) : null);
        if (!hasShownReturnPopup) {
          setInfoMessage('Check the cart to proceed with booking');
          openInfo();
          setHasShownReturnPopup(true);
        }
      } catch {}
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('rt_inbound_selected', onInboundSelected);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('rt_inbound_selected', onInboundSelected);
      }
    };
  }, []);

  const changeReturn = () => {
    const ret = searchParams.get('return') || '';
    const pax = (() => { try { const s = localStorage.getItem('rt_passengers') || ''; return s ? String(s) : (searchParams.get('passengers') || '2'); } catch { return searchParams.get('passengers') || '2'; } })();
    try { localStorage.removeItem('rt_inbound_selected'); } catch {}
    try { if (typeof window !== 'undefined') { sessionStorage.setItem('rt_popup_outbound_pending', '0'); } } catch {}
    setInboundSel(null);
    if (outboundSel) {
      const params = new URLSearchParams();
      if (outboundSel.to) params.set('from', String(outboundSel.to));
      if (outboundSel.from) params.set('to', String(outboundSel.from));
      if (ret) params.set('departure', ret);
      if (ret) params.set('return', ret);
      if (pax) params.set('passengers', String(pax));
      window.location.href = `/speedboat?${params.toString()}`;
    }
  };

  const changeDeparture = () => {
    const ret = searchParams.get('return') || '';
    const pax = (() => { try { const s = localStorage.getItem('rt_passengers') || ''; return s ? String(s) : (searchParams.get('passengers') || '2'); } catch { return searchParams.get('passengers') || '2'; } })();
    try { localStorage.removeItem('rt_inbound_selected'); } catch {}
    try { localStorage.removeItem('rt_outbound_selected'); } catch {}
    try { if (typeof window !== 'undefined') { sessionStorage.setItem('rt_popup_outbound_pending', '0'); } } catch {}
    setInboundSel(null);
    setOutboundSel(null);
    if (outboundSel) {
      const params = new URLSearchParams();
      if (outboundSel.from) params.set('from', String(outboundSel.from));
      if (outboundSel.to) params.set('to', String(outboundSel.to));
      if (outboundSel.departureDate) params.set('departure', String(outboundSel.departureDate));
      if (ret) params.set('return', ret);
      if (pax) params.set('passengers', String(pax));
      window.location.href = `/speedboat?${params.toString()}`;
    }
  };

  const bookNowCombined = async () => {
    if (!outboundSel || !inboundSel) return;
    setBookingLoading(true);
    const q = new URLSearchParams();
    q.set('sid', String(inboundSel.sid || ''));
    q.set('sid2', String(outboundSel.sid || ''));
    q.set('origin', String(inboundSel.origin || ''));
    q.set('destination', String(inboundSel.destination || ''));
    q.set('departureTime', String(inboundSel.departureTime || ''));
    q.set('departureDate', String(inboundSel.departureDate || ''));
    q.set('provider', String(inboundSel.provider || ''));
    q.set('priceIdr', String(inboundSel.priceIdr || ''));
    q.set('origin2', String(outboundSel.origin || ''));
    q.set('destination2', String(outboundSel.destination || ''));
    q.set('departureTime2', String(outboundSel.departureTime || ''));
    q.set('departureDate2', String(outboundSel.departureDate || ''));
    q.set('provider2', String(outboundSel.provider || ''));
    q.set('priceIdr2', String(outboundSel.priceIdr || ''));
    try {
      let a = 0, c = 0, i = 0;
      try {
        const raw = typeof window !== 'undefined' ? (localStorage.getItem('rt_passenger_counts') || '') : '';
        if (raw) {
          const obj = JSON.parse(raw);
          a = Math.max(0, Number(obj?.adult ?? 0));
          c = Math.max(0, Number(obj?.child ?? 0));
          i = Math.max(0, Number(obj?.infant ?? 0));
        }
      } catch {}
      const totalStr = searchParams.get('passengers') ?? '';
      const total = Number(totalStr);
      if (!(a || c || i)) {
        const t = Number.isFinite(total) && total > 0 ? total : 0;
        a = t || 1;
        c = 0;
        i = 0;
      }
      q.set('adult', String(a));
      q.set('child', String(c));
      q.set('infant', String(i));
    } catch {}
    const target = `/speedboat/book?${q.toString()}`;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = `/login?redirectTo=${encodeURIComponent(target)}`;
      } else {
        window.location.href = target;
      }
    } catch {
      setBookingLoading(false);
    }
  };

  const originOptions = useMemo(() => {
    if (routeOrigins.length > 0) {
      return routeOrigins;
    }
    if (Array.isArray(props.initialOriginOptions) && props.initialOriginOptions.length > 0) {
      return props.initialOriginOptions;
    }
    const map = new Map<string, string>();
    for (const s of schedules) {
      const r = s?.departureRoute;
      if (r?.id && r?.name) map.set(r.id, r.name);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [routeOrigins, props.initialOriginOptions, schedules]);

  const destinationOptions = useMemo(() => {
    if (routeDestinations.length > 0) {
      return routeDestinations;
    }
    if (Array.isArray(props.initialDestinationOptions) && props.initialDestinationOptions.length > 0) {
      return props.initialDestinationOptions;
    }
    const map = new Map<string, string>();
    for (const s of schedules) {
      const r = s?.arrivalRoute;
      if (r?.id && r?.name) map.set(r.id, r.name);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [routeDestinations, props.initialDestinationOptions, schedules]);

  const initialFrom = searchParams.get('from') ?? (props.initialFrom ?? null);
  const initialTo = searchParams.get('to') ?? (props.initialTo ?? null);
  const initialDeparture = (searchParams.get('departure') ?? props.initialDeparture ?? '');
  const initialReturn = searchParams.get('return') ?? '';
  const initialPassengers = Number(searchParams.get('passengers') ?? '2') || 2;

  const toggleProvider = (name: string) => {
    setSelectedProviders((prev) => prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]);
  };

  const toggleWindow = (win: 'morning' | 'afternoon' | 'evening') => {
    setSelectedWindows((prev) => prev.includes(win) ? prev.filter((w) => w !== win) : [...prev, win]);
    const w = (selectedWindows.includes(win) ? selectedWindows.filter((w) => w !== win) : [...selectedWindows, win]).join(',');
    const todayStr = (() => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    })();
    const date = searchParams.get('departure') ?? todayStr;
    const url = `/api/speedboat/schedules?onlyProviders=true${currentFrom ? `&from=${encodeURIComponent(currentFrom)}` : ''}${currentTo ? `&to=${encodeURIComponent(currentTo)}` : ''}${w ? `&window=${encodeURIComponent(w)}` : ''}${date ? `&date=${encodeURIComponent(date)}` : ''}`;
    fetch(url, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d && Array.isArray(d.providers)) setProviders(d.providers); })
      .catch(() => {});
  };

  const applyFilters = () => {
    setResultsLoading(true);
    let list = [...schedules];
    if (currentFrom) list = list.filter((s: any) => s?.departureRoute?.id === currentFrom);
    if (currentTo) list = list.filter((s: any) => s?.arrivalRoute?.id === currentTo);
    list = list.filter((s: any) => (s?.product?.tenant?.isActive ?? s?.tenant?.isActive ?? true) ? true : false);
    list = list.filter((s: any) => (s?.product?.isActive ?? true) ? true : false);
    const todayStr = (() => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const da = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${da}`; })();
    const dateStr = searchParams.get('departure') ?? todayStr;
    list = list.filter((s: any) => !isTooSoon(dateStr, s?.departure_time ?? null));
    if (selectedWindows.length) list = list.filter((s: any) => inWindow(toMinutes(s.departure_time), selectedWindows));
    if (selectedProviders.length) list = list.filter((s: any) => selectedProviders.includes(s?.boat?.name ?? s?.product?.name ?? ''));
    if (sortBy === 'lower-price') list.sort((a: any, b: any) => Number(a.product?.price_idr ?? 0) - Number(b.product?.price_idr ?? 0));
    if (sortBy === 'earliest-departure') list.sort((a: any, b: any) => (toMinutes(a.departure_time) ?? 0) - (toMinutes(b.departure_time) ?? 0));
    if (sortBy === 'latest-departure') list.sort((a: any, b: any) => (toMinutes(b.departure_time) ?? 0) - (toMinutes(a.departure_time) ?? 0));
    const passengers = Number(searchParams.get('passengers') ?? '2') || 2;
    setResults(list.map((s: any) => mapScheduleToResult(s, passengers)));
    setTimeout(() => setResultsLoading(false), 150);
  };

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header />
      <Container size="xl" style={{ marginTop: '30px', position: 'relative', zIndex: 10 }}>
        <SearchBar
          originOptions={originOptions}
          destinationOptions={destinationOptions}
          initialFrom={initialFrom}
          initialTo={initialTo}
          initialDeparture={initialDeparture}
          initialReturn={initialReturn}
          initialPassengers={initialPassengers}
          inboundMode={inboundMode}
          onFromChange={({ from, to, departure, return: ret, passengers }) => {
            setResultsLoading(true);
            try { localStorage.removeItem('rt_outbound_selected'); } catch {}
            try { localStorage.removeItem('rt_inbound_selected'); } catch {}
            try { localStorage.removeItem('rt_passengers'); } catch {}
            try { if (typeof window !== 'undefined') { sessionStorage.setItem('rt_popup_outbound_pending', '0'); } } catch {}
            setOutboundSel(null);
            setInboundSel(null);
            setInboundMode(false);
            closeCart();
            setCurrentFrom(from || null);
            setCurrentTo(to || null);
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            if (departure) params.set('departure', departure);
            if (ret) params.set('return', ret);
            if (typeof passengers === 'number' && passengers > 0) params.set('passengers', String(passengers));
            router.replace(`/speedboat?${params.toString()}`);
          }}
          onToChange={({ from, to, departure, return: ret, passengers }) => {
            setResultsLoading(true);
            try { localStorage.removeItem('rt_outbound_selected'); } catch {}
            try { localStorage.removeItem('rt_inbound_selected'); } catch {}
            try { localStorage.removeItem('rt_passengers'); } catch {}
            try { if (typeof window !== 'undefined') { sessionStorage.setItem('rt_popup_outbound_pending', '0'); } } catch {}
            setOutboundSel(null);
            setInboundSel(null);
            setInboundMode(false);
            closeCart();
            setCurrentFrom(from || null);
            setCurrentTo(to || null);
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            if (departure) params.set('departure', departure);
            if (ret) params.set('return', ret);
            if (typeof passengers === 'number' && passengers > 0) params.set('passengers', String(passengers));
            router.replace(`/speedboat?${params.toString()}`);
          }}
          onDepartureChange={({ from, to, departure, return: ret, passengers }) => {
            setResultsLoading(true);
            try { localStorage.removeItem('rt_outbound_selected'); } catch {}
            try { localStorage.removeItem('rt_inbound_selected'); } catch {}
            try { localStorage.removeItem('rt_passengers'); } catch {}
            try { if (typeof window !== 'undefined') { sessionStorage.setItem('rt_popup_outbound_pending', '0'); } } catch {}
            setOutboundSel(null);
            setInboundSel(null);
            setInboundMode(false);
            closeCart();
            setCurrentFrom(from || null);
            setCurrentTo(to || null);
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            if (departure) params.set('departure', departure);
            if (ret) params.set('return', ret);
            if (typeof passengers === 'number' && passengers > 0) params.set('passengers', String(passengers));
            router.replace(`/speedboat?${params.toString()}`);
          }}
          onReturnDateChange={({ from, to, departure, return: ret, passengers }) => {
            setResultsLoading(true);
            setCurrentFrom(from || null);
            setCurrentTo(to || null);
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            if (departure) params.set('departure', departure);
            if (ret) params.set('return', ret);
            if (typeof passengers === 'number' && passengers > 0) params.set('passengers', String(passengers));
            router.replace(`/speedboat?${params.toString()}`);
          }}
          onPassengersChange={({ from, to, departure, return: ret, passengers }) => {
            setResultsLoading(true);
            try { localStorage.setItem('rt_passengers', String(passengers ?? '')); } catch {}
            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            if (departure) params.set('departure', departure);
            if (ret) params.set('return', ret);
            if (typeof passengers === 'number' && passengers > 0) params.set('passengers', String(passengers));
            router.replace(`/speedboat?${params.toString()}`);
          }}
          onSearch={({ from, to, departure, return: ret, passengers }) => {
            setResultsLoading(true);
            try { localStorage.removeItem('rt_outbound_selected'); } catch {}
            try { localStorage.removeItem('rt_inbound_selected'); } catch {}
            try { localStorage.removeItem('rt_passengers'); } catch {}
            try { if (typeof window !== 'undefined') { sessionStorage.setItem('rt_popup_outbound_pending', '0'); } } catch {}
            setOutboundSel(null);
            setInboundSel(null);
            setInboundMode(false);
            closeCart();
            setCurrentFrom(from || null);
            setCurrentTo(to || null);
            const filtered = schedules.filter((s: any) => {
              const depOk = from ? (s?.departureRoute?.id === from) : true;
              const arrOk = to ? (s?.arrivalRoute?.id === to) : true;
              const tenantActive = (s?.product?.tenant?.isActive ?? s?.tenant?.isActive ?? true) ? true : false;
              const productActive = (s?.product?.isActive ?? true) ? true : false;
              const todayStr = (() => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const da = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${da}`; })();
              const dateStr = departure || todayStr;
              const tooSoon = isTooSoon(dateStr, s?.departure_time ?? null);
              return depOk && arrOk && tenantActive && productActive && !tooSoon;
            });
            const totalPassengers = Number(passengers ?? initialPassengers) || initialPassengers;
            setResults((filtered.length ? filtered : schedules).map((s) => mapScheduleToResult(s, totalPassengers, departure)));
            const w = selectedWindows.join(',');
            const url = `/api/speedboat/schedules?onlyProviders=true${from ? `&from=${encodeURIComponent(from)}` : ''}${to ? `&to=${encodeURIComponent(to)}` : ''}${w ? `&window=${encodeURIComponent(w)}` : ''}${departure ? `&date=${encodeURIComponent(departure)}` : ''}`;
            fetch(url, { cache: 'no-store' })
              .then((r) => r.ok ? r.json() : null)
              .then((d) => { if (d && Array.isArray(d.providers)) setProviders(d.providers); })
              .catch(() => {})
              .finally(() => setResultsLoading(false));

            const params = new URLSearchParams();
            if (from) params.set('from', from);
            if (to) params.set('to', to);
            if (departure) params.set('departure', departure);
            if (ret) params.set('return', ret);
            if (typeof passengers === 'number' && passengers > 0) params.set('passengers', String(passengers));
            router.replace(`/speedboat?${params.toString()}`);
          }}
          onReturnToggle={(checked, { from, to, departure, return: ret, passengers }) => {
            setCurrentFrom(from || null);
            setCurrentTo(to || null);
            if (checked) {
              try { localStorage.removeItem('rt_inbound_selected'); } catch {}
              try { if (typeof window !== 'undefined') { sessionStorage.setItem('rt_popup_outbound_pending', '0'); } } catch {}
              setInboundSel(null);
              const params = new URLSearchParams();
              if (from) params.set('from', from);
              if (to) params.set('to', to);
              if (departure) params.set('departure', departure);
              if (ret) params.set('return', ret);
              if (typeof passengers === 'number' && passengers > 0) params.set('passengers', String(passengers));
              router.replace(`/speedboat?${params.toString()}`);
            } else {
              try { localStorage.removeItem('rt_outbound_selected'); } catch {}
              try { localStorage.removeItem('rt_inbound_selected'); } catch {}
              try { localStorage.removeItem('rt_passengers'); } catch {}
              try { if (typeof window !== 'undefined') { sessionStorage.setItem('rt_popup_outbound_pending', '0'); } } catch {}
              setOutboundSel(null);
              setInboundSel(null);
              setInboundMode(false);
              closeCart();
              const params = new URLSearchParams();
              if (from) params.set('from', from);
              if (to) params.set('to', to);
              if (departure) params.set('departure', departure);
              if (typeof passengers === 'number' && passengers > 0) params.set('passengers', String(passengers));
              router.replace(`/speedboat?${params.toString()}`);
            }
          }}
        />
      </Container>

      {outboundSel ? (
        <Affix position={{ bottom: 24, right: 24 }}>
          <Button onClick={openCart} style={{ backgroundColor: '#284361' }}>
            {inboundSel ? 'Cart (2/2)' : 'Cart (1/2)'}
          </Button>
        </Affix>
      ) : null}

      <Box hiddenFrom="md" style={{ paddingLeft: 16, paddingRight: 16, marginTop: 12 }}>
        <Button
          variant="outline"
          leftSection={<IconFilter size={18} />}
          onClick={open}
          styles={{
            root: {
              borderColor: '#d1d5db',
              color: '#1f2937',
              backgroundColor: 'white'
            }
          }}
        >
          Filter Speedboats
        </Button>
      </Box>
      <Drawer
        opened={sidebarOpened}
        onClose={close}
        title="Filters"
        position={isMobile ? 'bottom' : 'right'}
        size={isMobile ? 'auto' : 'md'}
        padding={isMobile ? 'sm' : 'md'}
        overlayProps={{ opacity: 0, blur: 0 }}
        withinPortal={false}
        styles={{
          content: {
            borderTopLeftRadius: isMobile ? 16 : undefined,
            borderTopRightRadius: isMobile ? 16 : undefined,
            height: isMobile ? '65vh' : undefined,
          },
        }}
      >
        <FilterSidebar
          providers={providers}
          selectedProviders={selectedProviders}
          onToggleProvider={toggleProvider}
          selectedWindows={selectedWindows}
          onToggleWindow={toggleWindow}
          sortBy={sortBy}
          onToggleSort={setSortBy}
          onApply={() => { applyFilters(); close(); }}
          fullWidth
        />
      </Drawer>

      <Drawer
        opened={cartOpened}
        withCloseButton
        closeOnEscape={true}
        closeOnClickOutside={true}
        onClose={closeCart}
        title="Trip Cart"
        position={isMobile ? 'left' : 'right'}
        size={isMobile ? '85%' : 'md'}
        padding="md"
        overlayProps={{ opacity: isMobile ? 0.15 : 0.35 }}
      >
        <Stack
          gap="md"
          onTouchStart={(e) => { const t = e.touches?.[0]; if (t) setTouchStartCart({ x: t.clientX, y: t.clientY }); }}
          onTouchMove={(e) => {
            if (!touchStartCart) return;
            const t = e.touches?.[0];
            if (!t) return;
            const dx = t.clientX - touchStartCart.x;
            if (dx < -50) { closeCart(); setTouchStartCart(null); }
          }}
        >
          <Paper radius="md" p="md" withBorder>
            <Stack gap={6}>
              <Group justify="space-between">
                <Text fw={700}>Outbound</Text>
                <Text fw={600} c="#284361">
                  {outboundSel ? `Rp ${Number(outboundSel.priceIdr || 0).toLocaleString('id-ID')}` : '-'}
                </Text>
              </Group>
              <Group justify="flex-end">
                <Text size="sm" c="#284361">
                  {outboundSel ? `USD ${Number(outboundSel.priceUsd || 0).toLocaleString('en-US')}` : ''}
                </Text>
              </Group>
              <Text>{outboundSel ? `${outboundSel.origin} → ${outboundSel.destination}` : '-'}</Text>
              <Group gap="sm">
                <Text size="sm" c="dimmed">{outboundSel ? outboundSel.departureDate : '-'}</Text>
                <Text size="sm" c="dimmed">{outboundSel ? outboundSel.departureTime : '-'}</Text>
              </Group>
              <Text size="sm" c="dimmed">{outboundSel ? outboundSel.provider : '-'}</Text>
              <Group justify="flex-end">
                <Button variant="outline" onClick={changeDeparture}>Change Departure Ticket</Button>
              </Group>
            </Stack>
          </Paper>
          <Paper radius="md" p="md" withBorder>
            <Stack gap={6}>
              <Group justify="space-between">
                <Text fw={700}>Inbound</Text>
                <Text fw={600} c="#284361">
                  {inboundSel ? `Rp ${Number(inboundSel.priceIdr || 0).toLocaleString('id-ID')}` : '-'}
                </Text>
              </Group>
              <Group justify="flex-end">
                <Text size="sm" c="#284361">
                  {inboundSel ? `USD ${Number(inboundSel.priceUsd || 0).toLocaleString('en-US')}` : ''}
                </Text>
              </Group>
              <Text>{inboundSel ? `${inboundSel.origin} → ${inboundSel.destination}` : 'Belum memilih tiket pulang'}</Text>
              <Group gap="sm">
                <Text size="sm" c="dimmed">{inboundSel ? inboundSel.departureDate : '-'}</Text>
                <Text size="sm" c="dimmed">{inboundSel ? inboundSel.departureTime : '-'}</Text>
              </Group>
              <Text size="sm" c="dimmed">{inboundSel ? inboundSel.provider : '-'}</Text>
              <Group justify="flex-end">
                <Button variant="outline" onClick={changeReturn} disabled={!outboundSel}>Change Return Ticket</Button>
              </Group>
            </Stack>
          </Paper>
          <Group justify="flex-end">
            <Button disabled={!inboundSel} onClick={bookNowCombined} style={{ backgroundColor: '#284361' }} loading={bookingLoading}>Book Now</Button>
          </Group>
        </Stack>
      </Drawer>
      <Modal
        opened={infoOpened}
        onClose={closeInfo}
        centered
        withCloseButton={false}
        styles={{
          content: {
            width: 'auto',
            maxWidth: '300px',
            padding: '24px'
          }
        }}
      >
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <svg width="96" height="96" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#e8f7f0" />
            <path d="M28 52 L44 68 L74 38" stroke="#2dbe8d" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="100">
              <animate attributeName="stroke-dashoffset" from="100" to="0" dur="0.8s" fill="freeze" />
            </path>
          </svg>
          <Text fw={700} c="#0f5132">{infoMessage || ''}</Text>
        </Box>
      </Modal>

      <Container size="xl" py="xl">
        <Group align="flex-start" gap="xl">
          <Box visibleFrom="md">
            <FilterSidebar
              providers={providers}
              selectedProviders={selectedProviders}
              onToggleProvider={toggleProvider}
              selectedWindows={selectedWindows}
              onToggleWindow={toggleWindow}
              sortBy={sortBy}
              onToggleSort={setSortBy}
              onApply={applyFilters}
            />
          </Box>
          <Box style={{ flex: 1 }}>
            <Stack gap="md" mb="xl">
              <Title order={2} size="1.5rem" fw={700} c="#111827">
                Available Speedboat Services
              </Title>
              <Text c="#6b7280">
                Choose from our selection of reliable speedboat operators
              </Text>
            </Stack>
            <ResultsSection results={results} loading={resultsLoading} />
          </Box>
        </Group>
      </Container>

      <Footer />
    </Box>
  );
}
