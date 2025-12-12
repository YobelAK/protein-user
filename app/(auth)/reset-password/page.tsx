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
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setReady(!!session);
        if (!session) {
          setMessage('Link reset tidak valid atau sudah kedaluwarsa.');
        }
      } catch {
        setReady(false);
        setMessage('Terjadi kesalahan saat memproses tautan reset.');
      }
    };
    check();
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
              <Button type="submit" styles={{ root: { backgroundColor: '#284361' } }} disabled={!ready || submitting}>{submitting ? 'Menyimpan...' : 'Simpan password'}</Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  );
}

