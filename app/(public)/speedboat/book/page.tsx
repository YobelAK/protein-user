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
  const departureTime = searchParams.get('departureTime') ?? '';
  const departureDate = searchParams.get('departureDate') ?? '';
  const provider = searchParams.get('provider') ?? '';
  const priceIdr = Number(searchParams.get('priceIdr') ?? '0');
  const origin2 = searchParams.get('origin2') ?? '';
  const destination2 = searchParams.get('destination2') ?? '';
  const departureTime2 = searchParams.get('departureTime2') ?? '';
  const departureDate2 = searchParams.get('departureDate2') ?? '';
  const provider2 = searchParams.get('provider2') ?? '';
  const priceIdr2 = Number(searchParams.get('priceIdr2') ?? '0');
  const trip = useMemo(() => {
    const a = `${origin} → ${destination}`;
    const b = origin2 && destination2 ? ` • ${origin2} → ${destination2}` : '';
    return `${a}${b}`;
  }, [origin, destination, origin2, destination2]);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [contact, setContact] = useState<{ firstName: string; lastName: string; email: string; countryCode: string; phone: string; specialRequests?: string; agreed?: boolean }>({ firstName: '', lastName: '', email: '', countryCode: '+62', phone: '' });
  const [passengers, setPassengers] = useState<any[]>([]);
  const passengerPrice = useMemo(() => {
    const factor = (age: string) => {
      const a = String(age || '').toLowerCase();
      return (a === 'child' || a === 'infant') ? 0.75 : 1;
    };
    if (!Array.isArray(passengers) || passengers.length === 0) {
      const base1 = priceIdr * Math.max(1, guestCount);
      const base2 = priceIdr2 * Math.max(1, guestCount);
      return base1 + (priceIdr2 ? base2 : 0);
    }
    const sum1 = passengers.reduce((sum, p) => sum + Math.round(priceIdr * factor(p?.ageCategory)), 0);
    const sum2 = priceIdr2 ? passengers.reduce((sum, p) => sum + Math.round(priceIdr2 * factor(p?.ageCategory)), 0) : 0;
    return sum1 + sum2;
  }, [priceIdr, priceIdr2, passengers, guestCount]);
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

  React.useEffect(() => {
    const sid = searchParams.get('sid') ?? '';
    if (!sid) return;
    const url = departureDate ? `/api/speedboat/schedules?date=${encodeURIComponent(departureDate)}` : '/api/speedboat/schedules';
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
      .catch(() => {});
  }, [searchParams]);

  React.useEffect(() => {
    const sid2 = searchParams.get('sid2') ?? '';
    const retDate = departureDate2;
    if (!sid2 || !retDate) return;
    const url = retDate ? `/api/speedboat/schedules?date=${encodeURIComponent(retDate)}` : '/api/speedboat/schedules';
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
      .catch(() => {});
  }, [searchParams, departureDate2]);

  const canContinue = useMemo(() => {
    const nameOk = Boolean(contact.firstName?.trim()) && Boolean(contact.lastName?.trim());
    const emailOk = Boolean(contact.email?.trim()) && contact.email.includes('@') && contact.email.endsWith('.com');
    const phoneOk = Boolean(contact.phone?.trim());
    const agreedOk = contact.agreed === true;
    const passengersOk = passengers.length === Math.max(1, guestCount) && passengers.every((p) => {
      return Boolean(p.title) && Boolean(p.firstName?.trim()) && Boolean(p.lastName?.trim()) && Boolean(p.nationality) && Boolean(p.identityType) && Boolean(p.idNumber?.trim()) && Boolean(p.ageCategory);
    });
    const unitsOk = typeof availableUnits === 'number' ? (availableUnits > 0 && Math.max(1, guestCount) <= availableUnits) : true;
    return nameOk && emailOk && phoneOk && agreedOk && passengersOk && unitsOk;
  }, [contact, passengers, guestCount, availableUnits]);

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
                <ContactForm guestCount={guestCount} onGuestCountChange={setGuestCount} onChange={setContact} availableUnits={availableUnits} />
                <PassengerForm guestCount={guestCount} onChange={setPassengers} mainContactName={`${contact.firstName || ''} ${contact.lastName || ''}`.trim()} />
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
              portFee={10000} 
              inventoryDate={inventoryDate || departureDate}
              availableUnits={availableUnits}
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
              onContinue={async () => {
                const scheduleIdInbound = searchParams.get('sid') ?? '';
                const scheduleIdOutbound = searchParams.get('sid2') ?? '';
                const { data: { session } } = await supabase.auth.getSession();
                const ownerId = session?.user?.id || null;
                const ownerEmail = session?.user?.email || null;
                if (!ownerId) {
                  window.location.href = '/login?redirectTo=/speedboat/book/payment';
                  return;
                }
                const baseNotes = String(contact.specialRequests || '');
                const contactOutbound = {
                  ...contact,
                  specialRequests: baseNotes,
                  fullName: `${String(contact.firstName || '').trim()} ${String(contact.lastName || '').trim()}`.trim(),
                };
                const contactInbound = {
                  ...contact,
                  specialRequests: baseNotes,
                  fullName: `${String(contact.firstName || '').trim()} ${String(contact.lastName || '').trim()}`.trim(),
                };
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
                  priceIdr: priceIdr2 || priceIdr,
                  portFee: 10000,
                  totalAmount: segTotal(priceIdr2 || priceIdr) + 10000,
                  contact: contactOutbound,
                  passengers,
                  currency: 'IDR',
                  ownerId,
                  ownerEmail,
                  inventoryId: inventoryIdOutbound,
                } : null;
                const inboundPortFee = scheduleIdOutbound ? 0 : 10000;
                const payloadInbound = scheduleIdInbound ? {
                  scheduleId: scheduleIdInbound,
                  origin,
                  destination,
                  departureTime,
                  departureDate,
                  guestCount,
                  priceIdr,
                  portFee: inboundPortFee,
                  totalAmount: segTotal(priceIdr) + inboundPortFee,
                  contact: contactInbound,
                  passengers,
                  currency: 'IDR',
                  ownerId,
                  ownerEmail,
                  inventoryId,
                } : null;
                const createdIds: string[] = [];
                if (payloadOutbound) {
                  const resOut = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadOutbound) });
                  if (resOut.ok) {
                    const jsonOut = await resOut.json();
                    const idOut = jsonOut?.booking?.id ?? jsonOut?.id ?? '';
                    if (idOut) createdIds.push(String(idOut));
                  } else if (resOut.status === 401) {
                    window.location.href = '/login?redirectTo=/speedboat/book/payment';
                    return;
                  }
                }
                if (payloadInbound) {
                  const resIn = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadInbound) });
                  if (resIn.ok) {
                    const jsonIn = await resIn.json();
                    const idIn = jsonIn?.booking?.id ?? jsonIn?.id ?? '';
                    if (idIn) createdIds.push(String(idIn));
                  } else if (resIn.status === 401) {
                    window.location.href = '/login?redirectTo=/speedboat/book/payment';
                    return;
                  }
                }
                if (createdIds.length > 0) {
                  try { localStorage.setItem('booking_ids', JSON.stringify(createdIds)); } catch {}
                  const { data: { session } } = await supabase.auth.getSession();
                  const qs = new URLSearchParams();
                  qs.set('ids', createdIds.join(','));
                  if (session) {
                    window.location.href = `/speedboat/book/payment?${qs.toString()}`;
                  } else {
                    window.location.href = `/login?redirectTo=/speedboat/book/payment?${qs.toString()}`;
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
