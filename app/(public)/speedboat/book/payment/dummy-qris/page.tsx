'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { Container, Box, Stack, Title, Text, Group, Button, Paper, Alert, Loader } from '@mantine/core';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { supabase } from '@/lib/supabase/client';

export default function DummyQrisPage() {
  const [booking, setBooking] = useState<any | null>(null);
  const [status, setStatus] = useState<'idle' | 'paid' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setFetching(true);
        const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        const code = search.get('code') || '';
        if (!code) return;
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id || '';
        const email = (session?.user?.email || '').trim().toLowerCase();
        const qs = new URLSearchParams();
        qs.set('code', code);
        if (uid) qs.set('userId', uid);
        if (email) qs.set('email', email);
        const res = await fetch(`/api/bookings?${qs.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const j = await res.json();
          setBooking(j?.booking || null);
        }
      } catch {} finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  const handlePay = async () => {
    if (loading || !booking) return;
    try {
      setLoading(true);
      const search = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const xid = search.get('xid') || undefined;
      const paidAmount = Number(booking?.totalAmount ?? booking?.total_amount ?? 0);
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          code: booking?.bookingCode ?? booking?.booking_code,
          paymentMethod: 'QRIS',
          xenditPaymentChannel: 'QRIS',
          xenditInvoiceId: xid,
          paidAmount,
        }),
      });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      setStatus('paid');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Suspense fallback={<Box style={{ height: 64 }} />}>
        <Header />
      </Suspense>

      <Box component="main">
        <Container size="sm" py="xl">
          <Paper shadow="sm" radius="lg" p="xl" bg="white" style={{ position: 'relative' }}>
            {fetching && (
              <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
                <Loader color="#284361" />
              </Box>
            )}
            <Stack gap="md">
              <Title order={1} size="xl" fw={700} c="#284361">QRIS Payment (Dummy)</Title>
              <Text c="dimmed">Halaman ini hanya untuk keperluan uji coba. Tekan Pay untuk menyelesaikan pembayaran secara simulasi.</Text>

              {booking ? (
                <Stack gap="md">
                  <Group justify="space-between" align="center">
                    <Text c="dimmed">Booking Code</Text>
                    <Text fw={600} c="#284361">{booking?.bookingCode ?? booking?.booking_code ?? '-'}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text c="dimmed">Customer</Text>
                    <Text fw={600} c="#284361">{booking?.customerName ?? booking?.customer_name ?? '-'}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text c="dimmed">Total</Text>
                    <Text fw={700} c="#2dbe8d">{(() => {
                      const amt = booking?.totalAmount ?? booking?.total_amount;
                      const n = Number(amt || 0);
                      return `IDR ${n.toLocaleString('id-ID')}`;
                    })()}</Text>
                  </Group>

                  {status === 'idle' && (
                    <Button
                      onClick={handlePay}
                      size="lg"
                      style={{ backgroundColor: '#2dbe8d', fontWeight: 600 }}
                      loading={loading}
                      disabled={loading}
                    >
                      Pay
                    </Button>
                  )}
                  {status === 'paid' && (
                    <Alert color="green" variant="light">
                      <Text fw={600} c="#166534">Payment marked as PAID.</Text>
                      <Text c="dark">Kembali ke halaman Payment, tekan Refresh Payment untuk update status dan redirect.</Text>
                    </Alert>
                  )}
                  {status === 'error' && (
                    <Alert color="red" variant="light">
                      <Text fw={600} c="#991b1b">Failed to mark as paid.</Text>
                      <Text c="dark">Silakan coba lagi.</Text>
                    </Alert>
                  )}
                </Stack>
              ) : (
                <Alert color="orange" variant="light">
                  <Text c="dark">Booking tidak ditemukan. Pastikan parameter code tersedia pada URL.</Text>
                </Alert>
              )}
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
