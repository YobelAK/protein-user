import React from 'react';
import { Paper, Stack, Title, Group, Text, Divider, Button } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

interface PassengerInfo {
  nationality: string;
  ageCategory: string;
}

interface BookingSummaryProps {
  trip: string;
  departureDate: string;
  passengersList: PassengerInfo[];
  passengerSubtotal: number;
  portFee: number;
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
  onContinue?: () => void;
}

export function BookingSummary({
  trip,
  departureDate,
  passengersList,
  passengerSubtotal,
  portFee,
  addOns = [],
  nextStep = '/speedboat/book/addons',
  nextStepLabel = 'Continue',
  showContinueButton = true,
  buttonText,
  onContinue,
}: BookingSummaryProps) {
  const addOnsTotal = addOns.reduce((total, addOn) => total + addOn.price, 0);
  const totalPrice = passengerSubtotal + portFee + addOnsTotal;

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

        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Text size="sm" c="dimmed">Trip</Text>
            <Text size="sm" fw={500} c="dark" ta="right">
              {trip}
            </Text>
          </Group>
          <Group justify="space-between" align="flex-start">
            <Text size="sm" c="dimmed">Departure Date</Text>
            <Text size="sm" fw={500} c="dark">
              {departureDate}
            </Text>
          </Group>
          <Stack gap="xs">
            {passengersList.map((p, idx) => (
              <Group key={`${idx}-${p.nationality}-${p.ageCategory}`} justify="space-between" align="flex-start">
                <Text size="sm" c="dimmed">Passenger {idx + 1}</Text>
                <Text size="sm" fw={500} c="dark">{p.nationality}, {p.ageCategory}</Text>
              </Group>
            ))}
          </Stack>
        </Stack>

        <Divider />

        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Text size="sm" c="#374151">Passengers</Text>
            <Text size="sm" fw={500} c="dark">IDR {passengerSubtotal.toLocaleString()}</Text>
          </Group>
          <Group justify="space-between" align="center">
            <Text size="sm" c="#374151">Port Fee</Text>
            <Text size="sm" fw={500} c="dark">IDR {portFee.toLocaleString()}</Text>
          </Group>
          {addOns.map((addOn) => (
            <Group key={addOn.id} justify="space-between" align="center">
              <Text size="sm" c="#374151">{addOn.title}</Text>
              <Text size="sm" fw={500} c="dark">IDR {addOn.price.toLocaleString()}</Text>
            </Group>
          ))}
        </Stack>

        <Divider />

        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text size="md" fw={600} c="dark">Total</Text>
            <Text size="lg" fw={700} c="dark">IDR {totalPrice.toLocaleString()}</Text>
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
