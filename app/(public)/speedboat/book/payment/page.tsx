'use client';

import React, { useEffect, useState } from 'react';
import { Container, Box, SimpleGrid, Stack, Title, Text, Grid } from '@mantine/core';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProgressIndicator } from '@/components/speedboat/progress-indicator';
import { BookingReview } from '@/components/speedboat/booking-review';
import { PaymentSummary } from '@/components/speedboat/payment-summary';
import { PaymentMethodSelector } from '@/components/speedboat/payment-method-selector';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function PaymentPage() {
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('virtual-account');
  const [promoCode, setPromoCode] = useState('');
  const [booking, setBooking] = useState<any>(null);

  function mapBooking(b: any) {
    if (!b) return null;
    const supaItems = Array.isArray(b?.booking_items) ? b.booking_items : [];
    const prismaItems = Array.isArray(b?.items)
      ? b.items.map((it: any) => ({
          id: it.id,
          unit_price: it.unitPrice,
          quantity: it.quantity,
          item_date: it.itemDate,
          subtotal: it.subtotal,
          participant_name: it.participantName,
          participant_email: it.participantEmail,
          participant_phone: it.participantPhone,
          special_requirements: it.specialRequirements,
        }))
      : [];
    const booking_items = supaItems.length ? supaItems : prismaItems;
    return {
      id: b.id,
      booking_code: b?.booking_code ?? b?.bookingCode ?? '',
      status: b?.status ?? '',
      customer_name: b?.customer_name ?? b?.customerName ?? '',
      customer_email: b?.customer_email ?? b?.customerEmail ?? '',
      customer_phone: b?.customer_phone ?? b?.customerPhone ?? '',
      booking_date: b?.booking_date ?? b?.bookingDate ?? null,
      total_amount: Number(b?.total_amount ?? b?.totalAmount ?? 0),
      booking_items,
    };
  }

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login?redirectTo=/speedboat/book/payment');
        return;
      }
      try {
        const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const idParam = search.get('id');
        const idStorage = typeof window !== 'undefined' ? localStorage.getItem('booking_id') : null;
        const id = idParam || idStorage;
        if (!id) return;
        const res = await fetch(`/api/bookings?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        setBooking(mapBooking(json.booking));
      } catch {}
    };
    load();
  }, []);

  const handlePayment = async () => {
    try {
      const id = booking?.id;
      if (!id) return;
      const paidAmount = booking?.total_amount ?? booking?.totalAmount ?? 0;
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay', id, paymentMethod: selectedPaymentMethod, paidAmount }),
      });
      if (!res.ok) return;
      router.push(`/speedboat/book/confirmation?id=${encodeURIComponent(id)}`);
    } catch {}
  };

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header />
      
      <Box component="main">
        <Container size="xl" py="xl">
          {/* Progress Indicator */}
          <Box mb="xl">
            <ProgressIndicator currentStep={2} />
          </Box>

          {/* Page Title */}
          <Stack gap="xs" mb="xl">
            <Title order={1} size="2xl" fw={700} c="#284361">
              Payment
            </Title>
            <Text c="dimmed">
              Review your booking details and complete your payment
            </Text>
          </Stack>

          {/* Main Content */}
          <Grid gutter="xl">
            {/* Left Column - Booking Review */}
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Stack gap="xl">
                <BookingReview 
                  promoCode={promoCode}
                  setPromoCode={setPromoCode}
                  booking={booking}
                />
                
                <PaymentMethodSelector 
                  selectedMethod={selectedPaymentMethod}
                  onMethodChange={setSelectedPaymentMethod}
                />
              </Stack>
            </Grid.Col>

            {/* Right Column - Payment Summary */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Box style={{ position: 'sticky', top: 32 }}>
                <PaymentSummary 
                  onContinue={handlePayment}
                  buttonText="Pay Now"
                  booking={booking}
                />
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
