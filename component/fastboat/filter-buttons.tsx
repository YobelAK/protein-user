'use client';

import React from 'react';
import { Group, Button } from '@mantine/core';
import { IconSwimming, IconPaw, IconMapPin, IconGift } from '@tabler/icons-react';

interface FilterButtonsProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function FilterButtons({
  activeFilter,
  onFilterChange
}: FilterButtonsProps) {
  const filters = [
    {
      id: 'all',
      label: 'All',
      icon: null
    },
    {
      id: 'watersport',
      label: 'Watersport',
      icon: IconSwimming
    },
    {
      id: 'beach-club',
      label: 'Beach Club',
      icon: IconPaw
    },
    {
      id: 'tours',
      label: 'Tours',
      icon: IconMapPin
    },
    {
      id: 'combo',
      label: 'Combo Packages',
      icon: IconGift
    }
  ];

  return (
    <Group gap="sm" wrap="wrap">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilter === filter.id;
        
        return (
          <Button
            key={filter.id}
            onClick={() => onFilterChange(filter.id)}
            variant={isActive ? 'filled' : 'light'}
            color={isActive ? '#284361' : 'gray'}
            size="sm"
            leftSection={Icon ? <Icon size={16} /> : undefined}
            style={{
              backgroundColor: isActive ? '#284361' : '#f8f9fa',
              color: isActive ? 'white' : '#495057',
              ':hover': {
                backgroundColor: isActive ? '#284361' : '#e9ecef'
              }
            }}
          >
            {filter.label}
          </Button>
        );
      })}
    </Group>
  );
}