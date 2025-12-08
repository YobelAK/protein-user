'use client';

import React from 'react';
import { Card, Image, Box, Group, Text, Button, ActionIcon } from '@mantine/core';
import { Heart, X } from 'lucide-react';

type ExperienceCardProps = {
  title: string;
  duration: string;
  price: string;
  image: string;
  onBook: () => void;
  onRemove: () => void;
};

export function ExperienceCard({
  title,
  duration,
  price,
  image,
  onBook,
  onRemove,
}: ExperienceCardProps) {
  return (
    <Card
      shadow="md"
      radius="lg"
      withBorder={false}
      style={{
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        transition: 'box-shadow 150ms ease',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
      }}
    >
      <Box style={{ position: 'relative' }}>
        <Image src={image} alt={title} height={224} fit="cover" />
        <ActionIcon
          variant="default"
          aria-label="Remove from wishlist"
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
          size={40}
          radius="xl"
        >
          <Heart size={20} color="#ef4444" fill="#ef4444" />
        </ActionIcon>
      </Box>

      <Box style={{ padding: 20 }}>
        <Text size="lg" fw={700} c="#284361" mb={8}>
          {title}
        </Text>

        <Group justify="space-between" mb={16}>
          <Text size="sm" c="#6b7280">
            {duration}
          </Text>
          <Text size="lg" fw={700} c="#284361">
            {price}
          </Text>
        </Group>

        <Group gap={12}>
          <Button onClick={onBook} style={{ backgroundColor: '#284361', flex: 1 }}>
            Book Now
          </Button>
          <ActionIcon
            onClick={onRemove}
            variant="outline"
            aria-label="Remove from wishlist"
            size={44}
            radius="md"
            style={{ borderColor: '#284361' }}
          >
            <X size={20} color="#284361" />
          </ActionIcon>
        </Group>
      </Box>
    </Card>
  );
}