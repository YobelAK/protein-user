import React from 'react';
import { Paper, Stack, Title, Group, Text, Divider, Button, Box } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

interface PassengerInfo {
  nationality: string;
  ageCategory: string;
}

interface BookingSummaryProps {
  trip: string;
  categoryName?: string;
  departureTime?: string;
  departureDate?: string;
  arrivalTime?: string;
  boat?: { name?: string; code?: string; capacity?: number; duration?: string };
  vendorName?: string;
  passengersList: PassengerInfo[];
  passengerSubtotal: number;
  portFee: number;
  inventoryDate?: string;
  availableUnits?: number;
  segments?: Array<{
    title?: string;
    origin: string;
    destination: string;
    departureTime?: string;
    departureDate?: string;
    arrivalTime?: string;
    boat?: { name?: string; code?: string; capacity?: number; duration?: string };
    vendorName?: string;
    inventoryDate?: string;
    availableUnits?: number;
    capacity?: number;
    priceIdr?: number;
  }>;
  addOns?: Array<{
    id: string;
    title: string;
    price: number;
    originalPrice?: number;
  }>;
  nextStep?: string;
  nextStepLabel?: string;
  showContinueButton?: boolean;
  buttonText?: string;
  continueDisabled?: boolean;
  onContinue?: () => void;
  continueLoading?: boolean;
  currency?: 'IDR' | 'USD';
}

