'use client';

import React from 'react';
import { Paper, Stack, Title, Text, Group, Table, SimpleGrid, Image, Button, TextInput } from '@mantine/core';
import { IconAnchor, IconCalendar, IconClock, IconTicket } from '@tabler/icons-react';

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
            <Group align="center" gap="md">
              <IconCalendar size={20} color="#6b7280" />
              <Text c="dark">Status: {booking?.status || '-'}</Text>
            </Group>
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
        </Stack>

        {/* Passenger Details */}
        <Stack gap="md">
          <Text size="sm" fw={600} c="dark">Passenger Details</Text>
          <Table>
            <Table.Thead>
              <Table.Tr style={{ backgroundColor: '#f9fafb' }}>
                <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>No.</Table.Th>
                <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Name</Table.Th>
                <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Email</Table.Th>
                <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Phone</Table.Th>
                <Table.Th style={{ padding: '8px 16px', color: '#6b7280', fontWeight: 500 }}>Notes</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(booking?.booking_items || []).map((it: any, idx: number) => (
                <Table.Tr key={it.id}>
                  <Table.Td style={{ padding: '12px 16px', color: '#111827' }}>{idx + 1}</Table.Td>
                  <Table.Td style={{ padding: '12px 16px', color: '#111827', fontWeight: 500 }}>{it.participant_name || '-'}</Table.Td>
                  <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{it.participant_email || '-'}</Table.Td>
                  <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{it.participant_phone || '-'}</Table.Td>
                  <Table.Td style={{ padding: '12px 16px', color: '#6b7280' }}>{it.special_requirements || '-'}</Table.Td>
                </Table.Tr>
              ))}
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
