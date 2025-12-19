'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { 
  Container, 
  Box, 
  Stack, 
  Title, 
  Text, 
  Group, 
  Button, 
  Card, 
  SimpleGrid, 
  Table, 
  ThemeIcon,
  Flex,
  Center,
  Badge,
  Anchor,
  Grid,
  Menu,
  ActionIcon,
  Modal,
  Loader,
} from '@mantine/core';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { 
  IconCheck, 
  IconDownload, 
  IconHome, 
  IconClock, 
  IconCreditCard, 
  IconMapPin, 
  IconPhone, 
  IconBriefcase, 
  IconUmbrella, 
  IconToolsKitchen2, 
  IconWaveSawTool,
  IconInfoCircle,
  IconDotsVertical,
  IconReceipt
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import QRCode from 'qrcode';
import { useMediaQuery } from '@mantine/hooks';

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [fetching, setFetching] = useState(true);
  const [backLoading, setBackLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const printCSS = `
    @page { size: A4; margin: 16mm; }
    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body * { visibility: hidden !important; }
      #pdf-content, #pdf-content * { visibility: visible !important; }
      #pdf-content { position: absolute; left: 0; top: 0; width: 100%; display: block !important; }
    }
  `;
  const toMinutes = (t?: string) => {
    const s = String(t || '').trim();
    const m = s.match(/^([0-1]?\d|2[0-3]):([0-5]\d)$/);
    if (!m) return null;
    const h = Number(m[1]);
    const mm = Number(m[2]);
    return h * 60 + mm;
  };
  const bookingItems = React.useMemo(() => {
    const supa = Array.isArray((booking as any)?.booking_items) ? (booking as any).booking_items : [];
    if (supa.length) {
      return supa.map((it: any) => ({
        ...it,
        meta: (() => { try { return it.special_requirements ? JSON.parse(it.special_requirements) : undefined; } catch { return undefined; } })(),
      }));
    }
    const prisma = Array.isArray(items) ? items : [];
    return prisma.map((it: any) => ({
      id: it.id,
      participant_name: it.participantName,
      meta: (() => { try { return it.specialRequirements ? JSON.parse(it.specialRequirements) : undefined; } catch { return undefined; } })(),
    }));
  }, [booking, items]);
  const bookingItemsOutbound = React.useMemo(() => {
    const arr = Array.isArray(bookingItems) ? bookingItems : [];
    const allNoRt = arr.every((it: any) => {
      const m = it?.meta || {};
      if (m?.rtType) return false;
      const notes = m?.notes || '';
      if (typeof notes === 'string' && notes) {
        try {
          const inner = JSON.parse(String(notes));
          return !inner?.rtType;
        } catch { return true; }
      }
      return true;
    });
    return arr.filter((it: any) => {
      const m = it?.meta || {};
      const t1 = String(m?.rtType || '').toUpperCase();
      if (t1) return t1 === 'OUTBOUND';
      const notes = m?.notes || '';
      if (typeof notes === 'string' && notes) {
        try {
          const inner = JSON.parse(String(notes));
          const t2 = String(inner?.rtType || '').toUpperCase();
          if (t2) return t2 === 'OUTBOUND';
        } catch { return allNoRt; }
      }
      return allNoRt;
    });
  }, [bookingItems]);
  const bookingItemsInbound = React.useMemo(() => {
    const arr = Array.isArray(bookingItems) ? bookingItems : [];
    return arr.filter((it: any) => {
      const m = it?.meta || {};
      const t1 = String(m?.rtType || '').toUpperCase();
      if (t1) return t1 === 'INBOUND';
      const notes = m?.notes || '';
      if (typeof notes === 'string' && notes) {
        try {
          const inner = JSON.parse(String(notes));
          const t2 = String(inner?.rtType || '').toUpperCase();
          if (t2) return t2 === 'INBOUND';
        } catch { return false; }
      }
      return false;
    });
  }, [bookingItems]);
  const itemsOutboundFull = React.useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    const allNoRt = arr.every((it: any) => {
      try {
        const sr = it?.specialRequirements || '';
        const obj = sr ? JSON.parse(String(sr)) : {};
        const notes = obj?.notes || '';
        if (typeof notes === 'string' && notes) {
          try {
            const inner = JSON.parse(String(notes));
            return !inner?.rtType;
          } catch { return true; }
        }
        return true;
      } catch { return true; }
    });
    return arr.filter((it: any) => {
      try {
        const sr = it?.specialRequirements || '';
        const obj = sr ? JSON.parse(String(sr)) : {};
        const notes = obj?.notes || '';
        if (typeof notes === 'string' && notes) {
          try {
            const inner = JSON.parse(String(notes));
            const t = String(inner?.rtType || '').toUpperCase();
            return t === 'OUTBOUND';
          } catch { return allNoRt; }
        }
        return allNoRt;
      } catch { return allNoRt; }
    });
  }, [items]);
  const itemsInboundFull = React.useMemo(() => {
    const arr = Array.isArray(items) ? items : [];
    return arr.filter((it: any) => {
      try {
        const sr = it?.specialRequirements || '';
        const obj = sr ? JSON.parse(String(sr)) : {};
        const notes = obj?.notes || '';
        if (typeof notes === 'string' && notes) {
          try {
            const inner = JSON.parse(String(notes));
            const t = String(inner?.rtType || '').toUpperCase();
            return t === 'INBOUND';
          } catch { return false; }
        }
        return false;
      } catch { return false; }
    });
  }, [items]);

  function splitName(full?: string) {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
  }

  useEffect(() => {
    const load = async () => {
      try {
        setFetching(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login?redirectTo=/fastboat/book/ticket');
          return;
        }
        const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const idParam = search.get('id');
        const idStorage = typeof window !== 'undefined' ? localStorage.getItem('booking_id') : null;
        const id = idParam || idStorage;
        setBookingId(id || null);
        if (!id) {
          router.replace('/profile/my-bookings');
          return;
        }
        const uid = session.user.id;
        const email = (session.user.email || '').trim().toLowerCase();
        const res = await fetch(`/api/bookings?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`, { cache: 'no-store' });
        if (!res.ok) {
          router.replace('/profile/my-bookings');
          return;
        }
        const json = await res.json();
        const b = json.booking;
        const s = String(b?.status || '').toUpperCase();
        if (!(s === 'PAID' || s === 'COMPLETED')) {
          const qs = new URLSearchParams();
          qs.set('id', String(id));
          router.replace(`/fastboat/book/payment?${qs.toString()}`);
          return;
        }
        setBooking(b);
        setItems(b?.items || []);
      } catch {}
      finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const gen = async () => {
      try {
        if (!bookingId) return;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${origin}/fastboat/book/ticket?id=${encodeURIComponent(bookingId)}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 1 });
        setQrDataUrl(dataUrl);
      } catch {}
    };
    gen();
  }, [bookingId]);

  const handleBackToHome = () => {
    setBackLoading(true);
    try {
      router.push('/');
    } catch {}
  };

  const handleDownloadTicket = () => {
    try {
      const existing = document.getElementById('print-style');
      if (!existing) {
        const styleEl = document.createElement('style');
        styleEl.id = 'print-style';
        styleEl.innerHTML = printCSS;
        document.head.appendChild(styleEl);
      }
      window.print();
    } catch {}
  };

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isDoubleTrip = (() => {
    const hasOutbound = (bookingItemsOutbound.length > 0) || (itemsOutboundFull.length > 0);
    const hasInbound = (bookingItemsInbound.length > 0) || (itemsInboundFull.length > 0);
    return hasOutbound && hasInbound;
  })();

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      <Suspense fallback={<Box style={{ height: 64 }} />}>
        <Header />
      </Suspense>
      
      <Box component="main" style={{ flex: 1 }}>
        <style>{printCSS}</style>
        {isDoubleTrip && (
          <Box id="pdf-content" ref={pdfRef} style={{ display: 'none' }}>
            <Box style={{ backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 8, padding: 24, breakAfter: 'page', pageBreakAfter: 'always' }}>
              <Group justify="space-between" align="flex-start" mb="lg">
                <Stack gap={4}>
                  <Title order={1} size="2xl" fw={700} c="#284361">E‑Ticket Departure</Title>
                  <Text c="dimmed">Booking Code</Text>
                  <Text fw={700} c="#284361">{booking?.bookingCode || booking?.booking_code || '-'}</Text>
                </Stack>
                <Box style={{ border: '2px solid #dee2e6', borderRadius: 8, width: 192, height: 192, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="E-Ticket QR" style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 4 }} />
                  ) : (
                    <Text size="sm" c="dimmed">Generating QR...</Text>
                  )}
                </Box>
              </Group>
              <SimpleGrid cols={6} spacing="md" mb="lg">
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Passengers</Text>
                  <Text fw={600} c="#284361">{itemsOutboundFull.reduce((acc, it: any) => acc + (it.quantity || 0), 0)}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Category</Text>
                  <Text fw={600} c="#284361">{itemsOutboundFull?.[0]?.product?.category?.name || '-'}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Provider Name</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const t = (booking as any)?.tenant || {};
                    const vendor = t.vendorName || t.vendor_name || '';
                    return vendor || itemsOutboundFull?.[0]?.product?.name || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Boat Name</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                    const bn = (s as any)?.boat?.name || '';
                    return bn || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Route</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                    const dep = s?.departureRoute?.name;
                    const arr = s?.arrivalRoute?.name;
                    return dep && arr ? `${dep} → ${arr}` : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Departure Date</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const dt = (itemsOutboundFull?.[0] as any)?.itemDate ?? (itemsOutboundFull?.[0] as any)?.inventory?.inventoryDate ?? null;
                    return dt ? new Date(dt).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Departure Time</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                    const depStr = s?.departureTime || s?.departure_time || '';
                    return depStr || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Arrival Time</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                    const arrStr = s?.arrivalTime || s?.arrival_time || '';
                    return arrStr || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Duration</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                    const depStr = s?.departureTime || s?.departure_time || '';
                    const arrStr = s?.arrivalTime || s?.arrival_time || '';
                    const dm = toMinutes(depStr);
                    const am = toMinutes(arrStr);
                    return dm != null && am != null && am >= dm ? `${am - dm} min` : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Payment Method</Text>
                  <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Booking Date</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const cr = (booking as any)?.created_at ?? (booking as any)?.createdAt ?? null;
                    return cr ? new Date(cr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Status</Text>
                  <Group gap="xs">
                    <IconCheck size={16} color="#2dbe8d" />
                    <Text fw={600} c="#2dbe8d">{booking?.status === 'PAID' || booking?.status === 'COMPLETED' ? 'Confirmed' : booking?.status}</Text>
                  </Group>
                </Box>
              </SimpleGrid>
              <Box mt="md" pb="sm">
                <Text size="lg" fw={600} c="#284361">Passenger Details</Text>
              </Box>
              <Table>
                <Table.Thead>
                  <Table.Tr style={{ backgroundColor: '#f9fafb' }}>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>No.</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Name</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Age Category</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bookingItemsOutbound.map((it: any, idx: number) => {
                    const parts = String(it.participant_name || '').trim().split(/\s+/).filter(Boolean);
                    const nm = { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
                    const meta = it.meta || {};
                    return (
                      <Table.Tr key={it.id || idx}>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{idx + 1}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{`${meta.firstName || nm.first || '-'} ${meta.lastName || nm.last || ''}`.trim()}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.ageCategory || '-'}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>
            <Box style={{ backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 8, padding: 24, breakAfter: 'page', pageBreakAfter: 'always' }}>
              <Group justify="space-between" align="flex-start" mb="lg">
                <Stack gap={4}>
                  <Title order={1} size="2xl" fw={700} c="#284361">E‑Ticket Return</Title>
                  <Text c="dimmed">Booking Code</Text>
                  <Text fw={700} c="#284361">{booking?.bookingCode || booking?.booking_code || '-'}</Text>
                </Stack>
                <Box style={{ border: '2px solid #dee2e6', borderRadius: 8, width: 192, height: 192, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="E-Ticket QR" style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 4 }} />
                  ) : (
                    <Text size="sm" c="dimmed">Generating QR...</Text>
                  )}
                </Box>
              </Group>
              <SimpleGrid cols={6} spacing="md" mb="lg">
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Passengers</Text>
                  <Text fw={600} c="#284361">{itemsInboundFull.reduce((acc, it: any) => acc + (it.quantity || 0), 0)}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Category</Text>
                  <Text fw={600} c="#284361">{itemsInboundFull?.[0]?.product?.category?.name || '-'}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Provider Name</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const t = (booking as any)?.tenant || {};
                    const vendor = t.vendorName || t.vendor_name || '';
                    return vendor || itemsInboundFull?.[0]?.product?.name || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Boat Name</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                    const bn = (s as any)?.boat?.name || '';
                    return bn || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Route</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                    const dep = s?.departureRoute?.name;
                    const arr = s?.arrivalRoute?.name;
                    return dep && arr ? `${dep} → ${arr}` : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Return Date</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const dt = (itemsInboundFull?.[0] as any)?.itemDate ?? (itemsInboundFull?.[0] as any)?.inventory?.inventoryDate ?? null;
                    return dt ? new Date(dt).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Return Time</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                    const depStr = s?.departureTime || s?.departure_time || '';
                    return depStr || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Arrival Time</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                    const arrStr = s?.arrivalTime || s?.arrival_time || '';
                    return arrStr || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Duration</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                    const depStr = s?.departureTime || s?.departure_time || '';
                    const arrStr = s?.arrivalTime || s?.arrival_time || '';
                    const dm = toMinutes(depStr);
                    const am = toMinutes(arrStr);
                    return dm != null && am != null && am >= dm ? `${am - dm} min` : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Payment Method</Text>
                  <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Booking Date</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const cr = (booking as any)?.created_at ?? (booking as any)?.createdAt ?? null;
                    return cr ? new Date(cr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Status</Text>
                  <Group gap="xs">
                    <IconCheck size={16} color="#2dbe8d" />
                    <Text fw={600} c="#2dbe8d">{booking?.status === 'PAID' || booking?.status === 'COMPLETED' ? 'Confirmed' : booking?.status}</Text>
                  </Group>
                </Box>
              </SimpleGrid>
              <Box mt="md" pb="sm">
                <Text size="lg" fw={600} c="#284361">Passenger Details</Text>
              </Box>
              <Table>
                <Table.Thead>
                  <Table.Tr style={{ backgroundColor: '#f9fafb' }}>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>No.</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Name</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Age Category</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bookingItemsInbound.map((it: any, idx: number) => {
                    const parts = String(it.participant_name || '').trim().split(/\s+/).filter(Boolean);
                    const nm = { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
                    const meta = it.meta || {};
                    return (
                      <Table.Tr key={it.id || idx}>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{idx + 1}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{`${meta.firstName || nm.first || '-'} ${meta.lastName || nm.last || ''}`.trim()}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.ageCategory || '-'}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>
            <Box style={{ backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 8, padding: 24 }}>
              <Title order={1} size="xl" fw={700} c="#284361" mb="md">Page Information</Title>
              <Group align="flex-start" gap="md" mb="lg">
                <img
                  src={itemsOutboundFull?.[0]?.product?.featuredImage || 'https://via.placeholder.com/80x80?text=FB'}
                  alt="Fastboat/Vendor"
                  style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }}
                />
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>Fastboat Details</Text>
                  <Text size="sm" c="dimmed" mb={8}>
                    {(() => {
                      const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                      const boat = (s as any)?.boat?.name || '';
                      const t = (booking as any)?.tenant || {};
                      const vendor = t.vendorName || t.vendor_name || '';
                      const op = vendor || 'Fastboat Operator';
                      const bn = boat || 'Boat';
                      return `Operated by ${op} • ${bn}`;
                    })()}
                  </Text>
                  <Stack gap={4}>
                    <Text c="dark">• Safe & reliable service</Text>
                    <Text c="dark">• Check‑in 30 minutes before departure</Text>
                    <Text c="dark">• Life jackets and basic seating onboard</Text>
                  </Stack>
                </Box>
              </Group>
              <Group align="flex-start" gap="md" mb="lg">
                <img
                  src={itemsInboundFull?.[0]?.product?.featuredImage || 'https://via.placeholder.com/80x80?text=FB'}
                  alt="Fastboat/Vendor"
                  style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }}
                />
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>Fastboat Details</Text>
                  <Text size="sm" c="dimmed" mb={8}>
                    {(() => {
                      const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                      const boat = (s as any)?.boat?.name || '';
                      const t = (booking as any)?.tenant || {};
                      const vendor = t.vendorName || t.vendor_name || '';
                      const op = vendor || 'Fastboat Operator';
                      const bn = boat || 'Boat';
                      return `Operated by ${op} • ${bn}`;
                    })()}
                  </Text>
                  <Stack gap={4}>
                    <Text c="dark">• Safe & reliable service</Text>
                    <Text c="dark">• Check‑in 30 minutes before departure</Text>
                    <Text c="dark">• Life jackets and basic seating onboard</Text>
                  </Stack>
                </Box>
              </Group>
              <Group align="flex-start" gap="md" mb="lg">
                <ThemeIcon size={56} radius="md" color="blue" variant="light">
                  <IconInfoCircle size={28} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>Requirements</Text>
                  <Text c="dark">• Bawa identitas resmi (KTP/Paspor) saat check‑in</Text>
                  <Text c="dark">• Tiba minimal 30 menit sebelum jadwal keberangkatan</Text>
                  <Text c="dark">• Tunjukkan e‑ticket/QR di konter</Text>
                  <Text c="dark">• Patuhi kebijakan bagasi yang berlaku</Text>
                </Box>
              </Group>
              <Group align="flex-start" gap="md" mb="lg">
                <ThemeIcon size={56} radius="md" color="blue" variant="light">
                  <IconReceipt size={28} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>How to Refund</Text>
                  <Text c="dark">• Buka halaman My Bookings</Text>
                  <Text c="dark">• Pilih booking terkait, klik Refund</Text>
                  <Text c="dark">• Ikuti alur dan pantau status pengajuan refund</Text>
                  <Text c="dark">• Refund tunduk pada kebijakan operator</Text>
                  <Anchor size="sm" c="#284361" fw={500} href="/profile/my-bookings" mt={8}>
                    Go to My Bookings
                  </Anchor>
                </Box>
              </Group>
              <Group align="flex-start" gap="md">
                <ThemeIcon size={56} radius="md" color="blue" variant="light">
                  <IconPhone size={28} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>Help & Support</Text>
                  <Text c="dark">• Hubungi operator: {(() => {
                    const t = (booking as any)?.tenant || {};
                    const phone = t.phoneNumber || t.phone_number || '';
                    return phone || '-';
                  })()}</Text>
                  <Text c="dark">• Kunjungi My Bookings untuk bantuan lanjutan</Text>
                </Box>
              </Group>
            </Box>
            <Box style={{ backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 8, padding: 24, breakBefore: 'page', pageBreakBefore: 'always' }}>
              <Title order={1} size="xl" fw={700} c="#284361" mb="md">Receipt</Title>
              <Stack gap="md" mb="lg">
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Booking Code</Text>
                  <Text fw={700} c="#284361">{booking?.bookingCode || booking?.booking_code || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Customer</Text>
                  <Text fw={600} c="#284361">{booking?.customerName || booking?.customerEmail || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Payment Method</Text>
                  <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Invoice</Text>
                  <Text fw={600} c="#284361">{booking?.xenditInvoiceId || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Paid Amount</Text>
                  <Text fw={700} c="#284361">{(() => {
                    const amt = booking?.paidAmount ?? booking?.totalAmount;
                    if (!amt) return '-';
                    const n = Number(amt);
                    const cur = String(booking?.currency || 'IDR');
                    return `${cur} ${cur === 'USD' ? n.toLocaleString('en-US', { minimumFractionDigits: 2 }) : n.toLocaleString('id-ID')}`;
                  })()}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Paid At</Text>
                  <Text fw={600} c="#284361">{booking?.paidAt ? new Date(booking.paidAt).toLocaleString('id-ID', { hour12: false }) : '-'}</Text>
                </Group>
              </Stack>
              <Stack gap="xs">
                <Text c="dark">• This receipt is generated electronically.</Text>
                <Text c="dark">• Keep this document for your records.</Text>
                <Text c="dark">• For assistance, visit My Bookings or Support Center.</Text>
              </Stack>
            </Box>
          </Box>
        )}
        <Container size="xl" py="xl">
          {/* Confirmation Message */}
          <Stack align="center" gap="md" mb="xl">
            <ThemeIcon size={64} radius="xl" color="green" variant="light">
              <IconCheck size={32} />
            </ThemeIcon>
            <Title order={1} size="2xl" fw={700} c="#284361" ta="center">
              Booking Confirmed
            </Title>
            <Text c="dimmed" ta="center" mb="xs">
              Thank you for booking with Best Trip Guide. Your payment via QRIS has
              been received successfully.
            </Text>
            <Text c="dimmed" ta="center">
              We've also sent your e-ticket and booking details to your email.
            </Text>
          </Stack>

          {/* Action Buttons */}
          <Group justify="center" gap="md" mb="xl">
            <Button 
              onClick={handleDownloadTicket}
              leftSection={<IconDownload size={20} />}
              color="#284361"
              size="md"
            >
              Download E-Ticket (PDF)
            </Button>
            <Button 
              onClick={handleBackToHome}
              leftSection={<IconHome size={20} />}
              variant="light"
              color="#284361"
              size="md"
              loading={backLoading}
              disabled={backLoading}
            >
              Back to Homepage
            </Button>
          </Group>

          {/* Main Content Grid */}
          {!isDoubleTrip && (
          <Box id="print-area" ref={printRef}>
          <Grid gutter="xl" mb="xl">
            {/* Left Column - E-Ticket Summary */}
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Stack gap="xl">
                <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                  {fetching && (
                    <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                      <Loader color="#284361" />
                    </Box>
                  )}
                  <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
                    Departure E‑Ticket Summary
                  </Title>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Booking Code</Text>
                      <Text fw={600} c="#284361">{booking?.bookingCode || booking?.booking_code || '-'}</Text>
                    </Box>
                    <Box></Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Passengers</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const byItems = items.reduce((acc, it: any) => acc + (Number(it.quantity) || 0), 0);
                        const byBookingItems = Array.isArray(bookingItems) ? bookingItems.length : 0;
                        return byItems || byBookingItems;
                      })()}</Text>
                    </Box>
                    
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Category</Text>
                      <Text fw={600} c="#284361">{items?.[0]?.product?.category?.name || '-'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Provider Name</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const t = (booking as any)?.tenant || {};
                        const vendor = t.vendorName || t.vendor_name || '';
                        return vendor || items?.[0]?.product?.name || '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Boat Name</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const s = items?.[0]?.product?.fastboatSchedule;
                        const bn = (s as any)?.boat?.name || '';
                        return bn || '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Route</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const s = items?.[0]?.product?.fastboatSchedule;
                        const dep = s?.departureRoute?.name;
                        const arr = s?.arrivalRoute?.name;
                        return dep && arr ? `${dep} → ${arr}` : '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Departure Date</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const d = booking?.bookingDate;
                        return d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                      })()}</Text>
                    </Box>
                    
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Departure Time</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const s = items?.[0]?.product?.fastboatSchedule;
                        const depStr = s?.departureTime || s?.departure_time || '';
                        return depStr || '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Arrival Time</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const s = items?.[0]?.product?.fastboatSchedule;
                        const arrStr = s?.arrivalTime || s?.arrival_time || '';
                        return arrStr || '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Duration</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const s = items?.[0]?.product?.fastboatSchedule;
                        const depStr = s?.departureTime || s?.departure_time || '';
                        const arrStr = s?.arrivalTime || s?.arrival_time || '';
                        const dm = toMinutes(depStr);
                        const am = toMinutes(arrStr);
                        return dm != null && am != null && am >= dm ? `${am - dm} min` : '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Payment Method</Text>
                      <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Booking Date</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const cr = (booking as any)?.created_at ?? (booking as any)?.createdAt ?? null;
                        return cr ? new Date(cr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Status</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="#2dbe8d" />
                        <Text fw={600} c="#2dbe8d">{booking?.status === 'PAID' || booking?.status === 'COMPLETED' ? 'Confirmed' : booking?.status}</Text>
                      </Group>
                    </Box>
                  </SimpleGrid>
                  <Box mt="xl" pt="xl" style={{ borderTop: '1px solid #e9ecef' }}>
                    <Group justify="space-between" align="center">
                      <Text size="lg" fw={600} c="#284361">
                        Total Paid
                      </Text>
                      <Text size="2xl" fw={700} c="#284361">{(() => {
                        const amt = booking?.paidAmount ?? booking?.totalAmount;
                        if (!amt) return '-';
                        const n = Number(amt);
                        const cur = String(booking?.currency || 'IDR');
                        return `${cur} ${cur === 'USD' ? n.toLocaleString('en-US', { minimumFractionDigits: 2 }) : n.toLocaleString('id-ID')}`;
                      })()}</Text>
                    </Group>
                  </Box>
                </Card>
              </Stack>
            </Grid.Col>

            {/* Right Column - QR Code & Travel Tips */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack gap="xl">
              <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                {fetching && (
                  <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                    <Loader color="#284361" />
                  </Box>
                )}
                <Title order={2} size="xl" fw={600} c="#284361" mb="lg">
                  E-Ticket QR Code
                </Title>
                <Box bg="#f8f9fa" p="xl" style={{ borderRadius: 8 }} mb="lg">
                  <Center>
                    <Box 
                      w={192} 
                      h={192} 
                      bg="white" 
                      style={{ 
                        border: '2px solid #dee2e6', 
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box ta="center" c="dimmed" w={160} h={160} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt="E-Ticket QR"
                            style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 4 }}
                          />
                        ) : (
                          <Text size="sm" c="dimmed">Generating QR...</Text>
                        )}
                      </Box>
                    </Box>
                  </Center>
                </Box>
                <Text size="sm" c="dimmed" ta="center">
                  Show this QR at the counter for verification.
                </Text>
              </Card>

              <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                {fetching && (
                  <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                    <Loader color="#284361" />
                  </Box>
                )}
                <Title order={2} size="lg" fw={600} c="#284361" mb="lg">
                  Travel Tips
                </Title>
                <Stack gap="lg">
                  <Group align="flex-start" gap="md">
                    <IconClock size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Box style={{ flex: 1 }}>
                      <Text fw={500} c="#284361" size="sm">
                        Before You Go:
                      </Text>
                      <Text size="sm" c="dimmed">
                        Arrive 30 minutes before departure.
                      </Text>
                    </Box>
                  </Group>
                  <Group align="flex-start" gap="md">
                    <IconCreditCard size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" c="dimmed">
                        Bring your ID for check-in.
                      </Text>
                    </Box>
                  </Group>
                  <Group align="flex-start" gap="md">
                    <IconPhone size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" c="dimmed">
                        Keep this ticket accessible on your phone.
                      </Text>
                    </Box>
                  </Group>
                  <Group align="flex-start" gap="md">
                    <IconUmbrella size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" c="dimmed">
                        Contact our staff if weather conditions change.
                      </Text>
                    </Box>
                  </Group>
                </Stack>
              </Card>
              </Stack>
            </Grid.Col>
          </Grid>

          <Box id="pdf-content" ref={pdfRef} style={{ display: 'none' }}>
            {/* Page 1: E‑Ticket Essentials */}
            <Box style={{ backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 8, padding: 24, breakAfter: 'page', pageBreakAfter: 'always' }}>
              <Group justify="space-between" align="flex-start" mb="lg">
                <Stack gap={4}>
                  <Title order={1} size="2xl" fw={700} c="#284361">E‑Ticket Departure</Title>
                  <Text c="dimmed">Booking Code</Text>
                  <Text fw={700} c="#284361">{booking?.bookingCode || booking?.booking_code || '-'}</Text>
                </Stack>
                <Box style={{ border: '2px solid #dee2e6', borderRadius: 8, width: 192, height: 192, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white' }}>
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="E-Ticket QR" style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 4 }} />
                  ) : (
                    <Text size="sm" c="dimmed">Generating QR...</Text>
                  )}
                </Box>
              </Group>
              <SimpleGrid cols={6} spacing="md" mb="lg">
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Passengers</Text>
                  <Text fw={600} c="#284361">{items.reduce((acc, it: any) => acc + (it.quantity || 0), 0)}</Text>
                </Box>
                
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Category</Text>
                  <Text fw={600} c="#284361">{items?.[0]?.product?.category?.name || '-'}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Provider Name</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const t = (booking as any)?.tenant || {};
                    const vendor = t.vendorName || t.vendor_name || '';
                    return vendor || items?.[0]?.product?.name || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Boat Name</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = items?.[0]?.product?.fastboatSchedule;
                    const bn = (s as any)?.boat?.name || '';
                    return bn || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Route</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = items?.[0]?.product?.fastboatSchedule;
                    const dep = s?.departureRoute?.name;
                    const arr = s?.arrivalRoute?.name;
                    return dep && arr ? `${dep} → ${arr}` : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Departure Date</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const d = booking?.bookingDate;
                    return d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                  })()}</Text>
                </Box>
                
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Departure Time</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = items?.[0]?.product?.fastboatSchedule;
                    const depStr = s?.departureTime || s?.departure_time || '';
                    return depStr || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Arrival Time</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = items?.[0]?.product?.fastboatSchedule;
                    const arrStr = s?.arrivalTime || s?.arrival_time || '';
                    return arrStr || '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Duration</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const s = items?.[0]?.product?.fastboatSchedule;
                    const depStr = s?.departureTime || s?.departure_time || '';
                    const arrStr = s?.arrivalTime || s?.arrival_time || '';
                    const dm = toMinutes(depStr);
                    const am = toMinutes(arrStr);
                    return dm != null && am != null && am >= dm ? `${am - dm} min` : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Payment Method</Text>
                  <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
                </Box>
                
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Booking Date</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const cr = (booking as any)?.created_at ?? (booking as any)?.createdAt ?? null;
                    return cr ? new Date(cr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                  })()}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Status</Text>
                  <Group gap="xs">
                    <IconCheck size={16} color="#2dbe8d" />
                    <Text fw={600} c="#2dbe8d">{booking?.status === 'PAID' || booking?.status === 'COMPLETED' ? 'Confirmed' : booking?.status}</Text>
                  </Group>
                </Box>
              </SimpleGrid>
              <Box mt="md" pb="sm">
                <Text size="lg" fw={600} c="#284361">Passenger Details</Text>
              </Box>
              <Table>
                <Table.Thead>
                  <Table.Tr style={{ backgroundColor: '#f9fafb' }}>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>No.</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Name</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Age Category</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bookingItems.map((it: any, idx: number) => {
                    const parts = String(it.participant_name || '').trim().split(/\s+/).filter(Boolean);
                    const nm = { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
                    const meta = it.meta || {};
                    return (
                      <Table.Tr key={it.id || idx}>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{idx + 1}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{`${meta.firstName || nm.first || '-'} ${meta.lastName || nm.last || ''}`.trim()}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.ageCategory || '-'}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Box>

            <Box style={{ backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 8, padding: 24 }}>
              <Title order={1} size="xl" fw={700} c="#284361" mb="md">Page Information</Title>
              {/* <img
                src={items?.[0]?.product?.featuredImage || 'https://via.placeholder.com/800x300?text=Fastboat'}
                alt="Fastboat/Vendor"
                style={{ width: 240, height: 'auto', borderRadius: 8, marginBottom: 12 }}
              /> */}
              {/* <Text size="sm" c="dimmed">
                {(() => {
                  const s = items?.[0]?.product?.fastboatSchedule;
                  const boat = (s as any)?.boat?.name || '';
                  const t = (booking as any)?.tenant || {};
                  const vendor = t.vendorName || t.vendor_name || '';
                  return boat || vendor || '-';
                })()}
              </Text> */}

              <Group align="flex-start" gap="md" mb="lg">
                <img
                  src={items?.[0]?.product?.featuredImage || 'https://via.placeholder.com/80x80?text=FB'}
                  alt="Fastboat/Vendor"
                  style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }}
                />
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>Fastboat Details</Text>
                  <Text size="sm" c="dimmed" mb={8}>
                    {(() => {
                      const s = items?.[0]?.product?.fastboatSchedule;
                      const boat = (s as any)?.boat?.name || '';
                      const t = (booking as any)?.tenant || {};
                      const vendor = t.vendorName || t.vendor_name || '';
                      const op = vendor || 'Fastboat Operator';
                      const bn = boat || 'Boat';
                      return `Operated by ${op} • ${bn}`;
                    })()}
                  </Text>
                  <Stack gap={4}>
                    <Text c="dark">• Safe & reliable service</Text>
                    <Text c="dark">• Check‑in 30 minutes before departure</Text>
                    <Text c="dark">• Life jackets and basic seating onboard</Text>
                  </Stack>
                </Box>
              </Group>

              <Group align="flex-start" gap="md" mb="lg">
                <ThemeIcon size={56} radius="md" color="blue" variant="light">
                  <IconInfoCircle size={28} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>Requirements</Text>
                  <Text c="dark">• Bawa identitas resmi (KTP/Paspor) saat check‑in</Text>
                  <Text c="dark">• Tiba minimal 30 menit sebelum jadwal keberangkatan</Text>
                  <Text c="dark">• Tunjukkan e‑ticket/QR di konter</Text>
                  <Text c="dark">• Patuhi kebijakan bagasi yang berlaku</Text>
                </Box>
              </Group>

              <Group align="flex-start" gap="md" mb="lg">
                <ThemeIcon size={56} radius="md" color="blue" variant="light">
                  <IconReceipt size={28} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>How to Refund</Text>
                  <Text c="dark">• Buka halaman My Bookings</Text>
                  <Text c="dark">• Pilih booking terkait, klik Refund</Text>
                  <Text c="dark">• Ikuti alur dan pantau status pengajuan refund</Text>
                  <Text c="dark">• Refund tunduk pada kebijakan operator</Text>
                  <Anchor size="sm" c="#284361" fw={500} href="/profile/my-bookings" mt={8}>
                    Go to My Bookings
                  </Anchor>
                </Box>
              </Group>

              <Group align="flex-start" gap="md">
                <ThemeIcon size={56} radius="md" color="blue" variant="light">
                  <IconPhone size={28} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>Help & Support</Text>
                  <Text c="dark">• Hubungi operator: {(() => {
                    const t = (booking as any)?.tenant || {};
                    const phone = t.phoneNumber || t.phone_number || '';
                    return phone || '-';
                  })()}</Text>
                  <Text c="dark">• Kunjungi My Bookings untuk bantuan lanjutan</Text>
                  <Text c="dark">• Simpan e‑ticket ini untuk keperluan verifikasi</Text>
                  <Anchor size="sm" c="#284361" fw={500} href="/profile/support-center" mt={8}>
                    Contact Support
                  </Anchor>
                </Box>
              </Group>
            </Box>
            <Box style={{ backgroundColor: 'white', border: '1px solid #e9ecef', borderRadius: 8, padding: 24, breakBefore: 'page', pageBreakBefore: 'always' }}>
              <Title order={1} size="xl" fw={700} c="#284361" mb="md">Receipt</Title>
              <Stack gap="md" mb="lg">
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Booking Code</Text>
                  <Text fw={700} c="#284361">{booking?.bookingCode || booking?.booking_code || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Customer</Text>
                  <Text fw={600} c="#284361">{booking?.customerName || booking?.customerEmail || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Vendor</Text>
                  <Text fw={600} c="#284361">{(() => {
                    const t = (booking as any)?.tenant || {};
                    const vendor = t.vendorName || t.vendor_name || '';
                    return vendor || '-';
                  })()}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Payment Method</Text>
                  <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Invoice</Text>
                  <Text fw={600} c="#284361">{booking?.xenditInvoiceId || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Paid Amount</Text>
                  <Text fw={700} c="#284361">{(() => {
                    const amt = booking?.paidAmount ?? booking?.totalAmount;
                    if (!amt) return '-';
                    const n = Number(amt);
                    const cur = String(booking?.currency || 'IDR');
                    return `${cur} ${cur === 'USD' ? n.toLocaleString('en-US', { minimumFractionDigits: 2 }) : n.toLocaleString('id-ID')}`;
                  })()}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Paid At</Text>
                  <Text fw={600} c="#284361">{booking?.paidAt ? new Date(booking.paidAt).toLocaleString('id-ID', { hour12: false }) : '-'}</Text>
                </Group>
              </Stack>
              <Stack gap="xs">
                <Text c="dark">• This receipt is generated electronically.</Text>
                <Text c="dark">• Keep this document for your records.</Text>
                <Text c="dark">• For assistance, visit My Bookings or Support Center.</Text>
              </Stack>
            </Box>
          </Box>

          {/* Contact Details */}
          <Card withBorder radius="md" p="xl" mb="xl" bg="white" style={{ position: 'relative' }}>
            {fetching && (
              <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                <Loader color="#284361" />
              </Box>
            )}
            <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
              Contact Details
            </Title>
            {isMobile ? (
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">No.</Text>
                  <Text size="sm" fw={600} c="#284361">1</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">Name</Text>
                  <Text size="sm" fw={600} c="#284361">{booking?.customerName || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">Email</Text>
                  <Text size="sm" c="dark">{booking?.customerEmail || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">Phone Number</Text>
                  <Text size="sm" c="dark">{booking?.customerPhone || '-'}</Text>
                </Group>
              </Stack>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>
                      <Text size="sm" fw={500} c="dimmed">No.</Text>
                    </Table.Th>
                    <Table.Th>
                      <Text size="sm" fw={500} c="dimmed">Name</Text>
                    </Table.Th>
                    <Table.Th>
                      <Text size="sm" fw={500} c="dimmed">Email</Text>
                    </Table.Th>
                    <Table.Th>
                      <Text size="sm" fw={500} c="dimmed">Phone Number</Text>
                    </Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  <Table.Tr>
                    <Table.Td>
                      <Text size="sm" c="dark">1</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={500} c="#284361">{booking?.customerName || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dark">{booking?.customerEmail || '-'}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dark">{booking?.customerPhone || '-'}</Text>
                    </Table.Td>
                  </Table.Tr>
                </Table.Tbody>
              </Table>
            )}
            <Group gap="xs" mt="lg">
              <ThemeIcon size={16} radius="xl" color="blue" variant="light">
                <IconInfoCircle size={12} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">
                Please bring your ID or passport for check-in verification.
              </Text>
            </Group>
          </Card>

          {/* Passenger Details */}
          <Card withBorder radius="md" p="xl" mb="xl" bg="white" style={{ position: 'relative' }}>
            {fetching && (
              <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                <Loader color="#284361" />
              </Box>
            )}
            <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
              Passenger Details
            </Title>
            {isMobile ? (
              <Stack gap="sm">
                {bookingItems.map((it: any, idx: number) => {
                  const parts = String(it.participant_name || '').trim().split(/\s+/).filter(Boolean);
                  const nm = { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
                  const meta = it.meta || {};
                  const fullName = `${meta.title ? meta.title + ' ' : ''}${meta.firstName || nm.first || '-'} ${meta.lastName || nm.last || ''}`.trim();
                  return (
                    <Box key={it.id || idx} style={{ border: '1px solid #e9ecef', borderRadius: 8, padding: 12 }}>
                      <Group justify="space-between" align="center">
                        <Badge color="gray" variant="light" styles={{ root: { borderRadius: 8 } }}>{idx + 1}</Badge>
                        {meta.ageCategory ? (
                          <Badge color="blue" variant="light" styles={{ root: { borderRadius: 8 } }}>{meta.ageCategory}</Badge>
                        ) : null}
                      </Group>
                      <Text fw={600} c="#284361" mt={6}>{fullName}</Text>
                      <SimpleGrid cols={{ base: 2, md: 3 }} spacing="xs" mt={8}>
                        <Box>
                          <Text size="xs" c="dimmed">Nationality</Text>
                          <Text size="sm" c="#111827">{meta.nationality || '-'}</Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed">Identity Type</Text>
                          <Text size="sm" c="#111827">{meta.identityType || '-'}</Text>
                        </Box>
                        <Box>
                          <Text size="xs" c="dimmed">ID Number</Text>
                          <Text size="sm" c="#111827">{meta.idNumber || '-'}</Text>
                        </Box>
                      </SimpleGrid>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr style={{ backgroundColor: '#f9fafb' }}>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>No.</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Title</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>First Name</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Last Name</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Nationality</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Identity Type</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>ID Number</Table.Th>
                    <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Age Category</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bookingItems.map((it: any, idx: number) => {
                    const parts = String(it.participant_name || '').trim().split(/\s+/).filter(Boolean);
                    const nm = { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
                    const meta = it.meta || {};
                    return (
                      <Table.Tr key={it.id || idx}>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{idx + 1}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.title || '-'}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.firstName || nm.first || '-'}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.lastName || nm.last || '-'}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.nationality || '-'}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.identityType || '-'}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.idNumber || '-'}</Table.Td>
                        <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.ageCategory || '-'}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
            <Group gap="xs" mt="lg">
              <ThemeIcon size={16} radius="xl" color="blue" variant="light">
                <IconInfoCircle size={12} />
              </ThemeIcon>
              <Text size="sm" c="dimmed">
                Please bring your ID or passport for check-in verification.
              </Text>
            </Group>
          </Card>

          {/* Additional Packages */}
          {/* <Card withBorder radius="md" p="xl" mb="xl" bg="white">
            <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
              Additional Packages Included
            </Title>
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
              <Group align="flex-start" gap="md" p="md" bg="gray.0" style={{ borderRadius: '8px' }}>
                <ThemeIcon size={48} radius="xl" color="blue" variant="light" style={{ flexShrink: 0 }}>
                  <IconUmbrella size={24} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361">
                    VIP Beach Club Access
                  </Text>
                  <Group gap="xs" mt={4}>
                    <IconCheck size={16} color="#2dbe8d" />
                    <Text size="sm" c="#2dbe8d">Confirmed</Text>
                  </Group>
                </Box>
              </Group>
              <Group align="flex-start" gap="md" p="md" bg="gray.0" style={{ borderRadius: '8px' }}>
                <ThemeIcon size={48} radius="xl" color="orange" variant="light" style={{ flexShrink: 0 }}>
                  <IconToolsKitchen2 size={24} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361">
                    Balinese Lunch Package
                  </Text>
                  <Group gap="xs" mt={4}>
                    <IconCheck size={16} color="#2dbe8d" />
                    <Text size="sm" c="#2dbe8d">Confirmed</Text>
                  </Group>
                </Box>
              </Group>
              <Group align="flex-start" gap="md" p="md" bg="gray.0" style={{ borderRadius: '8px' }}>
                <ThemeIcon size={48} radius="xl" color="teal" variant="light" style={{ flexShrink: 0 }}>
                  <IconWaveSawTool size={24} />
                </ThemeIcon>
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361">
                    Snorkeling Experience
                  </Text>
                  <Group gap="xs" mt={4}>
                    <IconCheck size={16} color="#2dbe8d" />
                    <Text size="sm" c="#2dbe8d">Confirmed</Text>
                  </Group>
                </Box>
              </Group>
            </SimpleGrid>
            <Text size="sm" c="dimmed" mt="md">
              Your add-on activities will be coordinated automatically upon
              arrival at Nusa Penida.
            </Text>
          </Card> */}

          {/* Boarding Information */}
          <Card withBorder radius="md" p="xl" mb="xl" bg="white" style={{ position: 'relative' }}>
            {fetching && (
              <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                <Loader color="#284361" />
              </Box>
            )}
            <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
              Boarding Information
            </Title>
            <Stack gap="xl">
              <Group align="flex-start" gap="md">
                <IconMapPin size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>
                    Departure Point
                  </Text>
                  <Text c="dark" mb={8}>
                    {(() => {
                      const t = (booking as any)?.tenant || {};
                      const addr = t.businessAddress || t.business_address || '';
                      return addr || '-';
                    })()}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {(() => {
                      const t = (booking as any)?.tenant || {};
                      const vendor = t.vendorName || t.vendor_name || '';
                      return vendor ? `Managed by ${vendor}` : 'Check-in counter near Caspla Ticket Office';
                    })()}
                  </Text>
                  <Anchor size="sm" c="#284361" fw={500} mt={8}>
                    View on Google Maps
                  </Anchor>
                </Box>
              </Group>
              <Group align="flex-start" gap="md">
                <IconClock size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>
                    Boarding Time
                  </Text>
                  <Text c="dark">
                    {(() => {
                      const s = items?.[0]?.product?.fastboatSchedule;
                      const depStr = s?.departureTime || s?.departure_time || '';
                      const dm = toMinutes(depStr);
                      if (dm == null) return '-';
                      const btm = Math.max(0, dm - 30);
                      const hh = String(Math.floor(btm / 60)).padStart(2, '0');
                      const mm = String(btm % 60).padStart(2, '0');
                      return `${hh}:${mm} (30 minutes before departure)`;
                    })()}
                  </Text>
                </Box>
              </Group>
              <Group align="flex-start" gap="md">
                <IconBriefcase size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>
                    Baggage Policy
                  </Text>
                  <Stack gap={4}>
                    <Text c="dark">• 10kg cabin allowance</Text>
                    <Text c="dark">• Extra baggage Rp 20.000/kg</Text>
                  </Stack>
                </Box>
              </Group>
              <Group align="flex-start" gap="md">
                <IconPhone size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                <Box style={{ flex: 1 }}>
                  <Text fw={500} c="#284361" mb={4}>
                    Emergency Contact
                  </Text>
                  <Text c="dark">
                    {(() => {
                      const t = (booking as any)?.tenant || {};
                      const phone = t.phoneNumber || t.phone_number || '';
                      return phone || '-';
                    })()}
                  </Text>
                </Box>
              </Group>
            </Stack>
          </Card>
          </Box>
          )}

          {isDoubleTrip && (
            <Grid gutter="xl" mb="xl">
              <Grid.Col span={{ base: 12, lg: 8 }}>
                <Stack gap="xl">
                  <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                    {fetching && (
                      <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                        <Loader color="#284361" />
                      </Box>
                    )}
                    <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
                      Contact Details
                    </Title>
                    {isMobile ? (
                      <Stack gap="sm">
                        <Group justify="space-between" align="center">
                          <Text size="sm" c="dimmed">No.</Text>
                          <Text size="sm" fw={600} c="#284361">1</Text>
                        </Group>
                        <Group justify="space-between" align="center">
                          <Text size="sm" c="dimmed">Name</Text>
                          <Text size="sm" fw={600} c="#284361">{booking?.customerName || '-'}</Text>
                        </Group>
                        <Group justify="space-between" align="center">
                          <Text size="sm" c="dimmed">Email</Text>
                          <Text size="sm" c="dark">{booking?.customerEmail || '-'}</Text>
                        </Group>
                        <Group justify="space-between" align="center">
                          <Text size="sm" c="dimmed">Phone Number</Text>
                          <Text size="sm" c="dark">{booking?.customerPhone || '-'}</Text>
                        </Group>
                      </Stack>
                    ) : (
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>
                              <Text size="sm" fw={500} c="dimmed">No.</Text>
                            </Table.Th>
                            <Table.Th>
                              <Text size="sm" fw={500} c="dimmed">Name</Text>
                            </Table.Th>
                            <Table.Th>
                              <Text size="sm" fw={500} c="dimmed">Email</Text>
                            </Table.Th>
                            <Table.Th>
                              <Text size="sm" fw={500} c="dimmed">Phone Number</Text>
                            </Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          <Table.Tr>
                            <Table.Td>
                              <Text size="sm" c="dark">1</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" fw={500} c="#284361">{booking?.customerName || '-'}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dark">{booking?.customerEmail || '-'}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dark">{booking?.customerPhone || '-'}</Text>
                            </Table.Td>
                          </Table.Tr>
                        </Table.Tbody>
                      </Table>
                    )}
                    <Group gap="xs" mt="lg">
                      <ThemeIcon size={16} radius="xl" color="blue" variant="light">
                        <IconInfoCircle size={12} />
                      </ThemeIcon>
                      <Text size="sm" c="dimmed">
                        Please bring your ID or passport for check-in verification.
                      </Text>
                    </Group>
                  </Card>

                  <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                    {fetching && (
                      <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                        <Loader color="#284361" />
                      </Box>
                    )}
                    <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
                      Departure E‑Ticket Summary
                    </Title>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Booking Code</Text>
                        <Text fw={600} c="#284361">{booking?.bookingCode || booking?.booking_code || '-'}</Text>
                      </Box>
                      <Box></Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Category</Text>
                        <Text fw={600} c="#284361">{itemsOutboundFull?.[0]?.product?.category?.name || '-'}</Text>
                      </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Provider Name</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const t = (booking as any)?.tenant || {};
                        const vendor = t.vendorName || t.vendor_name || '';
                        return vendor || itemsOutboundFull?.[0]?.product?.name || '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Boat Name</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                        const bn = (s as any)?.boat?.name || '';
                        return bn || '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Route</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                        const dep = s?.departureRoute?.name;
                          const arr = s?.arrivalRoute?.name;
                          return dep && arr ? `${dep} → ${arr}` : '-';
                        })()}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Departure Date</Text>
                        <Text fw={600} c="#284361">{(() => {
                          const dt = (itemsOutboundFull?.[0] as any)?.itemDate ?? (itemsOutboundFull?.[0] as any)?.inventory?.inventoryDate ?? null;
                          return dt ? new Date(dt).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                        })()}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Departure Time</Text>
                        <Text fw={600} c="#284361">{(() => {
                          const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                          const depStr = s?.departureTime || s?.departure_time || '';
                          return depStr || '-';
                        })()}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Arrival Time</Text>
                        <Text fw={600} c="#284361">{(() => {
                          const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                          const arrStr = s?.arrivalTime || s?.arrival_time || '';
                          return arrStr || '-';
                        })()}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Duration</Text>
                        <Text fw={600} c="#284361">{(() => {
                          const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                          const depStr = s?.departureTime || s?.departure_time || '';
                          const arrStr = s?.arrivalTime || s?.arrival_time || '';
                          const dm = toMinutes(depStr);
                          const am = toMinutes(arrStr);
                          return dm != null && am != null && am >= dm ? `${am - dm} min` : '-';
                        })()}</Text>
                      </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Payment Method</Text>
                      <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Booking Date</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const cr = (booking as any)?.created_at ?? (booking as any)?.createdAt ?? null;
                        return cr ? new Date(cr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Status</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="#2dbe8d" />
                        <Text fw={600} c="#2dbe8d">{booking?.status === 'PAID' || booking?.status === 'COMPLETED' ? 'Confirmed' : booking?.status}</Text>
                        </Group>
                      </Box>
                    </SimpleGrid>
                  </Card>

                  <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                    {fetching && (
                      <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                        <Loader color="#284361" />
                      </Box>
                    )}
                    <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
                      Departure Passengers Details
                    </Title>
                    {isMobile ? (
                      <Stack gap="sm">
                        {bookingItemsOutbound.map((it: any, idx: number) => {
                          const parts = String(it.participant_name || '').trim().split(/\s+/).filter(Boolean);
                          const nm = { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
                          const meta = it.meta || {};
                          const fullName = `${meta.title ? meta.title + ' ' : ''}${meta.firstName || nm.first || '-'} ${meta.lastName || nm.last || ''}`.trim();
                          return (
                            <Box key={it.id || idx} style={{ border: '1px solid #e9ecef', borderRadius: 8, padding: 12 }}>
                              <Group justify="space-between" align="center">
                                <Badge color="gray" variant="light" styles={{ root: { borderRadius: 8 } }}>{idx + 1}</Badge>
                                {meta.ageCategory ? (
                                  <Badge color="blue" variant="light" styles={{ root: { borderRadius: 8 } }}>{meta.ageCategory}</Badge>
                                ) : null}
                              </Group>
                              <Text fw={600} c="#284361" mt={6}>{fullName}</Text>
                              <SimpleGrid cols={{ base: 2, md: 3 }} spacing="xs" mt={8}>
                                <Box>
                                  <Text size="xs" c="dimmed">Nationality</Text>
                                  <Text size="sm" c="#111827">{meta.nationality || '-'}</Text>
                                </Box>
                                <Box>
                                  <Text size="xs" c="dimmed">Identity Type</Text>
                                  <Text size="sm" c="#111827">{meta.identityType || '-'}</Text>
                                </Box>
                                <Box>
                                  <Text size="xs" c="dimmed">ID Number</Text>
                                  <Text size="sm" c="#111827">{meta.idNumber || '-'}</Text>
                                </Box>
                              </SimpleGrid>
                            </Box>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Table>
                        <Table.Thead>
                          <Table.Tr style={{ backgroundColor: '#f9fafb' }}>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>No.</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Title</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>First Name</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Last Name</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Nationality</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Identity Type</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>ID Number</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Age Category</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {bookingItemsOutbound.map((it: any, idx: number) => {
                            const parts = String(it.participant_name || '').trim().split(/\s+/).filter(Boolean);
                            const nm = { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
                            const meta = it.meta || {};
                            return (
                              <Table.Tr key={it.id || idx}>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{idx + 1}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.title || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.firstName || nm.first || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.lastName || nm.last || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.nationality || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.identityType || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.idNumber || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.ageCategory || '-'}</Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    )}
                    <Group gap="xs" mt="lg">
                      <ThemeIcon size={16} radius="xl" color="blue" variant="light">
                        <IconInfoCircle size={12} />
                      </ThemeIcon>
                      <Text size="sm" c="dimmed">
                        Please bring your ID or passport for check-in verification.
                      </Text>
                    </Group>
                  </Card>

                  <Card withBorder radius="md" p="xl" mb="xl" bg="white" style={{ position: 'relative' }}>
                    {fetching && (
                      <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                        <Loader color="#284361" />
                      </Box>
                    )}
                    <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
                      Departure Boarding Information
                    </Title>
                    <Stack gap="xl">
                      <Group align="flex-start" gap="md">
                        <IconMapPin size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} c="#284361" mb={4}>
                            Departure Point
                          </Text>
                          <Text c="dark" mb={8}>
                            {(() => {
                              const t = (booking as any)?.tenant || {};
                              const addr = t.businessAddress || t.business_address || '';
                              return addr || '-';
                            })()}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {(() => {
                              const t = (booking as any)?.tenant || {};
                              const vendor = t.vendorName || t.vendor_name || '';
                              return vendor ? `Managed by ${vendor}` : 'Check-in counter near Caspla Ticket Office';
                            })()}
                          </Text>
                          <Anchor size="sm" c="#284361" fw={500} mt={8}>
                            View on Google Maps
                          </Anchor>
                        </Box>
                      </Group>
                      <Group align="flex-start" gap="md">
                        <IconClock size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} c="#284361" mb={4}>
                            Boarding Time
                          </Text>
                          <Text c="dark">
                            {(() => {
                              const s = itemsOutboundFull?.[0]?.product?.fastboatSchedule;
                              const depStr = s?.departureTime || s?.departure_time || '';
                              const dm = toMinutes(depStr);
                              if (dm == null) return '-';
                              const btm = Math.max(0, dm - 30);
                              const hh = String(Math.floor(btm / 60)).padStart(2, '0');
                              const mm = String(btm % 60).padStart(2, '0');
                              return `${hh}:${mm} (30 minutes before departure)`;
                            })()}
                          </Text>
                        </Box>
                      </Group>
                      <Group align="flex-start" gap="md">
                        <IconBriefcase size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} c="#284361" mb={4}>
                            Baggage Policy
                          </Text>
                          <Stack gap={4}>
                            <Text c="dark">• 10kg cabin allowance</Text>
                            <Text c="dark">• Extra baggage Rp 20.000/kg</Text>
                          </Stack>
                        </Box>
                      </Group>
                      <Group align="flex-start" gap="md">
                        <IconPhone size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} c="#284361" mb={4}>
                            Emergency Contact
                          </Text>
                          <Text c="dark">
                            {(() => {
                              const t = (booking as any)?.tenant || {};
                              const phone = t.phoneNumber || t.phone_number || '';
                              return phone || '-';
                            })()}
                          </Text>
                        </Box>
                      </Group>
                    </Stack>
                  </Card>

                  <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                    {fetching && (
                      <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                        <Loader color="#284361" />
                      </Box>
                    )}
                    <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
                      Return E‑Ticket Summary
                    </Title>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Booking Code</Text>
                        <Text fw={600} c="#284361">{booking?.bookingCode || booking?.booking_code || '-'}</Text>
                      </Box>
                      <Box></Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Category</Text>
                        <Text fw={600} c="#284361">{itemsInboundFull?.[0]?.product?.category?.name || '-'}</Text>
                      </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Provider Name</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const t = (booking as any)?.tenant || {};
                        const vendor = t.vendorName || t.vendor_name || '';
                        return vendor || itemsInboundFull?.[0]?.product?.name || '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Boat Name</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                        const bn = (s as any)?.boat?.name || '';
                        return bn || '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Route</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                        const dep = s?.departureRoute?.name;
                          const arr = s?.arrivalRoute?.name;
                          return dep && arr ? `${dep} → ${arr}` : '-';
                        })()}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Return Date</Text>
                        <Text fw={600} c="#284361">{(() => {
                          const dt = (itemsInboundFull?.[0] as any)?.itemDate ?? (itemsInboundFull?.[0] as any)?.inventory?.inventoryDate ?? null;
                          return dt ? new Date(dt).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                        })()}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Departure Time</Text>
                        <Text fw={600} c="#284361">{(() => {
                          const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                          const depStr = s?.departureTime || s?.departure_time || '';
                          return depStr || '-';
                        })()}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Arrival Time</Text>
                        <Text fw={600} c="#284361">{(() => {
                          const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                          const arrStr = s?.arrivalTime || s?.arrival_time || '';
                          return arrStr || '-';
                        })()}</Text>
                      </Box>
                      <Box>
                        <Text size="sm" c="dimmed" mb={4}>Duration</Text>
                        <Text fw={600} c="#284361">{(() => {
                          const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                          const depStr = s?.departureTime || s?.departure_time || '';
                          const arrStr = s?.arrivalTime || s?.arrival_time || '';
                          const dm = toMinutes(depStr);
                          const am = toMinutes(arrStr);
                          return dm != null && am != null && am >= dm ? `${am - dm} min` : '-';
                        })()}</Text>
                      </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Payment Method</Text>
                      <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Booking Date</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const cr = (booking as any)?.created_at ?? (booking as any)?.createdAt ?? null;
                        return cr ? new Date(cr).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Status</Text>
                      <Group gap="xs">
                        <IconCheck size={16} color="#2dbe8d" />
                        <Text fw={600} c="#2dbe8d">{booking?.status === 'PAID' || booking?.status === 'COMPLETED' ? 'Confirmed' : booking?.status}</Text>
                        </Group>
                      </Box>
                    </SimpleGrid>
                  </Card>

                  <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                    {fetching && (
                      <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                        <Loader color="#284361" />
                      </Box>
                    )}
                    <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
                      Return Passengers Details
                    </Title>
                    {isMobile ? (
                      <Stack gap="sm">
                        {bookingItemsInbound.map((it: any, idx: number) => {
                          const parts = String(it.participant_name || '').trim().split(/\s+/).filter(Boolean);
                          const nm = { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
                          const meta = it.meta || {};
                          const fullName = `${meta.title ? meta.title + ' ' : ''}${meta.firstName || nm.first || '-'} ${meta.lastName || nm.last || ''}`.trim();
                          return (
                            <Box key={it.id || idx} style={{ border: '1px solid #e9ecef', borderRadius: 8, padding: 12 }}>
                              <Group justify="space-between" align="center">
                                <Badge color="gray" variant="light" styles={{ root: { borderRadius: 8 } }}>{idx + 1}</Badge>
                                {meta.ageCategory ? (
                                  <Badge color="blue" variant="light" styles={{ root: { borderRadius: 8 } }}>{meta.ageCategory}</Badge>
                                ) : null}
                              </Group>
                              <Text fw={600} c="#284361" mt={6}>{fullName}</Text>
                              <SimpleGrid cols={{ base: 2, md: 3 }} spacing="xs" mt={8}>
                                <Box>
                                  <Text size="xs" c="dimmed">Nationality</Text>
                                  <Text size="sm" c="#111827">{meta.nationality || '-'}</Text>
                                </Box>
                                <Box>
                                  <Text size="xs" c="dimmed">Identity Type</Text>
                                  <Text size="sm" c="#111827">{meta.identityType || '-'}</Text>
                                </Box>
                                <Box>
                                  <Text size="xs" c="dimmed">ID Number</Text>
                                  <Text size="sm" c="#111827">{meta.idNumber || '-'}</Text>
                                </Box>
                              </SimpleGrid>
                            </Box>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Table>
                        <Table.Thead>
                          <Table.Tr style={{ backgroundColor: '#f9fafb' }}>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>No.</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Title</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>First Name</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Last Name</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Nationality</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Identity Type</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>ID Number</Table.Th>
                            <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Age Category</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {bookingItemsInbound.map((it: any, idx: number) => {
                            const parts = String(it.participant_name || '').trim().split(/\s+/).filter(Boolean);
                            const nm = { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
                            const meta = it.meta || {};
                            return (
                              <Table.Tr key={it.id || idx}>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{idx + 1}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.title || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{meta.firstName || nm.first || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{meta.lastName || nm.last || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.nationality || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.identityType || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.idNumber || '-'}</Table.Td>
                                <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{meta.ageCategory || '-'}</Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    )}
                    <Group gap="xs" mt="lg">
                      <ThemeIcon size={16} radius="xl" color="blue" variant="light">
                        <IconInfoCircle size={12} />
                      </ThemeIcon>
                      <Text size="sm" c="dimmed">
                        Please bring your ID or passport for check-in verification.
                      </Text>
                    </Group>
                  </Card>

                  <Card withBorder radius="md" p="xl" mb="xl" bg="white" style={{ position: 'relative' }}>
                    {fetching && (
                      <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                        <Loader color="#284361" />
                      </Box>
                    )}
                    <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
                      Return Boarding Information
                    </Title>
                    <Stack gap="xl">
                      <Group align="flex-start" gap="md">
                        <IconMapPin size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} c="#284361" mb={4}>
                            Departure Point
                          </Text>
                          <Text c="dark" mb={8}>
                            {(() => {
                              const t = (booking as any)?.tenant || {};
                              const addr = t.businessAddress || t.business_address || '';
                              return addr || '-';
                            })()}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {(() => {
                              const t = (booking as any)?.tenant || {};
                              const vendor = t.vendorName || t.vendor_name || '';
                              return vendor ? `Managed by ${vendor}` : 'Check-in counter near Caspla Ticket Office';
                            })()}
                          </Text>
                          <Anchor size="sm" c="#284361" fw={500} mt={8}>
                            View on Google Maps
                          </Anchor>
                        </Box>
                      </Group>
                      <Group align="flex-start" gap="md">
                        <IconClock size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} c="#284361" mb={4}>
                            Boarding Time
                          </Text>
                          <Text c="dark">
                            {(() => {
                              const s = itemsInboundFull?.[0]?.product?.fastboatSchedule;
                              const depStr = s?.departureTime || s?.departure_time || '';
                              const dm = toMinutes(depStr);
                              if (dm == null) return '-';
                              const btm = Math.max(0, dm - 30);
                              const hh = String(Math.floor(btm / 60)).padStart(2, '0');
                              const mm = String(btm % 60).padStart(2, '0');
                              return `${hh}:${mm} (30 minutes before departure)`;
                            })()}
                          </Text>
                        </Box>
                      </Group>
                      <Group align="flex-start" gap="md">
                        <IconBriefcase size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} c="#284361" mb={4}>
                            Baggage Policy
                          </Text>
                          <Stack gap={4}>
                            <Text c="dark">• 10kg cabin allowance</Text>
                            <Text c="dark">• Extra baggage Rp 20.000/kg</Text>
                          </Stack>
                        </Box>
                      </Group>
                      <Group align="flex-start" gap="md">
                        <IconPhone size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} c="#284361" mb={4}>
                            Emergency Contact
                          </Text>
                          <Text c="dark">
                            {(() => {
                              const t = (booking as any)?.tenant || {};
                              const phone = t.phoneNumber || t.phone_number || '';
                              return phone || '-';
                            })()}
                          </Text>
                        </Box>
                      </Group>
                    </Stack>
                  </Card>
                </Stack>
              </Grid.Col>
              <Grid.Col span={{ base: 12, lg: 4 }}>
                <Stack gap="xl">
                  <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                    {fetching && (
                      <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                        <Loader color="#284361" />
                      </Box>
                    )}
                    <Title order={2} size="xl" fw={600} c="#284361" mb="lg">
                      E-Ticket QR Code
                    </Title>
                    <Box bg="#f8f9fa" p="xl" style={{ borderRadius: 8 }} mb="lg">
                      <Center>
                        <Box 
                          w={192} 
                          h={192} 
                          bg="white" 
                          style={{ 
                            border: '2px solid #dee2e6', 
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Box ta="center" c="dimmed" w={160} h={160} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {qrDataUrl ? (
                              <img
                                src={qrDataUrl}
                                alt="E-Ticket QR"
                                style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 4 }}
                              />
                            ) : (
                              <Text size="sm" c="dimmed">Generating QR...</Text>
                            )}
                          </Box>
                        </Box>
                      </Center>
                    </Box>
                    <Text size="sm" c="dimmed" ta="center">
                      Show this QR at the counter for verification.
                    </Text>
                  </Card>

                  <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
                    {fetching && (
                      <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                        <Loader color="#284361" />
                      </Box>
                    )}
                    <Title order={2} size="lg" fw={600} c="#284361" mb="lg">
                      Travel Tips
                    </Title>
                    <Stack gap="lg">
                      <Group align="flex-start" gap="md">
                        <IconClock size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text fw={500} c="#284361" size="sm">
                            Before You Go:
                          </Text>
                          <Text size="sm" c="dimmed">
                            Arrive 30 minutes before departure.
                          </Text>
                        </Box>
                      </Group>
                      <Group align="flex-start" gap="md">
                        <IconCreditCard size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" c="dimmed">
                            Bring your ID for check-in.
                          </Text>
                        </Box>
                      </Group>
                      <Group align="flex-start" gap="md">
                        <IconPhone size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" c="dimmed">
                            Keep this ticket accessible on your phone.
                          </Text>
                        </Box>
                      </Group>
                      <Group align="flex-start" gap="md">
                        <IconUmbrella size={20} color="#284361" style={{ marginTop: 2, flexShrink: 0 }} />
                        <Box style={{ flex: 1 }}>
                          <Text size="sm" c="dimmed">
                            Contact our staff if weather conditions change.
                          </Text>
                        </Box>
                      </Group>
                    </Stack>
                  </Card>
                </Stack>
              </Grid.Col>
            </Grid>
          )}

          {/* Payment Details */}
          <Card withBorder radius="md" p="xl" bg="white" style={{ position: 'relative' }}>
            {fetching && (
              <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                <Loader color="#284361" />
              </Box>
            )}
            <Group gap="md" mb="xl">
              <Badge color="gray" variant="light">{booking?.paymentMethod || '-'}</Badge>
              <Group gap="xs">
                <IconCheck size={20} color="#2dbe8d" />
                <Text size="sm" fw={500} c="#2dbe8d">
                  Payment Successful
                </Text>
              </Group>
            </Group>
            <Group justify="space-between" align="center" mb="xl">
              <Title order={2} size="xl" fw={600} c="#284361">
                Payment Details
              </Title>
              <Menu position="bottom-end" shadow="md">
                <Menu.Target>
                  <ActionIcon variant="outline" radius="md" size={36} style={{ borderColor: '#284361', color: '#284361' }}>
                    <IconDotsVertical size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item leftSection={<IconReceipt size={16} />} onClick={() => setInvoiceOpen(true)}>View Invoice</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Box>
                <Text size="sm" c="dimmed" mb={4}>Invoice</Text>
                <Text fw={600} c="#284361">{booking?.xenditInvoiceId || '-'}</Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed" mb={4}>Time</Text>
                <Text fw={600} c="#284361">{booking?.paidAt ? new Date(booking.paidAt).toLocaleString('id-ID', { hour12: false }) : '-'}</Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed" mb={4}>Method</Text>
                <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed" mb={4}>Amount</Text>
                <Text fw={600} c="#284361">{(() => {
                  const amt = booking?.paidAmount ?? booking?.totalAmount;
                  if (!amt) return '-';
                  const n = Number(amt);
                  const cur = String(booking?.currency || 'IDR').toUpperCase();
                  return `${cur} ${cur === 'USD' ? n.toLocaleString('en-US', { minimumFractionDigits: 2 }) : n.toLocaleString('id-ID')}`;
                })()}</Text>
              </Box>
              <Box>
                <Text size="sm" c="dimmed" mb={4}>Status</Text>
                <Text fw={600} c="#2dbe8d">{booking?.status || '-'}</Text>
              </Box>
            </SimpleGrid>
          <Text size="sm" c="dimmed" mt="xl">
            This transaction is verified and secured through our official
            payment gateway.
          </Text>
          <Modal opened={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="Invoice">
            <Stack gap="md">
              <Group gap="md">
                <Badge color="gray" variant="light">{booking?.paymentMethod || '-'}</Badge>
                <Group gap="xs">
                  <IconCheck size={20} color="#2dbe8d" />
                  <Text size="sm" fw={500} c="#2dbe8d">
                    Payment Successful
                  </Text>
                </Group>
              </Group>
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Invoice</Text>
                  <Text fw={600} c="#284361">{booking?.xenditInvoiceId || '-'}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Time</Text>
                  <Text fw={600} c="#284361">{booking?.paidAt ? new Date(booking.paidAt).toLocaleString('id-ID', { hour12: false }) : '-'}</Text>
                </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Method</Text>
                  <Text fw={600} c="#284361">{booking?.paymentMethod || '-'}</Text>
                </Box>
                <Box>
                <Text size="sm" c="dimmed" mb={4}>Amount</Text>
                <Text fw={600} c="#284361">{(() => {
                  const amt = booking?.paidAmount ?? booking?.totalAmount;
                  if (!amt) return '-';
                  const n = Number(amt);
                  const cur = String(booking?.currency || 'IDR').toUpperCase();
                  return `${cur} ${cur === 'USD' ? n.toLocaleString('en-US', { minimumFractionDigits: 2 }) : n.toLocaleString('id-ID')}`;
                })()}</Text>
              </Box>
                <Box>
                  <Text size="sm" c="dimmed" mb={4}>Status</Text>
                  <Text fw={600} c="#2dbe8d">{booking?.status || '-'}</Text>
                </Box>
              </SimpleGrid>
            </Stack>
          </Modal>
        </Card>
        </Container>
      </Box>
      
      <Footer />
    </Box>
  );
}
