import React from 'react';
import { Stack } from '@mantine/core';
import { ResultCard } from './result-card';
import type { ResultCardProps } from './result-card';

interface ResultsSectionProps {
  results: ResultCardProps[];
}

export function ResultsSection({ results }: ResultsSectionProps) {
  return (
    <Stack gap="md" style={{ flex: 1, color: '#000000' }}>
      {results.map((result, index) => (
        <ResultCard key={result.id ?? index} {...result} />
      ))}
    </Stack>
  );
}
