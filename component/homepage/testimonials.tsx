'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Title,
  Text,
  SimpleGrid,
  Card,
  Avatar,
  Group,
  Stack,
  ActionIcon,
  Rating
} from '@mantine/core';
import { Transition } from '@mantine/core';
import { IconStar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
type ReviewCard = { id: string; name: string; country: string; rating: number; text: string; avatar: string };

export function Testimonials() {
  const [reviews, setReviews] = useState<ReviewCard[]>([]);
  const [offset, setOffset] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [anim, setAnim] = useState<'slide-left' | 'slide-right'>('slide-right');
  const pendingOffset = React.useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/bookings?topReviews=1', { cache: 'no-store' });
        const data = await res.json();
        const list: ReviewCard[] = Array.isArray(data?.reviews) ? data.reviews.map((r: any) => ({
          id: String(r.id || ''),
          name: String(r.name || 'Anonymous'),
          country: String(r.country || ''),
          rating: Number(r.rating || 0),
          text: String(r.text || ''),
          avatar: String(r.avatar || ''),
        })) : [];
        if (mounted) setReviews(list);
      } catch {}
    })();
    return () => { mounted = false };
  }, []);

  const visible = reviews.slice(offset, Math.min(offset + 4, reviews.length));

  return (
    <Box style={{ backgroundColor: '#f8f9fa', padding: '16px 0' }}>
      <Container size="xl">
        <Group justify="space-between" mb="xl">
          <Stack gap="xs">
            <Title order={2} size="2rem" fw={700} c="#1a1a1a">
              What Our Travelers Say
            </Title>
            <Text c="dimmed" size="lg">
              Real experiences from our valued customers.
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
                const maxOffset = Math.max(0, reviews.length - 4);
                if (reviews.length <= 4 || offset >= maxOffset || !mounted) return;
                setAnim('slide-left');
                pendingOffset.current = Math.min(maxOffset, offset + 1);
                setMounted(false);
              }}
              disabled={reviews.length <= 4 || offset >= Math.max(0, reviews.length - 4) || !mounted}
            >
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
        </Group>
        
        <Transition mounted={mounted} transition={anim} duration={300} exitDuration={220} onExited={() => {
          if (pendingOffset.current != null) {
            setOffset(pendingOffset.current);
            pendingOffset.current = null;
            setMounted(true);
          }
        }}>
          {(styles: React.CSSProperties) => (
            <Box style={{ ...styles }}>
              <SimpleGrid
                cols={{ base: 1, md: 2, lg: 4 }}
                spacing="lg"
              >
                {visible.map((testimonial) => (
                  <Card
                    key={testimonial.id}
                    shadow="md"
                    radius="xl"
                    p="xl"
                    bg="white"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'box-shadow 0.3s ease',
                    }}
                  >
                      <Group gap="xs" mb="md">
                        <IconStar size={18} color="#f59e0b" />
                        <Rating value={testimonial.rating} readOnly size="sm" color="yellow" />
                      </Group>

                      <Box style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                        <Text c="#374151" style={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          maxWidth: '100%'
                        }}>
                          "{testimonial.text}"
                        </Text>
                      </Box>

                      <Group gap="md" mt="md">
                        <Avatar 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          size="lg"
                          radius="xl"
                        />
                        <Stack gap={2}>
                          <Text fw={600} c="#1a1a1a">
                            {testimonial.name}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {testimonial.country}
                          </Text>
                        </Stack>
                      </Group>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Transition>
      </Container>
    </Box>
  );
}
