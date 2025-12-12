'use client';

import React, { useEffect, useState } from 'react';
import { Paper, Stack, Title, Grid, TextInput, Select, NumberInput, Textarea, Checkbox, Group, Text, Anchor } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';

interface ContactFormProps {
  guestCount: number;
  onGuestCountChange: (value: number) => void;
  onChange?: (value: {
    firstName: string;
    lastName: string;
    email: string;
    countryCode: string;
    phone: string;
    specialRequests?: string;
    agreed?: boolean;
  }) => void;
  availableUnits?: number;
}

export function ContactForm({ guestCount, onGuestCountChange, onChange, availableUnits }: ContactFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [agreed, setAgreed] = useState(false);
  const emailError = email && (!email.includes('@') || !email.endsWith('.com')) ? 'Invalid email format' : undefined;

  useEffect(() => {
    if (onChange) {
      onChange({ firstName, lastName, email, countryCode, phone, specialRequests, agreed });
    }
  }, [firstName, lastName, email, countryCode, phone, specialRequests, agreed, onChange]);

  return (
    <Paper shadow="sm" p="xl" radius="lg" bg="white">
      <Stack gap="xl">
        <Title order={2} size="xl" fw={600} c="dark">Contact Information</Title>
        
        <Grid gutter="xl">
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TextInput
              label="First Name"
              placeholder="Enter first name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.currentTarget.value)}
              styles={{
                label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
                input: {
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  '&:focus': { 
                    borderColor: '#284361',
                    boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                  }
                }
              }}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TextInput
              label="Last Name"
              placeholder="Enter last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.currentTarget.value)}
              styles={{
                label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
                input: {
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  '&:focus': { 
                    borderColor: '#284361',
                    boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                  }
                }
              }}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <TextInput
              label="Email Address"
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              error={emailError}
              styles={{
                label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
                input: {
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  '&:focus': { 
                    borderColor: '#284361',
                    boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                  }
                }
              }}
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="xs">
              <Text size="sm" fw={500} c="#374151">Phone Number</Text>
              <Group gap="sm">
                <Select
                  data={[
                    { value: '+62', label: '+62' },
                    { value: '+1', label: '+1' },
                    { value: '+44', label: '+44' },
                    { value: '+61', label: '+61' }
                  ]}
                  value={countryCode}
                  onChange={(v) => v && setCountryCode(v)}
                  rightSection={<IconChevronDown size={16} />}
                  styles={{
                    input: {
                      padding: '12px 16px',
                      backgroundColor: 'white',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      width: 80,
                      '&:focus': { 
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
                <TextInput
                  placeholder="Enter phone number"
                  required
                  style={{ flex: 1 }}
                  value={phone}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  styles={{
                    input: {
                      padding: '12px 16px',
                      backgroundColor: 'white',
                      color: '#111827',
                      border: '1px solid #d1d5db',
                      '&:focus': { 
                        borderColor: '#284361',
                        boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                      }
                    }
                  }}
                />
              </Group>
            </Stack>
          </Grid.Col>
          
          <Grid.Col span={{ base: 12, md: 6 }}>
            <NumberInput
              label="Number of Passengers"
              min={1}
              max={typeof availableUnits === 'number' ? availableUnits : undefined}
              value={guestCount}
              onChange={(value) => {
                const v = typeof value === 'number' ? value : 1;
                const max = typeof availableUnits === 'number' ? availableUnits : undefined;
                const next = max != null ? Math.min(Math.max(1, v), max) : Math.max(1, v);
                onGuestCountChange(next);
              }}
              styles={{
                label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
                input: {
                  padding: '12px 16px',
                  backgroundColor: 'white',
                  color: '#111827',
                  border: '1px solid #d1d5db',
                  '&:focus': { 
                    borderColor: '#284361',
                    boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
                  }
                }
              }}
            />
          </Grid.Col>
        </Grid>
        
        <Textarea
          label="Special Requests (Optional)"
          placeholder="Any special requests or notes..."
          rows={4}
          resize="none"
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.currentTarget.value)}
          styles={{
            label: { fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: 8 },
            input: {
              padding: '12px 16px',
              backgroundColor: 'white',
              color: '#111827',
              border: '1px solid #d1d5db',
              '&:focus': { 
                borderColor: '#284361',
                boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)'
              }
            }
          }}
        />
        
        <Checkbox
          label={
            <Text size="sm" c="dimmed">
              I agree to the{' '}
              <Anchor href="#" c="#284361" td="hover">
                Terms and Conditions
              </Anchor>{' '}
              and{' '}
              <Anchor href="#" c="#284361" td="hover">
                Privacy Policy
              </Anchor>
            </Text>
          }
          checked={agreed}
          onChange={(e) => setAgreed(e.currentTarget.checked)}
          styles={{
            input: {
              '&:checked': { backgroundColor: '#284361', borderColor: '#284361' },
              '&:focus': { boxShadow: '0 0 0 2px rgba(40, 67, 97, 0.2)' }
            }
          }}
        />
      </Stack>
    </Paper>
  );
}
