"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Singleton Supabase browser client. Used by client components that need to
 * subscribe to realtime, listen for auth state, or call public RPCs.
 */
let client: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (client) return client;
  client = createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    db: { schema: env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA },
  });
  return client;
}
