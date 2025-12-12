"use client";
import React, { useEffect, useState } from 'react';
import { Box, Text, Group, Button, Container, Modal, TextInput, NumberInput, Stack, Select } from '@mantine/core';
import { Header } from '@/components/layout/header';
import { SavedTravelersTable } from '@/components/profile/SavedTravelersTable';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [travelers, setTravelers] = useState<Array<{ id?: string; title: string; firstName: string; lastName: string; nationality: string; identityType: string; idNumber: string; ageCategory: string; age?: number }>>([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState<number | string>('');
  const [nationality, setNationality] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [title, setTitle] = useState('Mr');
  const [identityType, setIdentityType] = useState('KTP');
  const [ageCategory, setAgeCategory] = useState('Adult');

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login?redirectTo=/profile/saved-travelers');
        return;
      }
      const uidKey = (session.user.id || (session.user.email || '').trim().toLowerCase());
      let arr: any = (session.user as any)?.user_metadata?.savedTravelers || [];
      if (!Array.isArray(arr) || arr.length === 0) {
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem(`saved_travelers:${uidKey}`) || '' : '';
          arr = raw ? JSON.parse(raw) : [];
        } catch { arr = []; }
      }
      if (Array.isArray(arr)) {
        setTravelers(arr.map((t: any) => ({
          id: t?.id,
          title: String(t?.title || 'Mr'),
          firstName: String(t?.firstName || ''),
          lastName: String(t?.lastName || ''),
          nationality: String(t?.nationality || 'Indonesia'),
          identityType: String(t?.identityType || 'KTP'),
          idNumber: String(t?.idNumber || t?.nationalId || ''),
          ageCategory: String(t?.ageCategory || (typeof t?.age === 'number' ? (t.age >= 12 ? 'Adult' : t.age >= 2 ? 'Child' : 'Infant') : 'Adult')),
          age: typeof t?.age === 'number' ? t.age : undefined,
        })));
      }
    };
    check();
  }, []);

  const persist = async (arr: Array<{ id?: string; title: string; firstName: string; lastName: string; nationality: string; identityType: string; idNumber: string; ageCategory: string; age?: number }>) => {
    setTravelers(arr);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uidKey = session?.user ? (session.user.id || (session.user.email || '').trim().toLowerCase()) : '';
      if (uidKey) {
        try { localStorage.setItem(`saved_travelers:${uidKey}`, JSON.stringify(arr)); } catch {}
      }
      if (session?.user?.id && typeof (supabase as any)?.auth?.updateUser === 'function') {
        await (supabase as any).auth.updateUser({ data: { savedTravelers: arr } });
      }
    } catch {}
  };

  const openAdd = () => {
    setEditingIndex(null);
    setTitle('Mr');
    setFirstName('');
    setLastName('');
    setAge('');
    setNationality('Indonesia');
    setIdentityType('KTP');
    setIdNumber('');
    setAgeCategory('Adult');
    setOpen(true);
  };

  const openEdit = (idx: number) => {
    const t = travelers[idx];
    setEditingIndex(idx);
    setTitle(t.title);
    setFirstName(t.firstName);
    setLastName(t.lastName);
    setAge(t.age || 0);
    setNationality(t.nationality);
    setIdentityType(t.identityType);
    setIdNumber(t.idNumber);
    setAgeCategory(t.ageCategory);
    setOpen(true);
  };

  const submit = async () => {
    const item = {
      id: editingIndex == null ? `${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : travelers[editingIndex]?.id,
      title: String(title || 'Mr'),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      age: Number(age || 0),
      nationality: nationality.trim(),
      identityType: String(identityType || 'KTP'),
      idNumber: idNumber.trim(),
      ageCategory: String(ageCategory || 'Adult'),
    };
    if (editingIndex == null) {
      await persist([...travelers, item]);
    } else {
      const next = travelers.slice();
      next[editingIndex] = item;
      await persist(next);
    }
    setOpen(false);
  };

  const remove = async (idx: number) => {
    const next = travelers.slice(0, idx).concat(travelers.slice(idx + 1));
    await persist(next);
  };
  return (
    <Box style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      <Box component="main">
        <Container size="xl" py="xl">
          <Group justify="space-between" align="flex-start" mb={24}>
            <Box>
              <Text style={{ fontSize: 30, fontWeight: 700, color: '#284361', marginBottom: 8 }}>
                Saved Travelers
              </Text>
              <Text style={{ color: '#6b7280' }}>
                Save your frequent travel companions for faster checkout.
              </Text>
            </Box>
            <Button
              styles={{
                root: {
                  paddingInline: 24,
                  paddingBlock: 12,
                  borderRadius: 8,
                  fontWeight: 600,
                  backgroundColor: '#284361',
                  color: '#ffffff',
                },
              }}
              onClick={openAdd}
            >
              <span style={{ fontSize: 18, marginRight: 8 }}>+</span>
              Add New Traveler
            </Button>
          </Group>

          <SavedTravelersTable
            travelers={travelers}
            onEdit={(_, i) => openEdit(i)}
            onDelete={(_, i) => remove(i)}
          />
        </Container>
      </Box>

      <Modal opened={open} onClose={() => setOpen(false)} title="Traveler" centered>
        <Stack>
          <Select label="Title" data={["Mr", "Mrs", "Ms"]} value={title} onChange={(val) => val && setTitle(val)} />
          <TextInput label="First Name" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required />
          <TextInput label="Last Name" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} />
          <NumberInput label="Age" placeholder="Age" value={age} onChange={setAge} min={0} clampBehavior="strict" />
          <Select label="Nationality" data={["Indonesia", "Malaysia", "Singapore"]} value={nationality} onChange={(val) => val && setNationality(val)} />
          <Select label="Identity Type" data={["KTP", "Passport", "SIM"]} value={identityType} onChange={(val) => val && setIdentityType(val)} />
          <TextInput label="ID Number" placeholder="ID number" value={idNumber} onChange={(e) => setIdNumber(e.currentTarget.value)} />
          <Select label="Age Category" data={["Adult", "Child", "Infant"]} value={ageCategory} onChange={(val) => val && setAgeCategory(val)} />
          <Group justify="flex-end">
            <Button styles={{ root: { backgroundColor: '#284361', fontWeight: 600 } }} onClick={submit}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
