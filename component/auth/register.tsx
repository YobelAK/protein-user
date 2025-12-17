'use client';

import React, { useEffect, useState } from 'react';
import { Box, Group, Text, Anchor, Checkbox, Button, Paper, Stack, Title, TextInput, ActionIcon } from '@mantine/core';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthRegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);
  const redirectParam = (() => {
    try {
      const raw = searchParams.get('redirectTo') || '';
      if (raw) {
        const decoded = decodeURIComponent(raw);
        return decoded || '/';
      }
      let fallback = '/';
      try {
        const ref = typeof document !== 'undefined' ? document.referrer || '' : '';
        if (ref && typeof window !== 'undefined') {
          const u = new URL(ref);
          if (u.origin === window.location.origin) {
            fallback = `${u.pathname}${u.search}`;
          }
        }
      } catch {}
      if (fallback === '/') {
        try {
          const last = typeof window !== 'undefined' ? (localStorage.getItem('last_path') || '') : '';
          if (last) fallback = last;
        } catch {}
      }
      return fallback || '/';
    } catch { return '/'; }
  })();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session) {
        const raw = searchParams.get('redirectTo') || '/';
        const r = raw ? decodeURIComponent(raw) : '/';
        router.replace(r || '/');
      }
    })();
    const { data: sub } = (supabase as any).auth.onAuthStateChange((_event: any, s: any) => {
      if (s) {
        const raw = searchParams.get('redirectTo') || '/';
        const r = raw ? decodeURIComponent(raw) : '/';
        router.replace(r || '/');
      }
    });
    return () => { active = false; try { sub?.subscription?.unsubscribe?.(); } catch {} };
  }, []);

  const createInitialSvg = (letter: string) => {
    const L = (letter || 'N').slice(0, 1).toUpperCase();
    return `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">` +
      `<defs><style>@font-face{font-family:Inter;src:local('Inter');font-weight:700}</style></defs>` +
      `<rect width="256" height="256" rx="128" fill="#284361"/>` +
      `<text x="50%" y="50%" dy="12" text-anchor="middle" fill="#ffffff" font-size="120" font-weight="700" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto">${L}</text>` +
      `</svg>`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (registerSubmitting) return;
    setRegisterSubmitting(true);
    if (!agree) {
      setError('Anda harus menyetujui syarat & ketentuan');
      setRegisterSubmitting(false);
      return;
    }
    const normalizedEmail = (email || '').trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '');
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError(`Email address "${email}" is invalid`);
      setRegisterSubmitting(false);
      return;
    }
    const { data, error: err } = await supabase.auth.signUp({ email: normalizedEmail, password });
    if (err) {
      const msg = String(err.message || 'Registrasi gagal');
      if (/exist|already/i.test(msg)) {
        setError('Email sudah terdaftar');
      } else {
        setError(msg);
      }
      setRegisterSubmitting(false);
      return;
    }

    try {
      const publicId = crypto.randomUUID();
      const prefix = (normalizedEmail || '').split('@')[0] || '';
      const svg = createInitialSvg(prefix);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const bucket = 'avatars';
      const path = `${publicId}/avatar-initial.svg`;
      await supabase.storage.from(bucket).upload(path, blob, { upsert: true, contentType: 'image/svg+xml' });
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      const avatarUrl = urlData.publicUrl;
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: publicId, email: normalizedEmail, role: 'CUSTOMER', avatarUrl }),
      });
    } catch (_) {}
    const raw = searchParams.get('redirectTo') || '/';
    const r = raw ? decodeURIComponent(raw) : '/';
    setRegisterSubmitting(false);
    router.push(r || '/');
  };

  const handleGoogleRegister = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL;
      if (!base) {
        setError('Konfigurasi redirect URL belum diset (NEXT_PUBLIC_SUPABASE_REDIRECT_URL)');
        return;
      }
      const raw = searchParams.get('redirectTo') || '/';
      const rto = encodeURIComponent(raw ? decodeURIComponent(raw) : '/');
      const redirectTo = `${base}/register?auth_flow=register&redirectTo=${rto}`;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { prompt: 'select_account' },
        },
      });
    } catch (err) {
      setError('Gagal registrasi dengan Google');
    }
  };

  return (
    <Box style={{ minHeight: '100vh', display: 'flex' }}>
      <Box visibleFrom="md" style={{ width: '50%', minHeight: '100vh', backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#ffffff' }}>
        <Box style={{ width: '100%', maxWidth: 480 }}>
          <Box mb={32}>
            <Title order={2} style={{ fontWeight: 700, color: '#111827' }}>Caspla Bali</Title>
          </Box>
          <Box mb={32}>
            <Title order={2} style={{ fontSize: 32, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Welcome Back</Title>
            <Text style={{ color: '#6b7280' }}>Login to your Caspla Dashboard</Text>
          </Box>
          <Paper radius="md" p={0} style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}>
            <form onSubmit={handleSubmit}>
              <Stack gap={24}>
                <div>
                  <Text component="label" htmlFor="email" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 8 }}>Email Address</Text>
                  <TextInput id="email" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} placeholder="Enter your email" required styles={{ input: { padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8 } }} />
                </div>
                <div>
                  <Text component="label" htmlFor="password" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 8 }}>Password</Text>
                  <TextInput id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.currentTarget.value)} placeholder="Create a password" required rightSection={<ActionIcon aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)} variant="subtle" color="gray">{showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}</ActionIcon>} styles={{ input: { padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8, paddingRight: 48 } }} />
                </div>
                <Group justify="space-between" align="center">
                  <Checkbox checked={agree} onChange={(e) => setAgree(e.currentTarget.checked)} label={<Text style={{ fontSize: 14, color: '#111827' }}>I agree to Terms & Privacy</Text>} styles={{ input: { borderColor: '#d1d5db' }, label: { cursor: 'pointer' } }} />
                  <Anchor href={`/login?redirectTo=${encodeURIComponent(redirectParam || '/')}`} style={{ fontSize: 14, color: '#111827' }}>Already have an account?</Anchor>
                </Group>
                {error && <Text style={{ color: '#ef4444' }}>{error}</Text>}
                <Button type="submit" fullWidth styles={{ root: { backgroundColor: '#284361', height: 44, fontWeight: 600 } }} loading={registerSubmitting}>Create Account</Button>
                <Box style={{ textAlign: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#6b7280' }}>Or Register With</Text>
                </Box>
                <Button type="button" fullWidth variant="outline" styles={{ root: { height: 44, borderColor: '#d1d5db' } }} onClick={handleGoogleRegister}>
                  <Group justify="center" gap={12}>
                    <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 20, height: 20 }} />
                    <Text style={{ color: '#111827', fontWeight: 500 }}>Continue with Google</Text>
                  </Group>
                </Button>
                <Text style={{ marginTop: 24, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>
                  Have an account? {" "}
                  <Anchor href={`/login?redirectTo=${encodeURIComponent(redirectParam || '/')}`} style={{ color: '#284361', fontWeight: 600 }}>Login now</Anchor>
                </Text>
              </Stack>
            </form>
          </Paper>
          <Text style={{ marginTop: 32, textAlign: 'center', fontSize: 12, color: '#6b7280' }}>© 2025 Caspla Bali. All rights reserved.</Text>
        </Box>
      </Box>
    </Box>
  );
}
