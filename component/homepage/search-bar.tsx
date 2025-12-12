'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Tabs, 
  Select, 
  TextInput, 
  Button, 
  Grid, 
  Text, 
  Checkbox, 
  Group,
  Stack
} from '@mantine/core';
import { 
  IconCalendar, 
  IconUsers, 
  IconSearch, 
  IconMapPin,
  IconChevronDown
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { PassengerSelector, PassengerCounts } from '@/components/layout/passengerselector';

type Option = { value: string; label: string };

export function SearchBar({ fromOptions = [], toOptions = [] }: { fromOptions?: Option[]; toOptions?: Option[] }) {
  const [activeTab, setActiveTab] = useState('speedboat');
  const [returnTrip, setReturnTrip] = useState(false);
  const router = useRouter();

  const [from, setFrom] = useState<string | null>(fromOptions[0]?.value ?? null);
  const [to, setTo] = useState<string | null>(toOptions[0]?.value ?? null);
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }, []);
  const [departure, setDeparture] = useState<string>(todayStr);
  const [ret, setRet] = useState<string>('');
  const [showPassengerSelector, setShowPassengerSelector] = useState(false);
  const passengerRef = useRef<HTMLDivElement>(null);
  const [passengerCounts, setPassengerCounts] = useState<PassengerCounts>({ adult: 2, child: 0, infant: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (passengerRef.current && !passengerRef.current.contains(event.target as Node)) {
        setShowPassengerSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleDepartureChange = (value: string) => {
    setDeparture(value || todayStr);
  };

  const handleSearch = () => {
    if (returnTrip) {
      try { localStorage.removeItem('rt_inbound_selected'); } catch {}
      try { localStorage.removeItem('rt_passengers'); } catch {}
    } else {
      try { localStorage.removeItem('rt_outbound_selected'); } catch {}
      try { localStorage.removeItem('rt_inbound_selected'); } catch {}
      try { localStorage.removeItem('rt_passengers'); } catch {}
    }
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (departure) params.set('departure', departure);
    if (returnTrip && ret) params.set('return', ret);
    const totalPassengers = passengerCounts.adult + passengerCounts.child + passengerCounts.infant;
    if (totalPassengers > 0) params.set('passengers', String(totalPassengers));
    router.push(`/speedboat?${params.toString()}`);
  };

  const getPassengerText = () => {
    const total = passengerCounts.adult + passengerCounts.child + passengerCounts.infant;
    if (total === 0) return 'Select passengers';
    const parts: string[] = [];
    if (passengerCounts.adult > 0) parts.push(`${passengerCounts.adult} Adult${passengerCounts.adult > 1 ? 's' : ''}`);
    if (passengerCounts.child > 0) parts.push(`${passengerCounts.child} Child${passengerCounts.child > 1 ? 'ren' : ''}`);
    if (passengerCounts.infant > 0) parts.push(`${passengerCounts.infant} Infant${passengerCounts.infant > 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  return (
    <Box style={{ backgroundColor: '#f8f9fa', padding: '64px 0' }}>
      <Container size="xl" style={{ marginTop: '-80px', position: 'relative', zIndex: 10 }}>
        <Paper 
          shadow="xl" 
          radius="xl" 
          p="xl"
          style={{ backgroundColor: 'white' }}
        >
          <Tabs 
            value={activeTab} 
            onChange={(value) => value && setActiveTab(value)}
            styles={{
              tab: {
                fontWeight: 500,
                color: '#6b7280'
              }
            }}
          >
            <Tabs.List>
              <Tabs.Tab value="speedboat">Speedboat</Tabs.Tab>
              {/* <Tabs.Tab value="watersport">Watersport & Tour</Tabs.Tab>
              <Tabs.Tab value="beachclub">Beach Club</Tabs.Tab> */}
            </Tabs.List>


          {/* jangan dihapus <div className="flex gap-4 mb-6 border-b">
            <button 
              onClick={() => setActiveTab('speedboat')} 
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'speedboat' 
                  ? 'border-b-2 border-[#284361] text-[#284361]' 
                  : 'text-gray-600 hover:text-[#284361]'
              }`}
            >
              Speedboat
            </button>
            <button 
              onClick={() => setActiveTab('watersport')} 
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'watersport' 
                  ? 'border-b-2 border-[#284361] text-[#284361]' 
                  : 'text-gray-600 hover:text-[#284361]'
              }`}
            >
              Watersport & Tour
            </button>
            <button 
              onClick={() => setActiveTab('beachclub')} 
              className={`pb-3 px-4 font-medium transition-colors ${
                activeTab === 'beachclub' 
                  ? 'border-b-2 border-[#284361] text-[#284361]' 
                  : 'text-gray-600 hover:text-[#284361]'
              }`}
            >
              Beach Club
            </button>
          </div> */}

            <Tabs.Panel value="speedboat">
              <Grid mt="md">
                <Grid.Col span={{ base: 12, md: 1.5 }}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">From</Text>
                    <Select
                      data={fromOptions}
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

                <Grid.Col span={{ base: 12, md: 1.5 }}>
                  <Stack gap="xs">
                    <Text size="sm" c="dimmed">To</Text>
                    <Select
                      data={toOptions}
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
                    onChange={(e) => handleDepartureChange(e.currentTarget.value)}
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
                        onChange={(event) => { const checked = event.currentTarget.checked; setReturnTrip(checked); if (!checked) setRet(''); }}
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
                            border: '1px solid #d1d5db',
                            padding: '12px 16px',
                            height: 'auto',
                            color: '#111827'
                          },
                          inner: { justifyContent: 'space-between' }
                        }}
                      >
                        {getPassengerText()}
                      </Button>
                      {showPassengerSelector && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, zIndex: 50 }}>
                          <PassengerSelector
                            initialCounts={passengerCounts}
                            onDone={(c) => { setPassengerCounts(c); setShowPassengerSelector(false); }}
                          />
                        </div>
                      )}
                    </div>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 2 }} style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button
                    fullWidth
                    leftSection={<IconSearch size={20} />}
                    style={{
                      backgroundColor: '#284361',
                      '&:hover': {
                        backgroundColor: '#1f3349'
                      }
                    }}
                    onClick={handleSearch}
                  >
                    Search
                  </Button>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="watersport">
              <Grid mt="md">
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Location"
                    placeholder="Select Location"
                    leftSection={<IconMapPin size={20} />}
                    data={[
                      { value: 'sanur', label: 'Sanur' },
                      { value: 'nusa-dua', label: 'Nusa Dua' },
                      { value: 'tanjung-benoa', label: 'Tanjung Benoa' }
                    ]}
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

                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Activity"
                    placeholder="Select Activity"
                    data={[
                      { value: 'jet-ski', label: 'Jet Ski' },
                      { value: 'parasailing', label: 'Parasailing' },
                      { value: 'banana-boat', label: 'Banana Boat' },
                      { value: 'flyboard', label: 'Flyboard' }
                    ]}
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

                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Date"
                    type="date"
                    placeholder="mm/dd/yyyy"
                    leftSection={<IconCalendar size={20} />}
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

                <Grid.Col span={{ base: 12, md: 3 }} style={{ display: 'flex', alignItems: 'end' }}>
                  <Button
                    fullWidth
                    leftSection={<IconSearch size={20} />}
                    style={{
                      backgroundColor: '#284361',
                      '&:hover': {
                        backgroundColor: '#1e3a52'
                      }
                    }}
                  >
                    Search Watersports
                  </Button>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            <Tabs.Panel value="beachclub">
              <Grid mt="md">
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Location"
                    placeholder="Select Location"
                    leftSection={<IconMapPin size={20} />}
                    data={[
                      { value: 'seminyak', label: 'Seminyak' },
                      { value: 'canggu', label: 'Canggu' },
                      { value: 'uluwatu', label: 'Uluwatu' }
                    ]}
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

                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Date"
                    type="date"
                    placeholder="mm/dd/yyyy"
                    leftSection={<IconCalendar size={20} />}
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

                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Guests"
                    placeholder="Select Guests"
                    leftSection={<IconUsers size={20} />}
                    data={[
                      { value: '1', label: '1 Guest' },
                      { value: '2', label: '2 Guests' },
                      { value: '3+', label: '3+ Guests' }
                    ]}
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

                <Grid.Col span={{ base: 12, md: 3 }} style={{ display: 'flex', alignItems: 'end' }}>
                  <Button
                    fullWidth
                    leftSection={<IconSearch size={20} />}
                    style={{
                      backgroundColor: '#284361',
                      '&:hover': {
                        backgroundColor: '#1f3349'
                      }
                    }}
                  >
                    Search Beach Clubs
                  </Button>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Container>
    </Box>
  );
}
