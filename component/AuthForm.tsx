'use client';

import React from 'react';
import { Paper, Stack, Title, TextInput, PasswordInput, Button } from '@mantine/core';

export function AuthForm() {
  return (
    <Paper shadow="sm" radius="lg" p="xl" bg="white" style={{ maxWidth: 420, margin: '0 auto' }}>
      <Stack gap="md">
        <Title order={2} size="xl" fw={700} c="#284361">Login</Title>
        <TextInput label="Email" placeholder="you@example.com" required />
        <PasswordInput label="Password" placeholder="Your password" required />
        <Button styles={{ root: { backgroundColor: '#284361' } }}>
          Sign in
        </Button>
      </Stack>
    </Paper>
  );
}
