"use client";

import React, { useEffect, useState } from 'react';
import { Box, Text, LoadingOverlay, Alert, Container, Modal } from '@mantine/core';
import { Header } from '@/components/layout/header';
// import { Sidebar } from '@/components/profile/Sidebar';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [initial, setInitial] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [requireName, setRequireName] = useState(false);
  const [isGoogle, setIsGoogle] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        router.replace('/login?redirectTo=/profile');
        return;
      }
      const uid = session.user.id || '';
      const email = session.user.email || '';
      try {
        const identities = Array.isArray((session.user as any)?.identities) ? (session.user as any).identities : [];
        const hasGoogleIdentity = identities.some((i: any) => String(i?.provider || '').toLowerCase() === 'google');
        const appMeta = (session.user as any)?.app_metadata || {};
        const prov = String(appMeta?.provider || '').toLowerCase();
        const provs = Array.isArray(appMeta?.providers) ? appMeta.providers.map((p: any) => String(p || '').toLowerCase()) : [];
        setIsGoogle(hasGoogleIdentity || prov === 'google' || provs.includes('google'));
      } catch {}
      const query = email ? `email=${encodeURIComponent(email)}` : `userId=${encodeURIComponent(uid)}`;
      let data: any = null;
      const res = await fetch(`/api/profile?${query}`, { cache: 'no-store' });
      if (res.ok) {
        data = await res.json();
      } else {
        const full = (session.user as any)?.user_metadata?.full_name || '';
        await fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid, email, role: 'CUSTOMER', fullName: full || undefined }),
        });
        const res2 = await fetch(`/api/profile?${query}`, { cache: 'no-store' });
        if (res2.ok) data = await res2.json();
      }
      if (data) {
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
          avatarUrl: data.avatarUrl || '',
        });
        if (!data.fullName) setRequireName(true);
      } else {
        const full = (session.user as any)?.user_metadata?.full_name || '';
        setUserId(uid);
        setInitial({ id: uid, fullName: full || '', email, dateOfBirth: '', nationality: '', nationalId: '', currency: 'USD', language: 'en', avatarUrl: '' });
        setRequireName(!full);
      }
      setLoading(false);
    };
    load();
  }, []);
  useEffect(() => {
    if (saveStatus === 'success') {
      const t = setTimeout(() => setSaveStatus('idle'), 1800);
      return () => clearTimeout(t);
    }
  }, [saveStatus]);
  return (
    <Box style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      <Box component="main">
        <Container size="xl" py="xl">
          <Text style={{ fontSize: 30, fontWeight: 700, color: '#284361', marginBottom: 8 }}>
            My Profile
          </Text>
          <Text style={{ color: '#6b7280', marginBottom: 32 }}>
            Manage your account and preferences easily.
          </Text>
          
          <Box style={{ position: 'relative' }}>
            <LoadingOverlay visible={loading} />
            <Modal opened={saveStatus === 'success'} onClose={() => setSaveStatus('idle')} centered withCloseButton>
              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <svg width="96" height="96" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="#e8f7f0" />
                  <path d="M28 52 L44 68 L74 38" stroke="#2dbe8d" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="100" strokeDashoffset="100">
                    <animate attributeName="stroke-dashoffset" from="100" to="0" dur="0.8s" fill="freeze" />
                  </path>
                </svg>
                <Text fw={700} c="#0f5132">Changes saved</Text>
              </Box>
            </Modal>
            {saveStatus === 'error' && (
              <Alert color="red" mb={16} title="Failed">
                Failed to update profile
              </Alert>
            )}
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
                try {
                  const res = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  setSaveStatus(res.ok ? 'success' : 'error');
                  if (res.ok && (values.fullName || '').trim()) setRequireName(false);
                } catch {
                  setSaveStatus('error');
                }
              }}
            />
            <Modal opened={requireName} onClose={() => setRequireName(false)} centered withCloseButton>
              <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Text fw={700} c="#842029">Complete your profile</Text>
                <Text c="#6b7280" ta="center">Please enter your full name to continue.</Text>
              </Box>
            </Modal>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
