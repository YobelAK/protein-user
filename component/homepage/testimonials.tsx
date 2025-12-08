import React from 'react';
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
import { IconStar, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    country: 'Australia',
    rating: 5,
    text: 'Amazing speedboat service! The trip to Nusa Penida was smooth and the crew was very professional. Highly recommend for anyone visiting Bali.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&q=80'
  },
  {
    id: 2,
    name: 'Marco Rodriguez',
    country: 'Spain',
    rating: 5,
    text: 'The watersport activities were incredible! Great equipment, safety measures, and the staff made sure we had an unforgettable experience.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80'
  },
  {
    id: 3,
    name: 'Emily Chen',
    country: 'Singapore',
    rating: 4,
    text: 'Beach club experience was fantastic. Great food, amazing views, and excellent service. Perfect place to relax and enjoy Bali.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80'
  },
  {
    id: 4,
    name: 'David Thompson',
    country: 'United Kingdom',
    rating: 5,
    text: 'The cultural tour was enlightening and well-organized. Our guide was knowledgeable and passionate about Balinese culture.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80'
  }
];

export function Testimonials() {
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
            >
              <IconChevronLeft size={20} />
            </ActionIcon>
            <ActionIcon 
              variant="outline" 
              size="lg"
              style={{ borderColor: '#dee2e6', backgroundColor: 'white' }}
            >
              <IconChevronRight size={20} />
            </ActionIcon>
          </Group>
        </Group>
        
        <SimpleGrid
          cols={{ base: 1, md: 2, lg: 4 }}
          spacing="lg"
        >
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              shadow="md"
              radius="xl"
              p="xl"
              bg="white"
              style={{
                transition: 'box-shadow 0.3s ease',
                ':hover': { boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }
              }}
            >
                <Stack gap="md">
                  <Rating 
                    value={testimonial.rating} 
                    readOnly 
                    size="sm"
                    color="yellow"
                  />
                  <Text c="#374151" style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    "{testimonial.text}"
                  </Text>
                  <Group gap="md">
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
                </Stack>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}