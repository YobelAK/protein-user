'use client';

import '@mantine/core/styles.css';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { supabase } from '@/lib/supabase/client';

type AuthInfo = {
  userId?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
} | null;

type AuthCtx = { auth: AuthInfo; setAuth: (info: AuthInfo) => void };
export const AuthContext = React.createContext<AuthCtx>({ auth: null, setAuth: () => {} });
export function useAuth() { return React.useContext(AuthContext).auth; }
export function useSetAuth() { return React.useContext(AuthContext).setAuth; }

export function Providers({ children, initialAuth }: { children: React.ReactNode; initialAuth?: AuthInfo }) {
  const [auth, setAuth] = React.useState<AuthInfo>(initialAuth ?? null);

  React.useEffect(() => {
    const updateAuthFromSession = async (session: any) => {
      if (session) {
        const full = (session.user as any)?.user_metadata?.full_name || '';
        const email = String(session.user?.email || '');
        let avatarUrl = '';
        let fullName = full;
        if (email) {
          try {
            const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
            if (res.ok) {
              const data = await res.json();
              fullName = data?.fullName || fullName;
              avatarUrl = data?.avatarUrl || '';
            }
          } catch {}
        }
        setAuth({ userId: session.user?.id, email, fullName, avatarUrl });
      } else {
        setAuth(null);
      }
    };

    (async () => {
      try {
        const { data: { session } } = await (supabase as any).auth.getSession();
        await updateAuthFromSession(session);
      } catch {}
    })();

    const sub = (supabase as any).auth.onAuthStateChange(async (_event: any, session: any) => {
      await updateAuthFromSession(session);
    });
    return () => { try { sub?.data?.subscription?.unsubscribe?.(); } catch {} };
  }, []);

  return (
    <MantineProvider>
      <AuthContext.Provider value={{ auth, setAuth }}>{children}</AuthContext.Provider>
    </MantineProvider>
  );
}
