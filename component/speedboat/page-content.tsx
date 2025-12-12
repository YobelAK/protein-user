"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Container, Box, Title, Text, Group, Stack, Drawer, Button, Affix, Paper, Divider } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SearchBar } from '@/components/speedboat/search-bar';
import { FilterSidebar } from '@/components/speedboat/filter-sidebar';
import { ResultsSection } from '@/components/speedboat/results-section';
import type { ResultCardProps } from '@/components/speedboat/result-card';
import { useRouter, useSearchParams } from 'next/navigation';

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
    logo: (
      (s?.product?.featured_image ? String(s.product.featured_image) : undefined)
      ?? (Array.isArray(s?.boat?.image_urls) && s.boat.image_urls.length > 0 ? String(s.boat.image_urls[0]) : undefined)
      ?? 'https://via.placeholder.com/60'
    ),
    departureTime: s?.departure_time ?? '',
    departureDate,
    arrivalTime: s?.arrival_time ?? '',
    duration,
    origin: s?.departureRoute?.name ?? '',
    destination: s?.arrivalRoute?.name ?? '',
    prices: {
      indonesian: { adult: priceIdr, child: Math.round(priceIdr * 0.75) },
      foreigner: { adult: priceIdr, child: Math.round(priceIdr * 0.75) },
      // foreigner: { adult: priceUsd, child: Math.round(priceUsd * 0.75) },
    },
    capacity,
    available,
    requestedPassengers,
  } as ResultCardProps;
}

