import { ColorSchemeScript } from '@mantine/core';
import { headers } from 'next/headers';
import { getSupabaseServerClient } from '@/lib/supabase/server';
export const metadata = {
  title: "Best Trip Guide",
  description: "User-facing app for booking fastboat/speedboat",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const Providers = require('./providers').Providers;
  let initialAuth: { userId?: string; email?: string; fullName?: string; avatarUrl?: string } | null = null;
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user && (user.email || user.id)) {
      const email = user.email || '';
      const hdrs = await headers();
      const host = hdrs.get('host') || `localhost:${process.env.PORT || 3000}`;
      const proto = hdrs.get('x-forwarded-proto') || 'http';
      const origin = `${proto}://${host}`;
      let fullName = (user as any)?.user_metadata?.full_name || '';
      let avatarUrl = '';
      if (email) {
        try {
          const res = await fetch(`${origin}/api/profile?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
          if (res.ok) {
            const d = await res.json();
            fullName = d?.fullName || fullName || '';
            avatarUrl = d?.avatarUrl || '';
          }
        } catch {}
      }
      initialAuth = { userId: user.id, email, fullName, avatarUrl };
    }
  } catch {}
  return (
    <html lang="en" data-mantine-color-scheme="light" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body>
        <Providers initialAuth={initialAuth}>{children}</Providers>
      </body>
    </html>
  );
}
