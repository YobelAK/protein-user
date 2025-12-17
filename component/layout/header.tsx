'use client';

import React, { Suspense } from 'react';
import { Menu as MenuIcon, X, ChevronDown, Globe, DollarSign, User, CalendarDays, Users, LifeBuoy, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { 
  AppShell, 
  Group, 
  Button, 
  Avatar, 
  Text, 
  Anchor, 
  Collapse, 
  Stack, 
  Divider,
  Box,
  Container,
  Loader
} from '@mantine/core';
import { Menu } from '@mantine/core';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
 

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [navLoginLoading, setNavLoginLoading] = React.useState(false);
  const [navRegisterLoading, setNavRegisterLoading] = React.useState(false);

  const computeInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'NA';
    const first = parts[0]?.[0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] || '' : '';
    const letters = (first + last).toUpperCase();
    return letters || 'NA';
  };

  const userName = React.useMemo(() => {
    const full = (auth?.fullName || '').trim();
    const email = (auth?.email || '').trim();
    return full || (email ? email.split('@')[0] : '');
  }, [auth?.fullName, auth?.email]);
  const userInitials = auth ? computeInitials(userName) : null;
  const avatarUrl = auth?.avatarUrl || '';
  const [avatarSrc, setAvatarSrc] = React.useState<string>('');
  React.useEffect(() => {
    const url = String(avatarUrl || '');
    setAvatarSrc(url || '');
    const idx = url.indexOf('/storage/v1/object/public/avatars/');
    if (idx >= 0) {
      const path = url.slice(idx + '/storage/v1/object/public/avatars/'.length);
      if (path) {
        (async () => {
          try {
            const res = await (supabase as any).storage.from('avatars').createSignedUrl(path, 3600);
            const signed = res?.data?.signedUrl || '';
            if (signed) setAvatarSrc(signed);
          } catch {}
        })();
      }
    }
  }, [avatarUrl]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const currentRedirect = React.useMemo(() => {
    try {
      const path = pathname || '/';
      const qs = searchParams?.toString() || '';
      return qs ? `${path}?${qs}` : path;
    } catch { return pathname || '/'; }
  }, [pathname, searchParams]);
  React.useEffect(() => {
    try {
      const x = currentRedirect || '/';
      if (typeof window !== 'undefined') {
        localStorage.setItem('last_path', x);
      }
    } catch {}
  }, [currentRedirect]);
 
  return (
    <Suspense fallback={<Box component="header" style={{ height: 64 }} />}>
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
              <Group gap="sm" align="center">
                <img
                  src="/asset/logo/besttripguide.png"
                  alt="Best Trip Guide"
                  style={{ height: 50}}
                />
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
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  loading={navLoginLoading}
                  onClick={() => {
                    if (navLoginLoading) return;
                    setNavLoginLoading(true);
                    router.push(`/login?redirectTo=${encodeURIComponent(currentRedirect || '/')}`);
                  }}
                >
                  Login
                </Button>
                <Button
                  color="primary"
                  size="sm"
                  style={{ backgroundColor: '#284361' }}
                  loading={navRegisterLoading}
                  onClick={() => {
                    if (navRegisterLoading) return;
                    setNavRegisterLoading(true);
                    router.push(`/register?redirectTo=${encodeURIComponent(currentRedirect || '/')}`);
                  }}
                >
                  Register
                </Button>
              </>
            )}
            {userInitials && (
              <Menu position="bottom-end" shadow="md">
                <Menu.Target>
                  <Avatar size={40} radius="xl" src={avatarSrc || undefined} style={{ cursor: 'pointer', border: '2px solid #284361' }} />
                </Menu.Target>
                <Menu.Dropdown style={{ borderRadius: 12, border: '1px solid #e6e7ea', fontFamily: 'Georgia, Times, "Times New Roman", serif' }}>
                  <Menu.Label style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif', fontWeight: 600, color: '#284361', marginBottom: 6 }}>{userName}</Menu.Label>
                  <Menu.Item leftSection={<User size={16} />} style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }} onClick={() => router.push('/profile')}>My Profile</Menu.Item>
                  <Menu.Item leftSection={<CalendarDays size={16} />} style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }} onClick={() => router.push('/profile/my-bookings')}>My Bookings</Menu.Item>
                  <Menu.Item leftSection={<Users size={16} />} style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }} onClick={() => router.push('/profile/saved-travelers')}>Saved Travelers</Menu.Item>
                  <Menu.Item leftSection={<LifeBuoy size={16} />} style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }} onClick={() => router.push('/profile/support-center')}>Support Center</Menu.Item>
                  <Menu.Item
                    leftSection={<LogOut size={16} />}
                    rightSection={logoutLoading ? <Loader size="xs" color="#284361" /> : undefined}
                    disabled={logoutLoading}
                    style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }}
                    onClick={async () => {
                      if (logoutLoading) return;
                      setLogoutLoading(true);
                      try {
                        await supabase.auth.signOut();
                        router.push('/');
                      } catch {
                      } finally {
                        setLogoutLoading(false);
                      }
                    }}
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
            
          </Group>
          <Group gap="md" hiddenFrom="md">
            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <Avatar size={40} radius="xl" src={avatarSrc || undefined} style={{ cursor: 'pointer', border: '2px solid #284361' }} />
              </Menu.Target>
              <Menu.Dropdown style={{ borderRadius: 12, border: '1px solid #e6e7ea', fontFamily: 'Georgia, Times, "Times New Roman", serif' }}>
                {userInitials ? (
                  <>
                    <Menu.Label style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif', fontWeight: 600, color: '#284361', marginBottom: 6 }}>{userName}</Menu.Label>
                    <Menu.Item leftSection={<User size={16} />} style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }} onClick={() => router.push('/profile')}>My Profile</Menu.Item>
                    <Menu.Item leftSection={<CalendarDays size={16} />} style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }} onClick={() => router.push('/profile/my-bookings')}>My Bookings</Menu.Item>
                    <Menu.Item leftSection={<Users size={16} />} style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }} onClick={() => router.push('/profile/saved-travelers')}>Saved Travelers</Menu.Item>
                    <Menu.Item leftSection={<LifeBuoy size={16} />} style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }} onClick={() => router.push('/profile/support-center')}>Support Center</Menu.Item>
                    <Menu.Item
                      leftSection={<LogOut size={16} />}
                      rightSection={logoutLoading ? <Loader size="xs" color="#284361" /> : undefined}
                      disabled={logoutLoading}
                      style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }}
                      onClick={async () => {
                        if (logoutLoading) return;
                        setLogoutLoading(true);
                        try {
                          await supabase.auth.signOut();
                          router.push('/');
                        } catch {
                        } finally {
                          setLogoutLoading(false);
                        }
                      }}
                    >
                      Logout
                    </Menu.Item>
                  </>
                ) : (
                  <>
                    <Menu.Item
                      style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }}
                      rightSection={navLoginLoading ? <Loader size="xs" color="#284361" /> : undefined}
                      disabled={navLoginLoading}
                      onClick={() => {
                        if (navLoginLoading) return;
                        setNavLoginLoading(true);
                        router.push(`/login?redirectTo=${encodeURIComponent(currentRedirect || '/')}`);
                      }}
                    >
                      Login
                    </Menu.Item>
                    <Menu.Item
                      style={{ fontFamily: 'Georgia, Times, "Times New Roman", serif' }}
                      rightSection={navRegisterLoading ? <Loader size="xs" color="#284361" /> : undefined}
                      disabled={navRegisterLoading}
                      onClick={() => {
                        if (navRegisterLoading) return;
                        setNavRegisterLoading(true);
                        router.push(`/register?redirectTo=${encodeURIComponent(currentRedirect || '/')}`);
                      }}
                    >
                      Register
                    </Menu.Item>
                  </>
                )}
              </Menu.Dropdown>
            </Menu>
            </Group>
   
          </Group>
        </Container>
      </Box>
    </Suspense>
  );
}
