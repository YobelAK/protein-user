'use client';

import React, { useState, useEffect } from 'react';
import { Menu as MenuIcon, X, ChevronDown, Globe, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  AppShell, 
  Group, 
  Burger, 
  Button, 
  Avatar, 
  Text, 
  Anchor, 
  Collapse, 
  Stack, 
  Divider,
  Box,
  Container
} from '@mantine/core';
import { Menu as DropdownMenu } from '@mantine/core';
import { supabase } from '@/lib/supabase/client';
import { useDisclosure } from '@mantine/hooks';

export function Header() {
  const [mobileMenuOpen, { toggle: toggleMobileMenu, close: closeMobileMenu }] = useDisclosure(false);
  const pathname = usePathname();
  const router = useRouter();
  const [userInitials, setUserInitials] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const computeInitials = (name: string) => {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 0) return null;
      const first = parts[0]?.[0] || '';
      const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
      const letters = (first + last).toUpperCase();
      return letters || null;
    };
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const full = (session.user as any).user_metadata?.full_name || '';
        const email = session.user.email || '';
        const name = full || email.split('@')[0] || '';
        setUserName(name);
        setUserInitials(computeInitials(name));
      } else {
        setUserName('');
        setUserInitials(null);
      }
    };
    init();
    const { data: listener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (session) {
        const full = (session.user as any).user_metadata?.full_name || '';
        const email = session.user.email || '';
        const name = full || email.split('@')[0] || '';
        setUserName(name);
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
        const letters = (first + last).toUpperCase();
        setUserInitials(letters || null);
      } else {
        setUserName('');
        setUserInitials(null);
      }
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/speedboat', label: 'Speedboat' },
    { href: '/watersport', label: 'Watersport' },
    { href: '/tour', label: 'Tours' },
    { href: '/beachclub', label: 'Beach Club' },
    { href: '/promo', label: 'Promo' },
  ];

  return (
    <Box 
      component="header" 
      style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 
        position: 'sticky', 
        top: 0, 
        zIndex: 50 
      }}
    >
      <Container size="xl" px="md">
        <Group justify="space-between" h={64}>
          {/* Logo */}
          <Group>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Group gap="sm">
                <Avatar 
                  size="md" 
                  color="primary" 
                  style={{ backgroundColor: '#284361' }}
                >
                  N
                </Avatar>
                <Text fw={700} size="lg" c="dark">Name</Text>
              </Group>
            </Link>
          </Group>

          {/* Desktop Navigation */}
          <Group gap="xl" visibleFrom="md">
            {/* {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ 
                  textDecoration: 'none',
                  color: isActive(item.href) ? '#284361' : '#6c757d',
                  fontWeight: isActive(item.href) ? 500 : 400,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#284361';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isActive(item.href) ? '#284361' : '#6c757d';
                }}
              >
                {item.label}
              </Link>
            ))} */}
          </Group>

          {/* Right Side Actions */}
          <Group gap="md" visibleFrom="md">
            {/* <Button 
              variant="subtle" 
              color="gray" 
              leftSection={<Globe size={16} />}
              rightSection={<ChevronDown size={16} />}
              size="sm"
            >
              EN
            </Button>
            <Button 
              variant="subtle" 
              color="gray" 
              leftSection={<DollarSign size={16} />}
              rightSection={<ChevronDown size={16} />}
              size="sm"
            >
              IDR
            </Button> */}
            {!userInitials && (
              <>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <Button variant="subtle" color="gray" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register" style={{ textDecoration: 'none' }}>
                  <Button color="primary" size="sm" style={{ backgroundColor: '#284361' }}>
                    Register
                  </Button>
                </Link>
              </>
            )}
            {userInitials && (
              <DropdownMenu position="bottom-end" shadow="md">
                <DropdownMenu.Target>
                  <Avatar 
                    size={40} 
                    radius="xl" 
                    style={{ backgroundColor: '#284361', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {userInitials}
                  </Avatar>
                </DropdownMenu.Target>
                <DropdownMenu.Dropdown>
                  <DropdownMenu.Label>{userName}</DropdownMenu.Label>
                  <DropdownMenu.Item onClick={() => router.push('/profile')}>My Profile</DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => router.push('/profile/my-bookings')}>My Bookings</DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => router.push('/profile/saved-travelers')}>Saved Travelers</DropdownMenu.Item>
                  <DropdownMenu.Item onClick={() => router.push('/profile/support-center')}>Support Center</DropdownMenu.Item>
                  <DropdownMenu.Item onClick={async () => { await supabase.auth.signOut(); setUserInitials(null); setUserName(''); router.push('/'); }}>Logout</DropdownMenu.Item>
                </DropdownMenu.Dropdown>
              </DropdownMenu>
            )}
            
          </Group>

          {/* Mobile Menu Button */}
          <Burger 
            opened={mobileMenuOpen} 
            onClick={toggleMobileMenu} 
            hiddenFrom="md" 
            size="sm" 
          />
        </Group>

          {/* Mobile Menu */}
          <Collapse in={mobileMenuOpen}>
            <Box hiddenFrom="md" py="md">
              <Divider mb="md" />
              <Stack gap="md">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    textDecoration: 'none',
                    color: isActive(item.href) ? '#284361' : '#6c757d',
                    fontWeight: isActive(item.href) ? 500 : 400
                  }}
                  onClick={closeMobileMenu}
                >
                  {item.label}
                </Link>
              ))}
              <Divider my="md" />
              <Group>
                {!userInitials && (
                  <>
                    <Link href="/login" style={{ textDecoration: 'none' }} onClick={closeMobileMenu}>
                      <Button variant="subtle" color="gray" size="sm">
                        Login
                      </Button>
                    </Link>
                    <Link href="/register" style={{ textDecoration: 'none' }} onClick={closeMobileMenu}>
                      <Button 
                        color="primary" 
                        size="sm"
                        style={{ backgroundColor: '#284361' }}
                      >
                        Register
                      </Button>
                    </Link>
                  </>
                )}
                {userInitials && (
                  <DropdownMenu position="bottom-end" shadow="md">
                    <DropdownMenu.Target>
                      <Avatar 
                        size={40} 
                        radius="xl" 
                        style={{ backgroundColor: '#284361', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {userInitials}
                      </Avatar>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                      <DropdownMenu.Label>{userName}</DropdownMenu.Label>
                      <DropdownMenu.Item onClick={() => { router.push('/profile'); closeMobileMenu(); }}>My Profile</DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => { router.push('/profile/my-bookings'); closeMobileMenu(); }}>My Bookings</DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => { router.push('/profile/saved-travelers'); closeMobileMenu(); }}>Saved Travelers</DropdownMenu.Item>
                      <DropdownMenu.Item onClick={() => { router.push('/profile/support-center'); closeMobileMenu(); }}>Support Center</DropdownMenu.Item>
                      <DropdownMenu.Item onClick={async () => { await supabase.auth.signOut(); setUserInitials(null); setUserName(''); closeMobileMenu(); router.push('/'); }}>Logout</DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                  </DropdownMenu>
                )}
              </Group>
              </Stack>
            </Box>
          </Collapse>
      </Container>
    </Box>
  );
}
