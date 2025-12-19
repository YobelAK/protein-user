"use client";
import React, { useEffect, useState } from 'react';
import { Box, Container, Title, Text, Button, Stack, Loader } from '@mantine/core';
import Link from 'next/link';
import homeImg from '../../public/asset/pic/home.png';

export function Hero() {
  const [isMobile, setIsMobile] = useState(false);
  const [bgLoading, setBgLoading] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setBgLoading(false);
    img.onerror = () => setBgLoading(false);
    img.src = homeImg.src;
    const t = setTimeout(() => setBgLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const heroHeight = isMobile ? 360 : 500;
  const titleSize = isMobile ? 'clamp(1.75rem, 7vw, 2.25rem)' : '3rem';
  const textSize = isMobile ? '1rem' : '1.25rem';
  const buttonSize = isMobile ? 'md' : 'lg';
  const justify = isMobile ? 'center' : 'flex-start';
  const align = isMobile ? 'center' : 'flex-start';

  return (
    <Box
      style={{
        position: 'relative',
        height: heroHeight,
        width: '100%',
        backgroundImage:
          `linear-gradient(rgba(40,67,97,0.35), rgba(30,58,95,0.35)), url(${homeImg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: justify
      }}
    >
      {bgLoading && (
        <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <Loader color="#284361" />
        </Box>
      )}
      <Container size="xl" style={{ position: 'relative', zIndex: 1, textAlign: isMobile ? 'center' : 'left' }}>
        <Box style={{ maxWidth: isMobile ? '100%' : '600px' }}>
          <Stack gap="lg" align={align}>
            <Title
              order={1}
              size="xl"
              fw={700}
              c="white"
              style={{ 
                lineHeight: 1.1,
                fontSize: titleSize,
                textAlign: isMobile ? 'center' : 'left'
              }}
            >
              Book Fast, Sail Faster
            </Title>
            <Text
              size={isMobile ? 'md' : 'xl'}
              c="gray.1"
              style={{ lineHeight: 1.6, fontSize: textSize }}
            >
              Explore Bali and the Gili Islands effortlessly with our trusted
              booking service.
            </Text>
            <Button
              size={buttonSize}
              color="#2dbe8d"
              style={{
                fontWeight: 600,
                padding: isMobile ? '10px 24px' : '12px 32px',
                fontSize: isMobile ? '14px' : '16px'
              }}
              styles={{
                root: {
                  '&:hover': {
                    backgroundColor: '#25a378'
                  }
                }
              }}
              component={Link}
              href="/fastboat"
            >
              Book Now
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
