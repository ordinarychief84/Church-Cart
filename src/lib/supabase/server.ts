import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for use in Server Components, Route Handlers and Server
 * Actions. Reads the auth session from the Next.js request cookies.
 *
 * The `db.schema` option scopes PostgREST to the `justhazaar` schema so we can
 * call `.from("profiles")` instead of `.from("justhazaar.profiles")`.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    db: { schema: env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA },
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet: CookieToSet[]) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // `set` is a no-op when called from a Server Component (read-only
          // context). The middleware refresh will pick up the rotation.
        }
      },
    },
  });
}
