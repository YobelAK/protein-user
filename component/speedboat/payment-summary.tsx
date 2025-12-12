'use client';

import React, { useState, useEffect } from 'react';
import { Paper, Title, Stack, Group, Text, Divider, Alert, Button } from '@mantine/core';
import { IconAlertCircle, IconClock } from '@tabler/icons-react';

interface PaymentSummaryProps {
  onContinue?: () => void;
  buttonText?: string;
  booking?: any;
  bookings?: any[];
  onExpire?: () => void;
  title?: string;
  disabled?: boolean;
  noWrapper?: boolean;
  qrString?: string;
  qrImageUrl?: string;
  vaNumber?: string;
  vaBankCode?: string;
}

export function PaymentSummary({
  onContinue,
  buttonText = "Pay Now",
  booking,
  bookings,
  onExpire,
  title,
  disabled,
  noWrapper,
  qrString,
  qrImageUrl,
  vaNumber,
  vaBankCode,
}: PaymentSummaryProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [expiredNotified, setExpiredNotified] = useState(false);
  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n);
  const passengerSubtotalSingle = ((booking?.booking_items || []) as any[]).reduce((sum, it: any) => sum + Number(it.subtotal || 0), 0);
  const totalAmountSingle = Number(booking?.total_amount || 0);
  const multiItems = Array.isArray(bookings) && bookings.length > 0 ? bookings.flatMap((b: any) => (Array.isArray(b?.booking_items) ? b.booking_items : [])) : [];
  const passengerSubtotalMulti = multiItems.reduce((sum, it: any) => sum + Number(it.subtotal || 0), 0);
  const totalAmountMulti = (Array.isArray(bookings) ? bookings : []).reduce((sum, b: any) => sum + Number(b?.total_amount || 0), 0);
  const passengerSubtotal = (Array.isArray(bookings) && bookings.length > 0) ? passengerSubtotalMulti : passengerSubtotalSingle;
  const totalAmount = (Array.isArray(bookings) && bookings.length > 0) ? totalAmountMulti : totalAmountSingle;
  const safePassengerSubtotal = Number.isFinite(passengerSubtotal) && passengerSubtotal >= 0 ? passengerSubtotal : 0;
  const safeTotalAmount = Number.isFinite(totalAmount) && totalAmount >= 0 ? totalAmount : 0;
  const portFeeCalc = Math.max(0, safeTotalAmount - safePassengerSubtotal);

  useEffect(() => {
    if (!booking) return;
    const isPaid = booking?.status === 'PAID' || booking?.status === 'COMPLETED';
    if (isPaid) {
      setTimeLeft(null);
      return;
    }
    const raw = booking?.booking_date ?? booking?.bookingDate ?? null;
    if (!raw) return;
    const bd = new Date(raw);
    const deadline = bd.getTime() + 15 * 60 * 1000;
    const tick = () => {
      const secs = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setTimeLeft(secs);
      if (secs === 0 && !expiredNotified) {
        setExpiredNotified(true);
        onExpire?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking]);

  const content = (
    <Stack gap="xl">
      <Title order={2} style={{ color: '#284361', fontSize: '1.25rem', fontWeight: 700 }}>
        {title || 'Payment Summary'}
      </Title>
      
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Text style={{ color: '#6b7280' }}>Passengers</Text>
          <Text style={{ fontWeight: 500, color: '#111827' }}>IDR {formatNumber(safePassengerSubtotal)}</Text>
        </Group>
        <Group justify="space-between" align="center">
          <Text style={{ color: '#6b7280' }}>Port Fee</Text>
          <Text style={{ fontWeight: 500, color: '#111827' }}>IDR {formatNumber(portFeeCalc)}</Text>
        </Group>
        <Divider />
        <Group justify="space-between" align="center">
          <Text size="lg" style={{ fontWeight: 700, color: '#111827' }}>Total Payment</Text>
          <Text size="lg" style={{ fontWeight: 700, color: '#2dbe8d' }}>IDR {formatNumber(safeTotalAmount)}</Text>
        </Group>
        <Group justify="space-between" align="center">
          <Text style={{ color: '#6b7280' }}>Status</Text>
          <Text style={{ fontWeight: 600, color: '#111827' }}>{booking?.status || '-'}</Text>
        </Group>
      </Stack>

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

      {(qrImageUrl || qrString) && (
        <Stack gap="md">
          {qrImageUrl ? (
            <img src={qrImageUrl} style={{ width: '100%', maxWidth: 320, alignSelf: 'center' }} />
          ) : null}
          {!qrImageUrl && qrString ? (
            <Text ta="center" fw={600} style={{ color: '#111827' }}>{qrString}</Text>
          ) : null}
        </Stack>
      )}

      {vaNumber && (
        <Stack gap="xs">
          <Group justify="center" align="center">
            <Text fw={700} style={{ color: '#111827' }}>Virtual Account</Text>
          </Group>
          <Group justify="space-between" align="center">
            <Text style={{ color: '#6b7280' }}>Bank</Text>
            <Text style={{ fontWeight: 600, color: '#111827' }}>{vaBankCode || '-'}</Text>
          </Group>
          <Group justify="space-between" align="center">
            <Text style={{ color: '#6b7280' }}>Account Number</Text>
            <Text style={{ fontWeight: 700, color: '#2dbe8d' }}>{vaNumber}</Text>
          </Group>
        </Stack>
      )}

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
        disabled={!!disabled || timeLeft === 0 || (booking?.status === 'PAID' || booking?.status === 'COMPLETED') || !!(qrString || qrImageUrl || vaNumber)}
      >
        {buttonText}
      </Button>
    </Stack>
  );

  return noWrapper ? content : (
    <Paper shadow="sm" p="xl" style={{ backgroundColor: 'white' }}>
      {content}
    </Paper>
  );
}
