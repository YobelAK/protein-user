import { createClient } from '@supabase/supabase-js';

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '') as string;
const anon = (
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  ''
) as string;

let client: any;
if (url && anon) {
  client = createClient(url, anon, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
} else {
  const builder = {
    select: () => builder,
    eq: () => builder,
    limit: () => builder,
    maybeSingle: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
    insert: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
    update: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
    delete: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
  };
  client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
      signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase is not configured' } }),
      signOut: async () => ({ error: null }),
    },
    from: () => builder,
  };
}

export const supabase = client;

