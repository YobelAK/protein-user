import React, { useEffect, useState } from 'react';
import { Paper, Title, Grid, Select, TextInput, Checkbox, Text, Group, Stack, Box, Autocomplete, Loader } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { supabase } from '@/lib/supabase/client';

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
  initialCounts?: { adult: number; child: number; infant: number };
}

export function PassengerForm({ guestCount, onChange, mainContactName, initialCounts }: PassengerFormProps) {
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

  const createInitialPassengers = (counts?: { adult: number; child: number; infant: number }): Passenger[] => {
    const result: Passenger[] = [];
    const a = Math.max(0, counts?.adult ?? 0);
    const c = Math.max(0, counts?.child ?? 0);
    const i = Math.max(0, counts?.infant ?? 0);
    for (let idx = 0; idx < a; idx++) {
      result.push({
        id: result.length + 1,
        label: `Adult ${idx + 1}`,
        title: 'Mr',
        firstName: '',
        lastName: '',
        nationality: 'Indonesia',
        identityType: 'KTP',
        idNumber: '',
        ageCategory: 'Adult',
        isMainContact: false,
      });
    }
    for (let idx = 0; idx < c; idx++) {
      result.push({
        id: result.length + 1,
        label: `Child ${idx + 1}`,
        title: 'Mr',
        firstName: '',
        lastName: '',
        nationality: 'Indonesia',
        identityType: 'KTP',
        idNumber: '',
        ageCategory: 'Child',
        isMainContact: false,
      });
    }
    for (let idx = 0; idx < i; idx++) {
      result.push({
        id: result.length + 1,
        label: `Infant ${idx + 1}`,
        title: 'Mr',
        firstName: '',
        lastName: '',
        nationality: 'Indonesia',
        identityType: 'KTP',
        idNumber: '',
        ageCategory: 'Infant',
        isMainContact: false,
      });
    }
    if (result.length === 0) {
      return Array.from({ length: Math.max(1, guestCount) }, (_, idx) => createDefaultPassenger(idx));
    }
    return result;
  };

  const [passengers, setPassengers] = useState<Passenger[]>(createInitialPassengers(initialCounts));
  const [savedTravelers, setSavedTravelers] = useState<Array<{ id?: string; title?: string; firstName: string; lastName: string; nationality: string; identityType?: string; idNumber?: string; nationalId?: string; ageCategory?: string; age?: number }>>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    setPassengers((prev) => {
      const anyFilled = prev.some((p) => Boolean(p.firstName?.trim()) || Boolean(p.lastName?.trim()) || Boolean(p.idNumber?.trim()));
      if (anyFilled) return prev;
      const rebuilt = createInitialPassengers(initialCounts);
      return rebuilt;
    });
  }, [initialCounts]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const uidKey = (session.user.id || (session.user.email || '').trim().toLowerCase());
          let arr: any = (session.user as any).user_metadata?.savedTravelers || [];
          if (!Array.isArray(arr) || arr.length === 0) {
            try {
              const raw = typeof window !== 'undefined' ? localStorage.getItem(`saved_travelers:${uidKey}`) || '' : '';
              arr = raw ? JSON.parse(raw) : [];
            } catch { arr = []; }
          }
          if (Array.isArray(arr)) {
            setSavedTravelers(arr.map((t: any) => ({
              id: t?.id,
              title: String(t?.title || 'Mr'),
              firstName: String(t?.firstName || ''),
              lastName: String(t?.lastName || ''),
              nationality: String(t?.nationality || 'Indonesia'),
              identityType: String(t?.identityType || 'KTP'),
              idNumber: String(t?.idNumber || t?.nationalId || ''),
              nationalId: String(t?.nationalId || ''),
              ageCategory: String(t?.ageCategory || (typeof t?.age === 'number' ? (t.age >= 12 ? 'Adult' : t.age >= 2 ? 'Child' : 'Infant') : 'Adult')),
              age: typeof t?.age === 'number' ? t.age : undefined,
            })));
          } else {
            setSavedTravelers([]);
          }
        } else {
          setSavedTravelers([]);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const handleChange = <K extends PassengerField>(id: number, field: K, value: Passenger[K]) => {
    setPassengers((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  return (
    <Paper shadow="sm" p="xl" radius="lg" bg="white" style={{ position: 'relative' }}>
      {loading && (
        <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 10 }}>
          <Loader color="#284361" />
        </Box>
      )}
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
                required
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
              <Autocomplete
                label="First Name"
                placeholder="First name"
                data={savedTravelers.map((t) => t.firstName).filter(Boolean)}
                value={passenger.firstName}
                onChange={(val) => handleChange(passenger.id, 'firstName', val)}
                onOptionSubmit={(val) => {
                  const t = savedTravelers.find((s) => String(s.firstName || '').toLowerCase() === String(val || '').toLowerCase());
                  if (t) {
                    setPassengers((prev) => prev.map((p) => (
                      p.id === passenger.id
                        ? {
                            ...p,
                            title: t.title ? String(t.title) : p.title,
                            firstName: t.firstName || '',
                            lastName: t.lastName || '',
                            nationality: t.nationality ? String(t.nationality) : p.nationality,
                            identityType: t.identityType ? String(t.identityType) : p.identityType,
                            idNumber: t.idNumber || t.nationalId || p.idNumber,
                            ageCategory: t.ageCategory ? String(t.ageCategory) : (typeof t.age === 'number' ? (t.age >= 12 ? 'Adult' : t.age >= 2 ? 'Child' : 'Infant') : p.ageCategory),
                          }
                        : p
                    )));
                  }
                }}
                size="sm"
                required
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
                // required
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
                data={["Indonesia", "Malaysia", "Singapore", "Thailand", "Philippines"]}
                value={passenger.nationality}
                onChange={(value) => value && handleChange(passenger.id, 'nationality', value)}
                size="sm"
                rightSection={<IconChevronDown size={12} />}
                required
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
                required
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
                required
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
                required
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
                  } else {
                    setPassengers((prev) => prev.map((p) => (p.id === passenger.id ? { ...p, firstName: '', lastName: '' } : p)));
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
