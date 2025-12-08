'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Box, Group, Text, Stack } from '@mantine/core';
import { Header } from '@/components/layout/header';
// import { Sidebar } from '@/components/profile/Sidebar';
import { BookingCard } from '@/components/profile/BookingCard';
import { supabase } from '@/lib/supabase/client';

type Status = 'All' | 'Booked' | 'Completed' | 'Cancelled' | 'Pending';

// const categories = ['All', 'Speedboat', 'Watersport', 'Tour', 'Beach Club'];

const statuses: Status[] = ['All','Pending', 'Booked', 'Completed', 'Cancelled'];

type CardItem = {
  id: string;
  initials: string;
  title: string;
  location: string;
  date: string;
  passengers: number;
  bookingCode: string;
  status: 'Pending' | 'Booked' | 'Completed' | 'Cancelled';
  image?: string | null;
  paymentDeadline?: string | null;
  deadlineAt?: string | null;
};

export default function MyBookingsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeStatus, setActiveStatus] = useState<Status>('All');
  const [cards, setCards] = useState<CardItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || '';
      if (!email) {
        setCards([]);
        return;
      }
      const res = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
      if (!res.ok) {
        setCards([]);
        return;
      }
      const json = await res.json();
      setCards(Array.isArray(json.bookings) ? json.bookings : []);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      const statusMatch = activeStatus === 'All' || c.status === activeStatus;
      return statusMatch;
    });
  }, [cards, activeStatus]);

  return (
    <Box style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      <Box component="main" style={{ padding: 32 }}>
        <Box>
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

          <Stack gap={16}>
            {filtered.map((b, idx) => (
              <BookingCard
                key={`${b.bookingCode}-${idx}`}
                initials={b.initials}
                title={b.title}
                location={b.location}
                date={b.date}
                passengers={b.passengers}
                bookingCode={b.bookingCode}
                status={b.status}
                paymentDeadline={b.paymentDeadline || undefined}
                deadlineAt={b.deadlineAt || undefined}
                onPayNow={b.status === 'Pending' ? () => {
                  try { localStorage.setItem('booking_id', b.id); } catch {}
                  window.location.href = `/speedboat/book/payment?id=${encodeURIComponent(b.id)}`;
                } : undefined}
                onCancel={(b.status === 'Pending' || b.status === 'Booked') ? async () => {
                  try {
                    const res = await fetch('/api/bookings', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'cancel', id: b.id }),
                    });
                    if (res.ok) {
                      setCards((prev) => prev.map((x) => x.id === b.id ? { ...x, status: 'Cancelled' } : x));
                    }
                  } catch {}
                } : undefined}
              />
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
