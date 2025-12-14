'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Container, Box, SimpleGrid, Stack, Title, Text, Grid, Group, Collapse, TextInput } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProgressIndicator } from '@/components/speedboat/progress-indicator';
import { BookingReview } from '@/components/speedboat/booking-review';
import { PaymentSummary } from '@/components/speedboat/payment-summary';
import { PaymentMethodSelector } from '@/components/speedboat/payment-method-selector';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import QRCode from 'qrcode';

export default function PaymentPage() {
  const router = useRouter();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('virtual-account');
  const [promoCode, setPromoCode] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [openDep, setOpenDep] = useState(true);
  const [openRet, setOpenRet] = useState(false);
  const [qrMap, setQrMap] = useState<Record<number, { qrString?: string; qrImageUrl?: string }>>({});
  const [qrSingle, setQrSingle] = useState<{ qrString?: string; qrImageUrl?: string } | null>(null);
  const [vaMap, setVaMap] = useState<Record<number, { accountNumber?: string; bankCode?: string }>>({});
  const [vaSingle, setVaSingle] = useState<{ accountNumber?: string; bankCode?: string } | null>(null);
  const [selectedVaBank, setSelectedVaBank] = useState<string>('BCA');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvn, setCardCvn] = useState('');
  const [cardName, setCardName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const cardReady = (() => {
    if (selectedPaymentMethod !== 'credit-card') return true;
    return !!(cardNumber && cardExpiry && cardCvn && cardName);
  })();
  const timers = useRef<Record<number, ReturnType<typeof setInterval> | undefined>>({});
  const singleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [readyRefreshMap, setReadyRefreshMap] = useState<Record<number, { xid?: string }>>({});
  const [readyRefreshSingle, setReadyRefreshSingle] = useState<{ xid?: string } | null>(null);

  const statusLabel = (b: any) => {
    const s = String(b?.status || '').toUpperCase();
    if (s === 'PAID' || s === 'COMPLETED') return 'Paid';
    if (s === 'PENDING') return 'Pending';
    return s || '-';
  };

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
          product: it.product ? { category: it.product.category ? { name: it.product.category.name } : undefined } : undefined,
          schedule: it.product?.fastboatSchedule ? {
            departure_time: it.product.fastboatSchedule.departureTime,
            arrival_time: it.product.fastboatSchedule.arrivalTime,
            departure_route: it.product.fastboatSchedule.departureRoute?.name,
            arrival_route: it.product.fastboatSchedule.arrivalRoute?.name,
            boat: {
              name: it.product.fastboatSchedule.boat?.name,
              capacity: it.product.fastboatSchedule.boat?.capacity,
            },
          } : undefined,
          inventory: it.inventory ? { inventoryDate: it.inventory.inventoryDate } : undefined,
          meta: (() => {
            try {
              return it.specialRequirements ? JSON.parse(it.specialRequirements) : undefined;
            } catch { return undefined; }
          })(),
        }))
      : [];
    const booking_items = supaItems.length ? supaItems.map((it: any) => ({
      ...it,
      meta: (() => { try { return it.special_requirements ? JSON.parse(it.special_requirements) : undefined; } catch { return undefined; } })(),
    })) : prismaItems;
    return {
      id: b.id,
      booking_code: b?.booking_code ?? b?.bookingCode ?? '',
      status: b?.status ?? '',
      customer_name: b?.customer_name ?? b?.customerName ?? '',
      customer_email: b?.customer_email ?? b?.customerEmail ?? '',
      customer_phone: b?.customer_phone ?? b?.customerPhone ?? '',
      booking_date: b?.booking_date ?? b?.bookingDate ?? null,
      created_at: b?.created_at ?? (b?.createdAt ? new Date(b.createdAt).toISOString() : null),
      createdAt: b?.createdAt ?? (b?.created_at ? new Date(b.created_at) : null),
      total_amount: Number(b?.total_amount ?? b?.totalAmount ?? 0),
      customer_notes: b?.customer_notes ?? b?.customerNotes ?? '',
      booking_items,
      tenant: b?.tenant ? { vendorName: b?.tenant?.vendorName ?? b?.tenant?.vendor_name ?? '' } : undefined,
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
        const uid = session.user.id;
        const email = (session.user.email || '').trim().toLowerCase();
        const idParam = search.get('id') || '';
        const idsParam = search.get('ids') || '';
        if (idsParam) {
          const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
          const loaded: any[] = [];
          for (const id of ids) {
            const byId = await fetch(`/api/bookings?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`, { cache: 'no-store' });
            if (byId.ok) {
              const json = await byId.json();
              loaded.push(mapBooking(json.booking));
            }
          }
          if (loaded.length) {
            setBookings(loaded);
            setBooking(loaded[0]);
            try { localStorage.setItem('booking_ids', JSON.stringify(ids)); } catch {}
            return;
          }
        }
        const hasIdParam = !!idParam;
        if (hasIdParam) {
          try { localStorage.removeItem('booking_code'); } catch {}
          const byId = await fetch(`/api/bookings?id=${encodeURIComponent(idParam)}&userId=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`, { cache: 'no-store' });
          if (byId.ok) {
            const json = await byId.json();
            setBooking(mapBooking(json.booking));
            try { localStorage.setItem('booking_id', idParam); } catch {}
            return;
          }
        }
        let idsLocal: string[] = [];
        try {
          const raw = typeof window !== 'undefined' ? (localStorage.getItem('booking_ids') || '') : '';
          if (raw) idsLocal = JSON.parse(raw);
        } catch {}
        if (idsLocal && idsLocal.length) {
          const loaded: any[] = [];
          for (const id of idsLocal) {
            const byId = await fetch(`/api/bookings?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`, { cache: 'no-store' });
            if (byId.ok) {
              const json = await byId.json();
              loaded.push(mapBooking(json.booking));
            }
          }
          if (loaded.length) {
            setBookings(loaded);
            setBooking(loaded[0]);
            return;
          }
        }
        let id = '';
        try { id = typeof window !== 'undefined' ? localStorage.getItem('booking_id') || '' : ''; } catch {}
        if (id) {
          const byId = await fetch(`/api/bookings?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`, { cache: 'no-store' });
          if (byId.ok) {
            const json = await byId.json();
            setBooking(mapBooking(json.booking));
            return;
          }
        }
        if (!hasIdParam) {
          let code = '';
          try { code = typeof window !== 'undefined' ? localStorage.getItem('booking_code') || '' : ''; } catch {}
          if (code) {
            const byCode = await fetch(`/api/bookings?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
            if (byCode.ok) {
              const json = await byCode.json();
              setBooking(mapBooking(json.booking));
              return;
            }
          }
        }
        const list = await fetch(`/api/bookings?userId=${encodeURIComponent(uid)}`, { cache: 'no-store' });
        if (list.ok) {
          const json = await list.json();
          const arr = Array.isArray(json?.bookings) ? json.bookings : [];
          const preferred = arr.find((b: any) => String(b?.status || b?.status) === 'PENDING') || arr[0];
          if (preferred) {
            const mapped = mapBooking(preferred);
            setBooking(mapped);
            try {
              const bid = String(preferred?.id || '');
              if (bid) localStorage.setItem('booking_id', bid);
            } catch {}
            return;
          }
        }
      } catch {}
    };
    load();
  }, []);

  const handlePayment = async (index?: number) => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      if (bookings && bookings.length > 1) {
        const idx = typeof index === 'number' ? index : 0;
        const b = bookings[idx];
        const id = b?.id;
        if (!id) return;
        if (selectedPaymentMethod === 'qris') {
          const createRes = await fetch('/api/payments/qris/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: id }) });
          if (!createRes.ok) return;
          const j = await createRes.json();
          try {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            const dummyUrl = `${origin}/speedboat/book/payment/dummy-qris?code=${encodeURIComponent(b?.booking_code || '')}&xid=${encodeURIComponent(j?.xenditId || '')}`;
            const dataUrl = await QRCode.toDataURL(dummyUrl, { width: 256, margin: 1 });
            setQrMap((prev) => ({ ...prev, [idx]: { qrString: dummyUrl, qrImageUrl: dataUrl } }));
          } catch {
            setQrMap((prev) => ({ ...prev, [idx]: { qrString: j?.qrString || '', qrImageUrl: j?.qrImageUrl || '' } }));
          }
          setReadyRefreshMap((prev) => ({ ...prev, [idx]: { xid: j?.xenditId || '' } }));
          return;
        }
        if (selectedPaymentMethod === 'virtual-account') {
          const createRes = await fetch('/api/payments/va/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: id, bankCode: selectedVaBank }) });
          if (!createRes.ok) return;
          const j = await createRes.json();
          setVaMap((prev) => ({ ...prev, [idx]: { accountNumber: j?.accountNumber || '', bankCode: j?.bankCode || '' } }));
          setReadyRefreshMap((prev) => ({ ...prev, [idx]: { xid: j?.xenditId || '' } }));
          return;
        }
        if (selectedPaymentMethod === 'credit-card') {
          const num = String(cardNumber || '').replace(/\s+/g, '');
          const exp = String(cardExpiry || '').trim();
          const cvn = String(cardCvn || '').trim();
          const name = String(cardName || '').trim();
          if (!/^\d{12,19}$/.test(num)) { window.alert('Nomor kartu harus angka 12–19 digit'); return; }
          const parts = exp.split('/').map((s) => s.trim());
          if (parts.length !== 2 || !/^\d{2}$/.test(parts[0]) || !/^\d{2}$/.test(parts[1])) { window.alert('Expiry harus format MM/YY'); return; }
          const mm = Number(parts[0]); const yy = Number(parts[1]);
          if (mm < 1 || mm > 12) { window.alert('Bulan expiry tidak valid'); return; }
          const year = 2000 + yy;
          const now = new Date();
          const expDate = new Date(year, mm, 0, 23, 59, 59, 999);
          if (expDate < now) { window.alert('Kartu sudah kedaluwarsa'); return; }
          if (!/^\d{3,4}$/.test(cvn)) { window.alert('CVV harus 3–4 digit angka'); return; }
          if (!name) { window.alert('Nama pemegang kartu wajib diisi'); return; }
          const createRes = await fetch('/api/payments/card/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId: id, cardNumber: num, cardExpMonth: mm, cardExpYear: year, cardCvn: cvn, cardName: name }),
          });
          if (!createRes.ok) return;
          const j = await createRes.json();
          // if (j?.requiresAction && j?.redirectUrl) { try { window.open(String(j.redirectUrl), '_blank'); } catch {} }
          setReadyRefreshMap((prev) => ({ ...prev, [idx]: { xid: j?.xenditId || '' } }));
          return;
        }
        const paidAmount = b?.total_amount ?? b?.totalAmount ?? 0;
        await fetch('/api/bookings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pay', id, paymentMethod: selectedPaymentMethod, paidAmount }),
        });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const uid = session.user.id;
            const email = (session.user.email || '').trim().toLowerCase();
            const byId = await fetch(`/api/bookings?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`, { cache: 'no-store' });
            if (byId.ok) {
              const json = await byId.json();
              const updated = mapBooking(json.booking);
              setBookings((prev) => {
                const copy = [...prev];
                copy[idx] = updated;
                return copy;
              });
            }
          }
        } catch {}
        const allPaid = (arr: any[]) => arr.every((bb: any) => String(bb?.status || '').toUpperCase() === 'PAID' || String(bb?.status || '').toUpperCase() === 'COMPLETED');
        const shouldRedirect = allPaid((Array.isArray(bookings) ? bookings : []).map((bb, i) => (i === idx ? { ...bb, status: 'PAID' } : bb)));
        if (shouldRedirect) {
          router.push('/profile/my-bookings');
          return;
        }
        return;
      }
      const id = booking?.id;
      if (!id) return;
      if (selectedPaymentMethod === 'qris') {
        const createRes = await fetch('/api/payments/qris/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: id }) });
        if (!createRes.ok) return;
        const j = await createRes.json();
        try {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const dummyUrl = `${origin}/speedboat/book/payment/dummy-qris?code=${encodeURIComponent(booking?.booking_code || '')}&xid=${encodeURIComponent(j?.xenditId || '')}`;
          const dataUrl = await QRCode.toDataURL(dummyUrl, { width: 256, margin: 1 });
          setQrSingle({ qrString: dummyUrl, qrImageUrl: dataUrl });
        } catch {
          setQrSingle({ qrString: j?.qrString || '', qrImageUrl: j?.qrImageUrl || '' });
        }
        setReadyRefreshSingle({ xid: j?.xenditId || '' });
        return;
      }
      if (selectedPaymentMethod === 'virtual-account') {
        const createRes = await fetch('/api/payments/va/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: id, bankCode: selectedVaBank }) });
        if (!createRes.ok) return;
        const j = await createRes.json();
        setVaSingle({ accountNumber: j?.accountNumber || '', bankCode: j?.bankCode || '' });
        setReadyRefreshSingle({ xid: j?.xenditId || '' });
        return;
      }
      if (selectedPaymentMethod === 'credit-card') {
        const num = String(cardNumber || '').replace(/\s+/g, '');
        const exp = String(cardExpiry || '').trim();
        const cvn = String(cardCvn || '').trim();
        const name = String(cardName || '').trim();
        if (!/^\d{12,19}$/.test(num)) { window.alert('Nomor kartu harus angka 12–19 digit'); return; }
        const parts = exp.split('/').map((s) => s.trim());
        if (parts.length !== 2 || !/^\d{2}$/.test(parts[0]) || !/^\d{2}$/.test(parts[1])) { window.alert('Expiry harus format MM/YY'); return; }
        const mm = Number(parts[0]); const yy = Number(parts[1]);
        if (mm < 1 || mm > 12) { window.alert('Bulan expiry tidak valid'); return; }
        const year = 2000 + yy;
        const now = new Date();
        const expDate = new Date(year, mm, 0, 23, 59, 59, 999);
        if (expDate < now) { window.alert('Kartu sudah kedaluwarsa'); return; }
        if (!/^\d{3,4}$/.test(cvn)) { window.alert('CVV harus 3–4 digit angka'); return; }
        if (!name) { window.alert('Nama pemegang kartu wajib diisi'); return; }
        const createRes = await fetch('/api/payments/card/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: id, cardNumber: num, cardExpMonth: mm, cardExpYear: year, cardCvn: cvn, cardName: name }),
        });
        if (!createRes.ok) return;
        const j = await createRes.json();
        // if (j?.requiresAction && j?.redirectUrl) { try { window.open(String(j.redirectUrl), '_blank'); } catch {} }
        setReadyRefreshSingle({ xid: j?.xenditId || '' });
        return;
      }
      const paidAmount = booking?.total_amount ?? booking?.totalAmount ?? 0;
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay', id, paymentMethod: selectedPaymentMethod, paidAmount }),
      });
      if (!res.ok) return;
      const qs = new URLSearchParams();
      qs.set('id', String(id));
      router.push(`/speedboat/book/ticket?${qs.toString()}`);
    } catch {}
    finally {
      setIsProcessing(false);
    }
  };

  const refreshPaidMulti = async (idx: number) => {
    try {
      const b = bookings[idx];
      const id = b?.id;
      if (!id) return;
      const paidAmount = b?.total_amount ?? b?.totalAmount ?? 0;
      const xid = (readyRefreshMap[idx] || {}).xid || undefined;
      const channel = selectedPaymentMethod === 'virtual-account' ? ((vaMap[idx] || {}).bankCode || 'VA') : (selectedPaymentMethod === 'credit-card' ? 'CREDIT_CARD' : 'QRIS');
      await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          id,
          paymentMethod: selectedPaymentMethod,
          xenditPaymentChannel: channel,
          xenditInvoiceId: xid,
          paidAmount,
        }),
      });
      const allPaid = (arr: any[]) => arr.every((bb: any) => String(bb?.status || '').toUpperCase() === 'PAID' || String(bb?.status || '').toUpperCase() === 'COMPLETED');
      const shouldRedirect = allPaid((Array.isArray(bookings) ? bookings : []).map((bb, i) => (i === idx ? { ...bb, status: 'PAID' } : bb)));
      if (shouldRedirect) {
        router.push('/profile/my-bookings');
      }
    } catch {}
  };

  const refreshPaidSingle = async () => {
    try {
      const id = booking?.id;
      if (!id) return;
      const paidAmount = booking?.total_amount ?? booking?.totalAmount ?? 0;
      const xid = readyRefreshSingle?.xid || undefined;
      const channel = selectedPaymentMethod === 'virtual-account' ? (vaSingle?.bankCode || 'VA') : (selectedPaymentMethod === 'credit-card' ? 'CREDIT_CARD' : 'QRIS');
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          id,
          paymentMethod: selectedPaymentMethod,
          xenditPaymentChannel: channel,
          xenditInvoiceId: xid,
          paidAmount,
        }),
      });
      if (!res.ok) return;
      const qs = new URLSearchParams();
      qs.set('id', String(id));
      router.push(`/speedboat/book/ticket?${qs.toString()}`);
    } catch {}
  };

  const handleExpire = async () => {
    try {
      const id = booking?.id;
      if (!id) {
        router.replace('/profile/my-bookings');
        return;
      }
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'expire', id }),
      });
      router.replace('/profile/my-bookings');
    } catch {
      router.replace('/profile/my-bookings');
    }
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
                {bookings && bookings.length > 0 ? (
                  bookings.map((b, idx) => (
                    <BookingReview key={String(b?.id || idx)} promoCode={promoCode} setPromoCode={setPromoCode} booking={b} />
                  ))
                ) : (
                  <BookingReview 
                    promoCode={promoCode}
                    setPromoCode={setPromoCode}
                    booking={booking}
                  />
                )}
                
                <PaymentMethodSelector 
                  selectedMethod={selectedPaymentMethod}
                  onMethodChange={setSelectedPaymentMethod}
                  vaBank={selectedVaBank}
                  onVaBankChange={setSelectedVaBank}
                  cardNumber={cardNumber}
                  cardExpiry={cardExpiry}
                  cardCvn={cardCvn}
                  cardName={cardName}
                  onCardNumberChange={setCardNumber}
                  onCardExpiryChange={setCardExpiry}
                  onCardCvnChange={setCardCvn}
                  onCardNameChange={setCardName}
                />
                
              </Stack>
            </Grid.Col>

            {/* Right Column - Payment Summary */}
            <Grid.Col span={{ base: 12, lg: 4 }}>
              <Box style={{ position: 'sticky', top: 32 }}>
                {bookings && bookings.length > 1 ? (
                  <Stack gap="md">
                    <Box>
                      <Box style={{ border: '1px solid #e9ecef', borderRadius: 12, backgroundColor: 'white' }}>
                        <Group justify="space-between" align="center" p="md" style={{ cursor: 'pointer' }} onClick={() => setOpenDep((o) => !o)}>
                          <Text fw={600} c="#284361">Departure Ticket</Text>
                          <Group gap="xs">
                            <Text c="dimmed">{statusLabel(bookings[0])}</Text>
                            <IconChevronDown size={16} style={{ transform: openDep ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }} />
                          </Group>
                        </Group>
                        <Collapse in={openDep}>
                          <Box p="md" pt={0}>
                            <PaymentSummary 
                              onContinue={() => handlePayment(0)}
                              buttonText="Pay Now"
                              booking={bookings[0]}
                              title="Payment Summary - Departure Ticket"
                              noWrapper
                              onExpire={handleExpire}
                              qrString={(qrMap[0] || {}).qrString}
                              qrImageUrl={(qrMap[0] || {}).qrImageUrl}
                              vaNumber={(vaMap[0] || {}).accountNumber}
                              vaBankCode={(vaMap[0] || {}).bankCode}
                              disabled={(!cardReady && selectedPaymentMethod === 'credit-card') || isProcessing}
                              onRefresh={readyRefreshMap[0] ? () => refreshPaidMulti(0) : undefined}
                            />
                          </Box>
                        </Collapse>
                      </Box>
                    </Box>
                    <Box>
                      <Box style={{ border: '1px solid #e9ecef', borderRadius: 12, backgroundColor: 'white' }}>
                        <Group justify="space-between" align="center" p="md" style={{ cursor: 'pointer' }} onClick={() => setOpenRet((o) => !o)}>
                          <Text fw={600} c="#284361">Return Ticket</Text>
                          <Group gap="xs">
                            <Text c="dimmed">{statusLabel(bookings[1])}</Text>
                            <IconChevronDown size={16} style={{ transform: openRet ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 150ms ease' }} />
                          </Group>
                        </Group>
                        <Collapse in={openRet}>
                          <Box p="md" pt={0}>
                            <PaymentSummary 
                              onContinue={() => handlePayment(1)}
                              buttonText="Pay Now"
                              booking={bookings[1]}
                              title="Payment Summary - Return Ticket"
                              noWrapper
                              onExpire={handleExpire}
                              qrString={(qrMap[1] || {}).qrString}
                              qrImageUrl={(qrMap[1] || {}).qrImageUrl}
                              vaNumber={(vaMap[1] || {}).accountNumber}
                              vaBankCode={(vaMap[1] || {}).bankCode}
                              disabled={(!cardReady && selectedPaymentMethod === 'credit-card') || isProcessing}
                              onRefresh={readyRefreshMap[1] ? () => refreshPaidMulti(1) : undefined}
                            />
                          </Box>
                        </Collapse>
                      </Box>
                    </Box>
                  </Stack>
                ) : (
                  <PaymentSummary 
                    onContinue={() => handlePayment()}
                    buttonText="Pay Now"
                    booking={booking}
                    onExpire={handleExpire}
                    qrString={(qrSingle || {}).qrString}
                    qrImageUrl={(qrSingle || {}).qrImageUrl}
                    vaNumber={(vaSingle || {}).accountNumber}
                    vaBankCode={(vaSingle || {}).bankCode}
                    disabled={(!cardReady && selectedPaymentMethod === 'credit-card') || isProcessing}
                    onRefresh={readyRefreshSingle ? refreshPaidSingle : undefined}
                  />
                )}
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
