import React from 'react';
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
  ActionIcon
} from '@mantine/core';
import { IconClock, IconMapPin, IconChevronLeft, IconChevronRight, IconArrowRight } from '@tabler/icons-react';

const offers = [
  {
    id: 1,
    title: '10% Off All Speedboat Bookings',
    description: 'Book your Sanur-Nusa Penida trip today and save more for group travel. Perfect for families looking to explore together.',
    discount: '10% OFF',
    validUntil: 'Valid until: 30 Nov 2025',
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&q=80'
  },
  {
    id: 2,
    title: 'Watersport Activity Bundle',
    description: 'Get 15% off when you book 3 or more watersport activities. Includes jet ski, parasailing, and banana boat rides.',
    discount: '15% OFF',
    validUntil: 'Valid until: 15 Dec 2025',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'
  },
  {
    id: 3,
    title: 'Beach Club Happy Hour Special',
    description: 'Enjoy 2-for-1 cocktails and 20% off all items during Happy Hour (4-6 PM) at all participating Beach Clubs.',
    discount: '20% OFF',
    validUntil: 'Valid until: 31 Dec 2025',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80'
  },
  {
    id: 4,
    title: 'Cultural Tour Package Discount',
    description: "Experience Bali's rich heritage with our guided tours. 12% off all cultural package when booking 3+ days.",
    discount: '12% OFF',
    validUntil: 'Valid until: 1 Jan 2026',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80'
  }
];

export function SpecialOffers() {
  return (
    <Box style={{ backgroundColor: '#f8f9fa', padding: '8px 0' }}>
      <Container size="xl" style={{ padding: '8px 16px' }}>
        <Group justify="space-between" mb="xl">
          <Title order={2} size="2rem" fw={700} c="#1a1a1a">
            Special Offers & Seasonal Deals
          </Title>
          <Group gap="xs">
            <ActionIcon 
              variant="outline" 
              size="lg"
              style={{ borderColor: '#dee2e6' }}
            >
              <IconChevronLeft size={20} />
            </ActionIcon>
            <ActionIcon 
              variant="outline" 
              size="lg"
              style={{ borderColor: '#dee2e6' }}
            >
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
        </Group>
        
        <Grid>
          {offers.map((offer) => (
            <GridCol key={offer.id} span={{ base: 12, md: 6, lg: 3 }}>
              <Card 
                shadow="md" 
                radius="xl" 
                bg="white"
                style={{ 
                  overflow: 'hidden',
                  transition: 'box-shadow 0.3s ease',
                  ':hover': { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardSection style={{ position: 'relative', height: '192px' }}>
                  <Image
                    src={offer.image}
                    alt={offer.title}
                    h={192}
                    style={{ objectFit: 'cover' }}
                  />
                  <Badge
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      backgroundColor: '#f59e0b',
                      color: 'white'
                    }}
                    size="md"
                    fw={600}
                  >
                    {offer.discount}
                  </Badge>
                </CardSection>
                
                <Stack gap="md" p="md" style={{ flex: 1, justifyContent: 'space-between' }}>
                  <Stack gap="md">
                    <Title order={3} size="lg" fw={700}>
                      {offer.title}
                    </Title>
                    <Text size="sm" c="dimmed" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {offer.description}
                    </Text>
                    <Group gap="xs" align="center">
                      <IconClock size={16} color="#6c757d" />
                      <Text size="sm" c="dimmed">
                        {offer.validUntil}
                      </Text>
                    </Group>
                  </Stack>
                  <Button
                    fullWidth
                    style={{
                      backgroundColor: '#284361',
                      ':hover': { backgroundColor: '#1e3149' }
                    }}
                    fw={600}
                    rightSection={<IconArrowRight size={16} />}
                  >
                    See Details
                  </Button>
                </Stack>
              </Card>
            </GridCol>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}