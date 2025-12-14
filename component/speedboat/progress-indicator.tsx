import React, { Fragment } from 'react';
import { 
  Box, 
  Container, 
  Group, 
  Text, 
  ThemeIcon, 
  Progress 
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

interface ProgressIndicatorProps {
  currentStep: number;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const steps = [
    {
      number: 1,
      label: 'Passenger Info'
    },
    {
      number: 2,
      label: 'Payment'
    }
  ];

  return (
    <>
      <Box 
        visibleFrom="md"
        style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #dee2e6', 
          padding: '32px 0' 
        }}
      >
        <Container size="md">
          <Group justify="space-between" align="center">
            {steps.map((step, index) => (
              <Fragment key={step.number}>
                <Group gap="sm" align="center">
                  <ThemeIcon
                    size={40}
                    radius="xl"
                    color={
                      step.number === currentStep || step.number < currentStep
                        ? '#284361'
                        : 'gray'
                    }
                    variant="filled"
                    style={{
                      backgroundColor: 
                        step.number === currentStep || step.number < currentStep
                          ? '#284361'
                          : '#e9ecef',
                      color: 
                        step.number === currentStep || step.number < currentStep
                          ? 'white'
                          : '#6c757d'
                    }}
                  >
                    {step.number < currentStep ? (
                      <IconCheck size={20} />
                    ) : (
                      step.number
                    )}
                  </ThemeIcon>
                  <Text
                    size="sm"
                    fw={500}
                    c={
                      step.number === currentStep
                        ? '#284361'
                        : step.number < currentStep
                        ? 'dark'
                        : 'dimmed'
                    }
                  >
                    {step.label}
                  </Text>
                </Group>
                {index < steps.length - 1 && (
                  <Box style={{ flex: 1, margin: '0 16px' }}>
                    <Progress
                      value={step.number < currentStep ? 100 : 0}
                      color="#284361"
                      size="xs"
                      style={{
                        transition: 'all 0.3s ease'
                      }}
                    />
                  </Box>
                )}
              </Fragment>
            ))}
          </Group>
        </Container>
      </Box>

      <Box 
        hiddenFrom="md"
        style={{ 
          backgroundColor: 'white', 
          borderBottom: '1px solid #dee2e6', 
          padding: '16px 0' 
        }}
      >
        <Container size="xs">
          <Group justify="center" align="center">
            {steps.map((step, index) => (
              <Fragment key={step.number}>
                <Group gap={8} align="center">
                  <ThemeIcon
                    size={28}
                    radius="xl"
                    variant="filled"
                    style={{
                      backgroundColor: 
                        step.number === currentStep || step.number < currentStep
                          ? '#284361'
                          : '#e9ecef',
                      color: 
                        step.number === currentStep || step.number < currentStep
                          ? 'white'
                          : '#6c757d'
                    }}
                  >
                    {step.number < currentStep ? <IconCheck size={16} /> : step.number}
                  </ThemeIcon>
                  <Text
                    size="xs"
                    fw={500}
                    c={
                      step.number === currentStep
                        ? '#284361'
                        : step.number < currentStep
                        ? 'dark'
                        : 'dimmed'
                    }
                  >
                    {step.label}
                  </Text>
                </Group>
                {index < steps.length - 1 && (
                  <Box style={{ width: 40, marginInline: 8 }}>
                    <Progress
                      value={step.number < currentStep ? 100 : 0}
                      color="#284361"
                      size="xs"
                    />
                  </Box>
                )}
              </Fragment>
            ))}
          </Group>
        </Container>
      </Box>
    </>
  );
}
