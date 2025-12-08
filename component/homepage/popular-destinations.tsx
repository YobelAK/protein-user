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
import { IconArrowRight, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

const destinations = [
  {
    id: 1,
    title: 'Sanur ➔ Nusa Penida',
    type: 'Speedboat',
    price: 'Rp 750,000',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80'
  },
  {
    id: 2,
    title: 'Nusa Penida Full Day Tour',
    type: 'Tour Package',
    price: 'Rp 850,000',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80'
  },
  {
    id: 3,
    title: 'Sanur ➔ Lembongan',
    type: 'Speedboat',
    price: 'Rp 300,000',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80'
  },
  {
    id: 4,
    title: 'Crystal Bay Snorkeling',
    type: 'Watersport',
    price: 'Rp 450,000',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80'
  },
  // {
  //   id: 5,
  //   title: 'Uluwatu Temple Tour',
  //   type: 'Tour Package',
  //   price: 'Rp 500,000',
  //   image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80'
  // }
];

export function PopularDestinations() {
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
          {destinations.map((destination) => (
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
                <CardSection style={{ position: 'relative', height: '224px' }}>
                  <Image
                    src={destination.image}
                    alt={destination.title}
                    h={224}
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
                        {destination.price}
                      </Text>
                    </Stack>
                    <Button
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
      </Container>
    </Box>
  );
}