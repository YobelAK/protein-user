"use client";
import React, { useEffect, useState } from 'react';
import { Box, Text, Group, Container } from '@mantine/core';
import { Header } from '@/components/layout/header';
// import { Sidebar } from '@/components/profile/Sidebar';
import { DateFilter } from '@/components/profile/DateFilter';
import { TransactionTable } from '@/components/profile/TransactionTable';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Page() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login?redirectTo=/profile/payment-history');
      }
    };
    check();
  }, []);
  return (
    <Box style={{ width: '100%', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <Header />
      <Box component="main">
        <Container size="xl" py="xl">
          <Group justify="space-between" align="flex-start" mb={24}>
            <Box>
              <Text style={{ fontSize: 30, fontWeight: 700, color: '#284361', marginBottom: 8 }}>
                Payment History
              </Text>
              <Text style={{ color: '#6b7280' }}>
                Track all your previous transactions.
              </Text>
            </Box>
            <DateFilter
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
            />
          </Group>

          <TransactionTable fromDate={fromDate} toDate={toDate} />
        </Container>
      </Box>
    </Box>
  );
}
