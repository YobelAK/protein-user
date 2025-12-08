import React from 'react';
import Link from 'next/link';
import { 
  Card, 
  Group, 
  Avatar, 
  Text, 
  Stack, 
  Box, 
  Button, 
  Table,
  Divider
} from '@mantine/core';

export interface ResultCardProps {
  id?: string | number;
  provider: string;
  logo: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  origin: string;
  destination: string;
  prices: {
    indonesian: {
      adult: number;
      child: number;
    };
    foreigner: {
      adult: number;
      child: number;
    };
  };
}

export function ResultCard({
  id,
  provider,
  logo,
  departureTime,
  arrivalTime,
  duration,
  origin,
  destination,
  prices
}: ResultCardProps) {
  const formatPrice = (price: number) => {
    return `Rp ${price.toLocaleString('id-ID')}`;
  };

  const priceIdr = prices.indonesian.adult;
  const href = `/speedboat/book?sid=${encodeURIComponent(String(id ?? ''))}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&departure=${encodeURIComponent(departureTime)}&provider=${encodeURIComponent(provider)}&priceIdr=${encodeURIComponent(String(priceIdr))}`;

  return (
    <Card 
      shadow="sm" 
      padding="xl" 
      radius="lg" 
      withBorder
      style={{ 
        backgroundColor: 'white',
        transition: 'box-shadow 0.2s ease',
        ':hover': { boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }
      }}
    >
      <Group align="flex-start" gap="xl">
        <Avatar
          src={logo}
          alt={provider}
          size={64}
          style={{
            border: '2px solid #fd7e14',
            flexShrink: 0
          }}
        />
        
        <Stack gap="md" style={{ flex: 1 }}>
          <Text fw={600} size="lg" c="dark">
            {provider}
          </Text>
          
          <Group gap="xl" align="center">
            <Stack gap="xs" align="center">
              <Text size="xl" fw={700} c="dark">
                {departureTime}
              </Text>
              <Text size="sm" c="dimmed">{origin}</Text>
            </Stack>
            
            <Stack gap="xs" align="center" style={{ flex: 1 }}>
              <Text size="xs" c="dimmed">{duration}</Text>
              <Box style={{ position: 'relative', width: '100%', height: '1px', backgroundColor: '#dee2e6' }}>
                <Box 
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#6c757d'
                  }}
                />
                <Box 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: '#6c757d'
                  }}
                />
              </Box>
            </Stack>
            
            <Stack gap="xs" align="center">
              <Text size="xl" fw={700} c="dark">
                {arrivalTime}
              </Text>
              <Text size="sm" c="dimmed">{destination}</Text>
            </Stack>
          </Group>
        </Stack>
        
        <Box 
          style={{ 
            backgroundColor: '#e8f1f5', 
            borderRadius: 8, 
            padding: 16, 
            minWidth: 300,
            color: '#000000 !important'
          }}
          c="dark"
        >
          <Table
            styles={{
              th: {
                color: '#000000 !important',
                fontWeight: 600
              },
              td: {
                color: '#000000 !important',
                fontWeight: 500
              },
              table: {
                color: '#000000 !important'
              }
            }}
            c="dark"
          >
            <thead>
              <tr>
                <th style={{ color: '#000000', fontWeight: 600 }}>Nationality</th>
                <th style={{ color: '#000000', fontWeight: 600 }}>Adult</th>
                <th style={{ color: '#000000', fontWeight: 600 }}>Child</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: '#000000', fontWeight: 500 }}>Indonesian</td>
                <td style={{ color: '#000000', fontWeight: 500 }}>{formatPrice(prices.indonesian.adult)}</td>
                <td style={{ color: '#000000', fontWeight: 500 }}>{formatPrice(prices.indonesian.child)}</td>
              </tr>
              <tr>
                <td style={{ color: '#000000', fontWeight: 500 }}>Foreigner</td>
                <td style={{ color: '#000000', fontWeight: 500 }}>{formatPrice(prices.foreigner.adult)}</td>
                <td style={{ color: '#000000', fontWeight: 500 }}>{formatPrice(prices.foreigner.child)}</td>
              </tr>
            </tbody>
          </Table>
          
          <Divider my="md" />
          
          <Link href={href}>
            <Button
              fullWidth
              color="#284361"
              variant="filled"
              fw={600}
              style={{
                backgroundColor: '#284361',
                ':hover': { backgroundColor: '#0075ff' }
              }}
            >
              Book Now
            </Button>
          </Link>
        </Box>
      </Group>
    </Card>
  );
}
