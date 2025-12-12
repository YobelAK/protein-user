'use client';

import React, { useState } from 'react';
import { 
  Box, 
  Container, 
  Title, 
  Text, 
  Grid, 
  Paper, 
  Image, 
  Button, 
  Group, 
  Stack,
  TextInput
} from '@mantine/core';
import { IconMail } from '@tabler/icons-react';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setMessage('Berhasil mendaftar newsletter');
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(typeof data?.error === 'string' ? data.error : 'Terjadi kesalahan');
      }
    } catch (e) {
      setError('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box style={{ backgroundColor: '#f8f9fa', paddingTop: '64px', paddingBottom: '64px' }}>
      <Container size="xl" style={{ padding: '0px 16px' }}>
        <Paper 
          radius="xl" 
          style={{ 
            background: 'linear-gradient(to right, #e8f1f5, #d0e7f0)',
            overflow: 'hidden'
          }}
        >
          <Grid>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Stack 
                gap="lg" 
                p={{ base: 'xl', lg: '3rem' }}
                justify="center"
                style={{ height: '100%' }}
              >
                <Group gap="sm" align="flex-start">
                  <IconMail size={32} color="#284361" />
                  <Title order={2} size="2rem" fw={700} c="#1a1a1a">
                    Stay updated on island packages & promotions!
                  </Title>
                </Group>
                <Text c="dimmed" size="lg">
                  Subscribe to our newsletter and be the first to know about special
                  deals, new destinations, and travel tips for your Bali adventure.
                </Text>
                <form onSubmit={handleSubmit}>
                  <Group gap="sm" align="flex-end" wrap="wrap">
                    <TextInput
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                      style={{ flex: 1 }}
                      styles={{
                        input: {
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6',
                          ':focus': {
                            borderColor: '#284361',
                            boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                          },
                          backgroundColor: '#fff',
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      style={{
                        backgroundColor: '#284361',
                        ':hover': { backgroundColor: '#1e3149' }
                      }}
                      px="xl"
                      py="sm"
                      styles={{
                        root: { minWidth: 'max-content', height: 42 },
                        label: { fontSize: 14, fontWeight: 600, lineHeight: 1.2 }
                      }}
                      loading={loading}
                    >
                      Register Now
                    </Button>
                  </Group>
                </form>
                {message && (
                  <Text size="sm" c="green">
                    {message}
                  </Text>
                )}
                {error && (
                  <Text size="sm" c="red">
                    {error}
                  </Text>
                )}
                <Text size="xs" c="dimmed">
                  By subscribing, you agree to our Privacy Policy. You can
                  unsubscribe at any time.
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Box style={{ position: 'relative', height: '425px' }}>
                <Image
                  src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80"
                  alt="Island paradise"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover' 
                  }}
                />
              </Box>
            </Grid.Col>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}
