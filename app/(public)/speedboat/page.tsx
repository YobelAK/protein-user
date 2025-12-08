'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { Container, Box, Title, Text, Group, Stack, Drawer, Button } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconFilter } from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { SearchBar } from '@/components/speedboat/search-bar';
import { FilterSidebar } from '@/components/speedboat/filter-sidebar';
import { ResultsSection } from '@/components/speedboat/results-section';
import type { ResultCardProps } from '@/components/speedboat/result-card';
import { useSearchParams } from 'next/navigation';

function SpeedboatPageContent() {
  const [sidebarOpened, { open, close }] = useDisclosure(false);
  const [results, setResults] = useState<ResultCardProps[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const searchParams = useSearchParams();

  useEffect(() => {
    const toMinutes = (t: string | null) => {
      if (!t) return null;
      const [h, m] = t.split(':').map(Number);
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m;
    };

    const mapScheduleToResult = (s: any): ResultCardProps => {
      const depMin = toMinutes(s.departure_time);
      const arrMin = toMinutes(s.arrival_time);
      const duration = depMin != null && arrMin != null && arrMin >= depMin
        ? `${arrMin - depMin} min`
        : '';

      const priceIdr = Number(s.product?.price_idr ?? 0);

      return {
        id: s.id,
        provider: s.boat?.name ?? s.product?.name ?? 'Unknown',
        logo: 'https://via.placeholder.com/60',
        departureTime: s.departure_time ?? '',
        arrivalTime: s.arrival_time ?? '',
        duration,
        origin: s.departureRoute?.name ?? '',
        destination: s.arrivalRoute?.name ?? '',
        prices: {
          indonesian: { adult: priceIdr, child: priceIdr },
          foreigner: { adult: priceIdr, child: priceIdr },
        },
      } as ResultCardProps;
    };

    const load = async () => {
      const res = await fetch('/api/speedboat/schedules', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      const items = Array.isArray(json.schedules) ? json.schedules : [];
      setSchedules(items);
      const from = searchParams.get('from');
      const to = searchParams.get('to');
      const filtered = items.filter((s: any) => {
        const depOk = from ? (s?.departureRoute?.id === from) : true;
        const arrOk = to ? (s?.arrivalRoute?.id === to) : true;
        return depOk && arrOk;
      });
      setResults((filtered.length ? filtered : items).map(mapScheduleToResult));
    };

    load();
  }, [searchParams]);

  const originOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of schedules) {
      const r = s?.departureRoute;
      if (r?.id && r?.name) map.set(r.id, r.name);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [schedules]);

  const destinationOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of schedules) {
      const r = s?.arrivalRoute;
      if (r?.id && r?.name) map.set(r.id, r.name);
    }
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [schedules]);

  const initialFrom = searchParams.get('from');
  const initialTo = searchParams.get('to');
  const initialDeparture = searchParams.get('departure') ?? '';
  const initialReturn = searchParams.get('return') ?? '';
  const initialPassengers = Number(searchParams.get('passengers') ?? '2') || 2;

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header />
      
      {/* Hero Section
      <Box
        style={{
          background: 'linear-gradient(to right, #284361, #1a2c3d)',
          paddingTop: '64px',
          paddingBottom: '64px'
        }}
      >
        <Container size="xl">
          <Stack align="center" gap="md">
            <Title 
              order={1} 
              size="2.5rem" 
              fw={700} 
              c="white" 
              ta="center"
            >
              Speedboat Services
            </Title>
            <Text 
              size="lg" 
              c="#e5e7eb" 
              ta="center" 
              maw={640}
            >
              Fast and reliable speedboat transfers between Bali and Nusa Penida. 
              Book your journey with trusted operators.
            </Text>
          </Stack>
        </Container>
      </Box> */}

      {/* Search Section */}
      <Container size="xl" style={{ marginTop: '30px', position: 'relative', zIndex: 10 }}>
        <SearchBar
          originOptions={originOptions}
          destinationOptions={destinationOptions}
          initialFrom={initialFrom}
          initialTo={initialTo}
          initialDeparture={initialDeparture}
          initialReturn={initialReturn}
          initialPassengers={initialPassengers}
          onSearch={({ from, to }) => {
            const filtered = schedules.filter((s: any) => {
              const depOk = from ? (s?.departureRoute?.id === from) : true;
              const arrOk = to ? (s?.arrivalRoute?.id === to) : true;
              return depOk && arrOk;
            });
            const toMinutes = (t: string | null) => {
              if (!t) return null;
              const [h, m] = t.split(':').map(Number);
              if (Number.isNaN(h) || Number.isNaN(m)) return null;
              return h * 60 + m;
            };
            const mapScheduleToResult = (s: any): ResultCardProps => {
              const depMin = toMinutes(s.departure_time);
              const arrMin = toMinutes(s.arrival_time);
              const duration = depMin != null && arrMin != null && arrMin >= depMin
                ? `${arrMin - depMin} min`
                : '';
              const priceIdr = Number(s.product?.price_idr ?? 0);
              return {
                id: s.id,
                provider: s.boat?.name ?? s.product?.name ?? 'Unknown',
                logo: 'https://via.placeholder.com/60',
                departureTime: s.departure_time ?? '',
                arrivalTime: s.arrival_time ?? '',
                duration,
                origin: s.departureRoute?.name ?? '',
                destination: s.arrivalRoute?.name ?? '',
                prices: {
                  indonesian: { adult: priceIdr, child: priceIdr },
                  foreigner: { adult: priceIdr, child: priceIdr },
                },
              } as ResultCardProps;
            };
            setResults((filtered.length ? filtered : schedules).map(mapScheduleToResult));
          }}
        />
      </Container>

      {/* Mobile Filters Toggle */}
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
        <FilterSidebar />
      </Drawer>

      {/* Main Content */}
      <Container size="xl" py="xl">
        <Group align="flex-start" gap="xl">
          {/* Desktop Sidebar */}
          <Box visibleFrom="md">
            <FilterSidebar />
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

export default function SpeedboatPage() {
  return (
    <Suspense fallback={null}>
      <SpeedboatPageContent />
    </Suspense>
  );
}
