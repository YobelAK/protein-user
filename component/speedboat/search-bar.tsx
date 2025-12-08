'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Paper, Grid, Stack, Text, Select, TextInput, Checkbox, Group, Button, Box } from '@mantine/core';
import { IconChevronDown, IconCalendar, IconUsers } from '@tabler/icons-react';
import { PassengerSelector, PassengerCounts } from './passenger-selector';

type Option = { value: string; label: string };

export function SearchBar({
  originOptions = [],
  destinationOptions = [],
  initialFrom = null,
  initialTo = null,
  initialDeparture = '',
  initialReturn = '',
  initialPassengers = 2,
  onSearch,
}: {
  originOptions?: Option[];
  destinationOptions?: Option[];
  initialFrom?: string | null;
  initialTo?: string | null;
  initialDeparture?: string;
  initialReturn?: string;
  initialPassengers?: number;
  onSearch?: (params: { from: string | null; to: string | null; departure?: string; return?: string; passengers?: number }) => void;
}) {
  const [returnTrip, setReturnTrip] = useState(false);
  const [showPassengerSelector, setShowPassengerSelector] = useState(false);
  const [from, setFrom] = useState<string | null>(initialFrom);
  const [to, setTo] = useState<string | null>(initialTo);
  const [departure, setDeparture] = useState<string>(initialDeparture);
  const [ret, setRet] = useState<string>(initialReturn);
  const [passengers, setPassengers] = useState<PassengerCounts>({
    adult: Math.max(1, Number(initialPassengers || 2)),
    child: 0,
    infant: 0
  });
  const passengerRef = useRef<HTMLDivElement>(null);

  // Close passenger selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengerRef.current && !passengerRef.current.contains(event.target as Node)) {
        setShowPassengerSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePassengerDone = (newPassengers: PassengerCounts) => {
    setPassengers(newPassengers);
    setShowPassengerSelector(false);
  };

  const getPassengerText = () => {
    const total = passengers.adult + passengers.child + passengers.infant;
    if (total === 0) return 'Select passengers';
    
    const parts = [];
    if (passengers.adult > 0) parts.push(`${passengers.adult} Adult${passengers.adult > 1 ? 's' : ''}`);
    if (passengers.child > 0) parts.push(`${passengers.child} Child${passengers.child > 1 ? 'ren' : ''}`);
    if (passengers.infant > 0) parts.push(`${passengers.infant} Infant${passengers.infant > 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }, []);

  const triggerSearch = () => {
    const total = passengers.adult + passengers.child + passengers.infant;
    onSearch?.({ from, to, departure, return: ret, passengers: total });
  };

  return (
    <Paper shadow="sm" radius="lg" p="xl" bg="white">
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">From</Text>
            <Select
              data={originOptions}
              value={from}
              onChange={setFrom}
              rightSection={<IconChevronDown size={16} />}
              styles={{
                input: {
                  backgroundColor: '#f5f7fa',
                  border: 'none',
                  padding: '12px 16px'
                }
              }}
            />
          </Stack>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 2 }}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">To</Text>
            <Select
              data={destinationOptions}
              value={to}
              onChange={setTo}
              rightSection={<IconChevronDown size={16} />}
              styles={{
                input: {
                  backgroundColor: '#f5f7fa',
                  border: 'none',
                  padding: '12px 16px'
                }
              }}
            />
          </Stack>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 2 }}>
                          <TextInput
                            label="Departure Date"
                            type="date"
                            placeholder="mm/dd/yyyy"
                            leftSection={<IconCalendar size={20} />}
                            value={departure}
                            onChange={(e) => setDeparture(e.currentTarget.value)}
                            min={todayStr}
                            styles={{
                              input: {
                                backgroundColor: '#f5f7fa',
                                border: '1px solid #d1d5db',
                                '&:focus': {
                                  borderColor: '#284361'
                                }
                              },
                              label: {
                                fontSize: '14px',
                                color: '#6b7280',
                                marginBottom: '8px'
                              }
                            }}
                          />
                        </Grid.Col>
        
                        <Grid.Col span={{ base: 12, md: 2 }}>
                          <Box>
                            <Group justify="space-between" mb="xs">
                              <Text size="sm" c="#6b7280">Return Date</Text>
                              <Checkbox
                                label="Return"
                                checked={returnTrip}
                                onChange={(event) => setReturnTrip(event.currentTarget.checked)}
                                size="sm"
                                styles={{
                                  label: {
                                    fontSize: '14px',
                                    color: '#6b7280'
                                  }
                                }}
                              />
                            </Group>
                            <TextInput
                              type="date"
                              placeholder="mm/dd/yyyy"
                              disabled={!returnTrip}
                              leftSection={<IconCalendar size={20} />}
                              value={ret}
                              onChange={(e) => setRet(e.currentTarget.value)}
                              min={todayStr}
                              styles={{
                                input: {
                                  backgroundColor: '#f5f7fa',
                                  border: '1px solid #d1d5db',
                                  '&:focus': {
                                    borderColor: '#284361'
                                  },
                                  '&:disabled': {
                                    opacity: 0.5
                                  }
                                }
                              }}
                            />
                          </Box>
                        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 2 }} ref={passengerRef}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">Passengers</Text>
            <div style={{ position: 'relative' }}>
              <Button
                variant="subtle"
                color="gray"
                fullWidth
                justify="space-between"
                leftSection={<IconUsers size={16} />}
                rightSection={<IconChevronDown size={16} />}
                onClick={() => setShowPassengerSelector(!showPassengerSelector)}
                styles={{
                  root: {
                    backgroundColor: '#f5f7fa',
                    border: 'none',
                    padding: '12px 16px',
                    height: 'auto',
                    color: '#111827'
                  },
                  inner: { justifyContent: 'space-between' },
                  section: { marginLeft: 0, marginRight: 0 }
                }}
              >
                {getPassengerText()}
              </Button>
              
              {showPassengerSelector && (
                <div style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  marginTop: 8, 
                  zIndex: 50 
                }}>
                  <PassengerSelector
                    initialCounts={passengers}
                    onDone={handlePassengerDone}
                  />
                </div>
              )}
            </div>
          </Stack>
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, md: 2 }} style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button
            fullWidth
            size="md"
            style={{
              backgroundColor: '#284361',
              ':hover': { backgroundColor: '#1f3349' }
            }}
            onClick={triggerSearch}
          >
            Search
          </Button>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
