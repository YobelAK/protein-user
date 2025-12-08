import React from 'react';
import { Box, Container, Title, Text, Button, Stack } from '@mantine/core';
import Link from 'next/link';
import homeImg from '../../public/asset/pic/home.png';

export function Hero() {
  return (
    <Box
      style={{
        position: 'relative',
        height: '500px',
        width: '100%',
        backgroundImage:
          `linear-gradient(rgba(40,67,97,0.35), rgba(30,58,95,0.35)), url(${homeImg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
      }}
    >
      <Container size="xl" style={{ position: 'relative', zIndex: 1, textAlign: 'left' }}>
        <Box style={{ maxWidth: '600px' }}>
          <Stack gap="lg" align="flex-start">
            <Title
              order={1}
              size="xl"
              fw={700}
              c="white"
              style={{ 
                lineHeight: 1.1,
                fontSize: '3rem',
                textAlign: 'left'
              }}
            >
              Book Fast, Sail Faster
            </Title>
            <Text
              size="xl"
              c="gray.1"
              style={{ lineHeight: 1.6 }}
            >
              Explore Bali and the Gili Islands effortlessly with our trusted
              booking service.
            </Text>
            <Button
              size="lg"
              color="#2dbe8d"
              style={{
                fontWeight: 600,
                padding: '12px 32px',
                fontSize: '16px'
              }}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: '#25a378'
                  }
                }
              }}
              component={Link}
              href="/speedboat"
            >
              Book Now
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
