'use client';

import React, { useState, useEffect } from 'react';
import { Paper, Title, Stack, Group, Text, Divider, Alert, Button } from '@mantine/core';
import { IconAlertCircle, IconClock } from '@tabler/icons-react';

interface PaymentSummaryProps {
  onContinue?: () => void;
  buttonText?: string;
  booking?: any;
}

export function PaymentSummary({
  onContinue,
  buttonText = "Pay Now",
  booking,
}: PaymentSummaryProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!booking) return;
    const raw = booking?.booking_date ?? booking?.bookingDate ?? null;
    if (!raw) return;
    const bd = new Date(raw);
    const deadline = bd.getTime() + 15 * 60 * 1000;
    const tick = () => {
      const secs = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeft(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking]);

  return (
    <Paper shadow="sm" p="xl" style={{ backgroundColor: 'white' }}>
      <Stack gap="xl">
        <Title order={2} style={{ color: '#284361', fontSize: '1.25rem', fontWeight: 700 }}>
          Payment Summary
        </Title>
        
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Text style={{ color: '#6b7280' }}>Passengers</Text>
            <Text style={{ fontWeight: 500, color: '#111827' }}>IDR {(((booking?.booking_items || []) as any[]).reduce((sum, it: any) => sum + Number(it.subtotal || 0), 0)).toLocaleString()}</Text>
          </Group>
          <Divider />
          <Group justify="space-between" align="center">
            <Text size="lg" style={{ fontWeight: 700, color: '#111827' }}>Total Payment</Text>
            <Text size="lg" style={{ fontWeight: 700, color: '#2dbe8d' }}>IDR {Number(booking?.total_amount || 0).toLocaleString()}</Text>
          </Group>
        </Stack>

        {/* Alerts */}
        <Stack gap="md">
          <Alert 
            icon={<IconAlertCircle size={20} />}
            color="blue"
            variant="light"
            style={{ backgroundColor: '#eff6ff' }}
          >
            <Text size="sm" style={{ color: '#1e40af' }}>
              All prices are inclusive of tax and service charges.
            </Text>
          </Alert>
          
          <Alert 
            icon={<IconClock size={20} />}
            color="orange"
            variant="light"
            style={{ backgroundColor: '#fff7ed' }}
          >
            <Group justify="space-between" align="center">
              <Text size="sm" style={{ color: '#9a3412' }}>Payment deadline</Text>
              <Text fw={700} style={{ color: '#ef4444' }}>
                {(() => {
                  if (timeLeft === null) return '—';
                  const m = Math.floor(timeLeft / 60);
                  const s = timeLeft % 60;
                  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                })()}
              </Text>
            </Group>
          </Alert>
        </Stack>

        {/* Payment Button */}
        <Button 
          onClick={onContinue}
          fullWidth
          size="lg"
          style={{ 
            backgroundColor: '#2dbe8d',
            fontWeight: 600,
            padding: '12px 24px'
          }}
          styles={{
            root: {
              '&:hover': {
                backgroundColor: '#25a374'
              }
            }
          }}
        >
          {buttonText}
        </Button>
      </Stack>
    </Paper>
  );
}
