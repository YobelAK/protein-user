import React, { useEffect, useState } from 'react';
import { Paper, Title, Grid, Select, TextInput, Checkbox, Text, Group, Stack, Box } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';

type Passenger = {
  id: number;
  label: string;
  title: string;
  firstName: string;
  lastName: string;
  nationality: string;
  identityType: string;
  idNumber: string;
  ageCategory: string;
  isMainContact: boolean;
};

type PassengerField = keyof Omit<Passenger, 'id' | 'label'>;

interface PassengerFormProps {
  guestCount: number;
  onChange?: (passengers: Passenger[]) => void;
  mainContactName?: string;
}

export function PassengerForm({ guestCount, onChange, mainContactName }: PassengerFormProps) {
  const createDefaultPassenger = (index: number): Passenger => ({
    id: index + 1,
    label: `Adult ${index + 1}`,
    title: 'Mr',
    firstName: '',
    lastName: '',
    nationality: 'Indonesia',
    identityType: 'KTP',
    idNumber: '',
    ageCategory: 'Adult',
    isMainContact: false
  });

  const [passengers, setPassengers] = useState<Passenger[]>(Array.from({ length: Math.max(1, guestCount) }, (_, i) => createDefaultPassenger(i)));

  useEffect(() => {
    const count = Math.max(1, guestCount);
    setPassengers((prev) => {
      if (prev.length === count) return prev;
      if (prev.length < count) {
        const add = Array.from({ length: count - prev.length }, (_, i) => createDefaultPassenger(prev.length + i));
        return [...prev, ...add];
      }
      return prev.slice(0, count);
    });
  }, [guestCount]);

  useEffect(() => {
    if (onChange) {
      onChange(passengers);
    }
  }, [passengers, onChange]);

  useEffect(() => {
    setPassengers((prev) => {
      if (prev.length === 0) return prev;
      const p0 = prev[0];
      if (!p0.isMainContact) return prev;
      const parts = String(mainContactName || '').trim().split(' ');
      const first = parts[0] || '';
      const last = parts.slice(1).join(' ') || '';
      const updated = { ...p0, firstName: first, lastName: last };
      return [updated, ...prev.slice(1)];
    });
  }, [mainContactName]);

  const handleChange = <K extends PassengerField>(id: number, field: K, value: Passenger[K]) => {
    setPassengers((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <Paper shadow="sm" p="xl" radius="lg" bg="white">
      <Title order={2} size="lg" fw={600} c="#284361" mb="xl">
        Passenger Information
      </Title>

      <Stack gap="xl">
        {passengers.map((passenger, index) => (
          <Box key={passenger.id}>
            <Group align="center" mb="md">
              <Title order={3} size="sm" fw={500} c="#1a1a1a">
                {passenger.label}
              </Title>
            </Group>

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Title"
                  data={["Mr", "Mrs", "Ms"]}
                  value={passenger.title}
                  onChange={(value) => value && handleChange(passenger.id, 'title', value)}
                  size="sm"
                  rightSection={<IconChevronDown size={12} />}
                  styles={{
                    input: {
                      fontSize: '14px',
                      color: '#1a1a1a',
                      backgroundColor: 'white',
                      borderColor: '#d1d5db',
                      '&:focus': {
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="First Name"
                  placeholder="First name"
                  value={passenger.firstName}
                  onChange={(e) => handleChange(passenger.id, 'firstName', e.currentTarget.value)}
                  size="sm"
                  styles={{
                    input: {
                      fontSize: '14px',
                      color: '#1a1a1a',
                      backgroundColor: 'white',
                      borderColor: '#d1d5db',
                      '&:focus': {
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 3 }}>
                <TextInput
                  label="Last Name"
                  placeholder="Last name"
                  value={passenger.lastName}
                  onChange={(e) => handleChange(passenger.id, 'lastName', e.currentTarget.value)}
                  size="sm"
                  styles={{
                    input: {
                      fontSize: '14px',
                      color: '#1a1a1a',
                      backgroundColor: 'white',
                      borderColor: '#d1d5db',
                      '&:focus': {
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Nationality"
                  data={["Indonesia", "Malaysia", "Singapore"]}
                  value={passenger.nationality}
                  onChange={(value) => value && handleChange(passenger.id, 'nationality', value)}
                  size="sm"
                  rightSection={<IconChevronDown size={12} />}
                  styles={{
                    input: {
                      fontSize: '14px',
                      color: '#1a1a1a',
                      backgroundColor: 'white',
                      borderColor: '#d1d5db',
                      '&:focus': {
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Identity Type"
                  data={["KTP", "Passport", "SIM"]}
                  value={passenger.identityType}
                  onChange={(value) => value && handleChange(passenger.id, 'identityType', value)}
                  size="sm"
                  rightSection={<IconChevronDown size={12} />}
                  styles={{
                    input: {
                      fontSize: '14px',
                      color: '#1a1a1a',
                      backgroundColor: 'white',
                      borderColor: '#d1d5db',
                      '&:focus': {
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="ID Number"
                  placeholder="ID number"
                  value={passenger.idNumber}
                  onChange={(e) => handleChange(passenger.id, 'idNumber', e.currentTarget.value)}
                  size="sm"
                  styles={{
                    input: {
                      fontSize: '14px',
                      color: '#1a1a1a',
                      backgroundColor: 'white',
                      borderColor: '#d1d5db',
                      '&:focus': {
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, md: 3 }}>
                <Select
                  label="Age Category"
                  data={["Adult", "Child", "Infant"]}
                  value={passenger.ageCategory}
                  onChange={(value) => value && handleChange(passenger.id, 'ageCategory', value)}
                  size="sm"
                  rightSection={<IconChevronDown size={12} />}
                  styles={{
                    input: {
                      fontSize: '14px',
                      color: '#1a1a1a',
                      backgroundColor: 'white',
                      borderColor: '#d1d5db',
                      '&:focus': {
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
              </Grid.Col>
            </Grid>

            {index === 0 && (
              <Checkbox
                label="Same as main contact"
                size="sm"
                checked={passenger.isMainContact}
                onChange={(e) => {
                  const checked = e.currentTarget.checked;
                  setPassengers((prev) => prev.map((p) => (p.id === passenger.id ? { ...p, isMainContact: checked } : p)));
                  if (checked) {
                    const parts = String(mainContactName || '').trim().split(' ');
                    const first = parts[0] || '';
                    const last = parts.slice(1).join(' ') || '';
                    setPassengers((prev) => prev.map((p) => (p.id === passenger.id ? { ...p, firstName: first, lastName: last } : p)));
                  }
                }}
                style={{ marginTop: 16 }}
                styles={{
                  label: { 
                    fontSize: '12px', 
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }
                }}
              />
            )}
          </Box>
        ))}
      </Stack>

      <Text size="xs" c="#6b7280" mt="md">
        Passenger names must match ID or passport
      </Text>
    </Paper>
  );
}
