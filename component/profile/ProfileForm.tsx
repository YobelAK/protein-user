'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Group, Text, ActionIcon, Grid, Button, Select, TextInput } from '@mantine/core';
import { Camera } from 'lucide-react';

type ProfileInitialValues = {
  id?: string;
  fullName?: string;
  email?: string;
  dateOfBirth?: string;
  nationality?: string;
  nationalId?: string;
  currency?: string;
  language?: string;
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
  });

  useEffect(() => {
    if (props.initialValues) {
      setFormData((prev) => ({
        ...prev,
        ...props.initialValues,
      }));
    }
  }, [props.initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (props.onSubmit) {
      await props.onSubmit(formData);
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
            {useMemo(() => {
              const name = (formData.fullName || '').trim();
              if (!name) return 'NA';
              const parts = name.split(/\s+/).filter(Boolean);
              const first = parts[0]?.[0] || '';
              const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
              const letters = (first + last).toUpperCase();
              return letters || 'NA';
            }, [formData.fullName])}
          </Box>
          <ActionIcon
            aria-label="Upload photo"
            variant="filled"
            size={32}
            radius={9999}
            style={{ position: 'absolute', right: 0, bottom: 0, backgroundColor: '#2dbe8d' }}
          >
            <Camera size={16} color="#ffffff" />
          </ActionIcon>
        </Box>
        <Box>
          <Text size="lg" fw={600} c="#111827" mb={4}>
            Profile Photo
          </Text>
          <Text size="sm" c="#6b7280">
            Upload a new photo to personalize your account
          </Text>
        </Box>
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
            data={['IDR', 'USD', 'EUR', 'SGD']}
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
        {/* <Button
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
        >
          Change Password
        </Button> */}
      </Group>

      <Text size="sm" c="#6b7280">
        Your profile helps us personalize your booking experience.
      </Text>
    </Paper>
  );
}
