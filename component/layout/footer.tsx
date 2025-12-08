'use client'

import Link from 'next/link'
import { Box, Container, SimpleGrid, Title, Text, Group, ActionIcon, Stack, Divider } from '@mantine/core'
import { IconBrandFacebook, IconBrandTwitter, IconBrandInstagram, IconBrandYoutube, IconMail, IconPhone, IconMapPin } from '@tabler/icons-react'
import '../../styles/footer.css'

export function Footer() {
  return (
    <Box component="footer" style={{ backgroundColor: '#284361', color: 'white' }}>
      <Container size="xl" py="xl">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl" mb="xl">
          {/* About */}
          <Stack gap="md">
            <Title order={3} size="lg" c="white">About Name</Title>
            <Text size="sm" c="gray.3" mb="md">
              Your trusted partner for island adventures in Bali and beyond. We
              provide safe, reliable, and unforgettable experiences.
            </Text>
            <Group gap="sm">
              <ActionIcon 
                variant="subtle" 
                color="white" 
                size="lg" 
                radius="xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <IconBrandFacebook size={16} />
              </ActionIcon>
              <ActionIcon 
                variant="subtle" 
                color="white" 
                size="lg" 
                radius="xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <IconBrandInstagram size={16} />
              </ActionIcon>
              <ActionIcon 
                variant="subtle" 
                color="white" 
                size="lg" 
                radius="xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <IconBrandTwitter size={16} />
              </ActionIcon>
              <ActionIcon 
                variant="subtle" 
                color="white" 
                size="lg" 
                radius="xl"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                }}
              >
                <IconBrandYoutube size={16} />
              </ActionIcon>
            </Group>
          </Stack>

          {/* Our Products */}
          <Stack gap="md">
            <Title order={3} size="lg" c="white">Our Products</Title>
            <Stack gap="xs">
              <Link 
                href="/speedboat" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Speedboat Services
              </Link>
              <Link 
                href="/tour" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Tour Packages
              </Link>
              <Link 
                href="/watersport" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Watersport Activities
              </Link>
              <Link 
                href="/beachclub" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Beach Club Access
              </Link>
              <Link 
                href="/promo" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Special Offers
              </Link>
            </Stack>
          </Stack>

          {/* Support */}
          <Stack gap="md">
            <Title order={3} size="lg" c="white">Support</Title>
            <Stack gap="xs">
              <Link 
                href="/help" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Help Center
              </Link>
              <Link 
                href="/contact" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Contact Us
              </Link>
              <Link 
                href="/faq" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                FAQ
              </Link>
              <Link 
                href="/terms" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Terms of Service
              </Link>
              <Link 
                href="/privacy" 
                style={{ 
                  textDecoration: 'none',
                  color: '#d1d5db',
                  fontSize: '14px',
                  transition: 'color 0.2s'
                }}
                className="footer-link"
              >
                Privacy Policy
              </Link>
            </Stack>
          </Stack>

          {/* Contact */}
          <Stack gap="md">
            <Title order={3} size="lg" c="white">Contact</Title>
            <Stack gap="sm">
              <Group gap="sm" align="flex-start">
                <IconMapPin size={20} style={{ marginTop: 2, flexShrink: 0 }} />
                <Text size="sm" c="gray.3">
                  Jl. Danau Tamblingan No.123, Sanur, Bali 80228
                </Text>
              </Group>
              <Group gap="sm" align="center">
                <IconPhone size={20} style={{ flexShrink: 0 }} />
                <Text size="sm" c="gray.3">
                  +62 361 123 4567
                </Text>
              </Group>
              <Group gap="sm" align="center">
                <IconMail size={20} style={{ flexShrink: 0 }} />
                <Text size="sm" c="gray.3">
                  info@name.com
                </Text>
              </Group>
            </Stack>
          </Stack>
        </SimpleGrid>
        
        <Divider color="rgba(255, 255, 255, 0.1)" />
        
        <Box pt="xl" ta="center">
          <Text size="sm" c="gray.3">
            &copy; 2024 Name. All rights reserved.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}