'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Container, Box, Group, Text, ActionIcon, SimpleGrid, Stack, Grid } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProgressIndicator } from '@/components/speedboat/progress-indicator';
import { ContactForm } from '@/components/speedboat/contact-form';
import { PassengerForm } from '@/components/speedboat/passenger-form';
import { BookingSummary } from '@/components/speedboat/booking-summary';
import { supabase } from '@/lib/supabase/client';

function BookingPageContent() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin') ?? '';
  const destination = searchParams.get('destination') ?? '';
  const departure = searchParams.get('departure') ?? '';
  const provider = searchParams.get('provider') ?? '';
  const priceIdr = Number(searchParams.get('priceIdr') ?? '0');
  const trip = useMemo(() => `${origin} → ${destination}`, [origin, destination]);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [contact, setContact] = useState<{ fullName: string; email: string; countryCode: string; phone: string; specialRequests?: string; agreed?: boolean }>({ fullName: '', email: '', countryCode: '+62', phone: '' });
  const [passengers, setPassengers] = useState<any[]>([]);
  const passengerPrice = useMemo(() => priceIdr * guestCount, [priceIdr, guestCount]);
  const passengersList = useMemo(() => passengers.map((p) => ({ nationality: p.nationality, ageCategory: p.ageCategory })), [passengers]);

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <ProgressIndicator currentStep={1} />
      <Container size="xl" py="md">
        <Link href="/speedboat" style={{ textDecoration: 'none' }}>
          <Group gap="xs" style={{ cursor: 'pointer', color: '#6b7280', transition: 'color 0.2s ease' }}>
            <IconArrowLeft size={16} />
            <Text size="sm" style={{ ':hover': { color: '#111827' } }}>Back to Speedboat</Text>
          </Group>
        </Link>
      </Container>

      <Box component="main" style={{ flex: 1 }}>
        <Container size="xl" pb="xl">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Stack gap="xl">
                <ContactForm guestCount={guestCount} onGuestCountChange={setGuestCount} onChange={setContact} />
                <PassengerForm guestCount={guestCount} onChange={setPassengers} mainContactName={contact.fullName} />
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <BookingSummary 
                trip={trip} 
                departureDate={departure} 
                passengersList={passengersList}
                passengerSubtotal={passengerPrice} 
                portFee={10000} 
                onContinue={async () => {
                  const scheduleId = searchParams.get('sid') ?? '';
                  const payload = {
                    scheduleId,
                    origin,
                    destination,
                    departureTime: departure,
                    guestCount,
                    priceIdr,
                    portFee: 10000,
                    contact,
                    passengers,
                    currency: 'IDR',
                  };
                  const res = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  if (res.ok) {
                    const json = await res.json();
                    const code = json?.booking?.booking_code ?? json?.booking_code ?? '';
                    const id = json?.booking?.id ?? json?.id ?? '';
                    if (code) {
                      try { localStorage.setItem('booking_code', code); } catch {}
                    }
                    if (id) {
                      try { localStorage.setItem('booking_id', id); } catch {}
                    }
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                      window.location.href = id ? `/speedboat/book/payment?id=${encodeURIComponent(id)}` : '/speedboat/book/payment';
                    } else {
                      window.location.href = id ? `/login?redirectTo=/speedboat/book/payment?id=${encodeURIComponent(id)}` : '/login?redirectTo=/speedboat/book/payment';
                    }
                  }
                }}
                buttonText="Continue to Payment"
              />
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}

export default function SpeedboatBookingPage() {
  return (
    <Suspense>
      <BookingPageContent />
    </Suspense>
  );
}
