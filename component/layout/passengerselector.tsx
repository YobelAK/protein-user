"use client";

import React, { useState } from 'react';
import { Paper, Stack, Group, Text, ActionIcon, Button } from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';

export interface PassengerCounts {
  adult: number;
  child: number;
  infant: number;
}

export function PassengerSelector({
  onDone,
  initialCounts = { adult: 2, child: 0, infant: 0 },
  minAdults = 1,
  maxAdults = 20,
  minChildren = 0,
  maxChildren = 10,
  minInfants = 0,
  maxInfants = 10,
  'data-id': dataId,
}: {
  onDone?: (counts: PassengerCounts) => void;
  initialCounts?: PassengerCounts;
  minAdults?: number;
  maxAdults?: number;
  minChildren?: number;
  maxChildren?: number;
  minInfants?: number;
  maxInfants?: number;
  'data-id'?: string;
}) {
  const [counts, setCounts] = useState<PassengerCounts>({
    adult: Math.max(minAdults, initialCounts.adult),
    child: Math.max(minChildren, initialCounts.child),
    infant: Math.max(minInfants, initialCounts.infant),
  });

  const dec = (key: keyof PassengerCounts, min: number) => {
    setCounts((prev) => ({ ...prev, [key]: Math.max(min, prev[key] - 1) }));
  };
  const inc = (key: keyof PassengerCounts, max: number) => {
    setCounts((prev) => ({ ...prev, [key]: Math.min(max, prev[key] + 1) }));
  };

  const done = () => { onDone?.(counts); };

  return (
    <Paper
      data-id={dataId}
      shadow="lg"
      radius="xl"
      p="lg"
      style={{ width: '100%', maxWidth: 384 }}
      role="dialog"
      aria-label="Select number of passengers"
    >
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="md" fw={500} c="dark">Adult</Text>
            <Text size="xs" c="dimmed">Age 12 and over</Text>
          </Stack>
          <Group gap="md" align="center">
            <ActionIcon
              onClick={() => dec('adult', minAdults)}
              variant="light"
              color="gray"
              size="md"
              radius="xl"
              aria-label="Decrease adult count"
              disabled={counts.adult <= minAdults}
            >
              <IconMinus size={18} />
            </ActionIcon>
            <Text size="md" fw={500} c="dark" style={{ minWidth: 28, textAlign: 'center' }}>
              {counts.adult}
            </Text>
            <ActionIcon
              onClick={() => inc('adult', maxAdults)}
              variant="light"
              color="gray"
              size="md"
              radius="xl"
              aria-label="Increase adult count"
              disabled={counts.adult >= maxAdults}
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <Group justify="space-between" align="center">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="md" fw={500} c="dark">Child</Text>
            <Text size="xs" c="dimmed">Age 2-11</Text>
          </Stack>
          <Group gap="md" align="center">
            <ActionIcon
              onClick={() => dec('child', minChildren)}
              variant="light"
              color="gray"
              size="md"
              radius="xl"
              aria-label="Decrease child count"
              disabled={counts.child <= minChildren}
            >
              <IconMinus size={18} />
            </ActionIcon>
            <Text size="md" fw={500} c="dark" style={{ minWidth: 28, textAlign: 'center' }}>
              {counts.child}
            </Text>
            <ActionIcon
              onClick={() => inc('child', maxChildren)}
              variant="light"
              color="gray"
              size="md"
              radius="xl"
              aria-label="Increase child count"
              disabled={counts.child >= maxChildren}
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <Group justify="space-between" align="center">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="md" fw={500} c="dark">Infant</Text>
            <Text size="xs" c="dimmed">Below 2 years old</Text>
          </Stack>
          <Group gap="md" align="center">
            <ActionIcon
              onClick={() => dec('infant', minInfants)}
              variant="light"
              color="gray"
              size="md"
              radius="xl"
              aria-label="Decrease infant count"
              disabled={counts.infant <= minInfants}
            >
              <IconMinus size={18} />
            </ActionIcon>
            <Text size="md" fw={500} c="dark" style={{ minWidth: 28, textAlign: 'center' }}>
              {counts.infant}
            </Text>
            <ActionIcon
              onClick={() => inc('infant', maxInfants)}
              variant="light"
              color="gray"
              size="md"
              radius="xl"
              aria-label="Increase infant count"
              disabled={counts.infant >= maxInfants}
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Group>
        </Group>

        <Group justify="flex-end" pt="md">
          <Button
            onClick={done}
            variant="light"
            color="#284361"
            size="md"
            px="lg"
            style={{ backgroundColor: '#e8f1f5', color: '#284361' }}
            aria-label="Confirm passenger selection"
          >
            Done
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
