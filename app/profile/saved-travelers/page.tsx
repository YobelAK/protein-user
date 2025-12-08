"use client";
import React from 'react';
import { Box, Text, Group, Button } from '@mantine/core';
import { Header } from '@/components/layout/header';
// import { Sidebar } from '@/components/profile/Sidebar';
import { SavedTravelersTable } from '@/components/profile/SavedTravelersTable';

export default function Page() {
  return (
    <Box style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      <Box component="main" style={{ padding: 32 }}>
        <Box>
          <Group justify="space-between" align="flex-start" mb={24}>
            <Box>
              <Text style={{ fontSize: 30, fontWeight: 700, color: '#284361', marginBottom: 8 }}>
                Saved Travelers
              </Text>
              <Text style={{ color: '#6b7280' }}>
                Save your frequent travel companions for faster checkout.
              </Text>
            </Box>
            <Button
              styles={{
                root: {
                  paddingInline: 24,
                  paddingBlock: 12,
                  borderRadius: 8,
                  fontWeight: 600,
                  backgroundColor: '#284361',
                  color: '#ffffff',
                },
              }}
            >
              <span style={{ fontSize: 18, marginRight: 8 }}>+</span>
              Add New Traveler
            </Button>
          </Group>

          <SavedTravelersTable />
        </Box>
      </Box>
    </Box>
  );
}
