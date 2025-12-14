'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Group, Text, Button, Image, Menu, ActionIcon, Stack, Badge } from '@mantine/core';
import { FileText, CreditCard, MoreVertical } from 'lucide-react';
import { useMediaQuery } from '@mantine/hooks';

type BookingStatus = 'Pending' | 'Booked' | 'Completed' | 'Cancelled'| 'Expired'| 'Refunded';

interface BookingCardProps {
  initials: string;
  title: string;
  location: string;
  bookingDate: string;
  departureDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  passengers: number;
  bookingCode: string;
  status: BookingStatus;
  image?: string;
  paymentDeadline?: string;
  onPayNow?: () => void;
  onCancel?: () => void;
  deadlineAt?: string;
  onViewDetails?: () => void;
  onViewTicket?: () => void;
  onViewInvoice?: () => void;
  pendingType?: 'payment' | 'refund';
  onIssueRefund?: () => void;
  onReview?: () => void;
  hasReview?: boolean;
  onViewReview?: () => void;
}

export function BookingCard({
  initials,
  title,
  location,
  bookingDate,
  passengers,
  bookingCode,
  status,
  image,
  paymentDeadline,
  onPayNow,
  onCancel,
  deadlineAt,
  onViewDetails,
  onViewTicket,
  onViewInvoice,
  pendingType,
  onIssueRefund,
  onReview,
  hasReview,
  onViewReview,
  departureDate,
  departureTime,
  arrivalTime,
}: BookingCardProps) {
  const statusStyles: Record<BookingStatus, { bg: string; color: string }> = {
    Pending: { bg: '#e0f2fe', color: '#075985' },
    Booked: { bg: '#fef9c3', color: '#854d0e' },
    Completed: { bg: '#bbf7d0', color: '#166534' },
    Cancelled: { bg: '#fee2e2', color: '#991b1b' },
    Expired: { bg: '#fee2e2', color: '#991b1b' },
    Refunded: { bg: '#e0f2fe', color: '#075985' },
  };

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
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
      <Box style={{ display: 'grid', gridTemplateRows: 'auto auto auto', gap: 12 }}>
        {isMobile ? (
          <Stack gap={6}>
            <Group justify="space-between" align="center">
              <Text c="#284361" fw={700}>Booking</Text>
              <Group gap={8} align="center">
                {(status === 'Pending' && pendingType === 'payment') && (
                  <Badge color="red" variant="filled" styles={{ root: { borderRadius: 8 } }}>
                    {(() => {
                      if (timeLeft === null) return paymentDeadline || '—';
                      const m = Math.floor(timeLeft / 60);
                      const s = timeLeft % 60;
                      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                    })()}
                  </Badge>
                )}
                <Menu position="bottom-end" shadow="md">
                  <Menu.Target>
                    <ActionIcon variant="outline" radius="md" size={32} style={{ borderColor: '#284361', color: '#284361' }}>
                      <MoreVertical size={18} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {onViewDetails && <Menu.Item onClick={onViewDetails}>View Details</Menu.Item>}
                    {(status === 'Booked') && onViewInvoice && (
                      <Menu.Item onClick={onViewInvoice}>View Invoice</Menu.Item>
                    )}
                    {(status === 'Booked') && onIssueRefund && (
                      <Menu.Item onClick={onIssueRefund}>Issue Refund</Menu.Item>
                    )}
                    {(status === 'Completed') && hasReview && onViewReview && (
                      <Menu.Item onClick={onViewReview}>View Review</Menu.Item>
                    )}
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </Stack>
        ) : (
          <Group justify="space-between" align="center">
            <Group gap={16}>
              <Text c="#284361" fw={700}>Booking</Text>
              <Text c="#6b7280">Code: <Text span c="#284361" fw={600}>{bookingCode}</Text></Text>
              <Text c="#6b7280">Booking Date: <Text span c="#284361" fw={600}>{bookingDate}</Text></Text>
            </Group>
            <Group gap={12} align="center">
              {(status === 'Pending' && pendingType === 'payment') && (
                <Group gap={6} align="center">
                  <Text c="#ef4444" fw={700}>{(() => {
                    if (timeLeft === null) return paymentDeadline || '—';
                    const m = Math.floor(timeLeft / 60);
                    const s = timeLeft % 60;
                    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                  })()}</Text>
                </Group>
              )}
              <Menu position="bottom-end" shadow="md">
                <Menu.Target>
                  <ActionIcon variant="outline" radius="md" size={36} style={{ borderColor: '#284361', color: '#284361' }}>
                    <MoreVertical size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  {onViewDetails && <Menu.Item onClick={onViewDetails}>View Details</Menu.Item>}
                  {(status === 'Booked') && onViewInvoice && (
                    <Menu.Item onClick={onViewInvoice}>View Invoice</Menu.Item>
                  )}
                  {(status === 'Booked') && onIssueRefund && (
                    <Menu.Item onClick={onIssueRefund}>Issue Refund</Menu.Item>
                  )}
                  {(status === 'Completed') && hasReview && onViewReview && (
                    <Menu.Item onClick={onViewReview}>View Review</Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
        )}

        {isMobile ? (
          <Stack gap="md">
            <Group gap={16} align="flex-start">
              <Box
                style={{
                  width: 64,
                  height: 64,
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
                {image ? <Image src={image} alt={title} width={64} height={64} fit="cover" /> : initials}
              </Box>
              <Box style={{ flex: 1 }}>
                <Text c="#284361" fw={600} size="lg" mb={4}>{title}</Text>
                <Text c="#6b7280" size="sm" mb={8}>{location}</Text>
                <Text c="#6b7280" size="sm">Passengers: <Text span c="#284361" fw={500}>{passengers}</Text></Text>
              </Box>
            </Group>
            <Stack gap={6}>
              <Group justify="space-between" align="center">
                <Text c="#6b7280" size="sm">Departure Date</Text>
                <Text fw={600} c="#284361">{departureDate || '—'}</Text>
              </Group>
              <Group justify="space-between" align="center">
                <Text c="#6b7280" size="sm">Departure Time</Text>
                <Text fw={600} c="#284361">{departureTime || '—'}</Text>
              </Group>
              <Group justify="space-between" align="center">
                <Text c="#6b7280" size="sm">Arrival Time</Text>
                <Text fw={600} c="#284361">{arrivalTime || '—'}</Text>
              </Group>
            </Stack>
          </Stack>
        ) : (
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
            <Box style={{ textAlign: 'right' }}>
              <Group justify="space-between" align="center">
                <Text c="#6b7280" size="sm">Departure Date</Text>
                <Text fw={600} c="#284361">{departureDate || '—'}</Text>
              </Group>
              <Group justify="space-between" align="center">
                <Text c="#6b7280" size="sm">Departure Time</Text>
                <Text fw={600} c="#284361">{departureTime || '—'}</Text>
              </Group>
              <Group justify="space-between" align="center">
                <Text c="#6b7280" size="sm">Arrival Time</Text>
                <Text fw={600} c="#284361">{arrivalTime || '—'}</Text>
              </Group>
            </Box>
          </Group>
        )}

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
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {(status === 'Pending' && pendingType) ? (pendingType === 'payment' ? 'Pending Payment' : 'Issue Refund') : status}
            </Box>
            {status === 'Pending' && pendingType === 'payment' && (
              <Button
                leftSection={<CreditCard size={16} />}
                style={{ backgroundColor: '#284361' }}
                styles={{ root: { borderRadius: 8 } }}
                onClick={onPayNow}
                disabled={timeLeft === 0}
              >
                Pay Now
              </Button>
            )}
            {(status === 'Booked' || status === 'Completed') && (
              <Button
                leftSection={<FileText size={16} />}
                style={{ backgroundColor: '#284361' }}
                styles={{ root: { borderRadius: 8 } }}
                onClick={onViewTicket}
              >
                View E-Ticket
              </Button>
            )}
            {status === 'Completed' && onReview && (
              <Button
                style={{ backgroundColor: '#284361' }}
                styles={{ root: { borderRadius: 8 } }}
                onClick={onReview}
                disabled={!!hasReview}
              >
                Review
              </Button>
            )}
          </Group>
        </Group>
      </Box>
    </Paper>
  );
}
