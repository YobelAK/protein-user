'use client';

import React, { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Container, Box, Group, Text, ActionIcon, SimpleGrid, Stack, Grid, Loader } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProgressIndicator } from '@/component/fastboat/progress-indicator';
import { ContactForm } from '@/component/fastboat/contact-form';
import { PassengerForm } from '@/component/fastboat/passenger-form';
import { BookingSummary } from '@/component/fastboat/booking-summary';
import { supabase } from '@/lib/supabase/client';

function normalizePhoneE164(cc: string, num: string) {
  const c = String(cc || '').trim();
  const n = String(num || '').trim();
  const ccDigitsRaw = c.replace(/[^\d+]/g, '');
  const ccDigits = ccDigitsRaw.startsWith('+') ? ccDigitsRaw.slice(1).replace(/\D/g, '') : ccDigitsRaw.replace(/\D/g, '');
  const rawDigits = n.replace(/\D/g, '');
  let localDigits = rawDigits;
  if (localDigits.startsWith(ccDigits)) {
    localDigits = localDigits.slice(ccDigits.length);
  }
  localDigits = localDigits.replace(/^0+/, '');
  if (ccDigits) {
    if (!localDigits) return undefined as string | undefined;
    const res = '+' + ccDigits + localDigits;
    return /^\+[0-9]\d{1,14}$/.test(res) ? res : undefined;
  }
  const keep = n.replace(/[^\d+]/g, '');
  if (keep.startsWith('+')) {
    const q = '+' + keep.replace(/^\+/, '').replace(/\D/g, '');
    return /^\+[0-9]\d{1,14}$/.test(q) ? q : undefined;
  }
  return undefined;
}

