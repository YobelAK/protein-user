'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Group, Text, Button, Image, Menu, ActionIcon } from '@mantine/core';
import { FileText, CreditCard, MoreVertical } from 'lucide-react';

type BookingStatus = 'Pending' | 'Booked' | 'Completed' | 'Cancelled';

interface BookingCardProps {
  initials: string;
  title: string;
  location: string;
  date: string;
  passengers: number;
  bookingCode: string;
  status: BookingStatus;
  image?: string;
  paymentDeadline?: string;
  onPayNow?: () => void;
  onCancel?: () => void;
  deadlineAt?: string;
}

export function BookingCard({
  initials,
  title,
  location,
  date,
  passengers,
  bookingCode,
  status,
  image,
  paymentDeadline,
  onPayNow,
  onCancel,
  deadlineAt,
}: BookingCardProps) {
  const statusStyles: Record<BookingStatus, { bg: string; color: string }> = {
    Pending: { bg: '#e0f2fe', color: '#075985' },
    Booked: { bg: '#fef9c3', color: '#854d0e' },
    Completed: { bg: '#bbf7d0', color: '#166534' },
    Cancelled: { bg: '#fee2e2', color: '#991b1b' },
  };

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!deadlineAt) {
      setTimeLeft(null);
      return;
    }
    const d = new Date(deadlineAt);
    const target = d.getTime();
    const tick = () => {
      const secs = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setTimeLeft(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineAt]);

  return (
    <Paper
      withBorder
      p={24}
      radius={16}
      style={{ borderColor: '#f3f4f6', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', background: 'white', minHeight: 260 }}
    >
      <Box style={{ display: 'grid', gridTemplateRows: '20% 50% 30%', gap: 12 }}>
        <Group justify="space-between" align="center">
          <Group gap={16}>
            <Text c="#284361" fw={700}>Booking</Text>
            <Text c="#6b7280">Code: <Text span c="#284361" fw={600}>{bookingCode}</Text></Text>
            <Text c="#6b7280">Date: <Text span c="#284361" fw={600}>{date}</Text></Text>
          </Group>
          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="outline" radius="md" size={36} style={{ borderColor: '#284361', color: '#284361' }}>
                <MoreVertical size={18} />
              </ActionIcon>
            </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item>Lihat Detail</Menu.Item>
            {(status === 'Pending' || status === 'Booked') && (
              <Menu.Item onClick={onCancel}>Batal</Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
        </Group>

        <Group justify="space-between" align="flex-start" style={{ alignItems: 'stretch' }}>
          <Group gap={16} style={{ flex: 1 }}>
            <Box
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                backgroundColor: '#e8f1f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#284361',
                fontWeight: 700,
                fontSize: 18,
                flexShrink: 0,
                overflow: 'hidden',
              }}
            >
              {image ? <Image src={image} alt={title} width={80} height={80} fit="cover" /> : initials}
            </Box>
            <Box style={{ flex: 1 }}>
              <Text c="#284361" fw={600} size="lg" mb={4}>{title}</Text>
              <Text c="#6b7280" size="sm" mb={12}>{location}</Text>
              <Group gap={24}>
                <Text c="#6b7280" size="sm">Passengers: <Text span c="#284361" fw={500}>{passengers}</Text></Text>
              </Group>
            </Box>
          </Group>
          {status === 'Pending' && (
            <Box style={{ textAlign: 'right' }}>
              <Text c="#6b7280" size="sm">Payment deadline</Text>
              <Text c="#ef4444" fw={700}>{(() => {
                if (timeLeft === null) return paymentDeadline || '—';
                const m = Math.floor(timeLeft / 60);
                const s = timeLeft % 60;
                return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
              })()}</Text>
            </Box>
          )}
        </Group>

        <Group justify="space-between" align="center">
          <Box />
          <Group gap={8}>
            <Box
              style={{
                backgroundColor: statusStyles[status].bg,
                color: statusStyles[status].color,
                padding: '6px 16px',
                borderRadius: 9999,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {status}
            </Box>
            {status === 'Pending' && (
              <Button
                leftSection={<CreditCard size={16} />}
                style={{ backgroundColor: '#284361' }}
                styles={{ root: { borderRadius: 8 } }}
                onClick={onPayNow}
              >
                Pay Now
              </Button>
            )}
            {(status === 'Booked' || status === 'Completed') && (
              <Button
                leftSection={<FileText size={16} />}
                style={{ backgroundColor: '#284361' }}
                styles={{ root: { borderRadius: 8 } }}
              >
                View E-Ticket
              </Button>
            )}
          </Group>
        </Group>
      </Box>
    </Paper>
  );
}
