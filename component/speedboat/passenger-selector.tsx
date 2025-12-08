import React, { useState } from 'react';
import { 
  Paper, 
  Stack, 
  Group, 
  Text, 
  ActionIcon, 
  Button 
} from '@mantine/core';
import { IconMinus, IconPlus } from '@tabler/icons-react';

interface PassengerSelectorProps {
  onDone?: (passengers: PassengerCounts) => void;
  initialCounts?: PassengerCounts;
  'data-id'?: string;
}

export interface PassengerCounts {
  adult: number;
  child: number;
  infant: number;
}

export const PassengerSelector: React.FC<PassengerSelectorProps> = ({
  onDone,
  initialCounts = {
    adult: 2,
    child: 0,
    infant: 0
  },
  'data-id': dataId
}) => {
  const [counts, setCounts] = useState<PassengerCounts>(initialCounts);

  const handleIncrement = (type: keyof PassengerCounts) => {
    setCounts(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  const handleDecrement = (type: keyof PassengerCounts) => {
    setCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1)
    }));
  };

  const handleDone = () => {
    onDone?.(counts);
  };

  return (
    <Paper 
      data-id={dataId}
      shadow="lg"
      radius="xl"
      p="xl"
      style={{ width: '100%', maxWidth: 448 }}
      role="dialog"
      aria-label="Select number of passengers"
    >
      <Stack gap="xl">
        {/* Adult */}
        <Group justify="space-between" align="center">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="lg" fw={500} c="dark">Adult</Text>
            <Text size="sm" c="dimmed">Age 12 and over</Text>
          </Stack>
          <Group gap="md" align="center">
            <ActionIcon
              onClick={() => handleDecrement('adult')}
              variant="light"
              color="gray"
              size="lg"
              radius="xl"
              aria-label="Decrease adult count"
              disabled={counts.adult === 0}
            >
              <IconMinus size={18} />
            </ActionIcon>
            <Text size="lg" fw={500} c="dark" style={{ minWidth: 32, textAlign: 'center' }}>
              {counts.adult}
            </Text>
            <ActionIcon
              onClick={() => handleIncrement('adult')}
              variant="light"
              color="gray"
              size="lg"
              radius="xl"
              aria-label="Increase adult count"
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Child */}
        <Group justify="space-between" align="center">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="lg" fw={500} c="dark">Child</Text>
            <Text size="sm" c="dimmed">Age 2-11</Text>
          </Stack>
          <Group gap="md" align="center">
            <ActionIcon
              onClick={() => handleDecrement('child')}
              variant="light"
              color="gray"
              size="lg"
              radius="xl"
              aria-label="Decrease child count"
              disabled={counts.child === 0}
            >
              <IconMinus size={18} />
            </ActionIcon>
            <Text size="lg" fw={500} c="dark" style={{ minWidth: 32, textAlign: 'center' }}>
              {counts.child}
            </Text>
            <ActionIcon
              onClick={() => handleIncrement('child')}
              variant="light"
              color="gray"
              size="lg"
              radius="xl"
              aria-label="Increase child count"
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Infant */}
        <Group justify="space-between" align="center">
          <Stack gap="xs" style={{ flex: 1 }}>
            <Text size="lg" fw={500} c="dark">Infant</Text>
            <Text size="sm" c="dimmed">Below 2 years old</Text>
          </Stack>
          <Group gap="md" align="center">
            <ActionIcon
              onClick={() => handleDecrement('infant')}
              variant="light"
              color="gray"
              size="lg"
              radius="xl"
              aria-label="Decrease infant count"
              disabled={counts.infant === 0}
            >
              <IconMinus size={18} />
            </ActionIcon>
            <Text size="lg" fw={500} c="dark" style={{ minWidth: 32, textAlign: 'center' }}>
              {counts.infant}
            </Text>
            <ActionIcon
              onClick={() => handleIncrement('infant')}
              variant="light"
              color="gray"
              size="lg"
              radius="xl"
              aria-label="Increase infant count"
            >
              <IconPlus size={18} />
            </ActionIcon>
          </Group>
        </Group>

        {/* Done Button */}
        <Group justify="flex-end" pt="md">
          <Button
            onClick={handleDone}
            variant="light"
            color="#284361"
            size="md"
            px="xl"
            style={{
              backgroundColor: '#e8f1f5',
              color: '#284361',
              ':hover': { backgroundColor: '#d0e5ed' }
            }}
            aria-label="Confirm passenger selection"
          >
            Done
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};