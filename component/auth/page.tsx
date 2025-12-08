"use client";

import React, { useState } from "react";
import { Box, Group, Text, Anchor, Checkbox, Button, Container, Paper, Stack, Title, TextInput, ActionIcon } from "@mantine/core";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from '@/lib/supabase/client';

export default function AuthLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message || "Email atau password salah");
      return;
    }
    const redirectTo = searchParams.get('redirectTo') || '/profile';
    router.push(redirectTo);
  };
  const handleGoogleLogin = async () => {
    try {
      const redirectTo = searchParams.get('redirectTo') || '/profile';
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}${redirectTo.startsWith('/') ? redirectTo : '/profile'}` : undefined,
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
                  <Anchor href="#" style={{ fontSize: 14, color: "#111827" }}>
                    Forgot Password?
                  </Anchor>
                </Group>

                {/* Error Message */}
                {error && (
                  <Text style={{ color: "#ef4444" }}>{error}</Text>
                )}

                
                {/* Login Button */}
                <Button type="submit" fullWidth styles={{ root: { backgroundColor: "#284361", height: 44, fontWeight: 600 } }}>
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
                  <Anchor href="/register" style={{ color: "#284361", fontWeight: 600 }}>Register Now</Anchor>
                </Text>
              </Stack>
            </form>
          </Paper>

          

          {/* Footer */}
          <Text style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: "#6b7280" }}>
            © 2025 Caspla Bali. All rights reserved.
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
