import React from 'react';
import { Stack, Box, Loader } from '@mantine/core';
import { ResultCard } from './result-card';
import type { ResultCardProps } from './result-card';

interface ResultsSectionProps {
  results: ResultCardProps[];
  loading?: boolean;
}

export function ResultsSection({ results, loading }: ResultsSectionProps) {
  return (
    <Stack gap="md" style={{ flex: 1, color: '#000000' }}>
      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 224 }}>
          <Loader color="#284361" />
        </Box>
      ) : (
        results.map((result, index) => (
          <ResultCard key={result.id ?? index} {...result} />
        ))
      )}
    </Stack>
  );
}
