'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Paper, Grid, Stack, Text, Select, TextInput, Checkbox, Group, Button, Box } from '@mantine/core';
import { IconChevronDown, IconCalendar, IconUsers } from '@tabler/icons-react';
import { PassengerSelector, PassengerCounts } from '@/components/layout/passengerselector';

type Option = { value: string; label: string };

export function SearchBar({
  originOptions = [],
  destinationOptions = [],
  initialFrom = null,
  initialTo = null,
  initialDeparture = '',
  initialReturn = '',
  initialPassengers = 2,
  inboundMode = false,
  onSearch,
  onReturnToggle,
  onFromChange,
  onToChange,
  onDepartureChange,
  onReturnDateChange,
  onPassengersChange,
}: {
  originOptions?: Option[];
  destinationOptions?: Option[];
  initialFrom?: string | null;
  initialTo?: string | null;
  initialDeparture?: string;
  initialReturn?: string;
  initialPassengers?: number;
  inboundMode?: boolean;
  onSearch?: (params: { from: string | null; to: string | null; departure?: string; return?: string; passengers?: number }) => void;
  onReturnToggle?: (checked: boolean, params: { from: string | null; to: string | null; departure?: string; return?: string; passengers?: number }) => void;
  onFromChange?: (params: { from: string | null; to: string | null; departure?: string; return?: string; passengers?: number }) => void;
  onToChange?: (params: { from: string | null; to: string | null; departure?: string; return?: string; passengers?: number }) => void;
  onDepartureChange?: (params: { from: string | null; to: string | null; departure?: string; return?: string; passengers?: number }) => void;
  onReturnDateChange?: (params: { from: string | null; to: string | null; departure?: string; return?: string; passengers?: number }) => void;
  onPassengersChange?: (params: { from: string | null; to: string | null; departure?: string; return?: string; passengers?: number }) => void;
}) {
  const [returnTrip, setReturnTrip] = useState(Boolean(initialReturn));
  const [showPassengerSelector, setShowPassengerSelector] = useState(false);
  const [from, setFrom] = useState<string | null>(initialFrom);
  const [to, setTo] = useState<string | null>(initialTo);
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }, []);
  const [departure, setDeparture] = useState<string>(initialDeparture || todayStr);
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

  useEffect(() => {
    setFrom(initialFrom ?? null);
  }, [initialFrom]);

  useEffect(() => {
    setTo(initialTo ?? null);
  }, [initialTo]);

  useEffect(() => {
    if (inboundMode) {
      try {
        const raw = typeof window !== 'undefined' ? (localStorage.getItem('rt_outbound_selected') || '') : '';
        const obj = raw ? JSON.parse(raw) : null;
        const dep = String(obj?.departureDate || initialDeparture || todayStr);
        setDeparture(dep);
      } catch {
        setDeparture(initialDeparture || todayStr);
      }
    } else {
      setDeparture(initialDeparture || todayStr);
    }
  }, [initialDeparture, todayStr, inboundMode]);

  useEffect(() => {
    setRet(initialReturn);
    setReturnTrip(Boolean(initialReturn));
  }, [initialReturn]);

  useEffect(() => {
    if (inboundMode) {
      setReturnTrip(true);
      setRet(initialReturn);
    }
  }, [inboundMode, initialReturn, todayStr]);

  useEffect(() => {
    setPassengers({ adult: Math.max(1, Number(initialPassengers || 2)), child: 0, infant: 0 });
  }, [initialPassengers]);

  const handlePassengerDone = (newPassengers: PassengerCounts) => {
    setPassengers(newPassengers);
    setShowPassengerSelector(false);
    const total = newPassengers.adult + newPassengers.child + newPassengers.infant;
    const dep = departure;
    const retParam = returnTrip ? ret : undefined;
    onPassengersChange?.({ from, to, departure: dep, return: retParam, passengers: total });
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

  const handleDepartureChange = (value: string) => {
    setDeparture(value || todayStr);
    const dep = (value || todayStr);
    const total = passengers.adult + passengers.child + passengers.infant;
    const retParam = returnTrip ? ret : undefined;
    onDepartureChange?.({ from, to, departure: dep, return: retParam, passengers: total });
  };

  const triggerSearch = () => {
    try { localStorage.removeItem('rt_outbound_selected'); } catch {}
    try { localStorage.removeItem('rt_inbound_selected'); } catch {}
    try { localStorage.removeItem('rt_passengers'); } catch {}
    const total = passengers.adult + passengers.child + passengers.infant;
    const dep = inboundMode ? ret : departure;
    onSearch?.({ from, to, departure: dep, return: returnTrip ? ret : undefined, passengers: total });
  };

  return (
    <Paper shadow="sm" radius="lg" p="xl" bg="white">
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 1.5 }}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">From</Text>
            <Select
              data={originOptions}
              value={from}
              onChange={(v) => { setFrom(v); const total = passengers.adult + passengers.child + passengers.infant; const dep = departure; const retParam = returnTrip ? ret : undefined; onFromChange?.({ from: v, to, departure: dep, return: retParam, passengers: total }); }}
              disabled={false}
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
        
        <Grid.Col span={{ base: 12, md: 1.5 }}>
          <Stack gap="xs">
            <Text size="sm" c="dimmed">To</Text>
            <Select
              data={destinationOptions}
              value={to}
              onChange={(v) => { setTo(v); const total = passengers.adult + passengers.child + passengers.infant; const dep = departure; const retParam = returnTrip ? ret : undefined; onToChange?.({ from, to: v, departure: dep, return: retParam, passengers: total }); }}
              disabled={false}
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
            onChange={(e) => handleDepartureChange(e.currentTarget.value)}
            min={todayStr}
            disabled={false}
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
                                disabled={false}
                                onChange={(event) => { const checked = event.currentTarget.checked; setReturnTrip(checked); if (!checked) setRet(''); const total = passengers.adult + passengers.child + passengers.infant; const dep = inboundMode ? ret : departure; onReturnToggle?.(checked, { from, to, departure: dep, return: checked ? ret : undefined, passengers: total }); }}
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
                              onChange={(e) => { const val = e.currentTarget.value; setRet(val); const total = passengers.adult + passengers.child + passengers.infant; const depEff = inboundMode ? val : departure; onReturnDateChange?.({ from, to, departure: depEff, return: returnTrip ? val : undefined, passengers: total }); }}
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
        
        <Grid.Col span={{ base: 12, md: 3 }} ref={passengerRef}>
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
            disabled
          >
            Search
          </Button>
        </Grid.Col>
      </Grid>
    </Paper>
  );
}
