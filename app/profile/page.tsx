"use client";

import React, { useEffect, useState } from 'react';
import { Box, Text, LoadingOverlay } from '@mantine/core';
import { Header } from '@/components/layout/header';
// import { Sidebar } from '@/components/profile/Sidebar';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { supabase } from '@/lib/supabase/client';

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [initial, setInitial] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const email = session.user.email || '';
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUserId(data.id);
        setInitial({
          id: data.id,
          fullName: data.fullName || '',
          email: data.email || '',
          dateOfBirth: data.dob || '',
          nationality: data.nationality || '',
          nationalId: data.nationalId || '',
          currency: data.currency || 'USD',
          language: data.language || 'en',
        });
      }
      setLoading(false);
    };
    load();
  }, []);
  return (
    <Box style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      <Box component="main" style={{ padding: 32 }}>
        <Box>
          <Text style={{ fontSize: 30, fontWeight: 700, color: '#284361', marginBottom: 8 }}>
            My Profile
          </Text>
          <Text style={{ color: '#6b7280', marginBottom: 32 }}>
            Manage your account and preferences easily.
          </Text>
          <Box style={{ position: 'relative' }}>
            <LoadingOverlay visible={loading} />
            <ProfileForm
              initialValues={initial || undefined}
              onSubmit={async (values) => {
                if (!userId) return;
                const payload = {
                  userId,
                  fullName: values.fullName,
                  dob: values.dateOfBirth,
                  nationality: values.nationality,
                  nationalId: values.nationalId,
                  currency: values.currency,
                  language: values.language,
                };
                await fetch('/api/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                });
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
