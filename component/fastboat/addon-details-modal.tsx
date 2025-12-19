'use client';

import React from 'react';
import { Modal, Group, Button, ActionIcon, Title, Image, SimpleGrid, Paper, Text, Stack, List, Badge, Box } from '@mantine/core';
import { IconArrowLeft, IconX, IconClock, IconMapPin, IconCalendar, IconCheck, IconPlus } from '@tabler/icons-react';

export interface AddOnDetailsModalProps {
  'data-id'?: string;
  opened: boolean;
  onBack?: () => void;
  onClose: () => void;
  onAddToTrip?: () => void;
  isAdded?: boolean;
  addOn?: {
    id: string;
    title: string;
    description: string;
    duration: string;
    price: number;
    originalPrice?: number;
    discount?: string;
    image: string;
    location?: string;
    availability?: string;
    about?: string;
    included?: string[];
  };
}

export function AddOnDetailsModal({
  'data-id': dataId,
  opened,
  onBack,
  onClose,
  onAddToTrip,
  isAdded = false,
  addOn = {
    id: 'watersport-adventure',
    title: 'Watersport Adventure',
    description: 'Try various water activities on Jet Ski in Nusa Penida!',
    duration: '1.5 hours',
    price: 150000,
    originalPrice: 250000,
    discount: '-40% OFF',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',
    location: 'Nusa Penida',
    availability: 'Daily',
    about: 'Experience the thrill of riding a jet ski in the beautiful waters of Bali. Our professional instructors will guide you through a 15-minute solo ride, ensuring both safety and maximum enjoyment.',
    included: [
      'Professional equipment',
      'Safety briefing',
      'Instructor guidance',
      'Insurance coverage'
    ]
  }
}: AddOnDetailsModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      radius="lg"
      padding={0}
      styles={{
        content: { maxHeight: '90vh', overflow: 'hidden' },
        body: { padding: 0, height: '100%' }
      }}
      data-id={dataId}
    >
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header Navigation */}
        <Group justify="space-between" p="md" style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={20} />}
            onClick={onBack}
            color="#284361"
            styles={{
              root: { color: '#284361', '&:hover': { color: '#1a2d42' } }
            }}
          >
            Back to Add-ons
          </Button>
          <ActionIcon
            variant="subtle"
            onClick={onClose}
            color="gray"
            size="lg"
          >
            <IconX size={24} />
          </ActionIcon>
        </Group>

        {/* Main Content */}
        <Box p="xl" style={{ flex: 1, overflowY: 'auto' }}>
          <Stack gap="xl">
            {/* Title */}
            <Title order={1} size="2.25rem" fw={700} c="#284361">
              {addOn.title}
            </Title>

            {/* Hero Image */}
            <Image
              src={addOn.image}
              alt={`${addOn.title} - ${addOn.description}`}
              radius="xl"
              h={400}
              fit="cover"
            />

            {/* Information Cards */}
            <SimpleGrid
              cols={{ base: 1, md: 3 }}
              spacing="md"
            >
              <Paper bg="#f9fafb" radius="xl" p="lg">
                <Group align="flex-start" gap="sm">
                  <IconClock color="#284361" size={24} style={{ flexShrink: 0 }} />
                  <Stack gap={4}>
                    <Text size="sm" c="#6b7280">Duration</Text>
                    <Text size="lg" fw={600} c="#284361">{addOn.duration}</Text>
                  </Stack>
                </Group>
              </Paper>
              <Paper bg="#f9fafb" radius="xl" p="lg">
                <Group align="flex-start" gap="sm">
                  <IconMapPin color="#284361" size={24} style={{ flexShrink: 0 }} />
                  <Stack gap={4}>
                    <Text size="sm" c="#6b7280">Location</Text>
                    <Text size="lg" fw={600} c="#284361">
                      {addOn.location || 'Nusa Penida'}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
              <Paper bg="#f9fafb" radius="xl" p="lg">
                <Group align="flex-start" gap="sm">
                  <IconCalendar color="#284361" size={24} style={{ flexShrink: 0 }} />
                  <Stack gap={4}>
                    <Text size="sm" c="#6b7280">Availability</Text>
                    <Text size="lg" fw={600} c="#284361">
                      {addOn.availability || 'Daily'}
                    </Text>
                  </Stack>
                </Group>
              </Paper>
            </SimpleGrid>

            {/* About Section */}
            <Stack gap="md">
              <Title order={2} size="1.5rem" fw={700} c="#284361">
                About This Package
              </Title>
              <Text c="#4b5563" style={{ lineHeight: 1.6 }}>
                {addOn.about || addOn.description}
              </Text>
            </Stack>

            {/* What's Included */}
            <Stack gap="md">
              <Title order={2} size="1.5rem" fw={700} c="#284361">
                What's Included
              </Title>
              <List spacing="sm" icon={<IconCheck color="#2dbe8d" size={20} />}>
                {addOn.included?.map((item, index) => (
                  <List.Item key={index}>
                    <Text c="#4b5563">{item}</Text>
                  </List.Item>
                ))}
              </List>
            </Stack>

            {/* Pricing and CTA */}
            <Group justify="space-between" align="flex-end" pt="xl" style={{ borderTop: '1px solid #e5e7eb' }}>
              <Stack gap="sm">
                <Group align="baseline" gap="sm">
                  {addOn.originalPrice && (
                    <Text size="lg" c="#9ca3af" td="line-through">
                      Rp {addOn.originalPrice.toLocaleString('id-ID')}
                    </Text>
                  )}
                  <Text size="2rem" fw={700} c="#2dbe8d">
                    Rp {addOn.price.toLocaleString('id-ID')}
                  </Text>
                </Group>
                {addOn.discount && (
                  <Badge
                    color="#2dbe8d"
                    size="lg"
                    radius="md"
                    styles={{
                      root: { backgroundColor: '#2dbe8d', color: 'white', fontSize: '14px', fontWeight: 500 }
                    }}
                  >
                    Save {addOn.discount.replace('-', '').replace('%', '')}% when booking online
                  </Badge>
                )}
              </Stack>
              <Button
                onClick={onAddToTrip}
                size="lg"
                radius="xl"
                px="xl"
                py="md"
                color={isAdded ? '#2dbe8d' : '#284361'}
                leftSection={isAdded ? <IconCheck size={20} /> : <IconPlus size={20} />}
                styles={{
                  root: {
                    backgroundColor: isAdded ? '#2dbe8d' : '#284361',
                    '&:hover': { backgroundColor: isAdded ? '#26a878' : '#1a2d42' },
                    fontSize: '18px',
                    fontWeight: 600
                  }
                }}
              >
                {isAdded ? 'Added to Trip' : 'Add to My Trip'}
              </Button>
            </Group>
          </Stack>
        </Box>
      </Box>
    </Modal>
  );
}