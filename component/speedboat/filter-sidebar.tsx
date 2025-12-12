"use client";

import React from 'react';
import { Paper, Stack, Title, Text, Checkbox, Radio, RadioGroup, Button } from '@mantine/core';

type Props = {
  providers: string[];
  selectedProviders: string[];
  onToggleProvider: (name: string) => void;
  selectedWindows: Array<'morning' | 'afternoon' | 'evening'>;
  onToggleWindow: (win: 'morning' | 'afternoon' | 'evening') => void;
  sortBy: 'lower-price' | 'earliest-departure' | 'latest-departure' | null;
  onToggleSort: (value: 'lower-price' | 'earliest-departure' | 'latest-departure' | null) => void;
  onApply: () => void;
};

export function FilterSidebar({ providers, selectedProviders, onToggleProvider, selectedWindows, onToggleWindow, sortBy, onToggleSort, onApply }: Props) {
  return (
    <aside style={{ width: '256px', flexShrink: 0 }}>
      <Paper 
        shadow="sm" 
        p="xl" 
        radius="xl"
        style={{ 
          position: 'sticky', 
          top: '16px',
          backgroundColor: 'white'
        }}
      >
        <Stack gap="xl">
          <Title order={3} size="lg" fw={600} c="#1a1a1a">
            Filter Speedboats
          </Title>
          
          <Stack gap="md">
            <Text fw={500} c="#1a1a1a">
              Departure Time
            </Text>
            <Stack gap="xs">
              <Checkbox
                checked={selectedWindows.includes('morning')}
                onChange={() => onToggleWindow('morning')}
                label="Morning (00:00 - 12:00)"
                color="#284361"
                size="sm"
                styles={{
                  label: { fontSize: '14px', color: '#1a1a1a' }
                }}
              />
              <Checkbox
                checked={selectedWindows.includes('afternoon')}
                onChange={() => onToggleWindow('afternoon')}
                label="Afternoon (12:00 - 18:00)"
                color="#284361"
                size="sm"
                styles={{
                  label: { fontSize: '14px', color: '#1a1a1a' }
                }}
              />
              <Checkbox
                checked={selectedWindows.includes('evening')}
                onChange={() => onToggleWindow('evening')}
                label="Evening (18:00 - 24:00)"
                color="#284361"
                size="sm"
                styles={{
                  label: { fontSize: '14px', color: '#1a1a1a' }
                }}
              />
            </Stack>
          </Stack>
        
          <Stack gap="md">
            <Text fw={500} c="#1a1a1a">
              Sort By
            </Text>
            <RadioGroup name="sort" value={sortBy ?? undefined} onChange={(v: any) => onToggleSort(v || null)}>
              <Stack gap="xs">
                <Radio
                  value="lower-price"
                  label="Lower Price"
                  color="#284361"
                  size="sm"
                  onClick={() => onToggleSort(sortBy === 'lower-price' ? null : 'lower-price')}
                  styles={{
                    label: { fontSize: '14px', color: '#1a1a1a' }
                  }}
                />
                <Radio
                  value="earliest-departure"
                  label="Earliest Departure"
                  color="#284361"
                  size="sm"
                  onClick={() => onToggleSort(sortBy === 'earliest-departure' ? null : 'earliest-departure')}
                  styles={{
                    label: { fontSize: '14px', color: '#1a1a1a' }
                  }}
                />
                <Radio
                  value="latest-departure"
                  label="Latest Departure"
                  color="#284361"
                  size="sm"
                  onClick={() => onToggleSort(sortBy === 'latest-departure' ? null : 'latest-departure')}
                  styles={{
                    label: { fontSize: '14px', color: '#1a1a1a' }
                  }}
                />
              </Stack>
            </RadioGroup>
          </Stack>
        
          <Stack gap="md">
            <Text fw={500} c="#1a1a1a">
              Provider
            </Text>
            <Stack gap="xs">
              {providers.map((p) => (
                <Checkbox
                  key={p}
                  checked={selectedProviders.includes(p)}
                  onChange={() => onToggleProvider(p)}
                  label={p}
                  color="#284361"
                  size="sm"
                  styles={{
                    label: { fontSize: '14px', color: '#1a1a1a' }
                  }}
                />
              ))}
            </Stack>
          </Stack>
          
          <Button
            fullWidth
            size="md"
            fw={500}
            radius="lg"
            style={{
              backgroundColor: '#284361',
              color: 'white'
            }}
            styles={{
              root: {
                '&:hover': {
                  backgroundColor: '#1f3349'
                }
              }
            }}
            onClick={onApply}
          >
            Apply Filters
          </Button>
        </Stack>
      </Paper>
    </aside>
  );
}
