'use client';

import React, { useEffect, useState, useRef } from 'react';
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

export default function BookingConfirmationPage() {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const printCSS = `
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body * { visibility: hidden; }
      #print-area, #print-area * { visibility: visible; }
      #print-area { position: absolute; left: 0; top: 0; width: 100%; }
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

  function splitName(full?: string) {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
  }

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login?redirectTo=/speedboat/book/confirmation');
          return;
        }
        const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const idParam = search.get('id');
        const idStorage = typeof window !== 'undefined' ? localStorage.getItem('booking_id') : null;
        const id = idParam || idStorage;
        if (!id) return;
        const uid = session.user.id;
        const email = (session.user.email || '').trim().toLowerCase();
        const res = await fetch(`/api/bookings?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setBooking(json.booking);
        setItems(json.booking?.items || []);
      } catch {}
    };
    load();
  }, []);

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleDownloadTicket = () => {
    try {
      const el = printRef.current;
      if (!el) {
        window.print();
        return;
      }
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

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <Box component="main" style={{ flex: 1 }}>
        <style>{printCSS}</style>
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
              Thank you for booking with Caspia Bali. Your payment via QRIS has
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
            >
              Back to Homepage
            </Button>
          </Group>

          {/* Main Content Grid */}
          <Box id="print-area" ref={printRef}>
          <Grid gutter="xl" mb="xl">
            {/* Left Column - E-Ticket Summary */}
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Stack gap="xl">
                <Card withBorder radius="md" p="xl" bg="white">
                  <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
                    E-Ticket Summary
                  </Title>
                  <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Booking Code</Text>
                      <Text fw={600} c="#284361">{booking?.bookingCode || booking?.booking_code || '-'}</Text>
                    </Box>
                    <Box></Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Booking Date</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const d = items?.[0]?.itemDate || booking?.bookingDate;
                        return d ? new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : '-';
                      })()}</Text>
                    </Box>
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
                        const d = items?.[0]?.inventory?.inventoryDate;
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
                        return `IDR ${n.toLocaleString('id-ID')}`;
                      })()}</Text>
                    </Group>
                  </Box>
                </Card>
              </Stack>
            </Grid.Col>

            {/* Right Column - QR Code & Travel Tips */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Stack gap="xl">
              {/* <Card withBorder radius="md" p="xl" bg="white">
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
                      <Box ta="center" c="dimmed">
                        <SimpleGrid 
                          cols={8} 
                          spacing={1} 
                          w={160} 
                          h={160} 
                          bg="#e9ecef" 
                          p={8} 
                          style={{ borderRadius: 4 }}
                        >
                          {Array.from({ length: 64 }).map((_, i) => (
                            <Box 
                              key={i} 
                              w="100%" 
                              h="100%" 
                              bg={Math.random() > 0.5 ? 'black' : 'white'}
                              style={{ borderRadius: 2 }}
                            />
                          ))}
                        </SimpleGrid>
                      </Box>
                    </Box>
                  </Center>
                </Box>
                <Text size="sm" c="dimmed" ta="center">
                  Show this QR at the Caspia Bali counter for verification.
                </Text>
              </Card> */}

              <Card withBorder radius="md" p="xl" bg="white">
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
                        Contact Caspia staff if weather conditions change.
                      </Text>
                    </Box>
                  </Group>
                </Stack>
              </Card>
              </Stack>
            </Grid.Col>
          </Grid>

          {/* Contact Details */}
          <Card withBorder radius="md" p="xl" mb="xl" bg="white">
            <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
              Contact Details
            </Title>
            <Box style={{ overflowX: 'auto' }}>
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
            </Box>
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
          <Card withBorder radius="md" p="xl" mb="xl" bg="white">
            <Title order={2} size="xl" fw={600} c="#284361" mb="xl">
              Passenger Details
            </Title>
            <Box style={{ overflowX: 'auto' }}>
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
            </Box>
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
          <Card withBorder radius="md" p="xl" mb="xl" bg="white">
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

          {/* Payment Details */}
          <Card withBorder radius="md" p="xl" bg="white">
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
                  return `IDR ${n.toLocaleString('id-ID')}`;
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
                    return `IDR ${n.toLocaleString('id-ID')}`;
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
        </Box>
        </Container>
      </Box>
      
      <Footer />
    </Box>
  );
}
