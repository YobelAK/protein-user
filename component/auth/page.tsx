"use client";

import React, { useEffect, useState } from "react";
import { Box, Group, Text, Anchor, Checkbox, Button, Container, Paper, Stack, Title, TextInput, ActionIcon, Modal } from "@mantine/core";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from '@/lib/supabase/client';

export default function AuthLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cpOpen, setCpOpen] = useState(false);
  const [cpEmail, setCpEmail] = useState<string>("");
  const [cpSubmitting, setCpSubmitting] = useState(false);
  const [cpMessage, setCpMessage] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

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
        router.replace(redirectParam || '/');
      }
    })();
    const { data: sub } = (supabase as any).auth.onAuthStateChange((_event: any, s: any) => {
      if (s) {
        router.replace(redirectParam || '/');
      }
    });
    return () => { active = false; try { sub?.subscription?.unsubscribe?.(); } catch {} };
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (loginSubmitting) return;
    setLoginSubmitting(true);
    try { if (typeof window !== 'undefined') { localStorage.setItem('remember_me', rememberMe ? '1' : '0'); } } catch {}
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message || "Email atau password salah");
      setLoginSubmitting(false);
      return;
    }
    if (typeof window !== 'undefined') {
      try {
        const pattern = /^sb-.*-auth-token/;
        if (!rememberMe) {
          const keys: string[] = [];
          for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ''; if (pattern.test(k)) keys.push(k); }
          keys.forEach((k) => { const v = localStorage.getItem(k); if (v) sessionStorage.setItem(k, v); localStorage.removeItem(k); });
        } else {
          const keys: string[] = [];
          for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i) || ''; if (pattern.test(k)) keys.push(k); }
          keys.forEach((k) => { const v = sessionStorage.getItem(k); if (v) localStorage.setItem(k, v); sessionStorage.removeItem(k); });
        }
      } catch {}
    }
    const redirectTo = redirectParam || '/';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(redirectTo);
        return;
      }
    } catch {} finally {
      setLoginSubmitting(false);
    }
    router.replace(redirectTo);
  };
  const handleGoogleLogin = async () => {
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL;
      if (!base) {
        setError('Konfigurasi redirect URL belum diset (NEXT_PUBLIC_SUPABASE_REDIRECT_URL)');
        return;
      }
      const rto = encodeURIComponent(redirectParam || '/');
      const redirectTo = `${base}/login?auth_flow=login&redirectTo=${rto}`;
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      });
    } catch (err) {
      setError('Gagal login dengan Google');
    }
  };

  return (
    <Box style={{ minHeight: "100vh", display: "flex" }}>
      {/* Left Side - Beach Image (hidden on mobile) */}
      <Box
        visibleFrom="md"
        style={{
          width: "50%",
          minHeight: "100vh",
          backgroundImage:
            "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Right Side - Login Form (full width on mobile) */}
      <Box style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#ffffff" }}>
        <Box style={{ width: "100%", maxWidth: 480 }}>
          {/* Mobile Logo */}
          <Box mb={32}>
            <Title order={2} style={{ fontWeight: 700, color: "#111827" }}>Caspla Bali</Title>
          </Box>

          {/* Welcome Text */}
          <Box mb={32}>
            <Title order={2} style={{ fontSize: 32, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Welcome Back</Title>
            <Text style={{ color: "#6b7280" }}>Login to your Caspla Dashboard</Text>
          </Box>

          {/* Login Form */}
          <Paper radius="md" p={0} style={{ background: "transparent", border: "none", boxShadow: "none" }}>
            <form onSubmit={handleSubmit}>
              <Stack gap={24}>
                {/* Email Input */}
                <div>
                  <Text component="label" htmlFor="email" style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 8 }}>
                    Email Address
                  </Text>
                  <TextInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    placeholder="Enter your email"
                    required
                    styles={{
                      input: {
                        padding: "12px 16px",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                      },
                    }}
                  />
                </div>

                {/* Password Input */}
                <div>
                  <Text component="label" htmlFor="password" style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 8 }}>
                    Password
                  </Text>
                  <TextInput
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    placeholder="Enter your password"
                    required
                    rightSection={
                      <ActionIcon aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((v) => !v)} variant="subtle" color="gray">
                        {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </ActionIcon>
                    }
                    styles={{
                      input: {
                        padding: "12px 16px",
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        paddingRight: 48,
                      },
                    }}
                  />
                </div>

                {/* Remember Me & Forgot Password */}
                <Group justify="space-between" align="center">
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.currentTarget.checked)}
                    label={<Text style={{ fontSize: 14, color: "#111827" }}>Remember Me</Text>}
                    styles={{ input: { borderColor: "#d1d5db" }, label: { cursor: "pointer" } }}
                  />
                  <Anchor
                    onClick={() => { setCpOpen(true); setCpEmail(email || ""); setCpMessage(null); }}
                    style={{ fontSize: 14, color: "#284361", cursor: "pointer" }}
                  >
                    Forgot Password?
                  </Anchor>
                </Group>

                {/* Error Message */}
                {error && (
                  <Text style={{ color: "#ef4444" }}>{error}</Text>
                )}

                
                {/* Login Button */}
                <Button type="submit" fullWidth styles={{ root: { backgroundColor: "#284361", height: 44, fontWeight: 600 } }} loading={loginSubmitting}>
                  Login
                </Button>

                {/* Or divider */}
                <Group justify="center">
                  <Text c="#6b7280" size="sm">or</Text>
                </Group>

                {/* Google Login */}
                <Button type="button" fullWidth variant="outline" styles={{ root: { height: 44, fontWeight: 600, borderColor: '#d1d5db', color: '#111827' } }} onClick={handleGoogleLogin}>
                   <Group justify="center" gap={12}>
                    <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: 20, height: 20 }} />
                    <Text style={{ color: "#111827", fontWeight: 500 }}>Continue with Google</Text>
                  </Group>
                </Button>
                <Text style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "#6b7280" }}>
                  Don&#39;t have an account? {" "}
                  <Anchor href={`/register?redirectTo=${encodeURIComponent(redirectParam || '/')}`} style={{ color: "#284361", fontWeight: 600 }}>Register Now</Anchor>
                </Text>
              </Stack>
            </form>
          </Paper>

          

          {/* Footer */}
          <Text style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: "#6b7280" }}>
            © 2025 Caspla Bali. All rights reserved.
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
                <TextInput
                  type="email"
                  value={cpEmail}
                  onChange={(e) => setCpEmail(e.currentTarget.value)}
                  placeholder="you@example.com"
                  required
                  styles={{ input: { padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: 8 } }}
                />
                {cpMessage && <Text style={{ color: cpMessage.includes('dikirim') ? '#10b981' : '#ef4444' }}>{cpMessage}</Text>}
                <Group justify="flex-end">
                  <Button variant="light" onClick={() => { setCpOpen(false); setCpMessage(null); }} disabled={cpSubmitting}>Batal</Button>
                  <Button type="submit" styles={{ root: { backgroundColor: '#284361' } }} disabled={cpSubmitting} loading={cpSubmitting}>{cpSubmitting ? 'Mengirim...' : 'Kirim tautan reset'}</Button>
                </Group>
              </Stack>
            </form>
          </Modal>
        </Box>
      </Box>
    </Box>
  );
}
