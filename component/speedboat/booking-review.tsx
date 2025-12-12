'use client';

import React from 'react';
import { Paper, Stack, Title, Text, Group, Table, SimpleGrid, Image, Button, TextInput } from '@mantine/core';
import { IconAnchor, IconCalendar, IconClock, IconTicket, IconBriefcase } from '@tabler/icons-react';

interface BookingReviewProps {
  promoCode: string;
  setPromoCode: (code: string) => void;
  booking?: any;
}

export function BookingReview({
  promoCode,
  setPromoCode,
  booking
}: BookingReviewProps) {
  function splitName(full?: string) {
    const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
  }
  const firstItem = Array.isArray(booking?.booking_items) ? booking.booking_items[0] : undefined;
  const trip = firstItem?.schedule?.departure_route && firstItem?.schedule?.arrival_route
    ? `${firstItem.schedule.departure_route} → ${firstItem.schedule.arrival_route}`
    : '';
  const departureTime = firstItem?.schedule?.departure_time || '';
  const arrivalTime = firstItem?.schedule?.arrival_time || '';
  const inventoryDateRaw = (firstItem as any)?.inventory?.inventoryDate || '';
  const inventoryDateStr = (() => {
    if (!inventoryDateRaw) return '';
    const d = new Date(inventoryDateRaw);
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
  const vendorName = (booking?.tenant?.vendorName || booking?.tenant?.vendor_name || '') as string;
  const categoryName = (firstItem as any)?.product?.category?.name || '';
  const passengerCount = Array.isArray(booking?.booking_items) ? booking.booking_items.length : 0;
  return (
    <Paper shadow="sm" radius="lg" p="xl" bg="white">
      <Stack gap="xl">
        <Title order={2} size="xl" fw={700} c="#284361">Review Your Booking</Title>
        
        <Stack gap="md">
          <Text size="sm" fw={600} c="dark">Booking Details</Text>
          <Stack gap="md">
            <Group align="center" gap="md">
              <IconAnchor size={20} color="#6b7280" />
              <Text c="dark">Code: {booking?.booking_code || '-'}</Text>
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
                <Text c="dark">Boat: {boatName || '-'}{typeof boatCapacity === 'number'}</Text>
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
            {inventoryDateStr && (
              <Group align="center" gap="md">
                <IconCalendar size={20} color="#6b7280" />
                <Text c="dark">Departure Date: {inventoryDateStr}</Text>
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

        {/* Contact Information */}
        <Stack gap="md">
          <Text size="sm" fw={600} c="dark">Contact Information</Text>
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
                <Table.Td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{booking?.customer_name || '-'}</Table.Td>
                <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{booking?.customer_email || '-'}</Table.Td>
                <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{booking?.customer_phone || '-'}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
          <Group gap="md">
            <Text size="sm" c="dark">Number of Passengers: {passengerCount}</Text>
            <Text size="sm" c="dark">Special Request: {booking?.customer_notes || '-'}</Text>
          </Group>
        </Stack>

        {/* Passenger Details */}
        <Stack gap="md">
          <Text size="sm" fw={600} c="dark">Passenger Details</Text>
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
              {(booking?.booking_items || []).map((it: any, idx: number) => {
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
        </Stack>

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
