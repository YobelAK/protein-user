import React, { Suspense } from 'react';
import { Box } from '@mantine/core';
import AuthLoginPage from '@/components/auth/page';

export default function LoginRoutePage() {
  return (
    <Box style={{ minHeight: '100vh', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      <Box component="main" style={{ flex: 1 }}>
        <Suspense fallback={null}>
          <AuthLoginPage />
        </Suspense>
      </Box>
    </Box>
  );
}
