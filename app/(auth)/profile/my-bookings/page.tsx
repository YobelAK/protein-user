'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { Box, Group, Text, Stack, Container, Modal, Badge, Divider, Alert, SimpleGrid, Button, Textarea, Rating, TextInput, Table, Loader } from '@mantine/core';
import { IconAlertCircle, IconClock, IconCheck, IconCreditCard } from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
// import { Sidebar } from '@/components/profile/Sidebar';
import { BookingCard } from '@/components/profile/BookingCard';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Status = 'All' | 'Booked' | 'Completed' | 'Cancelled' | 'Pending' | 'Expired'| 'Refunded';

// const categories = ['All', 'Fastboat', 'Watersport', 'Tour', 'Beach Club'];

const statuses: Status[] = ['All','Pending', 'Booked', 'Completed', 'Cancelled', 'Expired', 'Refunded'];

type CardItem = {
  id: string;
  initials: string;
  title: string;
  location: string;
  returnLocation?: string | null;
  returnVendorName?: string | null;
  returnBoatName?: string | null;
  date: string;
  bookingDate?: string | null;
  departureDate?: string | null;
  returnDate?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  returnDepartureTime?: string | null;
  returnArrivalTime?: string | null;
  arrivalAt?: string | null;
  passengers: number;
  isDoubleTrip?: boolean;
  departurePassengers?: number | null;
  returnPassengers?: number | null;
  bookingCode: string;
  status: 'Pending' | 'Booked' | 'Completed' | 'Cancelled'| 'Expired'| 'Refunded';
  image?: string | null;
  paymentDeadline?: string | null;
  deadlineAt?: string | null;
  pendingType?: 'payment' | 'refund';
  cancellationReason?: string | null;
  hasReview?: boolean;
};

