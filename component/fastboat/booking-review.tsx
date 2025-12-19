'use client';

import React from 'react';
import { Paper, Stack, Title, Text, Group, Table, SimpleGrid, Image, Button, TextInput, Badge, Box, Loader } from '@mantine/core';
import { IconAnchor, IconCalendar, IconClock, IconTicket, IconBriefcase } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';

interface BookingReviewProps {
  promoCode: string;
  setPromoCode: (code: string) => void;
  booking?: any;
  bookings?: any[];
  loading?: boolean;
}

export function BookingReview({
  promoCode,
  setPromoCode,
  booking,
  bookings,
  loading
}: BookingReviewProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const singleBooking = booking || (Array.isArray(bookings) && bookings.length === 1 ? bookings[0] : undefined);
  function splitName(full?: string) {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
  }
  const firstItem = Array.isArray(singleBooking?.booking_items) ? singleBooking.booking_items[0] : undefined;
  const trip = firstItem?.schedule?.departure_route && firstItem?.schedule?.arrival_route
    ? `${firstItem.schedule.departure_route} → ${firstItem.schedule.arrival_route}`
    : '';
  const departureTime = firstItem?.schedule?.departure_time || '';
  const arrivalTime = firstItem?.schedule?.arrival_time || '';
  const departureDateRaw = (singleBooking?.booking_date || singleBooking?.bookingDate || firstItem?.item_date || (firstItem as any)?.inventory?.inventoryDate || '') as string;
  const departureDateStr = (() => {
    if (!departureDateRaw) return '';
    const d = new Date(departureDateRaw);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  })();
  function toMinutes(t?: string) {
    const s = String(t || '').trim();
    const m = s.match(/^([0-1]?\d|2[0-3]):([0-5]\d)$/);
    if (!m) return null;
    const h = Number(m[1]);
    const mm = Number(m[2]);
    return h * 60 + mm;
  }
  const dm = toMinutes(departureTime);
  const am = toMinutes(arrivalTime);
  const duration = dm != null && am != null && am >= dm ? `${am - dm} min` : '';
  const boatName = firstItem?.schedule?.boat?.name || '';
  const boatCapacity = firstItem?.schedule?.boat?.capacity ?? null;
  const vendorName = (singleBooking?.tenant?.vendorName || singleBooking?.tenant?.vendor_name || '') as string;
  const categoryName = (firstItem as any)?.product?.category?.name || '';
  const bookingItems = Array.isArray(singleBooking?.booking_items) ? singleBooking.booking_items : [];
  const allNoRt = bookingItems.every((it: any) => {
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
  const getRt = (it: any) => {
    const m = it?.meta || {};
    const t1 = String(m?.rtType || '').toUpperCase();
    if (t1) return t1;
    const notes = m?.notes || '';
    if (typeof notes === 'string' && notes) {
      try {
        const inner = JSON.parse(String(notes));
        const t2 = String(inner?.rtType || '').toUpperCase();
        if (t2) return t2;
      } catch {}
    }
    return '';
  };
  const itemsOutbound = bookingItems.filter((it: any) => {
    const t = getRt(it);
    if (t) return t === 'OUTBOUND';
    return allNoRt;
  });
  const itemsInbound = bookingItems.filter((it: any) => {
    const t = getRt(it);
    if (t) return t === 'INBOUND';
    return false;
  });
  const isDouble = (Array.isArray(bookings) && bookings.length > 1) || (itemsOutbound.length > 0 && itemsInbound.length > 0);
  const passengerCount = bookingItems.length;
  const isDoubleTwoBookings = Array.isArray(bookings) && bookings.length > 1;
  const depBooking = isDoubleTwoBookings ? bookings![0] : singleBooking;
  const retBooking = isDoubleTwoBookings ? bookings![1] : singleBooking;
  const depItems = isDoubleTwoBookings ? (Array.isArray(depBooking?.booking_items) ? depBooking.booking_items : []) : itemsOutbound;
  const retItems = isDoubleTwoBookings ? (Array.isArray(retBooking?.booking_items) ? retBooking.booking_items : []) : itemsInbound;
  const depFirst = Array.isArray(depItems) ? depItems[0] : undefined;
  const retFirst = Array.isArray(retItems) ? retItems[0] : undefined;
  const depTrip = depFirst?.schedule?.departure_route && depFirst?.schedule?.arrival_route ? `${depFirst.schedule.departure_route} → ${depFirst.schedule.arrival_route}` : '';
  const retTrip = retFirst?.schedule?.departure_route && retFirst?.schedule?.arrival_route ? `${retFirst.schedule.departure_route} → ${retFirst.schedule.arrival_route}` : '';
  const depDateRaw = (depFirst?.item_date || (depFirst as any)?.inventory?.inventoryDate || depBooking?.booking_date || depBooking?.bookingDate || '') as string;
  const retDateRaw = (retFirst?.item_date || (retFirst as any)?.inventory?.inventoryDate || retBooking?.booking_date || retBooking?.bookingDate || '') as string;
  const depDateStr = (() => { if (!depDateRaw) return ''; const d = new Date(depDateRaw); return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); })();
  const retDateStr = (() => { if (!retDateRaw) return ''; const d = new Date(retDateRaw); return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }); })();
  const depDepartureTime = depFirst?.schedule?.departure_time || '';
  const depArrivalTime = depFirst?.schedule?.arrival_time || '';
  const retDepartureTime = retFirst?.schedule?.departure_time || '';
  const retArrivalTime = retFirst?.schedule?.arrival_time || '';
  const depCategory = (depFirst as any)?.product?.category?.name || '';
  const retCategory = (retFirst as any)?.product?.category?.name || '';
  const depCode = depBooking?.booking_code || '-';
  const retCode = retBooking?.booking_code || '-';
  const depVendor = (depFirst?.schedule?.vendor_name || depBooking?.tenant?.vendorName || depBooking?.tenant?.vendor_name || '') as string;
  const retVendor = (retFirst?.schedule?.vendor_name || retBooking?.tenant?.vendorName || retBooking?.tenant?.vendor_name || '') as string;
  const depBoat = depFirst?.schedule?.boat?.name || '';
  const retBoat = retFirst?.schedule?.boat?.name || '';
  const specialRequest = (singleBooking?.customer_notes || depBooking?.customer_notes || retBooking?.customer_notes || '-') as string;
  const isLoading = !!loading || (!singleBooking && !(Array.isArray(bookings) && bookings.length > 0));
  return (
    <Paper shadow="sm" radius="lg" p="xl" bg="white" style={{ position: 'relative' }}>
      {isLoading && (
        <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
          <Loader color="#284361" />
        </Box>
      )}
      <Stack gap="xl">
        <Title order={2} size="xl" fw={700} c="#284361">Review Your Booking</Title>
        {isDouble ? (
          <>
            <Stack gap="md">
              <Text size="sm" fw={600} c="dark">Contact Information</Text>
              {isMobile ? (
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">No.</Text>
                    <Text size="sm" fw={600} c="#284361">1</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">Name</Text>
                    <Text size="sm" fw={600} c="#284361">{depBooking?.customer_name || '-'}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">Email</Text>
                    <Text size="sm" c="dark">{depBooking?.customer_email || '-'}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">Phone Number</Text>
                    <Text size="sm" c="dark">{depBooking?.customer_phone || '-'}</Text>
                  </Group>
                </Stack>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr style={{ backgroundColor: '#f9fafb' }}>
                      <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>No.</Table.Th>
                      <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Name</Table.Th>
                      <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Email</Table.Th>
                      <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Phone Number</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>1</Table.Td>
                      <Table.Td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{depBooking?.customer_name || '-'}</Table.Td>
                      <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{depBooking?.customer_email || '-'}</Table.Td>
                      <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{depBooking?.customer_phone || '-'}</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              )}
            </Stack>

            <Stack gap="md">
              <Text size="sm" fw={600} c="dark">Departure Booking Details</Text>
              <Stack gap="md">
                <Group align="center" gap="md">
                  <IconAnchor size={20} color="#6b7280" />
                  <Text c="dark">Code: {depCode}</Text>
                </Group>
                {depCategory && (
                  <Group align="center" gap="md">
                    <IconBriefcase size={20} color="#6b7280" />
                    <Text c="dark">Category: {depCategory}</Text>
                  </Group>
                )}
                {depVendor && (
                  <Group align="center" gap="md">
                    <IconBriefcase size={20} color="#6b7280" />
                    <Text c="dark">Vendor: {depVendor}</Text>
                  </Group>
                )}
                {depBoat && (
                  <Group align="center" gap="md">
                    <IconAnchor size={20} color="#6b7280" />
                    <Text c="dark">Boat: {depBoat}</Text>
                  </Group>
                )}
                {depTrip && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Trip: {depTrip}</Text>
                  </Group>
                )}
                {depDateStr && (
                  <Group align="center" gap="md">
                    <IconCalendar size={20} color="#6b7280" />
                    <Text c="dark">Departure Date: {depDateStr}</Text>
                  </Group>
                )}
                {depDepartureTime && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Departure Time: {depDepartureTime}</Text>
                  </Group>
                )}
                {depArrivalTime && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Arrival Time: {depArrivalTime}</Text>
                  </Group>
                )}
              </Stack>
            </Stack>

            <Stack gap="md">
              <Text size="sm" fw={600} c="dark">Departure Passengers</Text>
              {isMobile ? (
                <Stack gap="sm">
                  {depItems.map((it: any, idx: number) => {
                    const nm = splitName(it.participant_name);
                    const meta = it.meta || {};
                    const fullName = `${meta.title ? meta.title + ' ' : ''}${meta.firstName || nm.first || '-'} ${meta.lastName || nm.last || ''}`.trim();
                    return (
                      <Paper key={it.id || idx} withBorder p="md" radius="md">
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Badge color="gray" variant="light" styles={{ root: { borderRadius: 8 } }}>{idx + 1}</Badge>
                            {meta.ageCategory ? (
                              <Badge color="blue" variant="light" styles={{ root: { borderRadius: 8 } }}>{meta.ageCategory}</Badge>
                            ) : null}
                          </Group>
                          <Text fw={600} c="#284361">{fullName}</Text>
                          <SimpleGrid cols={{ base: 2, md: 3 }} spacing="xs">
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
                        </Stack>
                      </Paper>
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
                    {depItems.map((it: any, idx: number) => {
                      const nm = splitName(it.participant_name);
                      const meta = it.meta || {};
                      return (
                        <Table.Tr key={it.id}>
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
            </Stack>

            <Stack gap="md">
              <Text size="sm" fw={600} c="dark">Return Booking Details</Text>
              <Stack gap="md">
                <Group align="center" gap="md">
                  <IconAnchor size={20} color="#6b7280" />
                  <Text c="dark">Code: {retCode}</Text>
                </Group>
                {retCategory && (
                  <Group align="center" gap="md">
                    <IconBriefcase size={20} color="#6b7280" />
                    <Text c="dark">Category: {retCategory}</Text>
                  </Group>
                )}
                {retVendor && (
                  <Group align="center" gap="md">
                    <IconBriefcase size={20} color="#6b7280" />
                    <Text c="dark">Vendor: {retVendor}</Text>
                  </Group>
                )}
                {retBoat && (
                  <Group align="center" gap="md">
                    <IconAnchor size={20} color="#6b7280" />
                    <Text c="dark">Boat: {retBoat}</Text>
                  </Group>
                )}
                {retTrip && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Trip: {retTrip}</Text>
                  </Group>
                )}
                {retDateStr && (
                  <Group align="center" gap="md">
                    <IconCalendar size={20} color="#6b7280" />
                    <Text c="dark">Return Date: {retDateStr}</Text>
                  </Group>
                )}
                {retDepartureTime && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Return Time: {retDepartureTime}</Text>
                  </Group>
                )}
                {retArrivalTime && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Arrival Time: {retArrivalTime}</Text>
                  </Group>
                )}
              </Stack>
            </Stack>

            <Stack gap="md">
              <Text size="sm" fw={600} c="dark">Return Passengers</Text>
              {isMobile ? (
                <Stack gap="sm">
                  {retItems.map((it: any, idx: number) => {
                    const nm = splitName(it.participant_name);
                    const meta = it.meta || {};
                    const fullName = `${meta.title ? meta.title + ' ' : ''}${meta.firstName || nm.first || '-'} ${meta.lastName || nm.last || ''}`.trim();
                    return (
                      <Paper key={it.id || idx} withBorder p="md" radius="md">
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Badge color="gray" variant="light" styles={{ root: { borderRadius: 8 } }}>{idx + 1}</Badge>
                            {meta.ageCategory ? (
                              <Badge color="blue" variant="light" styles={{ root: { borderRadius: 8 } }}>{meta.ageCategory}</Badge>
                            ) : null}
                          </Group>
                          <Text fw={600} c="#284361">{fullName}</Text>
                          <SimpleGrid cols={{ base: 2, md: 3 }} spacing="xs">
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
                        </Stack>
                      </Paper>
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
                    {retItems.map((it: any, idx: number) => {
                      const nm = splitName(it.participant_name);
                      const meta = it.meta || {};
                      return (
                        <Table.Tr key={it.id}>
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
            </Stack>

            <Group gap="md">
              <Text size="sm" c="dark">Departure passengers: {depItems.length || 0}</Text>
              <Text size="sm" c="dark">Return passengers: {retItems.length || 0}</Text>
              <Text size="sm" c="dark">Special Request: {specialRequest || '-'}</Text>
            </Group>
          </>
        ) : (
          <>
            <Stack gap="md">
              <Text size="sm" fw={600} c="dark">Booking Details</Text>
              <Stack gap="md">
                <Group align="center" gap="md">
                  <IconAnchor size={20} color="#6b7280" />
                  <Text c="dark">Code: {singleBooking?.booking_code || '-'}</Text>
                </Group>
                {categoryName && (
                  <Group align="center" gap="md">
                    <IconBriefcase size={20} color="#6b7280" />
                    <Text c="dark">Category: {categoryName}</Text>
                  </Group>
                )}
                {(boatName || typeof boatCapacity === 'number') && (
                  <Group align="center" gap="md">
                    <IconAnchor size={20} color="#6b7280" />
                    <Text c="dark">Boat: {boatName || '-'}</Text>
                  </Group>
                )}
                {vendorName && (
                  <Group align="center" gap="md">
                    <IconBriefcase size={20} color="#6b7280" />
                    <Text c="dark">Vendor: {vendorName}</Text>
                  </Group>
                )}
                {trip && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Trip: {trip}</Text>
                  </Group>
                )}
                {departureDateStr && (
                  <Group align="center" gap="md">
                    <IconCalendar size={20} color="#6b7280" />
                    <Text c="dark">Departure Date: {departureDateStr}</Text>
                  </Group>
                )}
                {departureTime && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Departure Time: {departureTime}</Text>
                  </Group>
                )}
                {arrivalTime && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Arrival Time: {arrivalTime}</Text>
                  </Group>
                )}
                {duration && (
                  <Group align="center" gap="md">
                    <IconClock size={20} color="#6b7280" />
                    <Text c="dark">Duration: {duration}</Text>
                  </Group>
                )}
              </Stack>
            </Stack>

            <Stack gap="md">
              <Text size="sm" fw={600} c="dark">Contact Information</Text>
              {isMobile ? (
                <Stack gap="sm">
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">No.</Text>
                    <Text size="sm" fw={600} c="#284361">1</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">Name</Text>
                    <Text size="sm" fw={600} c="#284361">{singleBooking?.customer_name || '-'}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">Email</Text>
                    <Text size="sm" c="dark">{singleBooking?.customer_email || '-'}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="sm" c="dimmed">Phone Number</Text>
                    <Text size="sm" c="dark">{singleBooking?.customer_phone || '-'}</Text>
                  </Group>
                </Stack>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr style={{ backgroundColor: '#f9fafb' }}>
                      <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>No.</Table.Th>
                      <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Name</Table.Th>
                      <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Email</Table.Th>
                      <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Phone Number</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>1</Table.Td>
                      <Table.Td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{singleBooking?.customer_name || '-'}</Table.Td>
                      <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{singleBooking?.customer_email || '-'}</Table.Td>
                      <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{singleBooking?.customer_phone || '-'}</Table.Td>
                    </Table.Tr>
                  </Table.Tbody>
                </Table>
              )}
              <Group gap="md">
                <Text size="sm" c="dark">Passengers: {passengerCount || 0}</Text>
                <Text size="sm" c="dark">Special Request: {specialRequest || '-'}</Text>
              </Group>
            </Stack>

            <Stack gap="md">
              <Text size="sm" fw={600} c="dark">Passenger Details</Text>
              {isMobile ? (
                <Stack gap="sm">
                  {bookingItems.map((it: any, idx: number) => {
                    const nm = splitName(it.participant_name);
                    const meta = it.meta || {};
                    const fullName = `${meta.title ? meta.title + ' ' : ''}${meta.firstName || nm.first || '-'} ${meta.lastName || nm.last || ''}`.trim();
                    return (
                      <Paper key={it.id || idx} withBorder p="md" radius="md">
                        <Stack gap="xs">
                          <Group justify="space-between" align="center">
                            <Badge color="gray" variant="light" styles={{ root: { borderRadius: 8 } }}>{idx + 1}</Badge>
                            {meta.ageCategory ? (
                              <Badge color="blue" variant="light" styles={{ root: { borderRadius: 8 } }}>{meta.ageCategory}</Badge>
                            ) : null}
                          </Group>
                          <Text fw={600} c="#284361">{fullName}</Text>
                          <SimpleGrid cols={{ base: 2, md: 3 }} spacing="xs">
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
                        </Stack>
                      </Paper>
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
                      const nm = splitName(it.participant_name);
                      const meta = it.meta || {};
                      return (
                        <Table.Tr key={it.id}>
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
            </Stack>
          </>
        )}

        {/* Additional Packages */}
        {/* <Stack gap="md">
          <Text size="sm" fw={600} c="dark">Additional Packages</Text>
          <SimpleGrid
            cols={{ base: 1, md: 2 }}
            spacing="md"
          >
            <PackageCard 
              image="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400" 
              title="VIP Beach Club Access" 
              originalPrice="IDR 300,000" 
              price="IDR 200,000" 
            />
            <PackageCard 
              image="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400" 
              title="Balinese Lunch Package" 
              originalPrice="IDR 120,000" 
              price="IDR 85,000" 
            />
            <PackageCard 
              image="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400" 
              title="Snorkeling Experience" 
              originalPrice="IDR 200,000" 
              price="IDR 120,000" 
            />
          </SimpleGrid>
        </Stack> */}

        {/* Apply Promo */}
        {/* <Stack gap="md">
          <Text size="sm" fw={600} c="dark">Apply Promo</Text>
          <Group gap="sm">
            <TextInput
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.currentTarget.value)}
              leftSection={<IconTicket size={20} />}
              style={{ flex: 1 }}
              styles={{
                input: {
                  border: '1px solid #d1d5db',
                  backgroundColor: 'white',
                  color: '#111827',
                  '&::placeholder': { color: '#6b7280' },
                  '&:focus': { 
                    borderColor: '#2dbe8d',
                    boxShadow: '0 0 0 2px rgba(45, 190, 141, 0.2)'
                  }
                }
              }}
            />
            <Button
              style={{
                backgroundColor: '#284361',
                ':hover': { backgroundColor: '#1e3147' }
              }}
            >
              Apply
            </Button>
          </Group>
        </Stack> */}
      </Stack>
    </Paper>
  );
}

function PackageCard({
  image,
  title,
  originalPrice,
  price
}: {
  image: string;
  title: string;
  originalPrice: string;
  price: string;
}) {
  return (
    <Group align="center" gap="md" p="md" style={{ border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <Image src={image} alt={title} w={64} h={64} radius="md" />
      <Stack gap="xs" style={{ flex: 1 }}>
        <Text size="sm" fw={500} c="dark">{title}</Text>
        <Group gap="sm" align="center">
          <Text size="xs" c="dimmed" td="line-through">{originalPrice}</Text>
          <Text size="sm" fw={600} c="#2dbe8d">{price}</Text>
        </Group>
      </Stack>
    </Group>
  );
}
