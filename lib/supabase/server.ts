import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function getSupabaseServerClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '') as string;
  const anon = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    ''
  ) as string;
  const store = cookies();
  const client = createServerClient(url, anon, {
    cookies: {
      get: (name: string) => store.get(name)?.value,
      set: (name: string, value: string, options: any) => {
        try { store.set({ name, value, ...options }); } catch {}
      },
      remove: (name: string, options: any) => {
        try { store.set({ name, value: '', ...options }); } catch {}
      },
    },
  });
  return client as any;
}