export default function MyBookingsPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeStatus, setActiveStatus] = useState<Status>('All');
  const [cards, setCards] = useState<CardItem[]>([]);
  const [expiredProcessed, setExpiredProcessed] = useState<Record<string, boolean>>({});
  const [completedProcessed, setCompletedProcessed] = useState<Record<string, boolean>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<CardItem | null>(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoice, setInvoice] = useState<any | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundBooking, setRefundBooking] = useState<CardItem | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundItemsLoading, setRefundItemsLoading] = useState(false);
  const [refundBookingDetail, setRefundBookingDetail] = useState<any | null>(null);
  const [refundItemSubmitting, setRefundItemSubmitting] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<CardItem | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewInput, setReviewInput] = useState<{ rating: number; title?: string; comment?: string; serviceRating?: number; valueRating?: number; locationRating?: number }>({ rating: 0 });
  const [viewReviewOpen, setViewReviewOpen] = useState(false);
  const [viewReview, setViewReview] = useState<any | null>(null);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [invoiceLoading, setInvoiceLoading] = useState<boolean>(false);
  const [viewReviewLoading, setViewReviewLoading] = useState<boolean>(false);
  const [ticketLoadingMap, setTicketLoadingMap] = useState<Record<string, boolean>>({});
  const [payLoadingMap, setPayLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id || '';
      const email = (session?.user?.email || '').trim().toLowerCase();
      if (!uid) {
        router.replace('/login?redirectTo=/profile/my-bookings');
        setPageLoading(false);
        return;
      }
      const qs = new URLSearchParams();
      if (uid) qs.set('userId', uid);
      if (email) qs.set('email', email);
      const res = await fetch(`/api/bookings?${qs.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        const arr = Array.isArray(json.bookings) ? json.bookings : [];
        if (arr.length > 0) {
          setCards(arr);
          setPageLoading(false);
          return;
        }
      }
      try {
        let code = '';
        try { code = typeof window !== 'undefined' ? localStorage.getItem('booking_code') || '' : ''; } catch {}
        if (code) {
          const byCode = await fetch(`/api/bookings?code=${encodeURIComponent(code)}`, { cache: 'no-store' });
          if (byCode.ok) {
            const j = await byCode.json();
            const b = j?.booking;
            if (b) {
              const firstItem = Array.isArray(b?.items) ? b.items[0] : undefined;
              const dateObj = firstItem?.itemDate || b?.bookingDate;
              const qty = Array.isArray(b?.items) ? b.items.reduce((acc: number, it: any) => acc + (it.quantity || 0), 0) : 0;
              const sched = firstItem?.product?.fastboatSchedule || null;
              const boatName = sched?.boat?.name || null;
              const vendorName = b?.tenant?.vendorName || null;
              let title = [boatName, vendorName].filter(Boolean).join(' \u2022 ') || firstItem?.product?.name || 'Unknown Product';
              try {
                const notesRaw = (b as any)?.customerNotes ?? (b as any)?.customer_notes ?? '';
                let rtType: string | null = null;
                if (notesRaw) {
                  try {
                    const meta = JSON.parse(String(notesRaw));
                    const t = String(meta?.rtType || '').toUpperCase();
                    rtType = t || null;
                  } catch {}
                }
                if (!rtType) {
                  const types = new Set<string>();
                  for (const it of (Array.isArray(b?.items) ? b.items : [])) {
                    try {
                      const sr = (it as any)?.specialRequirements || null;
                      if (!sr) continue;
                      const obj = JSON.parse(String(sr));
                      const notesField = obj?.notes || '';
                      if (typeof notesField === 'string' && notesField) {
                        try {
                          const inner = JSON.parse(String(notesField));
                          const t2 = String(inner?.rtType || '').toUpperCase();
                          if (t2) types.add(t2);
                        } catch {}
                      }
                    } catch {}
                  }
                  if (types.size === 1) {
                    const only = Array.from(types)[0];
                    rtType = only || null;
                  }
                  if (!rtType) {
                    const prodIds = new Set<string>();
                    for (const it of (Array.isArray(b?.items) ? b.items : [])) {
                      const pid = String((it as any)?.productId || '');
                      if (pid) prodIds.add(pid);
                    }
                    if (prodIds.size <= 1) {
                      rtType = 'OUTBOUND';
                    }
                  }
                }
                const suffix = '';
              } catch {}
              const featured = (b?.tenant?.imageUrl || (b as any)?.tenant?.image_url || null);
              const location = sched && sched.departureRoute && sched.arrivalRoute ? `${sched.departureRoute.name} → ${sched.arrivalRoute.name}` : '';
              const initials = (() => {
                const source = boatName || '';
                const parts = String(source).split(/\s+/).filter(Boolean);
                if (parts.length === 0) return 'BT';
                return parts.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
              })();
              const stRaw = String(b?.status || '').toUpperCase();
              const status: CardItem['status'] =
                stRaw === 'PENDING' ? 'Pending' :
                stRaw === 'PAID' ? 'Booked' :
                stRaw === 'COMPLETED' ? 'Completed' :
                stRaw === 'CANCELLED' ? 'Cancelled' :
                stRaw === 'EXPIRED' ? 'Expired' :
                stRaw === 'REFUNDED' ? 'Refunded' :
                'Pending';
              const cRaw = (b as any)?.created_at ?? (b as any)?.createdAt ?? (b as any)?.createdDate ?? (b as any)?.createdate ?? null;
              const bd = cRaw ? new Date(cRaw) : null;
              const pendingType: CardItem['pendingType'] = (status === 'Pending' && (b?.paidAmount || (b as any)?.paid_amount)) ? 'refund' : (status === 'Pending' ? 'payment' : undefined);
              const deadlineAt = (pendingType === 'payment' && bd) ? new Date(bd.getTime() + 15 * 60 * 1000) : null;
              const paymentDeadline = deadlineAt ? deadlineAt.toLocaleString('id-ID', { hour12: false }) : null;
              const dateStr = dateObj ? new Date(dateObj).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              const invDate = firstItem?.inventory?.inventoryDate ? new Date((firstItem as any).inventory.inventoryDate) : null;
              const depRaw = b?.bookingDate ?? null;
              const departureDate = depRaw ? new Date(depRaw).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
              const departureTime = (sched as any)?.departureTime ?? null;
              const arrivalTime = (sched as any)?.arrivalTime ?? null;
              let returnLocation: string | null = null;
              let returnDate: string | null = null;
              let returnDepartureTime: string | null = null;
              let returnArrivalTime: string | null = null;
              let returnVendorName: string | null = null;
              let returnBoatName: string | null = null;
              let departurePassengers: number | null = null;
              let returnPassengers: number | null = null;
              let isDoubleTrip: boolean = false;
              try {
                const arrItems = Array.isArray(b?.items) ? b.items : [];
                let outQty = 0;
                let inQty = 0;
                let hasOut = false;
                let hasIn = false;
                for (const it of arrItems) {
                  try {
                    const sr = (it as any)?.specialRequirements || '';
                    const obj = sr ? JSON.parse(String(sr)) : {};
                    const notesField = obj?.notes || '';
                    if (typeof notesField === 'string' && notesField) {
                      const inner = JSON.parse(String(notesField));
                      const t = String(inner?.rtType || '').toUpperCase();
                      if (t === 'INBOUND') {
                        const rs = (it as any)?.product?.fastboatSchedule || null;
                        const depRoute = (rs as any)?.departureRoute?.name || '';
                        const arrRoute = (rs as any)?.arrivalRoute?.name || '';
                        returnLocation = depRoute && arrRoute ? `${depRoute} → ${arrRoute}` : null;
                        const itDate = (it as any)?.itemDate || ((it as any)?.inventory?.inventoryDate ?? null);
                        returnDate = itDate ? new Date(itDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
                        returnDepartureTime = (rs as any)?.departureTime ?? null;
                        returnArrivalTime = (rs as any)?.arrivalTime ?? null;
                        if (!returnBoatName) {
                          const bn = (rs as any)?.boat?.name || '';
                          returnBoatName = bn || null;
                        }
                        if (!returnVendorName) {
                          const vn = (b as any)?.tenant?.vendorName || null;
                          returnVendorName = vn;
                        }
                        inQty += Number((it as any)?.quantity || 0);
                        hasIn = true;
                      } else if (t === 'OUTBOUND') {
                        outQty += Number((it as any)?.quantity || 0);
                        hasOut = true;
                      }
                    }
                  } catch {}
                }
                if (outQty === 0 && inQty === 0) {
                  outQty = qty;
                  inQty = 0;
                }
                departurePassengers = outQty || null;
                returnPassengers = inQty || null;
                isDoubleTrip = hasOut && hasIn;
              } catch {}
              let arrivalAt: string | null = null;
              try {
                if (invDate && arrivalTime) {
                  const parts = String(arrivalTime).split(':');
                  const hh = Number(parts[0] || 0);
                  const mm = Number(parts[1] || 0);
                  const d = new Date(invDate);
                  d.setHours(hh, mm, 0, 0);
                  arrivalAt = d.toISOString();
                }
              } catch {}
              const card: CardItem = {
                id: b.id,
                initials,
                title,
                location,
                date: dateStr,
                bookingDate: bd ? bd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
                departureDate,
                returnDate,
                departureTime,
                arrivalTime,
                returnDepartureTime,
                returnArrivalTime,
                arrivalAt,
                passengers: qty,
                isDoubleTrip,
                departurePassengers,
                returnPassengers,
                bookingCode: b.bookingCode || b.booking_code || '',
                status,
                image: featured,
                paymentDeadline,
                deadlineAt: deadlineAt ? deadlineAt.toISOString() : null,
                pendingType,
                cancellationReason: (b as any)?.cancellationReason ?? (b as any)?.cancellation_reason ?? null,
                hasReview: !!(b as any)?.review,
                returnLocation,
                returnVendorName,
                returnBoatName,
              };
              setCards([card]);
              setPageLoading(false);
              return;
            }
          }
        }
        let id = '';
        try { id = typeof window !== 'undefined' ? localStorage.getItem('booking_id') || '' : ''; } catch {}
        if (id) {
          const byId = await fetch(`/api/bookings?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(uid)}`, { cache: 'no-store' });
          if (byId.ok) {
            const j = await byId.json();
            const b = j?.booking;
            if (b) {
              const firstItem = Array.isArray(b?.items) ? b.items[0] : undefined;
              const dateObj = firstItem?.itemDate || b?.bookingDate;
              const qty = Array.isArray(b?.items) ? b.items.reduce((acc: number, it: any) => acc + (it.quantity || 0), 0) : 0;
              const sched = firstItem?.product?.fastboatSchedule || null;
              const boatName = sched?.boat?.name || null;
              const vendorName = b?.tenant?.vendorName || null;
              let title = [boatName, vendorName].filter(Boolean).join(' \u2022 ') || firstItem?.product?.name || 'Unknown Product';
              try {
                const notesRaw = (b as any)?.customerNotes ?? (b as any)?.customer_notes ?? '';
                let rtType: string | null = null;
                if (notesRaw) {
                  try {
                    const meta = JSON.parse(String(notesRaw));
                    const t = String(meta?.rtType || '').toUpperCase();
                    rtType = t || null;
                  } catch {}
                }
                if (!rtType) {
                  const sr = (firstItem as any)?.specialRequirements || null;
                  if (sr) {
                    try {
                      const obj = JSON.parse(String(sr));
                      const notesField = obj?.notes || '';
                      if (notesField) {
                        try {
                          const inner = JSON.parse(String(notesField));
                          const t2 = String(inner?.rtType || '').toUpperCase();
                          rtType = t2 || rtType;
                        } catch {}
                      }
                    } catch {}
                  }
                }
                const suffix = '';
              } catch {}
              const featured = (b?.tenant?.imageUrl || (b as any)?.tenant?.image_url || null);
              const location = sched && sched.departureRoute && sched.arrivalRoute ? `${sched.departureRoute.name} → ${sched.arrivalRoute.name}` : '';
              const initials = (() => {
                const source = boatName || '';
                const parts = String(source).split(/\s+/).filter(Boolean);
                if (parts.length === 0) return 'BT';
                return parts.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
              })();
              const stRaw = String(b?.status || '').toUpperCase();
              const status: CardItem['status'] =
                stRaw === 'PENDING' ? 'Pending' :
                stRaw === 'PAID' ? 'Booked' :
                stRaw === 'COMPLETED' ? 'Completed' :
                stRaw === 'CANCELLED' ? 'Cancelled' :
                stRaw === 'EXPIRED' ? 'Expired' :
                stRaw === 'REFUNDED' ? 'Refunded' :
                'Pending';
              const cRaw = (b as any)?.created_at ?? (b as any)?.createdAt ?? (b as any)?.createdDate ?? (b as any)?.createdate ?? null;
              const bd = cRaw ? new Date(cRaw) : null;
              const pendingType: CardItem['pendingType'] = (status === 'Pending' && (b?.paidAmount || (b as any)?.paid_amount)) ? 'refund' : (status === 'Pending' ? 'payment' : undefined);
              const deadlineAt = (pendingType === 'payment' && bd) ? new Date(bd.getTime() + 15 * 60 * 1000) : null;
              const paymentDeadline = deadlineAt ? deadlineAt.toLocaleString('id-ID', { hour12: false }) : null;
              const dateStr = dateObj ? new Date(dateObj).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
              const invDate = firstItem?.inventory?.inventoryDate ? new Date((firstItem as any).inventory.inventoryDate) : null;
              const depRaw = b?.bookingDate ?? null;
              const departureDate = depRaw ? new Date(depRaw).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
              const departureTime = (sched as any)?.departureTime ?? null;
              const arrivalTime = (sched as any)?.arrivalTime ?? null;
              let returnVendorName: string | null = null;
              let returnBoatName: string | null = null;
              let returnLocation: string | null = null;
              let returnDate: string | null = null;
              let returnDepartureTime: string | null = null;
              let returnArrivalTime: string | null = null;
              let departurePassengers: number | null = null;
              let returnPassengers: number | null = null;
              let isDoubleTrip: boolean = false;
              try {
                const arrItems = Array.isArray(b?.items) ? b.items : [];
                let outQty = 0;
                let inQty = 0;
                let hasOut = false;
                let hasIn = false;
                for (const it of arrItems) {
                  try {
                    const sr = (it as any)?.specialRequirements || '';
                    const obj = sr ? JSON.parse(String(sr)) : {};
                    const notesField = obj?.notes || '';
                    if (typeof notesField === 'string' && notesField) {
                      const inner = JSON.parse(String(notesField));
                      const t = String(inner?.rtType || '').toUpperCase();
                      if (t === 'INBOUND') {
                        const rs = (it as any)?.product?.fastboatSchedule || null;
                        const depRoute = (rs as any)?.departureRoute?.name || '';
                        const arrRoute = (rs as any)?.arrivalRoute?.name || '';
                        returnLocation = depRoute && arrRoute ? `${depRoute} → ${arrRoute}` : null;
                        const itDate = (it as any)?.itemDate || ((it as any)?.inventory?.inventoryDate ?? null);
                        returnDate = itDate ? new Date(itDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
                        returnDepartureTime = (rs as any)?.departureTime ?? null;
                        returnArrivalTime = (rs as any)?.arrivalTime ?? null;
                        if (!returnBoatName) {
                          const bn = (rs as any)?.boat?.name || '';
                          returnBoatName = bn || null;
                        }
                        if (!returnVendorName) {
                          const vn = (b as any)?.tenant?.vendorName || null;
                          returnVendorName = vn;
                        }
                        inQty += Number((it as any)?.quantity || 0);
                        hasIn = true;
                      } else if (t === 'OUTBOUND') {
                        outQty += Number((it as any)?.quantity || 0);
                        hasOut = true;
                      }
                    }
                  } catch {}
                }
                if (outQty === 0 && inQty === 0) {
                  outQty = qty;
                  inQty = 0;
                }
                departurePassengers = outQty || null;
                returnPassengers = inQty || null;
                isDoubleTrip = hasOut && hasIn;
              } catch {}
              let arrivalAt: string | null = null;
              try {
                if (invDate && arrivalTime) {
                  const parts = String(arrivalTime).split(':');
                  const hh = Number(parts[0] || 0);
                  const mm = Number(parts[1] || 0);
                  const d = new Date(invDate);
                  d.setHours(hh, mm, 0, 0);
                  arrivalAt = d.toISOString();
                }
              } catch {}
              const card: CardItem = {
                id: b.id,
                initials,
                title,
                location,
                date: dateStr,
                bookingDate: bd ? bd.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
                departureDate,
                returnDate,
                departureTime,
                arrivalTime,
                returnDepartureTime,
                returnArrivalTime,
                arrivalAt,
                passengers: qty,
                isDoubleTrip,
                departurePassengers,
                returnPassengers,
                bookingCode: b.bookingCode || b.booking_code || '',
                status,
                image: featured,
                paymentDeadline,
                deadlineAt: deadlineAt ? deadlineAt.toISOString() : null,
                pendingType,
                cancellationReason: (b as any)?.cancellationReason ?? (b as any)?.cancellation_reason ?? null,
                hasReview: !!(b as any)?.review,
                returnLocation,
                returnVendorName,
                returnBoatName,
              };
              setCards([card]);
              setPageLoading(false);
              return;
            }
          }
        }
        setCards([]);
      } catch {}
      setPageLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const now = Date.now();
    const pendingExpired = cards.filter((c) => c.status === 'Pending' && c.deadlineAt && new Date(c.deadlineAt).getTime() <= now && !expiredProcessed[c.id]);
    if (pendingExpired.length === 0) return;
    pendingExpired.forEach(async (c) => {
      try {
        await fetch('/api/bookings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'expire', id: c.id }),
        });
      } catch {}
      setExpiredProcessed((prev) => ({ ...prev, [c.id]: true }));
      setCards((prev) => prev.map((x) => x.id === c.id ? { ...x, status: 'Expired' } : x));
    });
  }, [cards, expiredProcessed]);

  useEffect(() => {
    const now = Date.now();
    const toComplete = cards.filter((c) => c.status === 'Booked' && c.arrivalAt && new Date(c.arrivalAt).getTime() <= now && !completedProcessed[c.id]);
    if (toComplete.length === 0) return;
    toComplete.forEach(async (c) => {
      try {
        await fetch('/api/bookings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'complete', id: c.id }),
        });
      } catch {}
      setCompletedProcessed((prev) => ({ ...prev, [c.id]: true }));
      setCards((prev) => prev.map((x) => x.id === c.id ? { ...x, status: 'Completed' } : x));
    });
  }, [cards, completedProcessed]);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      if (activeStatus === 'All') return true;
      if (activeStatus === 'Cancelled') return c.status === 'Cancelled' || c.status === 'Refunded';
      return c.status === activeStatus;
    });
  }, [cards, activeStatus]);

  return (
    <Box style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Suspense fallback={<Loader size="sm" color="#284361" />}>
        <Header />
      </Suspense>
      <Box component="main">
        <Container size="xl" py="xl">
          <Modal opened={refundOpen} onClose={() => { if (!refundSubmitting) { setRefundOpen(false); setRefundReason(''); setRefundBooking(null); } }} title="Issue Refund">
            <Stack gap="md">
              {refundBooking && (
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Booking Code</Text>
                  <Text fw={600} c="#284361">{refundBooking.bookingCode}</Text>
                </Group>
              )}
              <Textarea
                placeholder="Tuliskan alasan refund Anda"
                value={refundReason}
                onChange={(e) => setRefundReason(e?.currentTarget?.value ?? '')}
                minRows={3}
              />
              <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                <Text size="sm">Alasan Anda akan dikirim sebagai bagian dari cancellation_reason.</Text>
              </Alert>
              <Group justify="flex-end">
                <Button variant="light" color="#284361" onClick={() => { if (!refundSubmitting) { setRefundOpen(false); setRefundReason(''); setRefundBooking(null); } }} disabled={refundSubmitting}>Batal</Button>
                <Button style={{ backgroundColor: '#284361' }} onClick={async () => {
                  if (!refundBooking || refundSubmitting) return;
                  setRefundSubmitting(true);
                  try {
                    const res = await fetch('/api/bookings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'refund', id: refundBooking.id, reason: refundReason || '' }),
                    });
                    if (res.ok) {
                      setCards((prev) => prev.map((x) => x.id === refundBooking.id ? { ...x, status: 'Pending', pendingType: 'refund', paymentDeadline: null, deadlineAt: null, cancellationReason: `Refund requested - ${refundReason}` } : x));
                      setRefundOpen(false);
                      setRefundReason('');
                      setRefundBooking(null);
                    }
                  } catch {}
                  setRefundSubmitting(false);
                }} disabled={refundSubmitting || !refundReason.trim()}>Kirim</Button>
              </Group>
            </Stack>
          </Modal>
          <Modal opened={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="Invoice">
            <Stack gap="md">
              {invoiceLoading || !invoice ? (
                <Group justify="center" py="md">
                  <Loader color="#284361" />
                </Group>
              ) : (
                <>
                  <Group gap="md">
                    <Badge color="gray" variant="light">{invoice?.paymentMethod || '-'}</Badge>
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
                      <Text fw={600} c="#284361">{invoice?.xenditInvoiceId || '-'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Time</Text>
                      <Text fw={600} c="#284361">{invoice?.paidAt ? new Date(invoice.paidAt).toLocaleString('id-ID', { hour12: false }) : '-'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Method</Text>
                      <Text fw={600} c="#284361">{invoice?.paymentMethod || '-'}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Amount</Text>
                      <Text fw={600} c="#284361">{(() => {
                        const amt = invoice?.paidAmount ?? invoice?.totalAmount;
                        if (!amt) return '-';
                        const n = Number(amt);
                        const cur = String(invoice?.currency || 'IDR').toUpperCase();
                        if (cur === 'USD') {
                          return `USD ${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                        }
                        return `IDR ${n.toLocaleString('id-ID')}`;
                      })()}</Text>
                    </Box>
                    <Box>
                      <Text size="sm" c="dimmed" mb={4}>Status</Text>
                      <Text fw={600} c="#2dbe8d">{invoice?.status || '-'}</Text>
                    </Box>
                  </SimpleGrid>
                </>
              )}
            </Stack>
          </Modal>
          <Modal opened={reviewOpen} onClose={() => { if (!reviewSubmitting) { setReviewOpen(false); setReviewBooking(null); setReviewInput({ rating: 0 }); } }} title="Review">
            <Stack gap="md">
              {reviewBooking && (
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Booking Code</Text>
                  <Text fw={600} c="#284361">{reviewBooking.bookingCode}</Text>
                </Group>
              )}
              <Group justify="space-between" align="center">
                <Text c="dimmed">Rating</Text>
                <Rating value={reviewInput.rating} onChange={(v) => setReviewInput((prev) => ({ ...prev, rating: v }))} />
              </Group>
              <TextInput placeholder="Judul (opsional)" value={reviewInput.title || ''} onChange={(e) => {
                const v = e?.currentTarget?.value ?? '';
                setReviewInput((prev) => ({ ...prev, title: v }));
              }} />
              <Textarea placeholder="Komentar (opsional)" value={reviewInput.comment || ''} onChange={(e) => {
                const v = e?.currentTarget?.value ?? '';
                setReviewInput((prev) => ({ ...prev, comment: v }));
              }} minRows={3} />
              <Group justify="space-between" align="center">
                <Text c="dimmed">Service Rating</Text>
                <Rating value={reviewInput.serviceRating || 0} onChange={(v) => setReviewInput((prev) => ({ ...prev, serviceRating: v }))} />
              </Group>
              <Group justify="space-between" align="center">
                <Text c="dimmed">Value Rating</Text>
                <Rating value={reviewInput.valueRating || 0} onChange={(v) => setReviewInput((prev) => ({ ...prev, valueRating: v }))} />
              </Group>
              <Group justify="space-between" align="center">
                <Text c="dimmed">Location Rating</Text>
                <Rating value={reviewInput.locationRating || 0} onChange={(v) => setReviewInput((prev) => ({ ...prev, locationRating: v }))} />
              </Group>
              <Group justify="flex-end">
                <Button variant="light" color="#284361" onClick={() => { if (!reviewSubmitting) { setReviewOpen(false); setReviewBooking(null); setReviewInput({ rating: 0 }); } }} disabled={reviewSubmitting}>Batal</Button>
                <Button style={{ backgroundColor: '#284361' }} onClick={async () => {
                  if (!reviewBooking || reviewSubmitting) return;
                  if (!reviewInput.rating || reviewInput.rating < 1) return;
                  setReviewSubmitting(true);
                  try {
                    const res = await fetch('/api/bookings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'review',
                        bookingId: reviewBooking.id,
                        rating: reviewInput.rating,
                        title: reviewInput.title || undefined,
                        comment: reviewInput.comment || undefined,
                        serviceRating: reviewInput.serviceRating || undefined,
                        valueRating: reviewInput.valueRating || undefined,
                        locationRating: reviewInput.locationRating || undefined,
                      }),
                    });
                    if (res.ok) {
                      const j = await res.json();
                      setViewReview(j?.review || null);
                      setCards((prev) => prev.map((x) => x.id === reviewBooking.id ? { ...x, hasReview: true } : x));
                      setReviewOpen(false);
                      setReviewBooking(null);
                      setReviewInput({ rating: 0 });
                    }
                  } catch {}
                  setReviewSubmitting(false);
                }} disabled={reviewSubmitting || !reviewInput.rating}>Kirim</Button>
              </Group>
            </Stack>
          </Modal>
          <Modal opened={viewReviewOpen} onClose={() => setViewReviewOpen(false)} title="View Review">
            {viewReviewLoading ? (
              <Group justify="center" py="md">
                <Loader color="#284361" />
              </Group>
            ) : viewReview ? (
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Rating</Text>
                  <Text fw={600} c="#284361">{viewReview.rating}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Title</Text>
                  <Text fw={600} c="#284361">{viewReview.title || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Comment</Text>
                  <Text fw={600} c="#284361">{viewReview.comment || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Service Rating</Text>
                  <Text fw={600} c="#284361">{viewReview.serviceRating ?? '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Value Rating</Text>
                  <Text fw={600} c="#284361">{viewReview.valueRating ?? '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Location Rating</Text>
                  <Text fw={600} c="#284361">{viewReview.locationRating ?? '-'}</Text>
                </Group>
                <Divider />
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Sentiment</Text>
                  <Badge color="gray" variant="light">{viewReview.sentimentLabel || '-'}</Badge>
                </Group>
              </Stack>
            ) : null}
          </Modal>
          <Modal
            opened={detailOpen}
            onClose={() => setDetailOpen(false)}
            title={(() => {
              if (!detail) return 'Ticket Details';
              if (detail.status === 'Expired') return 'Expired Ticket Details';
              if (detail.status === 'Pending') return detail.pendingType === 'payment' ? 'Pending Payment Details' : 'Refund Details';
              return 'Ticket Details';
            })()}
          >
            {detail && (
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Booking Code</Text>
                  <Text fw={600} c="#284361">{detail.bookingCode}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Status</Text>
                  {detail.status === 'Expired' ? (
                    <Badge color="red" variant="light">Expired</Badge>
                  ) : detail.status === 'Pending' ? (
                    <Badge color={detail.pendingType === 'payment' ? 'yellow' : 'blue'} variant="light">
                      {detail.pendingType === 'payment' ? 'Pending Payment' : 'Issue Refund'}
                    </Badge>
                  ) : (
                    <Badge color="gray" variant="light">{detail.status}</Badge>
                  )}
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Date</Text>
                  <Text fw={600} c="#284361">{detail.date}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Title</Text>
                  <Text fw={600} c="#284361">{detail.title}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Route</Text>
                  <Text fw={600} c="#284361">{detail.location || '-'}</Text>
                </Group>
                <Group justify="space-between" align="center">
                  <Text c="dimmed">Passengers</Text>
                  <Text fw={600} c="#284361">{detail.passengers}</Text>
                </Group>
                {detail.status === 'Pending' && detail.pendingType === 'payment' && (
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <IconClock size={16} />
                      <Text c="dimmed">Payment deadline</Text>
                    </Group>
                    <Text fw={600} c="#ef4444">{detail.paymentDeadline || '—'}</Text>
                  </Group>
                )}
                {detail.status === 'Pending' && detail.pendingType === 'refund' && (
                  <Group justify="space-between" align="center">
                    <Text c="dimmed">Refund Reason</Text>
                    <Text fw={600} c="#284361">{(() => {
                      const raw = detail.cancellationReason || '';
                      const cleaned = raw.replace(/^Refund requested\s*-\s*/i, '').trim();
                      return cleaned || raw || '—';
                    })()}</Text>
                  </Group>
                )}
                {(detail.status === 'Cancelled' || detail.status === 'Refunded') && (
                  <Group justify="space-between" align="center">
                    <Text c="dimmed">{detail.status === 'Refunded' ? 'Refund Reason' : 'Cancellation Reason'}</Text>
                    <Text fw={600} c="#284361">{(() => {
                      const raw = detail.cancellationReason || '';
                      const cleaned = raw.replace(/^Refund requested\s*-\s*/i, '').trim();
                      return cleaned || raw || '—';
                    })()}</Text>
                  </Group>
                )}
                <Divider />
                {detail.status === 'Expired' && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                    <Text size="sm">This ticket expired because payment was not completed before the deadline.</Text>
                  </Alert>
                )}
                {detail.status === 'Pending' && (
                  <Alert icon={<IconAlertCircle size={16} />} color={detail.pendingType === 'payment' ? 'yellow' : 'blue'} variant="light">
                    <Text size="sm">
                      {detail.pendingType === 'payment'
                        ? 'Please complete payment before the deadline to confirm your booking.'
                        : 'Your refund request is being processed.'}
                    </Text>
                  </Alert>
                )}
                {detail.status === 'Pending' && detail.pendingType === 'payment' && (
                  <Group justify="flex-end">
                    <Button
                      leftSection={<IconCreditCard size={16} />}
                      styles={{ root: { borderRadius: 8 } }}
                      style={{ backgroundColor: '#284361' }}
                      onClick={() => {
                        try { localStorage.setItem('booking_id', detail.id); } catch {}
                        window.location.href = `/fastboat/book/payment?id=${encodeURIComponent(detail.id)}`;
                      }}
                    >
                      Pay Now
                    </Button>
                  </Group>
                )}
              </Stack>
            )}
          </Modal>
          <Text style={{ fontSize: 30, fontWeight: 700, color: '#284361', marginBottom: 8 }}>
            My Bookings
          </Text>
          <Text style={{ color: '#6b7280', marginBottom: 32 }}>
            View and manage your bookings.
          </Text>

                {/* <Group gap={12} mb={24}>
                  {categories.map((cat) => {
                    const active = cat === activeCategory;
                    return (
                      <Button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        styles={{
                          root: {
                            borderRadius: 9999,
                            paddingInline: 24,
                            paddingBlock: 10,
                            fontWeight: 600,
                            backgroundColor: active ? '#284361' : '#ffffff',
                            color: active ? '#ffffff' : '#284361',
                            border: '1px solid #e5e7eb',
                            boxShadow: active ? 'none' : '0 1px 2px rgba(0,0,0,0.03)',
                            '&:hover': {
                              backgroundColor: active ? '#1f3349' : '#f3f4f6',
                            },
                          },
                        }}
                      >
                        {cat}
                      </Button>
                    );
                  })}
                </Group> */}

                <Box style={{ borderBottom: '1px solid #e5e7eb', marginBottom: 24 }}>
                  <Group gap={24}>
                    {statuses.map((st) => {
                      const active = st === activeStatus;
                      return (
                        <Box
                          key={st}
                          onClick={() => setActiveStatus(st)}
                          style={{
                            paddingBottom: 12,
                            cursor: 'pointer',
                            color: active ? '#284361' : '#6b7280',
                            fontWeight: active ? 600 : 500,
                            position: 'relative',
                          }}
                        >
                          {st}
                          {active && (
                            <Box
                              style={{
                                position: 'absolute',
                                bottom: -1,
                                left: 0,
                                right: 0,
                                height: 2,
                                backgroundColor: '#284361',
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Group>
                </Box>

          {pageLoading ? (
            <Group justify="center" my={32}>
              <Loader color="#284361" />
            </Group>
          ) : (
            <Stack gap={16}>
              {filtered.map((b, idx) => (
                <BookingCard
                key={`${b.bookingCode}-${idx}`}
                initials={b.initials}
                title={b.title}
                location={b.location}
                bookingDate={b.bookingDate || b.date}
                departureDate={b.departureDate || undefined}
                returnDate={b.returnDate || undefined}
                departureTime={b.departureTime || undefined}
                arrivalTime={b.arrivalTime || undefined}
                returnDepartureTime={b.returnDepartureTime || undefined}
                returnArrivalTime={b.returnArrivalTime || undefined}
                returnLocation={b.returnLocation || undefined}
                returnVendorName={(b as any)?.returnVendorName || undefined}
                returnBoatName={(b as any)?.returnBoatName || undefined}
                passengers={b.passengers}
                isDoubleTrip={typeof (b as any)?.isDoubleTrip === 'boolean' ? (b as any).isDoubleTrip : !!(b.returnDate || b.returnDepartureTime || b.returnArrivalTime || b.returnLocation)}
                departurePassengers={(() => {
                  try {
                    const arr = Array.isArray((b as any)?.items) ? (b as any).items : [];
                    if (!arr.length) {
                      const qty =
                        Number((b as any)?.departurePassengers ?? (b as any)?.outboundPassengers ?? (b as any)?.outbound_participants ?? (b as any)?.passengers ?? 0);
                      return qty || undefined;
                    }
                    let out = 0;
                    for (const it of arr) {
                      const qty = Number((it as any)?.quantity || 0);
                      const sr = (it as any)?.specialRequirements || '';
                      const obj = sr ? JSON.parse(String(sr)) : {};
                      const notesField = obj?.notes || '';
                      if (typeof notesField === 'string' && notesField) {
                        try {
                          const inner = JSON.parse(String(notesField));
                          const t = String(inner?.rtType || '').toUpperCase();
                          if (t === 'OUTBOUND') out += qty;
                        } catch {}
                      }
                    }
                    return out || undefined;
                  } catch { return undefined; }
                })()}
                returnPassengers={(() => {
                  try {
                    const arr = Array.isArray((b as any)?.items) ? (b as any).items : [];
                    if (!arr.length) {
                      const qty =
                        Number((b as any)?.returnPassengers ?? (b as any)?.inboundPassengers ?? (b as any)?.inbound_participants ?? 0);
                      return qty || undefined;
                    }
                    let inn = 0;
                    for (const it of arr) {
                      const qty = Number((it as any)?.quantity || 0);
                      const sr = (it as any)?.specialRequirements || '';
                      const obj = sr ? JSON.parse(String(sr)) : {};
                      const notesField = obj?.notes || '';
                      if (typeof notesField === 'string' && notesField) {
                        try {
                          const inner = JSON.parse(String(notesField));
                          const t = String(inner?.rtType || '').toUpperCase();
                          if (t === 'INBOUND') inn += qty;
                        } catch {}
                      }
                    }
                    return inn || undefined;
                  } catch { return undefined; }
                })()}
                passengers={(() => {
                  try {
                    const arr = Array.isArray((b as any)?.items) ? (b as any).items : [];
                    if (arr.length) {
                      const total = arr.reduce((acc: number, it: any) => acc + Number((it as any)?.quantity || 0), 0);
                      return total || (b.passengers ?? undefined);
                    }
                    const p = (b as any)?.passengers ?? (b as any)?.totalParticipants ?? (b as any)?.total_participants;
                    return p ?? undefined;
                  } catch { return (b as any)?.passengers ?? undefined; }
                })()}
                bookingCode={b.bookingCode}
                status={b.status}
                image={b.image || undefined}
                paymentDeadline={b.paymentDeadline || undefined}
                deadlineAt={b.deadlineAt || undefined}
                pendingType={b.pendingType}
                onPayNow={b.status === 'Pending' ? () => {
                  setPayLoadingMap((prev) => ({ ...prev, [b.id]: true }));
                  try { localStorage.setItem('booking_id', b.id); } catch {}
                  window.location.href = `/fastboat/book/payment?id=${encodeURIComponent(b.id)}`;
                } : undefined}
                onIssueRefund={(b.status === 'Booked') ? () => { setRefundBooking(b); setRefundOpen(true); } : undefined}
                onViewDetails={(b.status === 'Expired' || b.status === 'Pending' || b.status === 'Refunded' || b.status === 'Cancelled') ? () => { setDetail(b); setDetailOpen(true); } : undefined}
                onViewTicket={(b.status === 'Booked' || b.status === 'Completed') ? () => {
                  setTicketLoadingMap((prev) => ({ ...prev, [b.id]: true }));
                  try { localStorage.setItem('booking_id', b.id); } catch {}
                  window.location.href = `/fastboat/book/ticket?id=${encodeURIComponent(b.id)}`;
                } : undefined}
                onViewInvoice={(b.status === 'Booked') ? async () => {
                  setInvoice(null);
                  setInvoiceOpen(true);
                  setInvoiceLoading(true);
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const uid = session?.user?.id || '';
                    const email = (session?.user?.email || '').trim().toLowerCase();
                    const res = await fetch(`/api/bookings?id=${encodeURIComponent(b.id)}&userId=${encodeURIComponent(uid)}&email=${encodeURIComponent(email)}`, { cache: 'no-store' });
                    if (res.ok) {
                      const j = await res.json();
                      setInvoice(j?.booking || null);
                    }
                  } catch {}
                  setInvoiceLoading(false);
                } : undefined}
                onReview={(b.status === 'Completed' && !b.hasReview) ? () => { setReviewBooking(b); setReviewOpen(true); } : undefined}
                hasReview={b.hasReview}
                onViewReview={(b.status === 'Completed' && b.hasReview) ? async () => {
                  setViewReview(null);
                  setViewReviewOpen(true);
                  setViewReviewLoading(true);
                  try {
                    const res = await fetch(`/api/bookings?reviewOf=${encodeURIComponent(b.id)}`, { cache: 'no-store' });
                    if (res.ok) {
                      const j = await res.json();
                      setViewReview(j?.review || null);
                    }
                  } catch {}
                  setViewReviewLoading(false);
                } : undefined}
                loadingViewTicket={!!ticketLoadingMap[b.id]}
                loadingPayNow={!!payLoadingMap[b.id]}
              />
              ))}
            </Stack>
          )}
        </Container>
      </Box>
    </Box>
  );
}
