import React, { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import AuthRegisterPage from '@/components/auth/register';
import { Box } from '@mantine/core';

export default function RegisterRoutePage() {
  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      {/* <Header /> */}
      <Box component="main" style={{ flex: 1 }}>
        <Suspense fallback={null}>
          <AuthRegisterPage />
        </Suspense>
      </Box>
      {/* <Footer /> */}
    </Box>
  );
}