export default function SpeedboatPageContent(props: { initialProviders?: string[]; initialResults?: ResultCardProps[]; initialOriginOptions?: Array<{ value: string; label: string }>; initialDestinationOptions?: Array<{ value: string; label: string }> }) {
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

  useEffect(() => {
    const load = async () => {
      const from = searchParams.get('from') ?? '';
      const to = searchParams.get('to') ?? '';
      const departure = searchParams.get('departure') ?? '';
      const todayStr = (() => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      })();
      const date = departure || todayStr;
      const urlParams = new URLSearchParams();
      if (from) urlParams.set('from', from);
      if (to) urlParams.set('to', to);
      if (date) urlParams.set('date', date);
      const res = await fetch(`/api/speedboat/schedules?${urlParams.toString()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      const items = Array.isArray(json.schedules) ? json.schedules : [];
      setSchedules(items);
      setCurrentFrom(from);
      setCurrentTo(to);
      const filtered = items.filter((s: any) => {
        const depOk = from ? (s?.departureRoute?.id === from) : true;
        const arrOk = to ? (s?.arrivalRoute?.id === to) : true;
        return depOk && arrOk;
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
      if (outRaw) openCart();
    } catch {}
  }, [searchParams]);

  useEffect(() => {
    const onInboundSelected = () => {
      try {
        const inRaw = typeof window !== 'undefined' ? (localStorage.getItem('rt_inbound_selected') || '') : '';
        setInboundSel(inRaw ? JSON.parse(inRaw) : null);
        openCart();
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

  const bookNowCombined = () => {
    if (!outboundSel || !inboundSel) return;
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
    window.location.href = `/speedboat/book?${q.toString()}`;
  };

  const originOptions = useMemo(() => {
    if (Array.isArray(props.initialOriginOptions) && props.initialOriginOptions.length > 0) {
      return props.initialOriginOptions;
    }
    const map = new Map<string, string>();
    for (const s of schedules) {
      const r = s?.departureRoute;
      if (r?.id && r?.name) map.set(r.id, r.name);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [props.initialOriginOptions, schedules]);

  const destinationOptions = useMemo(() => {
    if (Array.isArray(props.initialDestinationOptions) && props.initialDestinationOptions.length > 0) {
      return props.initialDestinationOptions;
    }
    const map = new Map<string, string>();
    for (const s of schedules) {
      const r = s?.arrivalRoute;
      if (r?.id && r?.name) map.set(r.id, r.name);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [props.initialDestinationOptions, schedules]);

  const initialFrom = searchParams.get('from');
  const initialTo = searchParams.get('to');
  const initialDeparture = searchParams.get('departure') ?? '';
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
    let list = [...schedules];
    if (currentFrom) list = list.filter((s: any) => s?.departureRoute?.id === currentFrom);
    if (currentTo) list = list.filter((s: any) => s?.arrivalRoute?.id === currentTo);
    if (selectedWindows.length) list = list.filter((s: any) => inWindow(toMinutes(s.departure_time), selectedWindows));
    if (selectedProviders.length) list = list.filter((s: any) => selectedProviders.includes(s?.boat?.name ?? s?.product?.name ?? ''));
    if (sortBy === 'lower-price') list.sort((a: any, b: any) => Number(a.product?.price_idr ?? 0) - Number(b.product?.price_idr ?? 0));
    if (sortBy === 'earliest-departure') list.sort((a: any, b: any) => (toMinutes(a.departure_time) ?? 0) - (toMinutes(b.departure_time) ?? 0));
    if (sortBy === 'latest-departure') list.sort((a: any, b: any) => (toMinutes(b.departure_time) ?? 0) - (toMinutes(a.departure_time) ?? 0));
    const passengers = Number(searchParams.get('passengers') ?? '2') || 2;
    setResults(list.map((s: any) => mapScheduleToResult(s, passengers)));
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
            try { localStorage.removeItem('rt_outbound_selected'); } catch {}
            try { localStorage.removeItem('rt_inbound_selected'); } catch {}
            try { localStorage.removeItem('rt_passengers'); } catch {}
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
            try { localStorage.removeItem('rt_outbound_selected'); } catch {}
            try { localStorage.removeItem('rt_inbound_selected'); } catch {}
            try { localStorage.removeItem('rt_passengers'); } catch {}
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
            try { localStorage.removeItem('rt_outbound_selected'); } catch {}
            try { localStorage.removeItem('rt_inbound_selected'); } catch {}
            try { localStorage.removeItem('rt_passengers'); } catch {}
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
            try { localStorage.removeItem('rt_outbound_selected'); } catch {}
            try { localStorage.removeItem('rt_inbound_selected'); } catch {}
            try { localStorage.removeItem('rt_passengers'); } catch {}
            setOutboundSel(null);
            setInboundSel(null);
            setInboundMode(false);
            closeCart();
            setCurrentFrom(from || null);
            setCurrentTo(to || null);
            const filtered = schedules.filter((s: any) => {
              const depOk = from ? (s?.departureRoute?.id === from) : true;
              const arrOk = to ? (s?.arrivalRoute?.id === to) : true;
              return depOk && arrOk;
            });
            const totalPassengers = Number(passengers ?? initialPassengers) || initialPassengers;
            setResults((filtered.length ? filtered : schedules).map((s) => mapScheduleToResult(s, totalPassengers, departure)));
            const w = selectedWindows.join(',');
            const url = `/api/speedboat/schedules?onlyProviders=true${from ? `&from=${encodeURIComponent(from)}` : ''}${to ? `&to=${encodeURIComponent(to)}` : ''}${w ? `&window=${encodeURIComponent(w)}` : ''}${departure ? `&date=${encodeURIComponent(departure)}` : ''}`;
            fetch(url, { cache: 'no-store' })
              .then((r) => r.ok ? r.json() : null)
              .then((d) => { if (d && Array.isArray(d.providers)) setProviders(d.providers); })
              .catch(() => {});

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
      <Drawer opened={sidebarOpened} onClose={close} title="Filters" size="md" padding="md">
        <FilterSidebar
          providers={providers}
          selectedProviders={selectedProviders}
          onToggleProvider={toggleProvider}
          selectedWindows={selectedWindows}
          onToggleWindow={toggleWindow}
          sortBy={sortBy}
          onToggleSort={setSortBy}
          onApply={() => { applyFilters(); close(); }}
        />
      </Drawer>

      <Drawer
        opened={cartOpened}
        withCloseButton
        closeOnEscape={true}
        closeOnClickOutside={true}
        onClose={closeCart}
        title="Trip Cart"
        size="md"
        padding="md"
      >
        <Stack gap="md">
          <Paper radius="md" p="md" withBorder>
            <Stack gap={6}>
              <Group justify="space-between">
                <Text fw={700}>Outbound</Text>
                <Text fw={600} c="#284361">{outboundSel ? `Rp ${Number(outboundSel.priceIdr || 0).toLocaleString('id-ID')}` : '-'}</Text>
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
                <Text fw={600} c="#284361">{inboundSel ? `Rp ${Number(inboundSel.priceIdr || 0).toLocaleString('id-ID')}` : '-'}</Text>
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
            <Button disabled={!inboundSel} onClick={bookNowCombined} style={{ backgroundColor: '#284361' }}>Book Now</Button>
          </Group>
        </Stack>
      </Drawer>

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
            <ResultsSection results={results} />
          </Box>
        </Group>
      </Container>

      <Footer />
    </Box>
  );
}