export function BookingSummary({
  trip,
  categoryName,
  departureTime,
  departureDate,
  arrivalTime,
  boat,
  vendorName,
  passengersList,
  passengerSubtotal,
  portFee,
  inventoryDate,
  availableUnits,
  segments = [],
  addOns = [],
  nextStep = '/fastboat/book/addons',
  nextStepLabel = 'Continue',
  showContinueButton = true,
  buttonText,
  continueDisabled,
  onContinue,
  continueLoading,
  currency = 'IDR',
}: BookingSummaryProps) {
  const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0);
  const effectivePortFee = currency === 'USD' ? 1 : portFee;
  const totalPrice = passengerSubtotal + effectivePortFee + addOnsTotal;
  const formatNumber = (n: number) => new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'id-ID', currency === 'USD' ? { minimumFractionDigits: 2 } : undefined).format(n);
  const currencyLabel = currency === 'USD' ? 'USD' : 'IDR';

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <Paper shadow="sm" radius="lg" bg="white" p="xl" style={{ position: 'sticky', top: 24 }}>
      <Stack gap="xl">
        <Title order={2} size="lg" fw={600} c="dark">
          Booking Summary
        </Title>

        <Box visibleFrom="md">
          {segments && segments.length > 0 ? (
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Text size="sm" c="dimmed">Trip</Text>
                <Text size="sm" fw={500} c="dark" ta="right">{trip}</Text>
              </Group>
              {segments.map((seg, idx) => (
                <Paper key={idx} radius="md" p="md" withBorder>
                  <Stack gap="xs">
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">{seg.title || 'Segment'}</Text>
                      <Text size="sm" fw={500} c="dark">{seg.origin} → {seg.destination}</Text>
                    </Group>
                    {(seg.departureDate || seg.inventoryDate) && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Departure Date</Text>
                        <Text size="sm" fw={500} c="dark">{seg.departureDate || seg.inventoryDate}</Text>
                      </Group>
                    )}
                    {(seg.departureTime || seg.departureDate) && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Departure Time</Text>
                        <Text size="sm" fw={500} c="dark">{seg.departureTime || ''}</Text>
                      </Group>
                    )}
                    {seg.arrivalTime && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Arrival Time</Text>
                        <Text size="sm" fw={500} c="dark">{seg.arrivalTime}</Text>
                      </Group>
                    )}
                    
                    {seg.boat && (seg.boat.name || seg.boat.code || seg.boat.duration || seg.boat.capacity != null) && (
                      <Stack gap="xs">
                        <Group justify="space-between" align="flex-start">
                          <Text size="sm" c="dimmed">Boat</Text>
                          <Text size="sm" fw={500} c="dark">{seg.boat.name || '-'}</Text>
                        </Group>
                        {seg.vendorName && (
                          <Group justify="space-between" align="flex-start">
                            <Text size="sm" c="dimmed">Vendor</Text>
                            <Text size="sm" fw={500} c="dark">{seg.vendorName}</Text>
                          </Group>
                        )}
                        {seg.boat.code && (
                          <Group justify="space-between" align="flex-start">
                            <Text size="sm" c="dimmed">Code</Text>
                            <Text size="sm" fw={500} c="dark">{seg.boat.code}</Text>
                          </Group>
                        )}
                        {seg.boat.duration && (
                          <Group justify="space-between" align="flex-start">
                            <Text size="sm" c="dimmed">Duration</Text>
                            <Text size="sm" fw={500} c="dark">{seg.boat.duration}</Text>
                          </Group>
                        )}
                      </Stack>
                    )}
                    {(
                      typeof seg.capacity === 'number' ||
                      (seg.boat && typeof seg.boat.capacity === 'number')
                    ) && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Capacity</Text>
                        <Text size="sm" fw={500} c="dark">
                          {typeof seg.capacity === 'number' ? seg.capacity : (seg.boat?.capacity ?? '')}
                        </Text>
                      </Group>
                    )}
                    {typeof seg.availableUnits === 'number' && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Available Units</Text>
                        <Text size="sm" fw={500} c="dark">{seg.availableUnits}</Text>
                      </Group>
                    )}
                  </Stack>
                </Paper>
              ))}
              <Stack gap="xs">
                {passengersList.map((p, idx) => (
                  <Group key={`${idx}-${p.nationality}-${p.ageCategory}`} justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">Passenger {idx + 1}</Text>
                    <Text size="sm" fw={500} c="dark">{p.nationality}, {p.ageCategory}</Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Stack gap="md">
              {categoryName && (
                <Group justify="space-between" align="flex-start">
                  <Text size="sm" c="dimmed">Category</Text>
                  <Text size="sm" fw={500} c="dark">{categoryName}</Text>
                </Group>
              )}
              <Group justify="space-between" align="flex-start">
                <Text size="sm" c="dimmed">Trip</Text>
                <Text size="sm" fw={500} c="dark" ta="right">{trip}</Text>
              </Group>
              {inventoryDate && (
                <Group justify="space-between" align="flex-start">
                  <Text size="sm" c="dimmed">Departure Date</Text>
                  <Text size="sm" fw={500} c="dark">{inventoryDate}</Text>
                </Group>
              )}
              <Group justify="space-between" align="flex-start">
                <Text size="sm" c="dimmed">Departure Time</Text>
                <Text size="sm" fw={500} c="dark">{departureTime || ''}</Text>
              </Group>
              {arrivalTime && (
                <Group justify="space-between" align="flex-start">
                  <Text size="sm" c="dimmed">Arrival Time</Text>
                  <Text size="sm" fw={500} c="dark">{arrivalTime}</Text>
                </Group>
              )}
              {boat && (boat.name || boat.code || boat.duration || boat.capacity != null) && (
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">Boat</Text>
                    <Text size="sm" fw={500} c="dark">{boat.name || '-'}</Text>
                  </Group>
                  {vendorName && (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">Vendor</Text>
                      <Text size="sm" fw={500} c="dark">{vendorName}</Text>
                    </Group>
                  )}
                  {boat.code && (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">Code</Text>
                      <Text size="sm" fw={500} c="dark">{boat.code}</Text>
                    </Group>
                  )}
                  {boat.duration && (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">Duration</Text>
                      <Text size="sm" fw={500} c="dark">{boat.duration}</Text>
                    </Group>
                  )}
                  {typeof boat.capacity === 'number' && (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">Capacity</Text>
                      <Text size="sm" fw={500} c="dark">{boat.capacity}</Text>
                    </Group>
                  )}
                </Stack>
              )}
              <Stack gap="xs">
                {passengersList.map((p, idx) => (
                  <Group key={`${idx}-${p.nationality}-${p.ageCategory}`} justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">Passenger {idx + 1}</Text>
                    <Text size="sm" fw={500} c="dark">{p.nationality}, {p.ageCategory}</Text>
                  </Group>
                ))}
                {typeof availableUnits === 'number' && (
                  <Group justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">Available Units</Text>
                    <Text size="sm" fw={500} c="dark">{availableUnits}</Text>
                  </Group>
                )}
              </Stack>
            </Stack>
          )}
        </Box>

        <Box hiddenFrom="md">
          {segments && segments.length > 0 ? (
            <Stack gap="md">
              <Group justify="space-between" align="flex-start">
                <Text size="sm" c="dimmed">Trip</Text>
                <Text size="sm" fw={500} c="dark" ta="right">{trip}</Text>
              </Group>
              {segments.map((seg, idx) => (
                <Paper key={idx} radius="md" p="md" withBorder>
                  <Stack gap="xs">
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">{seg.title || 'Segment'}</Text>
                      <Text size="sm" fw={500} c="dark">{seg.origin} → {seg.destination}</Text>
                    </Group>
                    {(seg.departureDate || seg.inventoryDate) && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Departure Date</Text>
                        <Text size="sm" fw={500} c="dark">{seg.departureDate || seg.inventoryDate}</Text>
                      </Group>
                    )}
                    {(seg.departureTime || seg.departureDate) && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Departure Time</Text>
                        <Text size="sm" fw={500} c="dark">{seg.departureTime || ''}</Text>
                      </Group>
                    )}
                    {seg.arrivalTime && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Arrival Time</Text>
                        <Text size="sm" fw={500} c="dark">{seg.arrivalTime}</Text>
                      </Group>
                    )}
                    {seg.boat && (seg.boat.name || seg.boat.code || seg.boat.duration || seg.boat.capacity != null) && (
                      <Stack gap="xs">
                        <Group justify="space-between" align="flex-start">
                          <Text size="sm" c="dimmed">Boat</Text>
                          <Text size="sm" fw={500} c="dark">{seg.boat.name || '-'}</Text>
                        </Group>
                        {seg.vendorName && (
                          <Group justify="space-between" align="flex-start">
                            <Text size="sm" c="dimmed">Vendor</Text>
                            <Text size="sm" fw={500} c="dark">{seg.vendorName}</Text>
                          </Group>
                        )}
                        {seg.boat.code && (
                          <Group justify="space-between" align="flex-start">
                            <Text size="sm" c="dimmed">Code</Text>
                            <Text size="sm" fw={500} c="dark">{seg.boat.code}</Text>
                          </Group>
                        )}
                        {seg.boat.duration && (
                          <Group justify="space-between" align="flex-start">
                            <Text size="sm" c="dimmed">Duration</Text>
                            <Text size="sm" fw={500} c="dark">{seg.boat.duration}</Text>
                          </Group>
                        )}
                      </Stack>
                    )}
                    {(
                      typeof seg.capacity === 'number' ||
                      (seg.boat && typeof seg.boat.capacity === 'number')
                    ) && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Capacity</Text>
                        <Text size="sm" fw={500} c="dark">
                          {typeof seg.capacity === 'number' ? seg.capacity : (seg.boat?.capacity ?? '')}
                        </Text>
                      </Group>
                    )}
                    {typeof seg.availableUnits === 'number' && (
                      <Group justify="space-between" align="flex-start">
                        <Text size="sm" c="dimmed">Available Units</Text>
                        <Text size="sm" fw={500} c="dark">{seg.availableUnits}</Text>
                      </Group>
                    )}
                  </Stack>
                </Paper>
              ))}
              <Stack gap="xs">
                {passengersList.map((p, idx) => (
                  <Group key={`${idx}-${p.nationality}-${p.ageCategory}`} justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">Passenger {idx + 1}</Text>
                    <Text size="sm" fw={500} c="dark">{p.nationality}, {p.ageCategory}</Text>
                  </Group>
                ))}
              </Stack>
            </Stack>
          ) : (
            <Stack gap="md">
              {categoryName && (
                <Group justify="space-between" align="flex-start">
                  <Text size="sm" c="dimmed">Category</Text>
                  <Text size="sm" fw={500} c="dark">{categoryName}</Text>
                </Group>
              )}
              <Group justify="space-between" align="flex-start">
                <Text size="sm" c="dimmed">Trip</Text>
                <Text size="sm" fw={500} c="dark" ta="right">{trip}</Text>
              </Group>
              {inventoryDate && (
                <Group justify="space-between" align="flex-start">
                  <Text size="sm" c="dimmed">Departure Date</Text>
                  <Text size="sm" fw={500} c="dark">{inventoryDate}</Text>
                </Group>
              )}
              <Group justify="space-between" align="flex-start">
                <Text size="sm" c="dimmed">Departure Time</Text>
                <Text size="sm" fw={500} c="dark">{departureTime || ''}</Text>
              </Group>
              {arrivalTime && (
                <Group justify="space-between" align="flex-start">
                  <Text size="sm" c="dimmed">Arrival Time</Text>
                  <Text size="sm" fw={500} c="dark">{arrivalTime}</Text>
                </Group>
              )}
              {boat && (boat.name || boat.code || boat.duration || boat.capacity != null) && (
                <Stack gap="xs">
                  <Group justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">Boat</Text>
                    <Text size="sm" fw={500} c="dark">{boat.name || '-'}</Text>
                  </Group>
                  {vendorName && (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">Vendor</Text>
                      <Text size="sm" fw={500} c="dark">{vendorName}</Text>
                    </Group>
                  )}
                  {boat.code && (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">Code</Text>
                      <Text size="sm" fw={500} c="dark">{boat.code}</Text>
                    </Group>
                  )}
                  {boat.duration && (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">Duration</Text>
                      <Text size="sm" fw={500} c="dark">{boat.duration}</Text>
                    </Group>
                  )}
                  {typeof boat.capacity === 'number' && (
                    <Group justify="space-between" align="flex-start">
                      <Text size="sm" c="dimmed">Capacity</Text>
                      <Text size="sm" fw={500} c="dark">{boat.capacity}</Text>
                    </Group>
                  )}
                </Stack>
              )}
              <Stack gap="xs">
                {passengersList.map((p, idx) => (
                  <Group key={`${idx}-${p.nationality}-${p.ageCategory}`} justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">Passenger {idx + 1}</Text>
                    <Text size="sm" fw={500} c="dark">{p.nationality}, {p.ageCategory}</Text>
                  </Group>
                ))}
                {typeof availableUnits === 'number' && (
                  <Group justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">Available Units</Text>
                    <Text size="sm" fw={500} c="dark">{availableUnits}</Text>
                  </Group>
                )}
              </Stack>
            </Stack>
          )}
        </Box>

        <Divider />

        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text size="sm" c="#374151">Passengers</Text>
            <Text size="sm" fw={500} c="dark">{currencyLabel} {formatNumber(passengerSubtotal)}</Text>
          </Group>
          <Group justify="space-between" align="center">
            <Text size="sm" c="#374151">Port Fee</Text>
            <Text size="sm" fw={500} c="dark">{currencyLabel} {formatNumber(effectivePortFee)}</Text>
          </Group>
          {addOns.map((addOn) => (
            <Group key={addOn.id} justify="space-between" align="center">
              <Text size="sm" c="#374151">{addOn.title}</Text>
              <Text size="sm" fw={500} c="dark">{currencyLabel} {formatNumber(addOn.price)}</Text>
            </Group>
          ))}
        </Stack>

        <Divider />

        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text size="md" fw={600} c="dark">Total</Text>
            <Text size="lg" fw={700} c="dark">{currencyLabel} {formatNumber(totalPrice)}</Text>
          </Group>
        </Stack>

        {showContinueButton && (
          <>
            {onContinue ? (
              <Button
                onClick={handleContinue}
                fullWidth
                size="md"
                radius="lg"
                rightSection={<IconChevronRight size={20} />}
                styles={{
                  root: {
                    backgroundColor: '#284361',
                    '&:hover': { backgroundColor: '#0075ff' },
                    fontWeight: 600,
                    padding: '12px 24px'
                  }
                }}
                disabled={!!continueDisabled}
                loading={!!continueLoading}
              >
                {buttonText || nextStepLabel}
              </Button>
            ) : (
              <Link href={nextStep}>
                <Button
                  fullWidth
                  size="md"
                  radius="lg"
                  rightSection={<IconChevronRight size={20} />}
                  styles={{
                    root: {
                      backgroundColor: '#284361',
                      '&:hover': { backgroundColor: '#0075ff' },
                      fontWeight: 600,
                      padding: '12px 24px'
                    }
                  }}
                  disabled={!!continueDisabled}
                  loading={!!continueLoading}
                >
                  {buttonText || nextStepLabel}
                </Button>
              </Link>
            )}
          </>
        )}
      </Stack>
    </Paper>
  );
}
