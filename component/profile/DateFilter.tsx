"use client";
import React from 'react';
import { Box, Group, Text, TextInput } from '@mantine/core';
import { Calendar } from 'lucide-react';

interface DateFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
}

export function DateFilter({ fromDate, toDate, onFromDateChange, onToDateChange }: DateFilterProps) {
  return (
    <Group gap={16} align="center">
      <Box style={{ display: 'flex', flexDirection: 'column' }}>
        <Text size="sm" c="#6b7280" mb={6}>From</Text>
        <TextInput
          value={fromDate}
          onChange={(e) => onFromDateChange(e.currentTarget.value)}
          placeholder="DD/MM/YYYY"
          rightSection={<Calendar size={20} color="#9ca3af" />}
          styles={{
            input: {
              width: 192,
              paddingInline: 16,
              paddingBlock: 8,
              paddingRight: 40,
              border: '1px solid #d1d5db',
              borderRadius: 8,
              outline: 'none',
              transition: 'box-shadow 120ms ease, border-color 120ms ease',
              background: 'white'
            },
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px #2dbe8d';
            e.currentTarget.style.borderColor = 'transparent';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        />
      </Box>

      <Box style={{ display: 'flex', flexDirection: 'column' }}>
        <Text size="sm" c="#6b7280" mb={6}>To</Text>
        <TextInput
          value={toDate}
          onChange={(e) => onToDateChange(e.currentTarget.value)}
          placeholder="DD/MM/YYYY"
          rightSection={<Calendar size={20} color="#9ca3af" />}
          styles={{
            input: {
              width: 192,
              paddingInline: 16,
              paddingBlock: 8,
              paddingRight: 40,
              border: '1px solid #d1d5db',
              borderRadius: 8,
              outline: 'none',
              transition: 'box-shadow 120ms ease, border-color 120ms ease',
              background: 'white'
            },
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = '0 0 0 2px #2dbe8d';
            e.currentTarget.style.borderColor = 'transparent';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.borderColor = '#d1d5db';
          }}
        />
      </Box>
    </Group>
  );
}