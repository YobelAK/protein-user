import React, { Suspense } from 'react';
import FastboatPageContent from '@/component/fastboat/page-content';

export default function FastboatPage() {
  return (
    <Suspense fallback={null}>
      <FastboatPageContent />
    </Suspense>
  );
}
