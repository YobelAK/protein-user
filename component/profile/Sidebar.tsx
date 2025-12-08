'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Box, Stack, Group, Text } from '@mantine/core';
import { User, Briefcase, Users, CreditCard, MessageCircle, LogOut, Heart } from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const menuItems = [
    { icon: User, label: 'My Profile', href: '/profile', badge: null },
    { icon: Briefcase, label: 'My Bookings', href: '/profile/my-bookings', badge: 2 },
    { icon: Users, label: 'Saved Travelers', href: '/profile/saved-travelers', badge: null },
    { icon: CreditCard, label: 'Payment History', href: '/profile/payment-history', badge: null },
    { icon: Heart, label: 'Wishllist', href: '/profile/wishlist', badge: null },
    { icon: MessageCircle, label: 'Support Center', href: '/profile/support-center', badge: null },
  ];

  const itemStyles = (active: boolean) => ({
    backgroundColor: active ? '#284361' : 'transparent',
    color: active ? '#ffffff' : '#284361',
    borderRadius: 8,
    padding: '12px 16px',
    transition: 'all 150ms ease',
    boxShadow: active ? '0 4px 10px rgba(0,0,0,0.15)' : 'none',
  });

  const itemHoverStyles = (active: boolean) => ({
    backgroundColor: active ? '#284361' : '#ffffff',
  });

  return (
    <Box w={224} p={16} style={{ backgroundColor: '#e8f1f5', minHeight: 'calc(100vh - 64px)' }} component="aside">
      <nav>
        <Stack gap={8}>
          {menuItems.map((item) => {
            const isActive =
              (item.label === 'My Profile' && pathname === '/profile') ||
              (item.label === 'My Bookings' && pathname?.startsWith('/profile/my-bookings')) ||
              (item.label === 'Saved Travelers' && pathname?.startsWith('/profile/saved-travelers')) ||
              (item.label === 'Payment History' && pathname?.startsWith('/profile/payment-history')) ||
              (item.label === 'Wishllist' && pathname?.startsWith('/profile/wishlist')) ||
              (item.label === 'Support Center' && pathname?.startsWith('/profile/support-center'));
            return (
            <Link key={item.label} href={item.href as string} style={{ textDecoration: 'none' }}>
              <Box
                style={itemStyles(isActive)}
                onMouseEnter={(e) => {
                  Object.assign((e.currentTarget as HTMLElement).style, itemHoverStyles(isActive));
                }}
                onMouseLeave={(e) => {
                  Object.assign((e.currentTarget as HTMLElement).style, itemStyles(isActive));
                }}
              >
                <Group gap={12} align="center">
                  <item.icon size={20} color={isActive ? '#ffffff' : '#284361'} />
                  <Text fw={500} style={{ flex: 1 }} c={isActive ? '#ffffff' : '#284361'}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <Box
                      style={{
                        backgroundColor: '#2dbe8d',
                        color: '#ffffff',
                        fontSize: 12,
                        fontWeight: 700,
                        borderRadius: '9999px',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {item.badge}
                    </Box>
                  )}
                </Group>
              </Box>
            </Link>
          )})}

          <Box style={{ paddingTop: 16, marginTop: 16, borderTop: '1px solid rgba(40, 67, 97, 0.2)' }}>
            <Link href="#" style={{ textDecoration: 'none' }}>
              <Box
                style={itemStyles(false)}
                onMouseEnter={(e) => {
                  Object.assign((e.currentTarget as HTMLElement).style, itemHoverStyles(false));
                }}
                onMouseLeave={(e) => {
                  Object.assign((e.currentTarget as HTMLElement).style, itemStyles(false));
                }}
              >
                <Group gap={12} align="center">
                  <LogOut size={20} color={'#284361'} />
                  <Text fw={500} c="#284361">Logout</Text>
                </Group>
              </Box>
            </Link>
          </Box>
        </Stack>
      </nav>
    </Box>
  );
}