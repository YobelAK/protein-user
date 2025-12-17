"use client";

import React, { useEffect, useState } from 'react';
import { Box, Paper, Stack, Title, Text, TextInput, Button } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          let code = '';
          let accessToken = '';
          let refreshToken = '';
          try {
            const loc = typeof window !== 'undefined' ? window.location : null;
            if (loc) {
              const qs = new URLSearchParams(loc.search || '');
              const hs = new URLSearchParams((loc.hash || '').startsWith('#') ? (loc.hash || '').slice(1) : (loc.hash || ''));
              code = qs.get('code') || hs.get('code') || '';
              accessToken = qs.get('access_token') || hs.get('access_token') || '';
              refreshToken = qs.get('refresh_token') || hs.get('refresh_token') || '';
            }
          } catch {}
          if (code && typeof (supabase as any)?.auth?.exchangeCodeForSession === 'function') {
            const { error } = await (supabase as any).auth.exchangeCodeForSession(code);
            if (error) {
              setReady(false);
              setMessage('Tautan reset tidak valid atau sudah kedaluwarsa.');
              return;
            }
          } else if (accessToken && refreshToken && typeof (supabase as any)?.auth?.setSession === 'function') {
            const { error } = await (supabase as any).auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (error) {
              setReady(false);
              setMessage('Tautan reset tidak valid atau sudah kedaluwarsa.');
              return;
            }
          }
        }
        const { data: { session: s2 } } = await (supabase as any).auth.getSession();
        setReady(!!s2);
        if (!s2) {
          setMessage('Link reset tidak valid atau sudah kedaluwarsa.');
        }
      } catch {
        setReady(false);
        setMessage('Terjadi kesalahan saat memproses tautan reset.');
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!ready) return;
    if (!password || password.length < 6) {
      setMessage('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirm) {
      setMessage('Konfirmasi password tidak sama.');
      return;
    }
    try {
      setSubmitting(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message || 'Gagal mengubah password');
      } else {
        setMessage('Password berhasil diubah. Silakan login kembali.');
        setTimeout(() => { router.replace('/login'); }, 1500);
      }
    } catch (ex: any) {
      setMessage(ex?.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', padding: 32 }}>
      <Paper shadow="sm" radius="lg" p="xl" bg="white" style={{ width: '100%', maxWidth: 480 }}>
        <Stack gap="md">
          <Title order={2} size="xl" fw={700} c="#284361">Reset Password</Title>
          <Text c="#6b7280">Masukkan password baru untuk akun Anda.</Text>
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput type="password" value={password} onChange={(e) => setPassword(e.currentTarget.value)} placeholder="Password baru" required />
              <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)} placeholder="Konfirmasi password" required />
              {message && <Text style={{ color: message.includes('berhasil') ? '#10b981' : '#ef4444' }}>{message}</Text>}
              <Button type="submit" styles={{ root: { backgroundColor: '#284361' } }} disabled={!ready || submitting} loading={submitting}>{submitting ? 'Menyimpan...' : 'Simpan password'}</Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}