function BookingPageContent() {
  const searchParams = useSearchParams();
  const origin = searchParams.get('origin') ?? '';
  const destination = searchParams.get('destination') ?? '';
  const departureTime = searchParams.get('departureTime') ?? '';
  const departureDate = searchParams.get('departureDate') ?? '';
  const provider = searchParams.get('provider') ?? '';
  const priceIdr = Number(searchParams.get('priceIdr') ?? '0');
  const [priceUsd, setPriceUsd] = useState<number>(0);
  const origin2 = searchParams.get('origin2') ?? '';
  const destination2 = searchParams.get('destination2') ?? '';
  const departureTime2 = searchParams.get('departureTime2') ?? '';
  const departureDate2 = searchParams.get('departureDate2') ?? '';
  const provider2 = searchParams.get('provider2') ?? '';
  const priceIdr2 = Number(searchParams.get('priceIdr2') ?? '0');
  const [priceUsd2, setPriceUsd2] = useState<number>(0);
  const trip = useMemo(() => {
    const a = `${origin} → ${destination}`;
    const b = origin2 && destination2 ? ` • ${origin2} → ${destination2}` : '';
    return `${a}${b}`;
  }, [origin, destination, origin2, destination2]);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [initialCounts, setInitialCounts] = useState<{ adult: number; child: number; infant: number }>({ adult: 1, child: 0, infant: 0 });
  const [contact, setContact] = useState<{ firstName: string; lastName: string; email: string; countryCode: string; phone: string; specialRequests?: string; agreed?: boolean }>({ firstName: '', lastName: '', email: '', countryCode: '+62', phone: '' });
  const [passengers, setPassengers] = useState<any[]>([]);
  const [currency, setCurrency] = useState<'IDR' | 'USD'>('IDR');
  const passengerPrice = useMemo(() => {
    const factor = (age: string) => {
      const a = String(age || '').toLowerCase();
      return (a === 'child' || a === 'infant') ? 0.75 : 1;
    };
    const base1 = currency === 'USD' ? priceUsd : priceIdr;
    const base2 = currency === 'USD' ? priceUsd2 : priceIdr2;
    if (!Array.isArray(passengers) || passengers.length === 0) {
      const a = base1 * Math.max(1, guestCount);
      const b = base2 * Math.max(1, guestCount);
      return a + (base2 ? b : 0);
    }
    const sum1 = passengers.reduce((sum, p) => sum + Math.round(base1 * factor(p?.ageCategory)), 0);
    const sum2 = base2 ? passengers.reduce((sum, p) => sum + Math.round(base2 * factor(p?.ageCategory)), 0) : 0;
    return sum1 + sum2;
  }, [currency, priceUsd, priceUsd2, priceIdr, priceIdr2, passengers, guestCount]);
  const passengersList = useMemo(() => passengers.map((p) => ({ nationality: p.nationality, ageCategory: p.ageCategory })), [passengers]);
  const [arrivalTime, setArrivalTime] = useState<string>('');
  const [boat, setBoat] = useState<{ name?: string; code?: string; capacity?: number; duration?: string }>({});
  const [vendorName, setVendorName] = useState<string>('');
  const [categoryName, setCategoryName] = useState<string>('');
  const [inventoryId, setInventoryId] = useState<string>('');
  const [inventoryDate, setInventoryDate] = useState<string>('');
  const [availableUnits, setAvailableUnits] = useState<number | undefined>(undefined);
  const [availableUnitsInbound, setAvailableUnitsInbound] = useState<number | undefined>(undefined);
  const [availableUnitsOutbound, setAvailableUnitsOutbound] = useState<number | undefined>(undefined);
  const [capacityInbound, setCapacityInbound] = useState<number | undefined>(undefined);
  const [capacityOutbound, setCapacityOutbound] = useState<number | undefined>(undefined);
  const [inventoryIdOutbound, setInventoryIdOutbound] = useState<string>('');
  const [arrivalTime2, setArrivalTime2] = useState<string>('');
  const [boat2, setBoat2] = useState<{ name?: string; code?: string; capacity?: number; duration?: string }>({});
  const [vendorName2, setVendorName2] = useState<string>('');
  const [inventoryDate2, setInventoryDate2] = useState<string>('');
  const [loadingInbound, setLoadingInbound] = useState(false);
  const [loadingOutbound, setLoadingOutbound] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);

  React.useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email || '';
        const userId = session?.user?.id || '';
        const query = email ? `email=${encodeURIComponent(email)}` : (userId ? `userId=${encodeURIComponent(userId)}` : '');
        if (query) {
          const res = await fetch(`/api/profile?${query}`, { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            const cur = String(data?.currency || '').toUpperCase();
            if (cur === 'USD' || cur === 'IDR') setCurrency(cur as any);
          }
        }
      } catch {}
    })();
  }, []);

  React.useEffect(() => {
    const sid = searchParams.get('sid') ?? '';
    if (!sid) return;
    setLoadingInbound(true);
    const url = departureDate ? `/api/fastboat/schedules?date=${encodeURIComponent(departureDate)}` : '/api/fastboat/schedules';
    fetch(url, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const items = Array.isArray(d?.schedules) ? d.schedules : [];
        const s = items.find((it: any) => String(it?.id ?? '') === String(sid));
        if (s) {
          const dep = String(s?.departure_time ?? '');
          const arr = String(s?.arrival_time ?? '');
          setArrivalTime(arr);
          const toMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            if (Number.isNaN(h) || Number.isNaN(m)) return null;
            return h * 60 + m;
          };
          const dm = toMinutes(dep);
          const am = toMinutes(arr);
          const duration = dm != null && am != null && am >= dm ? `${am - dm} min` : undefined;
          setBoat({ name: s?.boat?.name ?? undefined, code: s?.boat?.registration_number ?? undefined, capacity: s?.boat?.capacity ?? undefined, duration });
          setVendorName(s?.product?.tenant?.vendor_name ?? '');
          setCategoryName(s?.product?.category?.name ?? '');
          setPriceUsd(Number(s?.product?.price_usd ?? 0));
          const inv = s?.inventory;
          if (inv) {
            setInventoryId(String(inv.id || ''));
            setInventoryDate(String(inv.inventoryDate || ''));
            const au = typeof inv.availableUnits === 'number' ? inv.availableUnits : undefined;
            setAvailableUnitsInbound(au);
            setAvailableUnits(au);
            const cap = typeof inv.totalCapacity === 'number' ? inv.totalCapacity : undefined;
            setCapacityInbound(cap);
          } else {
            const scheduleCap = typeof s?.capacity === 'number' ? Number(s.capacity) : (typeof s?.boat?.capacity === 'number' ? Number(s.boat.capacity) : undefined);
            setCapacityInbound(scheduleCap);
            const scheduleAvail = scheduleCap;
            if (typeof scheduleAvail === 'number') {
              setAvailableUnitsInbound(scheduleAvail);
              setAvailableUnits(scheduleAvail);
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingInbound(false));
  }, [searchParams]);

  React.useEffect(() => {
    const sid2 = searchParams.get('sid2') ?? '';
    const retDate = departureDate2;
    if (!sid2 || !retDate) return;
    setLoadingOutbound(true);
    const url = retDate ? `/api/fastboat/schedules?date=${encodeURIComponent(retDate)}` : '/api/fastboat/schedules';
    fetch(url, { cache: 'no-store' })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        const items = Array.isArray(d?.schedules) ? d.schedules : [];
        const s = items.find((it: any) => String(it?.id ?? '') === String(sid2));
        if (s) {
          const dep = String(s?.departure_time ?? '');
          const arr = String(s?.arrival_time ?? '');
          setArrivalTime2(arr);
          const toMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            if (Number.isNaN(h) || Number.isNaN(m)) return null;
            return h * 60 + m;
          };
          const dm = toMinutes(dep);
          const am = toMinutes(arr);
          const duration = dm != null && am != null && am >= dm ? `${am - dm} min` : undefined;
          setBoat2({ name: s?.boat?.name ?? undefined, code: s?.boat?.registration_number ?? undefined, capacity: s?.boat?.capacity ?? undefined, duration });
          setVendorName2(s?.product?.tenant?.vendor_name ?? '');
          setPriceUsd2(Number(s?.product?.price_usd ?? 0));
          const inv = s?.inventory;
          if (inv) {
            setInventoryIdOutbound(String(inv.id || ''));
            const au = typeof inv.availableUnits === 'number' ? inv.availableUnits : undefined;
            setAvailableUnitsOutbound(au);
            setAvailableUnits((prev) => (typeof prev === 'number' && typeof au === 'number') ? Math.min(prev, au) : (prev ?? au));
            const cap = typeof inv.totalCapacity === 'number' ? inv.totalCapacity : undefined;
            setCapacityOutbound(cap);
            setInventoryDate2(String(inv.inventoryDate || ''));
          } else {
            const scheduleCap = typeof s?.capacity === 'number' ? Number(s.capacity) : (typeof s?.boat?.capacity === 'number' ? Number(s.boat.capacity) : undefined);
            setCapacityOutbound(scheduleCap);
            const scheduleAvail = scheduleCap;
            if (typeof scheduleAvail === 'number') {
              setAvailableUnitsOutbound(scheduleAvail);
              setAvailableUnits((prev) => (typeof prev === 'number' && typeof scheduleAvail === 'number') ? Math.min(prev, scheduleAvail) : (prev ?? scheduleAvail));
            }
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOutbound(false));
  }, [searchParams, departureDate2]);

  React.useEffect(() => {
    const adult = Number(searchParams.get('adult') ?? '');
    const child = Number(searchParams.get('child') ?? '');
    const infant = Number(searchParams.get('infant') ?? '');
    const hasQs = [adult, child, infant].some((n) => Number.isFinite(n) && n >= 0);
    if (hasQs) {
      const a = Number.isFinite(adult) && adult >= 0 ? adult : 1;
      const c = Number.isFinite(child) && child >= 0 ? child : 0;
      const i = Number.isFinite(infant) && infant >= 0 ? infant : 0;
      setInitialCounts({ adult: a, child: c, infant: i });
      setGuestCount(Math.max(1, a + c + i));
      return;
    }
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('rt_passenger_counts') || '' : '';
      if (raw) {
        const obj = JSON.parse(raw);
        const a = Math.max(0, Number(obj?.adult ?? 1));
        const c = Math.max(0, Number(obj?.child ?? 0));
        const i = Math.max(0, Number(obj?.infant ?? 0));
        setInitialCounts({ adult: a, child: c, infant: i });
        setGuestCount(Math.max(1, a + c + i));
      } else {
        setInitialCounts({ adult: 1, child: 0, infant: 0 });
        setGuestCount(1);
      }
    } catch {
      setInitialCounts({ adult: 1, child: 0, infant: 0 });
      setGuestCount(1);
    }
  }, [searchParams]);

 

  const canContinue = useMemo(() => {
    const nameOk = Boolean(contact.firstName?.trim());
    const emailOk = Boolean(contact.email?.trim()) && contact.email.includes('@') && contact.email.endsWith('.com');
    const phoneOk = Boolean(contact.phone?.trim());
    const agreedOk = contact.agreed === true;
    const passengersOk = passengers.length === Math.max(1, guestCount) && passengers.every((p) => {
      return Boolean(p.title) && Boolean(p.firstName?.trim()) && Boolean(p.nationality) && Boolean(p.identityType) && Boolean(p.idNumber?.trim()) && Boolean(p.ageCategory);
    });
    const unitsOk = typeof availableUnits === 'number' ? (availableUnits > 0 && Math.max(1, guestCount) <= availableUnits) : true;
    return nameOk && emailOk && phoneOk && agreedOk && passengersOk && unitsOk;
  }, [contact, passengers, guestCount, availableUnits]);

  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <ProgressIndicator currentStep={1} />
      <Container size="xl" py="md">
        <Link href="/fastboat" style={{ textDecoration: 'none' }}>
          <Group gap="xs" style={{ cursor: 'pointer', color: '#6b7280', transition: 'color 0.2s ease' }}>
            <IconArrowLeft size={16} />
            <Text size="sm" style={{ ':hover': { color: '#111827' } }}>Back to Fastboat</Text>
          </Group>
        </Link>
      </Container>

      <Box component="main" style={{ flex: 1 }}>
        <Container size="xl" pb="xl">
          {(loadingInbound || loadingOutbound) && (
            <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <Loader color="#284361" />
            </Box>
          )}
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, lg: 8 }}>
              <Stack gap="xl">
                <ContactForm guestCount={guestCount} onGuestCountChange={setGuestCount} onChange={setContact} availableUnits={availableUnits} />
                <PassengerForm guestCount={guestCount} onChange={setPassengers} mainContactName={`${contact.firstName || ''} ${contact.lastName || ''}`.trim()} initialCounts={initialCounts} />
              </Stack>
            </Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}>
              <BookingSummary 
                trip={trip} 
                categoryName={categoryName}
                departureDate={departureDate}
                departureTime={departureTime}
                arrivalTime={arrivalTime}
                boat={boat}
                vendorName={vendorName}
                passengersList={passengersList}
                passengerSubtotal={passengerPrice} 
                portFee={currency === 'USD' ? 1 : 10000} 
                inventoryDate={inventoryDate || departureDate}
                availableUnits={availableUnits}
                currency={currency}
              segments={[
                ...(origin2 && destination2 ? [{
                  title: 'Departure Ticket',
                  origin: origin2,
                  destination: destination2,
                  departureDate: departureDate2,
                  departureTime: departureTime2,
                  arrivalTime: arrivalTime2,
                  boat: boat2,
                  vendorName: vendorName2,
                  inventoryDate: inventoryDate2 || departureDate2,
                  availableUnits: availableUnitsOutbound,
                  capacity: capacityOutbound,
                  priceIdr: priceIdr2 || 0,
                }] : []),
                {
                  title: 'Return Ticket',
                  origin,
                  destination,
                  departureDate,
                  departureTime,
                  arrivalTime,
                  boat,
                  vendorName: vendorName,
                  inventoryDate: inventoryDate || departureDate,
                  availableUnits: availableUnitsInbound,
                  capacity: capacityInbound,
                  priceIdr: priceIdr || 0,
                }
              ]}
              continueDisabled={!canContinue}
              continueLoading={continueLoading}
              onContinue={async () => {
                setContinueLoading(true);
                const scheduleIdInbound = searchParams.get('sid') ?? '';
                const scheduleIdOutbound = searchParams.get('sid2') ?? '';
                const { data: { session } } = await supabase.auth.getSession();
                const ownerId = session?.user?.id || null;
                const ownerEmail = session?.user?.email || null;
                if (!ownerId) {
                  const factorFor = (age: string) => {
                    const a = String(age || '').toLowerCase();
                    return (a === 'child' || a === 'infant') ? 0.75 : 1;
                  };
                  const segTotal = (price: number) => passengers.reduce((sum, p) => sum + Math.round(price * factorFor(p?.ageCategory)), 0);
                const payloadOutbound = scheduleIdOutbound ? {
                  scheduleId: scheduleIdOutbound,
                  origin: origin2 || destination,
                  destination: destination2 || origin,
                  departureTime: departureTime2 || departureTime,
                  departureDate: departureDate2 || departureDate,
                  guestCount,
                  priceIdr: currency === 'USD' ? (priceUsd2 || priceUsd) : (priceIdr2 || priceIdr),
                  portFee: currency === 'USD' ? 1 : 10000,
                  totalAmount: segTotal(currency === 'USD' ? (priceUsd2 || priceUsd) : (priceIdr2 || priceIdr)) + (currency === 'USD' ? 1 : 10000),
                  contact,
                  passengers,
                  currency,
                  inventoryId: inventoryIdOutbound,
                } : null;
                const inboundPortFee = scheduleIdOutbound ? 0 : (currency === 'USD' ? 1 : 10000);
                const payloadInbound = scheduleIdInbound ? {
                  scheduleId: scheduleIdInbound,
                  origin,
                  destination,
                  departureTime,
                  departureDate,
                  guestCount,
                  priceIdr: currency === 'USD' ? priceUsd : priceIdr,
                  portFee: inboundPortFee,
                  totalAmount: segTotal(currency === 'USD' ? priceUsd : priceIdr) + inboundPortFee,
                  contact,
                  passengers,
                  currency,
                  inventoryId,
                } : null;
                  const redirectTo = (() => {
                    try {
                      const url = new URL(typeof window !== 'undefined' ? window.location.href : '');
                      const relative = `${url.pathname}?${url.searchParams.toString()}`;
                      return relative || '/fastboat/book';
                    } catch {
                      return '/fastboat/book';
                    }
                  })();
                  window.location.href = `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
                  return;
                }
                const baseNotes = String(contact.specialRequests || '');
                const contactFullName = `${String(contact.firstName || '').trim()} ${String(contact.lastName || '').trim()}`.trim();
                const factorFor = (age: string) => {
                  const a = String(age || '').toLowerCase();
                  return (a === 'child' || a === 'infant') ? 0.75 : 1;
                };
                const segTotal = (price: number) => passengers.reduce((sum, p) => sum + Math.round(price * factorFor(p?.ageCategory)), 0);
                const legs: Array<{ scheduleId: string; departureDate: string; priceIdr: number; inventoryId?: string; notes?: string; rtType?: string }> = [];
                if (scheduleIdOutbound) {
                  legs.push({
                    scheduleId: scheduleIdOutbound,
                    departureDate: departureDate2 || departureDate,
                    priceIdr: currency === 'USD' ? (priceUsd2 || priceUsd) : (priceIdr2 || priceIdr),
                    inventoryId: inventoryIdOutbound,
                    notes: JSON.stringify({ rtType: 'OUTBOUND', userNotes: baseNotes || '' }),
                    rtType: 'OUTBOUND',
                  });
                }
                if (scheduleIdInbound) {
                  legs.push({
                    scheduleId: scheduleIdInbound,
                    departureDate,
                    priceIdr: currency === 'USD' ? priceUsd : priceIdr,
                    inventoryId,
                    notes: JSON.stringify({ rtType: 'INBOUND', userNotes: baseNotes || '' }),
                    rtType: 'INBOUND',
                  });
                }
                const totalPortFee = currency === 'USD' ? 1 : 10000;
                const totalAmountCombined = legs.reduce((sum, lg) => sum + segTotal(lg.priceIdr), 0) + totalPortFee;
                const phoneE164 = normalizePhoneE164(contact.countryCode, contact.phone);
                const payloadCombined = {
                  legs,
                  guestCount,
                  portFee: totalPortFee,
                  totalAmount: totalAmountCombined,
                  contact: { ...contact, phone: (phoneE164 || `${String(contact.countryCode || '')} ${String(contact.phone || '')}`.trim()), fullName: contactFullName },
                  passengers,
                  currency,
                  ownerId,
                  ownerEmail,
                };
                const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadCombined) });
                if (res.status === 401) {
                  setContinueLoading(false);
                  window.location.href = '/login?redirectTo=/fastboat/book/payment';
                  return;
                }
                if (res.ok) {
                  const json = await res.json();
                  const id = json?.booking?.id ?? json?.id ?? '';
                  if (id) {
                    try { localStorage.setItem('booking_id', String(id)); } catch {}
                    const { data: { session } } = await supabase.auth.getSession();
                    const qs = new URLSearchParams();
                    qs.set('id', String(id));
                    if (session) {
                      window.location.href = `/fastboat/book/payment?${qs.toString()}`;
                    } else {
                      window.location.href = `/login?redirectTo=/fastboat/book/payment?${qs.toString()}`;
                    }
                  } else {
                    setContinueLoading(false);
                  }
                } else {
                  setContinueLoading(false);
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

export default function FastboatBookingPage() {
  return (
    <Suspense>
      <BookingPageContent />
    </Suspense>
  );
}
