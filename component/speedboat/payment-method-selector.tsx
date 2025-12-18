'use client';

import React from 'react';
import { Paper, Title, Stack, Group, Text, Radio, UnstyledButton, Box, Select, Collapse, Avatar, TextInput } from '@mantine/core';
import { IconCreditCard, IconDeviceMobile, IconBuilding, IconHelpCircle } from '@tabler/icons-react';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  vaBank?: string;
  onVaBankChange?: (bank: string) => void;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvn?: string;
  cardName?: string;
  cardPhone?: string;
  onCardNumberChange?: (v: string) => void;
  onCardExpiryChange?: (v: string) => void;
  onCardCvnChange?: (v: string) => void;
  onCardNameChange?: (v: string) => void;
  onCardPhoneChange?: (v: string) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodChange,
  vaBank,
  onVaBankChange,
  cardNumber,
  cardExpiry,
  cardCvn,
  cardName,
  cardPhone,
  onCardNumberChange,
  onCardExpiryChange,
  onCardCvnChange,
  onCardNameChange,
  onCardPhoneChange
}: PaymentMethodSelectorProps) {
  return (
    <>
      <Box visibleFrom="md">
        <Paper 
          shadow="sm" 
          p="xl" 
          radius="lg"
          style={{ backgroundColor: '#eff6ff' }}
        >
          <Title order={2} size="xl" fw={700} c="#284361" mb="md">
            Select Your Payment Method
          </Title>
          <Stack gap="sm">
            <PaymentOption 
              id="virtual-account" 
              icon={<IconBuilding size={20} />} 
              title="Virtual Account" 
              subtitle="Bank Virtual Account" 
              fee="" 
              selected={selectedMethod === 'virtual-account'} 
              onSelect={() => onMethodChange('virtual-account')} 
            />
            <Collapse in={selectedMethod === 'virtual-account'}>
              <Box p="md" style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <Title order={6} size="sm" c="#374151" mb={8}>Select Bank</Title>
                <Select
                  value={vaBank}
                  onChange={(v) => onVaBankChange?.(String(v || '').toUpperCase())}
                  data={[
                    { value: 'BCA', label: 'BCA' },
                    { value: 'BNI', label: 'BNI' },
                    { value: 'MANDIRI', label: 'Mandiri' },
                    { value: 'BRI', label: 'BRI' },
                    { value: 'CIMB', label: 'CIMB' },
                    { value: 'PERMATA', label: 'Permata' },
                  ]}
                  placeholder="Select bank"
                />
                <Group mt="sm">
                  {(() => {
                    const logos: Record<string, string> = {
                      BCA: '/asset/bank/bca.svg',
                      BNI: '/asset/bank/bni.svg',
                      MANDIRI: '/asset/bank/mandiri.svg',
                      BRI: '/asset/bank/bri.svg',
                      CIMB: '/asset/bank/cimb.svg',
                      PERMATA: '/asset/bank/permata.svg',
                    };
                    const src = logos[(vaBank || '').toUpperCase()] || '';
                    return src ? (
                      <img src={src} alt={vaBank || ''} style={{ height: 24 }} />
                    ) : (
                      <Avatar radius="sm">{(vaBank || '').toUpperCase()}</Avatar>
                    );
                  })()}
                </Group>
              </Box>
            </Collapse>
            <PaymentOption 
              id="credit-card" 
              icon={<IconCreditCard size={20} />} 
              title="Credit / Debit Card" 
              subtitle="" 
              selected={selectedMethod === 'credit-card'} 
              onSelect={() => onMethodChange('credit-card')} 
            />
            <Collapse in={selectedMethod === 'credit-card'}>
              <Box p="md" style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <Title order={6} size="sm" c="#374151" mb={8}>Card Details</Title>
                <Stack gap="sm">
                  <TextInput label="Card Number" placeholder="4111 1111 1111 1111" value={cardNumber} onChange={(e) => onCardNumberChange?.(e.currentTarget.value)} />
                  <Group grow>
                    <TextInput label="Expiry (MM/YY)" placeholder="12/29" value={cardExpiry} onChange={(e) => onCardExpiryChange?.(e.currentTarget.value)} />
                    <TextInput label="CVV" placeholder="123" value={cardCvn} onChange={(e) => onCardCvnChange?.(e.currentTarget.value)} />
                  </Group>
                  <TextInput label="Name on Card" placeholder="Your name" value={cardName} onChange={(e) => onCardNameChange?.(e.currentTarget.value)} />
                  <TextInput label="Phone (E.164 format)" placeholder="+6281234567890" value={cardPhone} onChange={(e) => onCardPhoneChange?.(e.currentTarget.value)} />
                </Stack>
              </Box>
            </Collapse>
            <PaymentOption 
              id="qris" 
              icon={<IconDeviceMobile size={20} />} 
              title="QRIS" 
              subtitle="" 
              selected={selectedMethod === 'qris'} 
              onSelect={() => onMethodChange('qris')} 
            />
          </Stack>
        </Paper>
      </Box>

      <Box hiddenFrom="md">
        <Paper 
          shadow="sm" 
          p="md" 
          radius="lg"
          style={{ backgroundColor: '#eff6ff' }}
        >
          <Title order={2} size="lg" fw={700} c="#284361" mb="sm">
            Select Payment Method
          </Title>
          <Stack gap="sm">
            <PaymentOption 
              id="virtual-account" 
              icon={<IconBuilding size={18} />} 
              title="Virtual Account" 
              subtitle="BCA / Mandiri / BNI" 
              fee="Transaction fee IDR 5,000 applies" 
              selected={selectedMethod === 'virtual-account'} 
              onSelect={() => onMethodChange('virtual-account')} 
            />
            <Collapse in={selectedMethod === 'virtual-account'}>
              <Box p="sm" style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <Title order={6} size="sm" c="#374151" mb={6}>Select Bank</Title>
                <Select
                  value={vaBank}
                  onChange={(v) => onVaBankChange?.(String(v || '').toUpperCase())}
                  data={[
                    { value: 'BCA', label: 'BCA' },
                    { value: 'BNI', label: 'BNI' },
                    { value: 'MANDIRI', label: 'Mandiri' },
                    { value: 'BRI', label: 'BRI' },
                    { value: 'CIMB', label: 'CIMB' },
                    { value: 'PERMATA', label: 'Permata' },
                  ]}
                  placeholder="Select bank"
                />
              </Box>
            </Collapse>
            <PaymentOption 
              id="credit-card" 
              icon={<IconCreditCard size={18} />} 
              title="Credit / Debit Card" 
              subtitle="Processing fee 2.5% applies" 
              selected={selectedMethod === 'credit-card'} 
              onSelect={() => onMethodChange('credit-card')} 
            />
            <Collapse in={selectedMethod === 'credit-card'}>
              <Box p="sm" style={{ backgroundColor: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <Title order={6} size="sm" c="#374151" mb={6}>Card Details</Title>
                <Stack gap="sm">
                  <TextInput label="Card Number" placeholder="4111 1111 1111 1111" value={cardNumber} onChange={(e) => onCardNumberChange?.(e.currentTarget.value)} />
                  <Group grow>
                    <TextInput label="Expiry (MM/YY)" placeholder="12/29" value={cardExpiry} onChange={(e) => onCardExpiryChange?.(e.currentTarget.value)} />
                    <TextInput label="CVV" placeholder="123" value={cardCvn} onChange={(e) => onCardCvnChange?.(e.currentTarget.value)} />
                  </Group>
                  <TextInput label="Name on Card" placeholder="Your name" value={cardName} onChange={(e) => onCardNameChange?.(e.currentTarget.value)} />
                  <TextInput label="Phone (E.164 format)" placeholder="+6281234567890" value={cardPhone} onChange={(e) => onCardPhoneChange?.(e.currentTarget.value)} />
                </Stack>
              </Box>
            </Collapse>
            <PaymentOption 
              id="qris" 
              icon={<IconDeviceMobile size={18} />} 
              title="QRIS" 
              subtitle="Transaction fee IDR 5,000 applies" 
              selected={selectedMethod === 'qris'} 
              onSelect={() => onMethodChange('qris')} 
            />
          </Stack>
        </Paper>
      </Box>
    </>
  );
}

function PaymentOption({
  id,
  icon,
  title,
  subtitle,
  fee,
  selected,
  onSelect
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  fee?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <UnstyledButton 
      onClick={onSelect} 
      w="100%"
      p="md"
      style={{
        borderRadius: '8px',
        border: `2px solid ${selected ? '#284361' : '#e5e7eb'}`,
        backgroundColor: 'white',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: selected ? '#284361' : '#d1d5db'
        }
      }}
    >
      <Group justify="space-between" align="center">
        <Group gap="sm" align="center">
          <Box c={selected ? '#284361' : '#6b7280'}>
            {icon}
          </Box>
          <Stack gap={2} align="flex-start">
            <Text fw={500} c="#1a1a1a" size="sm">
              {title}
            </Text>
            <Text size="xs" c="#6b7280">
              {subtitle}
            </Text>
            {fee && (
              <Text size="xs" c="#9ca3af" mt={2}>
                {fee}
              </Text>
            )}
          </Stack>
        </Group>
        <Group gap="xs" align="center">
          {selected && <IconHelpCircle size={16} color="#9ca3af" />}
          <Box
            w={20}
            h={20}
            style={{
              borderRadius: '50%',
              border: `2px solid ${selected ? '#284361' : '#d1d5db'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {selected && (
              <Box
                w={12}
                h={12}
                style={{
                  borderRadius: '50%',
                  backgroundColor: '#284361'
                }}
              />
            )}
          </Box>
        </Group>
      </Group>
    </UnstyledButton>
  );
}
