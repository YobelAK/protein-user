'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Box, Paper, Group, Text, ActionIcon, Grid, Button, Select, TextInput, Modal, Stack, Tabs } from '@mantine/core';
import { Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useSetAuth, useAuth } from '@/app/providers';

type ProfileInitialValues = {
  id?: string;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  nationality?: string;
  nationalId?: string;
  currency?: string;
  language?: string;
  avatarUrl?: string;
};

export function ProfileForm(props: { initialValues?: ProfileInitialValues; onSubmit?: (values: ProfileInitialValues) => Promise<void> | void }) {
  const [formData, setFormData] = useState<ProfileInitialValues>({
    fullName: '',
    email: '',
    dateOfBirth: '',
    nationality: '',
    nationalId: '',
    currency: 'USD',
    language: 'en',
    avatarUrl: '',
  });

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [cpOpen, setCpOpen] = useState(false);
  const [cpEmail, setCpEmail] = useState<string>('');
  const [cpSubmitting, setCpSubmitting] = useState(false);
  const [cpMessage, setCpMessage] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState<'file' | 'url'>('file');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  const setAuth = useSetAuth();
  const auth = useAuth();
  const [avatarSrc, setAvatarSrc] = useState<string>('');
  const [isGoogle, setIsGoogle] = useState(false);

  // Avatar will be shown from database-only; fallback displays plain circle

  useEffect(() => {
    if (props.initialValues) {
      setFormData((prev) => ({
        ...prev,
        ...props.initialValues,
      }));
    }
  }, [props.initialValues]);
  useEffect(() => {
    const url = String(formData.avatarUrl || '');
    setAvatarSrc(url || '');
    const idx = url.indexOf('/storage/v1/object/public/avatars/');
    if (idx >= 0) {
      const path = url.slice(idx + '/storage/v1/object/public/avatars/'.length);
      if (path) {
        (async () => {
          try {
            const res = await (supabase as any).storage.from('avatars').createSignedUrl(path, 3600);
            const signed = res?.data?.signedUrl || '';
            if (signed) setAvatarSrc(signed);
          } catch {}
        })();
      }
    }
  }, [formData.avatarUrl]);
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const identities = Array.isArray((session?.user as any)?.identities) ? (session as any).user.identities : [];
        const appMeta = (session?.user as any)?.app_metadata || {};
        const prov = String(appMeta?.provider || '').toLowerCase();
        const provs = Array.isArray(appMeta?.providers) ? appMeta.providers.map((p: any) => String(p || '').toLowerCase()) : [];
        const hasGoogle = identities.some((i: any) => String(i?.provider || '').toLowerCase() === 'google') || prov === 'google' || provs.includes('google');
        setIsGoogle(!!hasGoogle);
      } catch {}
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (props.onSubmit) {
      await props.onSubmit(formData);
    }
  };

  const onPickFile = () => {
    setAvatarOpen(true);
    setAvatarTab('file');
    setAvatarMessage(null);
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const uid = String(formData.id || props.initialValues?.id || '');
    if (!uid) return;
    const ext = file.name.split('.')?.pop() || 'jpg';
    const path = `${uid}/avatar-${Date.now()}.${ext}`;
    const bucket = 'avatars';
    setAvatarMessage(null);
    setAvatarUploading(true);
    try {
      const storage = (supabase as any)?.storage;
      if (!storage || typeof storage.from !== 'function') {
        setAvatarMessage('Supabase belum dikonfigurasi');
        return;
      }
      const up = await storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
      if (up?.error) {
        setAvatarMessage(up.error.message || 'Gagal upload');
        return;
      }
      const urlData = storage.from(bucket).getPublicUrl(path);
      const publicUrl = urlData?.data?.publicUrl || '';
      setFormData((prev) => ({ ...prev, avatarUrl: publicUrl }));
      const resp = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, avatarUrl: publicUrl }),
      });
      setAvatarMessage(resp.ok ? 'Foto berhasil diperbarui' : 'Gagal menyimpan avatar');
      if (resp.ok) {
        setAvatarOpen(false);
        try { setAuth(auth ? ({ ...auth, avatarUrl: publicUrl }) : auth); } catch {}
      }
    } catch (ex: any) {
      setAvatarMessage(ex?.message || 'Terjadi kesalahan');
    } finally {
      setAvatarUploading(false);
    }
  };

  const onSubmitAvatarUrl = async () => {
    const raw = (avatarUrlInput || '').trim();
    const isValid = /^https?:\/\//i.test(raw);
    if (!isValid) {
      setAvatarMessage('URL tidak valid');
      return;
    }
    const uid = String(formData.id || props.initialValues?.id || '');
    if (!uid) return;
    setAvatarUploading(true);
    setAvatarMessage(null);
    try {
      const resp = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: uid, avatarUrl: raw }),
      });
      if (resp.ok) {
        setFormData((prev) => ({ ...prev, avatarUrl: raw }));
        setAvatarMessage('Foto berhasil diperbarui');
        setAvatarOpen(false);
        try { setAuth(auth ? ({ ...auth, avatarUrl: raw }) : auth); } catch {}
      } else {
        setAvatarMessage('Gagal menyimpan avatar');
      }
    } catch (ex: any) {
      setAvatarMessage(ex?.message || 'Terjadi kesalahan');
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <Paper component="form" onSubmit={handleSubmit} withBorder p={32} radius={16} style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff' }}>
      <Group align="flex-start" gap={24} mb={32} style={{ paddingBottom: 32, borderBottom: '1px solid #e5e7eb' }}>
        <Box style={{ position: 'relative' }}>
          <Box
            style={{
              width: 96,
              height: 96,
              borderRadius: '9999px',
              backgroundColor: '#284361',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 24,
            }}
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="avatar" style={{ width: 96, height: 96, borderRadius: '9999px', objectFit: 'cover' }} />
            ) : null}
          </Box>
          <ActionIcon
            aria-label="Upload photo"
            variant="filled"
            size={32}
            radius={9999}
            style={{ position: 'absolute', right: 0, bottom: 0, backgroundColor: '#2dbe8d' }}
            onClick={onPickFile}
          >
            <Camera size={16} color="#ffffff" />
          </ActionIcon>
          <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={onFileChange} />
          {avatarMessage && (
            <Text size="sm" style={{ marginTop: 8, color: avatarMessage.includes('berhasil') ? '#10b981' : '#ef4444' }}>{avatarMessage}</Text>
          )}
        </Box>
        <Box>
          <Text size="lg" fw={600} c="#111827" mb={4}>
            Profile Photo
          </Text>
          <Text size="sm" c="#6b7280">
            Upload a new photo to personalize your account
          </Text>
        </Box>
        <Paper withBorder radius={12} p={16} style={{ borderColor: '#e5e7eb', backgroundColor: '#ffffff', minHeight: 30, width: 270, marginLeft: 'auto' }}>
          <Group justify="space-between" align="center">
            <Group align="center" gap={12}>
              <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 20, height: 20 }} />
              <Text size="13px" fw={500} c="#111827">Google Account</Text>
            </Group>
            <Text size="13px" fw={600} c={isGoogle ? '#10b981' : '#9ca3af'}>{isGoogle ? 'Connected' : 'Not connected'}</Text>
          </Group>
        </Paper>
      </Group>

      <Grid gutter={24} mb={32}>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Text size="sm" fw={500} c="#374151" mb={8}>
            Full Name
          </Text>
          <TextInput
            value={formData.fullName || ''}
            onChange={(e) => setFormData({ ...formData, fullName: e.currentTarget.value })}
            styles={{ input: { borderColor: '#e8f1f5', borderRadius: 8, padding: '12px 16px', background: 'white' } }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Text size="sm" fw={500} c="#374151" mb={8}>
            Email Address
          </Text>
          <TextInput
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.currentTarget.value })}
            type="email"
            disabled
            styles={{ input: { borderColor: '#e8f1f5', borderRadius: 8, padding: '12px 16px' ,background: 'white'} }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Text size="sm" fw={500} c="#374151" mb={8}>
            Date of Birth
          </Text>
          <TextInput
            value={formData.dateOfBirth || ''}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.currentTarget.value })}
            type="date"
            styles={{ input: { borderColor: '#e8f1f5', borderRadius: 8, padding: '12px 16px' ,background: 'white'} }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Text size="sm" fw={500} c="#374151" mb={8}>
            Nationality
          </Text>
          <Select
            value={formData.nationality || ''}
            onChange={(value) => setFormData({ ...formData, nationality: value || '' })}
            data={["Indonesia", "Malaysia", "Singapore", "Thailand", "Philippines"]}
            styles={{ input: { borderColor: '#e8f1f5', borderRadius: 8, padding: '12px 16px' ,background: 'white'} }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Text size="sm" fw={500} c="#374151" mb={8}>
            National Id / Passport
          </Text>
          <TextInput
            value={formData.nationalId || ''}
            onChange={(e) => setFormData({ ...formData, nationalId: e.currentTarget.value })}
            styles={{ input: { borderColor: '#e8f1f5', borderRadius: 8, padding: '12px 16px' ,background: 'white'} }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Text size="sm" fw={500} c="#374151" mb={8}>
            Preferred Currency
          </Text>
          <Select
            value={formData.currency || ''}
            onChange={(value) => setFormData({ ...formData, currency: value || '' })}
            data={['IDR', 'USD']}
            styles={{ input: { borderColor: '#e8f1f5', borderRadius: 8, padding: '12px 16px' ,background: 'white'} }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Text size="sm" fw={500} c="#374151" mb={8}>
            Preferred Language
          </Text>
          <Select
            value={formData.language || ''}
            onChange={(value) => setFormData({ ...formData, language: value || '' })}
            data={['en', 'id', 'zh', 'ja']}
            styles={{ input: { borderColor: '#e8f1f5', borderRadius: 8, padding: '12px 16px' ,background: 'white'} }}
          />
        </Grid.Col>
      </Grid>

      <Group gap={16} mb={24}>
        <Button
          type="submit"
          style={{ backgroundColor: '#284361' }}
          styles={{ root: { '&:hover': { backgroundColor: '#1f3449' } } }}
        >
          Save Changes
        </Button>
        <Button
          type="button"
          variant="outline"
          color="#284361"
          styles={{
            root: {
              borderWidth: 2,
              borderColor: '#284361',
              color: '#284361',
              '&:hover': { backgroundColor: '#284361', color: '#ffffff' },
            },
          }}
          onClick={() => { setCpEmail(String(formData.email || '')); setCpOpen(true); setCpMessage(null); }}
        >
          Change Password
        </Button>
      </Group>

      <Text size="sm" c="#6b7280">
        Your profile helps us personalize your booking experience.
      </Text>
          <Modal opened={cpOpen} onClose={() => { setCpOpen(false); setCpMessage(null); }} centered withCloseButton title="Reset Password">
        <form onSubmit={async (e) => {
          e.preventDefault();
          setCpMessage(null);
          const normalizedEmail = (cpEmail || '').trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, '');
          const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
          if (!emailRegex.test(normalizedEmail)) {
            setCpMessage(`Email address "${cpEmail}" is invalid`);
            return;
          }
          try {
            setCpSubmitting(true);
            const base = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL;
            if (!base) {
              setCpMessage('Konfigurasi redirect URL belum diset (NEXT_PUBLIC_SUPABASE_REDIRECT_URL)');
              return;
            }
            const next = encodeURIComponent('/reset-password');
            const redirectTo = `${base}/auth/confirm?next=${next}`;
            const { error } = await (supabase as any).auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
            if (error) {
              setCpMessage(error.message || 'Gagal mengirim tautan reset');
            } else {
              setCpMessage('Tautan reset password telah dikirim ke email Anda');
            }
          } catch (ex: any) {
            setCpMessage(ex?.message || 'Terjadi kesalahan');
          } finally {
            setCpSubmitting(false);
          }
        }}>
          <Stack gap={16}>
            <TextInput type="email" value={cpEmail} onChange={(e) => setCpEmail(e.currentTarget.value)} placeholder="you@example.com" required styles={{ input: { padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8 } }} />
            {cpMessage && <Text style={{ color: cpMessage.includes('dikirim') ? '#10b981' : '#ef4444' }}>{cpMessage}</Text>}
            <Group justify="flex-end">
              <Button variant="light" onClick={() => { setCpOpen(false); setCpMessage(null); }} disabled={cpSubmitting}>Batal</Button>
              <Button type="submit" styles={{ root: { backgroundColor: '#284361' } }} disabled={cpSubmitting} loading={cpSubmitting}>{cpSubmitting ? 'Mengirim...' : 'Kirim tautan reset'}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={avatarOpen} onClose={() => { setAvatarOpen(false); setAvatarMessage(null); }} centered withCloseButton title="Change Photo">
        <Tabs value={avatarTab} onChange={(v) => setAvatarTab((v as 'file' | 'url') || 'file')}>
          <Tabs.List>
            <Tabs.Tab value="file">Upload File</Tabs.Tab>
            <Tabs.Tab value="url">Link URL</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="file" pt="md">
            <Stack gap={12}>
              <Button disabled styles={{ root: { backgroundColor: '#284361' } }}>Pilih File</Button>
              {avatarMessage && <Text style={{ color: avatarMessage.includes('berhasil') ? '#10b981' : '#ef4444' }}>{avatarMessage}</Text>}
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="url" pt="md">
            <Stack gap={12}>
              <TextInput value={avatarUrlInput} onChange={(e) => setAvatarUrlInput(e.currentTarget.value)} placeholder="https://example.com/avatar.jpg" styles={{ input: { padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8 } }} />
              <Group justify="flex-end">
                <Button variant="light" onClick={() => setAvatarOpen(false)} disabled={avatarUploading}>Batal</Button>
                <Button onClick={onSubmitAvatarUrl} disabled={avatarUploading} styles={{ root: { backgroundColor: '#284361' } }}>Simpan</Button>
              </Group>
              {avatarMessage && <Text style={{ color: avatarMessage.includes('berhasil') ? '#10b981' : '#ef4444' }}>{avatarMessage}</Text>}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Modal>
    </Paper>
  );
}
