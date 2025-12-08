'use client';

import React, { useMemo, useState } from 'react';
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
  Group 
} from '@mantine/core';
import { 
  IconCalendar, 
  IconUsers, 
  IconSearch, 
  IconMapPin 
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

type Option = { value: string; label: string };

export function SearchBar({ fromOptions = [], toOptions = [] }: { fromOptions?: Option[]; toOptions?: Option[] }) {
  const [activeTab, setActiveTab] = useState('speedboat');
  const [returnTrip, setReturnTrip] = useState(false);
  const router = useRouter();

  const [from, setFrom] = useState<string | null>(fromOptions[0]?.value ?? null);
  const [to, setTo] = useState<string | null>(toOptions[0]?.value ?? null);
  const [departure, setDeparture] = useState<string>('');
  const [ret, setRet] = useState<string>('');
  const [passengers, setPassengers] = useState<string>('2');

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (departure) params.set('departure', departure);
    if (returnTrip && ret) params.set('return', ret);
    if (passengers) params.set('passengers', passengers);
    router.push(`/speedboat?${params.toString()}`);
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
                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Select
                    label="From"
                    placeholder="Select departure"
                    leftSection={<IconMapPin size={20} />}
                    data={fromOptions}
                    value={from}
                    onChange={setFrom}
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
                  <Select
                    label="To"
                    placeholder="Select destination"
                    leftSection={<IconMapPin size={20} />}
                    data={toOptions}
                    value={to}
                    onChange={setTo}
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

                <Grid.Col span={{ base: 12, md: 2 }}>
                  <Select
                    label="Passengers"
                    placeholder="Select passengers"
                    leftSection={<IconUsers size={20} />}
                    data={[
                      { value: '1', label: '1 Adult' },
                      { value: '2', label: '2 Adult' },
                      { value: '3', label: '3 Adult' },
                      { value: '4', label: '4 Adult' }
                    ]}
                    value={passengers}
                    onChange={(v) => setPassengers(v || '2')}
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

                <Grid.Col span={{ base: 12, md: 2 }} style={{ display: 'flex', alignItems: 'end' }}>
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
