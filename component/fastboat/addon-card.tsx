'use client';

import React from 'react';
import { 
  Card, 
  Image, 
  Text, 
  Badge, 
  Button, 
  Group, 
  Stack, 
  Box 
} from '@mantine/core';
import { IconClock, IconCheck } from '@tabler/icons-react';

interface AddOnCardProps {
  id: string;
  title: string;
  description: string;
  duration: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  image: string;
  badge?: 'Popular' | 'Limited Offer';
  isAdded: boolean;
  onToggle: (id: string) => void;
  onSeeDetails?: (id: string) => void;
}

export function AddOnCard({
  id,
  title,
  description,
  duration,
  price,
  originalPrice,
  discount,
  image,
  badge,
  isAdded,
  onToggle,
  onSeeDetails
}: AddOnCardProps) {
  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="xl"
      bg="white" 
      withBorder
      style={{ 
        transition: 'box-shadow 0.2s ease',
        ':hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
      }}
    >
      <Card.Section style={{ position: 'relative' }}>
        <Image
          src={image}
          alt={title}
          height={192}
          style={{ objectFit: 'cover' }}
        />
        {badge && (
          <Badge
            variant="filled"
            color={badge === 'Popular' ? 'yellow' : 'red'}
            size="sm"
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {badge === 'Popular' ? '⭐' : '🔥'} {badge}
          </Badge>
        )}
      </Card.Section>

      <Stack gap="sm" mt="md">
        <Text fw={600} size="lg" c="dark">
          {title}
        </Text>
        
        <Text size="sm" c="dimmed">
          {description}
        </Text>
        
        <Group gap="xs" align="center">
          <IconClock size={16} color="#6c757d" />
          <Text size="sm" c="dimmed">
            Duration: {duration}
          </Text>
        </Group>
        
        <Group gap="xs" align="baseline">
          <Text size="xl" fw={700} c="dark">
            Rp {price.toLocaleString('id-ID')}
          </Text>
          {originalPrice && (
            <Text size="sm" c="dimmed" td="line-through">
              Rp {originalPrice.toLocaleString('id-ID')}
            </Text>
          )}
        </Group>
        
        {discount && (
          <Text size="sm" fw={600} c="#2dbe8d">
            {discount}
          </Text>
        )}
        
        <Button
          onClick={() => onToggle(id)}
          fullWidth
          color={isAdded ? '#2dbe8d' : '#284361'}
          variant="filled"
          style={{
            backgroundColor: isAdded ? '#2dbe8d' : '#284361',
            ':hover': {
              backgroundColor: isAdded ? '#26a878' : '#1f3450'
            }
          }}
        >
          {isAdded ? (
            <Group gap="xs" justify="center">
              <IconCheck size={20} />
              Added!
            </Group>
          ) : (
            '+ Add to My Trip'
          )}
        </Button>
        
        <Button
          onClick={() => onSeeDetails?.(id)}
          variant="subtle"
          color="gray"
          size="sm"
          fullWidth
          style={{
            ':hover': { color: '#284361' }
          }}
        >
          See details
        </Button>
      </Stack>
    </Card>
  );
}