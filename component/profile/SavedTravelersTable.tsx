"use client";
import React from 'react';
import { Box, Group, Table, Text, Stack, SimpleGrid, Paper } from '@mantine/core';
import { Edit2, Trash2 } from 'lucide-react';
import { useMediaQuery } from '@mantine/hooks';

interface Traveler {
  id?: string;
  title: string;
  firstName: string;
  lastName: string;
  nationality: string;
  identityType: string;
  idNumber: string;
  ageCategory: string;
  age?: number;
}

type Props = {
  travelers: Traveler[];
  onEdit?: (traveler: Traveler, index: number) => void;
  onDelete?: (traveler: Traveler, index: number) => void;
};

export function SavedTravelersTable({ travelers, onEdit, onDelete }: Props) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const headerStyle = { backgroundColor: '#e8f1f5' } as React.CSSProperties;
  const thStyle = {
    padding: '16px 24px',
    textAlign: 'left' as const,
    fontWeight: 600,
    color: '#284361',
    fontSize: 14,
  };

  const tdStyle = {
    padding: '20px 24px',
    color: '#284361',
    fontSize: 14,
    borderTop: '1px solid #f3f4f6',
  } as React.CSSProperties;

  return (
    <Box
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      {isMobile ? (
        <Stack gap="sm" p="md">
          {travelers.map((traveler, index) => (
            <Paper key={traveler.id ?? index} withBorder radius="md" p="md">
              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Text size="sm" c="dimmed">Name</Text>
                  <Text size="sm" fw={600} c="#284361">{`${traveler.title ? traveler.title + ' ' : ''}${traveler.firstName} ${traveler.lastName}`}</Text>
                </Group>
                <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xs">
                  <Group justify="space-between" align="center">
                    <Text size="xs" c="dimmed">Nationality</Text>
                    <Text size="sm" c="#284361">{traveler.nationality}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="xs" c="dimmed">Identity Type</Text>
                    <Text size="sm" c="#284361">{traveler.identityType}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="xs" c="dimmed">ID Number</Text>
                    <Text size="sm" c="#284361">{traveler.idNumber}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text size="xs" c="dimmed">Age Category</Text>
                    <Text size="sm" c="#284361">{traveler.ageCategory}</Text>
                  </Group>
                </SimpleGrid>
                <Group gap={12} justify="flex-end">
                  <Box
                    role="button"
                    aria-label="Edit traveler"
                    style={{ padding: 8, borderRadius: 8, cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                    onClick={() => onEdit?.(traveler, index)}
                  >
                    <Edit2 size={18} style={{ color: '#284361' }} />
                  </Box>
                  <Box
                    role="button"
                    aria-label="Delete traveler"
                    style={{ padding: 8, borderRadius: 8, cursor: 'pointer' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                    onClick={() => onDelete?.(traveler, index)}
                  >
                    <Trash2 size={18} style={{ color: '#2dbe8d' }} />
                  </Box>
                </Group>
              </Stack>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Table w="100%">
          <thead style={headerStyle}>
            <tr>
              <th style={thStyle}>Title</th>
              <th style={thStyle}>First Name</th>
              <th style={thStyle}>Last Name</th>
              <th style={thStyle}>Nationality</th>
              <th style={thStyle}>Identity Type</th>
              <th style={thStyle}>ID Number</th>
              <th style={thStyle}>Age Category</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {travelers.map((traveler, index) => (
              <tr
                key={traveler.id ?? index}
                style={{ transition: 'background-color 120ms ease' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
                }}
              >
                <td style={tdStyle}>{traveler.title}</td>
                <td style={tdStyle}>{traveler.firstName}</td>
                <td style={tdStyle}>{traveler.lastName}</td>
                <td style={tdStyle}>{traveler.nationality}</td>
                <td style={tdStyle}>{traveler.identityType}</td>
                <td style={tdStyle}>{traveler.idNumber}</td>
                <td style={tdStyle}>{traveler.ageCategory}</td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <Group gap={12}>
                    <Box
                      role="button"
                      aria-label="Edit traveler"
                      style={{ padding: 8, borderRadius: 8, cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                      onClick={() => onEdit?.(traveler, index)}
                    >
                      <Edit2 size={18} style={{ color: '#284361' }} />
                    </Box>
                    <Box
                      role="button"
                      aria-label="Delete traveler"
                      style={{ padding: 8, borderRadius: 8, cursor: 'pointer' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                      onClick={() => onDelete?.(traveler, index)}
                    >
                      <Trash2 size={18} style={{ color: '#2dbe8d' }} />
                    </Box>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Box>
  );
}
