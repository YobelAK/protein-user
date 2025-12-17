"use client";
import React from 'react';
import Link from 'next/link';
import { 
  Card, 
  Group, 
  Avatar, 
  Text, 
  Stack, 
  Box, 
  Button, 
  Table,
  Divider,
  Badge,
  Collapse
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { supabase } from '@/lib/supabase/client';

export interface ResultCardProps {
  id?: string | number;
  provider: string;
  vendorName?: string;
  logo: string;
  departureTime: string;
  departureDate?: string;
  arrivalTime: string;
  duration: string;
  origin: string;
  destination: string;
  prices: {
    indonesian: {
      adult: number;
      child: number;
    };
    foreigner: {
      adult: number;
      child: number;
    };
  };
  capacity?: number;
  available?: number;
  requestedPassengers?: number;
}

export function ResultCard({
  id,
  provider,
  vendorName,
  logo,
  departureTime,
  arrivalTime,
  departureDate,
  duration,
  origin,
  destination,
  prices,
  capacity,
  available,
  requestedPassengers
}: ResultCardProps) {
  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const priceIdr = prices.indonesian.adult;
  const href = `/speedboat/book?sid=${encodeURIComponent(String(id ?? ''))}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departureTime=${encodeURIComponent(departureTime)}&departureDate=${encodeURIComponent(String(departureDate ?? ''))}&provider=${encodeURIComponent(provider)}&priceIdr=${encodeURIComponent(String(priceIdr))}`;
  const canBook = (Number(available ?? 0) > 0) && ((requestedPassengers ?? 1) <= Number(available ?? 0));
  const logoSrc = logo && String(logo).trim() ? logo : 'https://via.placeholder.com/60';
  const [openedPricing, { toggle: togglePricing }] = useDisclosure(false);

  const handleBookClick = async () => {
    try {
      const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const ret = search.get('return') || '';
      const fromId = search.get('from') || '';
      const toId = search.get('to') || '';
      const passengers = search.get('passengers') || String(requestedPassengers ?? 1);
      const existingRaw = typeof window !== 'undefined' ? (localStorage.getItem('rt_outbound_selected') || '') : '';

      const hasReturn = !!ret;
      if (!hasReturn) {
        try { localStorage.removeItem('rt_outbound_selected'); } catch {}
        try { localStorage.removeItem('rt_passengers'); } catch {}
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
          const totalStr = search.get('passengers') ?? '';
          const total = Number(totalStr);
          if (!(a || c || i)) {
            const t = Number.isFinite(total) && total > 0 ? total : (requestedPassengers ?? 1);
            a = Math.max(1, Number(t) || 1);
            c = 0;
            i = 0;
          }
          const direct = new URLSearchParams();
          direct.set('sid', String(id ?? ''));
          direct.set('origin', origin);
          direct.set('destination', destination);
          direct.set('departureTime', departureTime);
          direct.set('departureDate', String(departureDate ?? ''));
          direct.set('provider', provider);
          direct.set('priceIdr', String(priceIdr));
          direct.set('adult', String(a));
          direct.set('child', String(c));
          direct.set('infant', String(i));
          const target = `/speedboat/book?${direct.toString()}`;
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            window.location.href = `/login?redirectTo=${encodeURIComponent(target)}`;
          } else {
            window.location.href = target;
          }
        } catch {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            window.location.href = `/login?redirectTo=${encodeURIComponent(href)}`;
          } else {
            window.location.href = href;
          }
        }
        return;
      }

      if (existingRaw) {
        let out: any = null;
        try { out = JSON.parse(existingRaw); } catch {}
        const currentFrom = search.get('from') || '';
        const currentTo = search.get('to') || '';
        if (out && currentFrom && currentTo && currentFrom === String(out.from || '') && currentTo === String(out.to || '')) {
          const retDate = ret;
          const pax = passengers;
          const params = new URLSearchParams();
          if (out.to) params.set('from', String(out.to));
          if (out.from) params.set('to', String(out.from));
          if (retDate) params.set('departure', retDate);
          if (retDate) params.set('return', retDate);
          if (pax) params.set('passengers', String(pax));
          window.location.href = `/speedboat?${params.toString()}`;
          return;
        }

        const inbound = {
          sid: String(id ?? ''),
          priceIdr: priceIdr,
          origin,
          destination,
          departureTime,
          departureDate: String(departureDate ?? ''),
          provider,
        };
        try { localStorage.setItem('rt_inbound_selected', JSON.stringify(inbound)); } catch {}
        try { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('rt_inbound_selected')); } } catch {}
        return;
      }

      const outbound = {
        sid: String(id ?? ''),
        priceIdr: priceIdr,
        from: fromId,
        to: toId,
        origin,
        destination,
        departureTime,
        departureDate: String(departureDate ?? ''),
        provider,
      };
      try { localStorage.setItem('rt_outbound_selected', JSON.stringify(outbound)); } catch {}
      try { localStorage.setItem('rt_passengers', String(passengers)); } catch {}
      try { if (typeof window !== 'undefined') { sessionStorage.setItem('rt_popup_outbound_pending', '1'); } } catch {}
      const params = new URLSearchParams();
      if (toId) params.set('from', toId);
      if (fromId) params.set('to', fromId);
      if (ret) params.set('departure', ret);
      if (ret) params.set('return', ret);
      if (passengers) params.set('passengers', String(passengers));
      window.location.href = `/speedboat?${params.toString()}`;
    } catch {
      window.location.href = href;
    }
  };

  return (
    <>
      <Box visibleFrom="md">
        <Card 
          shadow="sm" 
          padding="xl" 
          radius="lg" 
          withBorder
          style={{ 
            backgroundColor: 'white',
            transition: 'box-shadow 0.2s ease',
            ':hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
          }}
        >
          <Group align="flex-start" gap="xl">
            <Avatar
              src={logoSrc}
              alt={provider}
              size={64}
              style={{
                border: '2px solid #fd7e14',
                flexShrink: 0
              }}
            />
            
            <Stack gap="md" style={{ flex: 1 }}>
              <Text fw={600} size="lg" c="dark">
                {provider}
              </Text>
              {vendorName ? (
                <Text size="sm" c="dimmed">{vendorName}</Text>
              ) : null}
              
              <Group gap="xl" align="center">
                <Stack gap="xs" align="center">
                  <Text size="xl" fw={700} c="dark">
                    {departureTime}
                  </Text>
                  <Text size="sm" c="dimmed">{origin}</Text>
                </Stack>
                
                <Stack gap="xs" align="center" style={{ flex: 1 }}>
                  <Text size="xs" c="dimmed">{duration}</Text>
                  <Box style={{ position: 'relative', width: '100%', height: '1px', backgroundColor: '#dee2e6' }}>
                    <Box 
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#6c757d'
                      }}
                    />
                    <Box 
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: '#6c757d'
                      }}
                    />
                  </Box>
                </Stack>
                
                <Stack gap="xs" align="center">
                  <Text size="xl" fw={700} c="dark">
                    {arrivalTime}
                  </Text>
                  <Text size="sm" c="dimmed">{destination}</Text>
                </Stack>
              </Group>
            </Stack>
            
            <Box 
              style={{ 
                backgroundColor: '#e8f1f5', 
                borderRadius: 8, 
                padding: 16, 
                minWidth: 300,
                color: '#000000 !important'
              }}
              c="dark"
            >
              <Group justify="space-between" mb="sm">
                <Text size="sm" c="#000000">Capacity: {typeof capacity === 'number' ? capacity : '-'}</Text>
                <Text size="sm" c="#000000">Available: {typeof available === 'number' ? available : '-'}</Text>
              </Group>
              <Table
                styles={{
                  th: {
                    color: '#000000 !important',
                    fontWeight: 600
                  },
                  td: {
                    color: '#000000 !important',
                    fontWeight: 500
                  },
                  table: {
                    color: '#000000 !important'
                  }
                }}
                c="dark"
              >
                <thead>
                  <tr>
                    <th style={{ color: '#000000', fontWeight: 600 }}>Nationality</th>
                    <th style={{ color: '#000000', fontWeight: 600 }}>Adult</th>
                    <th style={{ color: '#000000', fontWeight: 600 }}>Child</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: '#000000', fontWeight: 500 }}>Indonesian</td>
                    <td style={{ color: '#000000', fontWeight: 500 }}>{formatPrice(prices.indonesian.adult)}</td>
                    <td style={{ color: '#000000', fontWeight: 500 }}>{formatPrice(prices.indonesian.child)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#000000', fontWeight: 500 }}>Foreigner</td>
                    <td style={{ color: '#000000', fontWeight: 500 }}>{formatPrice(prices.foreigner.adult)}</td>
                    <td style={{ color: '#000000', fontWeight: 500 }}>{formatPrice(prices.foreigner.child)}</td>
                  </tr>
                </tbody>
              </Table>
              
              <Divider my="md" />
              
              {canBook ? (
                <Button
                  fullWidth
                  color="#284361"
                  variant="filled"
                  fw={600}
                  style={{
                    backgroundColor: '#284361'
                  }}
                  onClick={handleBookClick}
                >
                  Book Now
                </Button>
              ) : (
                <Button
                  fullWidth
                  color="gray"
                  variant="filled"
                  fw={600}
                  disabled
                  style={{
                    backgroundColor: '#d1d5db'
                  }}
                >
                  Unavailable
                </Button>
              )}
            </Box>
          </Group>
        </Card>
      </Box>

      <Box hiddenFrom="md">
        <Card 
          shadow="sm" 
          padding="md" 
          radius="lg" 
          withBorder
          style={{ backgroundColor: 'white' }}
        >
          <Stack gap="md">
            <Group gap="sm" align="center">
              <Avatar
                src={logoSrc}
                alt={provider}
                size={48}
                style={{ border: '2px solid #fd7e14' }}
              />
              <Stack gap={2}>
                <Text fw={600} size="md" c="dark">{provider}</Text>
                {vendorName ? <Text size="xs" c="dimmed">{vendorName}</Text> : null}
              </Stack>
            </Group>

            <Stack gap={8}>
              <Group justify="space-between" align="center">
                <Stack gap={2} align="flex-start">
                  <Text size="lg" fw={700} c="dark">{departureTime}</Text>
                  <Text size="xs" c="dimmed">{origin}</Text>
                </Stack>
                <Stack gap={2} align="flex-end">
                  <Text size="lg" fw={700} c="dark">{arrivalTime}</Text>
                  <Text size="xs" c="dimmed">{destination}</Text>
                </Stack>
              </Group>
              {duration ? <Text size="xs" c="dimmed">Duration {duration}</Text> : null}
            </Stack>

            <Group gap="xs">
              <Badge variant="light" color="gray">Capacity {typeof capacity === 'number' ? capacity : '-'}</Badge>
              <Badge variant="light" color={canBook ? 'green' : 'red'}>Available {typeof available === 'number' ? available : '-'}</Badge>
            </Group>

            <Group justify="space-between" align="center">
              <Text fw={700} c="#284361">{formatPrice(priceIdr)}</Text>
              {canBook ? (
                <Button
                  onClick={handleBookClick}
                  styles={{ root: { backgroundColor: '#284361' } }}
                  radius="md"
                >
                  Book
                </Button>
              ) : (
                <Button disabled radius="md">Unavailable</Button>
              )}
            </Group>

            <Button variant="light" size="xs" onClick={togglePricing}>
              {openedPricing ? 'Hide pricing details' : 'View pricing details'}
            </Button>
            <Collapse in={openedPricing}>
              <Box 
                style={{ 
                  backgroundColor: '#e8f1f5', 
                  borderRadius: 8, 
                  padding: 12 
                }}
              >
                <Table
                  styles={{
                    th: { fontWeight: 600 },
                    td: { fontWeight: 500 }
                  }}
                >
                  <thead>
                    <tr>
                      <th>Nationality</th>
                      <th>Adult</th>
                      <th>Child</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Indonesian</td>
                      <td>{formatPrice(prices.indonesian.adult)}</td>
                      <td>{formatPrice(prices.indonesian.child)}</td>
                    </tr>
                    <tr>
                      <td>Foreigner</td>
                      <td>{formatPrice(prices.foreigner.adult)}</td>
                      <td>{formatPrice(prices.foreigner.child)}</td>
                    </tr>
                  </tbody>
                </Table>
              </Box>
            </Collapse>
          </Stack>
        </Card>
      </Box>
    </>
  );
}
