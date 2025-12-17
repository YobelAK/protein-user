'use client';

import React, { useEffect, useState } from 'react';
import { Box, Paper, Group, Text, Button, Image, Menu, ActionIcon, Stack, Badge, SimpleGrid } from '@mantine/core';
import { FileText, CreditCard, MoreVertical } from 'lucide-react';
import { useMediaQuery } from '@mantine/hooks';

type BookingStatus = 'Pending' | 'Booked' | 'Completed' | 'Cancelled'| 'Expired'| 'Refunded';

interface BookingCardProps {
  initials: string;
  title: string;
  location: string;
  returnLocation?: string;
  returnVendorName?: string;
  returnBoatName?: string;
  bookingDate: string;
  departureDate?: string;
  returnDate?: string;
  departureTime?: string;
  arrivalTime?: string;
  returnDepartureTime?: string;
  returnArrivalTime?: string;
  passengers: number;
  isDoubleTrip?: boolean;
  departurePassengers?: number;
  returnPassengers?: number;
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
  loadingPayNow?: boolean;
  loadingViewTicket?: boolean;
  loadingReviewButton?: boolean;
}

export function BookingCard({
  initials,
  title,
  location,
  bookingDate,
  passengers,
  isDoubleTrip,
  departurePassengers,
  returnPassengers,
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
  returnDate,
  departureTime,
  arrivalTime,
  returnDepartureTime,
  returnArrivalTime,
  returnLocation,
  returnVendorName,
  returnBoatName,
  loadingPayNow,
  loadingViewTicket,
  loadingReviewButton,
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

  const double = !!(isDoubleTrip ?? (returnDate || returnDepartureTime || returnArrivalTime || returnLocation));
  const depPax = departurePassengers ?? (double ? undefined : passengers);
  const retPax = returnPassengers ?? (double ? undefined : undefined);
  const routeCombined = (() => {
    const loc = String(location || '');
    const parts = loc.split('→').map((s) => s.trim());
    if (parts.length === 2) return `${parts[0]} ⇄ ${parts[1]}`;
    const alt = loc.split('->').map((s) => s.trim());
    if (alt.length === 2) return `${alt[0]} ⇄ ${alt[1]}`;
    return loc;
  })();
  const dateRange = (() => {
    const dep = departureDate || '';
    const ret = returnDate || '';
    if (dep && ret) {
      const retYear = (ret.match(/\d{4}$/) || [null])[0];
      const depShort = dep.replace(/\s*\d{4}$/, '');
      return retYear ? `${depShort} – ${ret}` : `${dep} – ${ret}`;
    }
    return dep || ret || '';
  })();
  const outboundVendorFromTitle = (() => {
    const segs = String(title || '').split(' \u2022 ').map((s) => s.trim()).filter(Boolean);
    return segs.length >= 2 ? segs[1] : undefined;
  })();
  const outboundBoatFromTitle = (() => {
    const segs = String(title || '').split(' \u2022 ').map((s) => s.trim()).filter(Boolean);
    return segs.length >= 1 ? segs[0] : undefined;
  })();
  const vendorSummary = (() => {
    if (!double) return '';
    const ov = outboundVendorFromTitle ? outboundVendorFromTitle.toLowerCase() : undefined;
    const rv = returnVendorName ? returnVendorName.toLowerCase() : undefined;
    const ob = outboundBoatFromTitle ? outboundBoatFromTitle.toLowerCase() : undefined;
    const rb = returnBoatName ? returnBoatName.toLowerCase() : undefined;
    if (ov && rv) {
      if (ov === rv) return outboundVendorFromTitle as string;
      return 'Multiple vendors';
    }
    if (ob && rb) {
      if (ob === rb) return outboundVendorFromTitle || returnVendorName || (outboundBoatFromTitle as string);
      return 'Multiple vendors';
    }
    return outboundVendorFromTitle || returnVendorName || 'Multiple vendors';
  })();

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
              <Text c="#284361" fw={700}>{double ? 'Double trip Booking' : 'Booking'}</Text>
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
              <Text c="#284361" fw={700}>{double ? 'Double trip Booking' : 'Booking'}</Text>
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
                <Text c="#284361" fw={700} size="lg" mb={4}>{double ? routeCombined : location}</Text>
                <Text c="#284361" fw={600} size="md" mb={8}>{double ? dateRange : (departureDate || '')}</Text>
                {double ? (
                  <Text c="#6b7280" size="sm" mb={8}>{vendorSummary}</Text>
                ) : (
                  <>
                    {outboundVendorFromTitle ? (
                      <Text c="#6b7280" size="sm" mb={4}>Provider: <Text span c="#284361" fw={500}>{outboundVendorFromTitle}</Text></Text>
                    ) : null}
                    {outboundBoatFromTitle ? (
                      <Text c="#6b7280" size="sm" mb={8}>Boat: <Text span c="#284361" fw={500}>{outboundBoatFromTitle}</Text></Text>
                    ) : null}
                  </>
                )}
                {double ? (
                  <Stack gap={4}>
                    <Text c="#6b7280" size="sm">Departure Passengers: <Text span c="#284361" fw={500}>{depPax ?? '—'}</Text></Text>
                    <Text c="#6b7280" size="sm">Return Passengers: <Text span c="#284361" fw={500}>{retPax ?? '—'}</Text></Text>
                  </Stack>
                ) : (
                  <Text c="#6b7280" size="sm">Passengers: <Text span c="#284361" fw={500}>{depPax ?? passengers}</Text></Text>
                )}
              </Box>
            </Group>
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
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
              {double ? (
                <Stack gap={6}>
                  <Group justify="space-between" align="center">
                    <Text c="#6b7280" size="sm">Return Date</Text>
                    <Text fw={600} c="#284361">{returnDate || '—'}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text c="#6b7280" size="sm">Return Departure Time</Text>
                    <Text fw={600} c="#284361">{returnDepartureTime || '—'}</Text>
                  </Group>
                  <Group justify="space-between" align="center">
                    <Text c="#6b7280" size="sm">Return Arrival Time</Text>
                    <Text fw={600} c="#284361">{returnArrivalTime || '—'}</Text>
                  </Group>
                </Stack>
              ) : null}
            </SimpleGrid>
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
                <Text c="#284361" fw={700} size="lg" mb={4}>{double ? routeCombined : location}</Text>
                <Text c="#284361" fw={600} size="md" mb={12}>{double ? dateRange : (departureDate || '')}</Text>
                {double ? (
                  <Text c="#6b7280" size="sm" mb={12}>{vendorSummary}</Text>
                ) : (
                  <>
                    {outboundVendorFromTitle ? (
                      <Text c="#6b7280" size="sm" mb={6}>Provider: <Text span c="#284361" fw={500}>{outboundVendorFromTitle}</Text></Text>
                    ) : null}
                    {outboundBoatFromTitle ? (
                      <Text c="#6b7280" size="sm" mb={12}>Boat: <Text span c="#284361" fw={500}>{outboundBoatFromTitle}</Text></Text>
                    ) : null}
                  </>
                )}
                <Group gap={24}>
                  {double ? (
                    <Group gap={24}>
                      <Text c="#6b7280" size="sm">Departure Passengers: <Text span c="#284361" fw={500}>{depPax ?? '—'}</Text></Text>
                      <Text c="#6b7280" size="sm">Return Passengers: <Text span c="#284361" fw={500}>{retPax ?? '—'}</Text></Text>
                    </Group>
                  ) : (
                    <Text c="#6b7280" size="sm">Passengers: <Text span c="#284361" fw={500}>{depPax ?? passengers}</Text></Text>
                  )}
                </Group>
              </Box>
            </Group>
            <Box style={{ flex: 1, ...(double ? {} : { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }) }}>
              <SimpleGrid cols={{ base: 1, md: double ? 2 : 1 }} spacing="md">
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
                {double ? (
                  <Stack gap={6}>
                    <Group justify="space-between" align="center">
                      <Text c="#6b7280" size="sm">Return Date</Text>
                      <Text fw={600} c="#284361">{returnDate || '—'}</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                      <Text c="#6b7280" size="sm">Return Departure Time</Text>
                      <Text fw={600} c="#284361">{returnDepartureTime || '—'}</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                      <Text c="#6b7280" size="sm">Return Arrival Time</Text>
                      <Text fw={600} c="#284361">{returnArrivalTime || '—'}</Text>
                    </Group>
                  </Stack>
                ) : null}
              </SimpleGrid>
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
                loading={!!loadingPayNow}
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
                loading={!!loadingViewTicket}
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
                loading={!!loadingReviewButton}
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
