"use client";
import React from 'react';
import { Box, Group, Table } from '@mantine/core';
import { Edit2, Trash2 } from 'lucide-react';

interface Traveler {
  firstName: string;
  lastName: string;
  age: number;
  nationality: string;
  nationalId: string;
}

export function SavedTravelersTable() {
  const travelers: Traveler[] = [
    {
      firstName: 'Nadya',
      lastName: 'Astuti',
      age: 22,
      nationality: 'Indonesia',
      nationalId: '123456789',
    },
    {
      firstName: 'John',
      lastName: 'Smith',
      age: 28,
      nationality: 'Australia',
      nationalId: 'P987654321',
    },
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      age: 25,
      nationality: 'United States',
      nationalId: 'P456789123',
    },
  ];

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
      <Table w="100%">
        <thead style={headerStyle}>
          <tr>
            <th style={thStyle}>First Name</th>
            <th style={thStyle}>Last Name</th>
            <th style={thStyle}>Age</th>
            <th style={thStyle}>Nationality</th>
            <th style={thStyle}>National Id / Passport</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {travelers.map((traveler, index) => (
            <tr
              key={index}
              style={{ transition: 'background-color 120ms ease' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'transparent';
              }}
            >
              <td style={tdStyle}>{traveler.firstName}</td>
              <td style={tdStyle}>{traveler.lastName}</td>
              <td style={tdStyle}>{traveler.age}</td>
              <td style={tdStyle}>{traveler.nationality}</td>
              <td style={tdStyle}>{traveler.nationalId}</td>
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
                  >
                    <Trash2 size={18} style={{ color: '#2dbe8d' }} />
                  </Box>
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );
}