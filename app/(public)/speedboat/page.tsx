import React, { Suspense } from 'react';
import SpeedboatPageContent from '@/components/speedboat/page-content';

export default function SpeedboatPage() {
  return (
    <Suspense fallback={null}>
      <SpeedboatPageContent />
    </Suspense>
  );
}
