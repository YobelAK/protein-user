'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Title,
  Text,
  Grid,
  GridCol,
  Card,
  CardSection,
  Image,
  Button,
  Group,
  Stack,
  Badge,
  ActionIcon,
  Transition,
  Loader
} from '@mantine/core';
import { IconArrowRight, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';
type DestinationCard = { id: string; title: string; type: string; priceIdr: number; image?: string | null; depId: string; arrId: string; date: string };

export function PopularDestinations() {
  const [destinations, setDestinations] = useState<DestinationCard[]>([]);
  const [offset, setOffset] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [anim, setAnim] = useState<'slide-left' | 'slide-right'>('slide-right');
  const pendingOffset = React.useRef<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/bookings?topFastboatRoutes=1', { cache: 'no-store' });
        const data = await res.json();
        const list: DestinationCard[] = Array.isArray(data?.destinations) ? data.destinations.map((d: any) => ({
          id: String(d.id || ''),
          title: String(d.title || ''),
          type: 'Fastboat',
          priceIdr: Number(d.priceIdr || 0),
          image: d.image || null,
          depId: String(d.depId || ''),
          arrId: String(d.arrId || ''),
          date: String(d.date || ''),
        })) : [];
        if (mounted) {
          setDestinations(list);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const visible = destinations.slice(offset, Math.min(offset + (isMobile ? 1 : 4), destinations.length));

  function formatIdr(n: number) {
    try { return `IDR ${new Intl.NumberFormat('id-ID').format(Math.round(n))}` } catch { return `IDR ${n}` }
  }

  return (
    <Box style={{ backgroundColor: '#f8f9fa', padding: '8px 0' }}>
      <Container size="xl" style={{ padding: '64px 16px' }}>
        <Group justify="space-between" mb="xl">
          <Stack gap="xs">
            <Title order={2} size="2rem" fw={700} c="#1a1a1a">
              Popular Destinations
            </Title>
            <Text c="dimmed" size="lg">
              Discover the most loved routes and experiences.
            </Text>
          </Stack>
          <Group gap="xs">
            <ActionIcon 
              variant="outline" 
              size="lg"
              style={{ borderColor: '#dee2e6', backgroundColor: 'white' }}
              onClick={() => {
                if (offset <= 0 || !mounted) return;
                setAnim('slide-right');
                pendingOffset.current = Math.max(0, offset - 1);
                setMounted(false);
              }}
              disabled={offset <= 0 || !mounted}
            >
              <IconChevronLeft size={20} />
            </ActionIcon>
            <ActionIcon 
              variant="outline" 
              size="lg"
              style={{ borderColor: '#dee2e6', backgroundColor: 'white' }}
              onClick={() => {
                const maxOffset = Math.max(0, destinations.length - (isMobile ? 1 : 4));
                if (destinations.length <= (isMobile ? 1 : 4) || offset >= maxOffset || !mounted) return;
                setAnim('slide-left');
                pendingOffset.current = Math.min(maxOffset, offset + 1);
                setMounted(false);
              }}
              disabled={destinations.length <= (isMobile ? 1 : 4) || offset >= Math.max(0, destinations.length - (isMobile ? 1 : 4)) || !mounted}
            >
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
        </Group>
        {loading ? (
          <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: isMobile ? 200 : 224 }}>
            <Loader color="#284361" />
          </Box>
        ) : (
        <Transition mounted={mounted} transition={anim} duration={300} exitDuration={220} onExited={() => {
          if (pendingOffset.current != null) {
            setOffset(pendingOffset.current);
            pendingOffset.current = null;
            setMounted(true);
          }
        }}>
          {(styles: React.CSSProperties) => (
            <Box
              style={{ ...styles }}
              onTouchStart={(e) => {
                if (!isMobile) return;
                touchStartX.current = e.changedTouches[0]?.clientX ?? null;
              }}
              onTouchEnd={(e) => {
                if (!isMobile) return;
                touchEndX.current = e.changedTouches[0]?.clientX ?? null;
                if (touchStartX.current != null && touchEndX.current != null) {
                  const dx = touchEndX.current - touchStartX.current;
                  const threshold = 40;
                  const maxOffset = Math.max(0, destinations.length - 1);
                  if (dx < -threshold && offset < maxOffset) {
                    setAnim('slide-left');
                    pendingOffset.current = Math.min(maxOffset, offset + 1);
                    setMounted(false);
                  } else if (dx > threshold && offset > 0) {
                    setAnim('slide-right');
                    pendingOffset.current = Math.max(0, offset - 1);
                    setMounted(false);
                  }
                }
                touchStartX.current = null;
                touchEndX.current = null;
              }}
            >
              <Grid>
                {visible.map((destination) => (
                  <GridCol key={destination.id} span={{ base: 12, md: 6, lg: 3 }}>
                    <Card 
                      shadow="md" 
                      radius="xl" 
                      bg="white"
                      style={{ 
                        overflow: 'hidden',
                        transition: 'box-shadow 0.3s ease',
                        ':hover': { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
                      }}
                    >
                      <CardSection style={{ position: 'relative', height: isMobile ? '200px' : '224px' }}>
                        <Image
                          src={destination.image || ''}
                          alt={destination.title}
                          h={isMobile ? 200 : 224}
                          style={{ objectFit: 'cover' }}
                        />
                        <Badge
                          style={{
                            position: 'absolute',
                            top: '16px',
                            left: '16px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(4px)',
                            color: '#284361'
                          }}
                          size="md"
                          fw={600}
                        >
                          {destination.type}
                        </Badge>
                      </CardSection>
                      
                      <Stack gap="md" p="md">
                        <Title order={3} size="lg" fw={700}>
                          {destination.title}
                        </Title>
                        <Group justify="space-between" align="flex-end">
                          <Stack gap={2}>
                            <Text size="sm" c="dimmed">From</Text>
                            <Text fw={700} size="lg" c="#284361">
                              {formatIdr(destination.priceIdr)}
                            </Text>
                          </Stack>
                          <Button
                            component={Link}
                            href={`/fastboat?from=${encodeURIComponent(destination.depId)}&to=${encodeURIComponent(destination.arrId)}&departure=${encodeURIComponent(destination.date)}`}
                            style={{
                              backgroundColor: '#284361',
                              ':hover': { backgroundColor: '#1e3149' }
                            }}
                            fw={600}
                          >
                            View Details
                          </Button>
                        </Group>
                      </Stack>
                    </Card>
                  </GridCol>
                ))}
              </Grid>
              {isMobile && (
                <Group justify="center" mt="md" gap={6}>
                  {destinations.map((_, i) => (
                    <Box
                      key={i}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 6,
                        backgroundColor: i === offset ? '#284361' : '#cbd5e1'
                      }}
                    />
                  ))}
                </Group>
              )}
            </Box>
          )}
        </Transition>
        )}
      </Container>
    </Box>
  );
}
