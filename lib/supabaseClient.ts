"use client";
import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

export const getSupabase = () => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client during build time to prevent build errors
    if (typeof window === 'undefined') {
      return {
        from: () => ({
          select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
          insert: () => ({ data: null, error: null }),
          update: () => ({ eq: () => ({ data: null, error: null }) }),
          delete: () => ({ eq: () => ({ data: null, error: null }) })
        })
      };
    }
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: { persistSession: false },
      global: { fetch: (input, init) => fetch(input, { cache: 'no-store', ...init }) }
    }
  );

  return supabaseInstance;
};

// For backward compatibility - only initialize on client side
export const supabase = typeof window !== 'undefined' ? getSupabase() : null;
