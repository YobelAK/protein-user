import React from 'react';
import { Paper, Stack, Title, Text, Checkbox, Radio, RadioGroup, Button } from '@mantine/core';

export function FilterSidebar() {
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
                label="Morning (00:00 - 12:00)"
                color="#284361"
                size="sm"
                styles={{
                  label: { fontSize: '14px', color: '#1a1a1a' }
                }}
              />
              <Checkbox
                label="Afternoon (12:00 - 18:00)"
                color="#284361"
                size="sm"
                styles={{
                  label: { fontSize: '14px', color: '#1a1a1a' }
                }}
              />
              <Checkbox
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
            <RadioGroup name="sort">
              <Stack gap="xs">
                <Radio
                  value="lower-price"
                  label="Lower Price"
                  color="#284361"
                  size="sm"
                  styles={{
                    label: { fontSize: '14px', color: '#1a1a1a' }
                  }}
                />
                <Radio
                  value="earliest-departure"
                  label="Earliest Departure"
                  color="#284361"
                  size="sm"
                  styles={{
                    label: { fontSize: '14px', color: '#1a1a1a' }
                  }}
                />
                <Radio
                  value="latest-departure"
                  label="Latest Departure"
                  color="#284361"
                  size="sm"
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
              <Checkbox
                label="Caspia Bali"
                color="#284361"
                size="sm"
                styles={{
                  label: { fontSize: '14px', color: '#1a1a1a' }
                }}
              />
              <Checkbox
                label="Eka Jaya"
                color="#284361"
                size="sm"
                styles={{
                  label: { fontSize: '14px', color: '#1a1a1a' }
                }}
              />
              <Checkbox
                label="The Tanis"
                color="#284361"
                size="sm"
                styles={{
                  label: { fontSize: '14px', color: '#1a1a1a' }
                }}
              />
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
          >
            Apply Filters
          </Button>
        </Stack>
      </Paper>
    </aside>
  );
}