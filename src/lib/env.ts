import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_SUPABASE_DB_SCHEMA: z.string().default("justhazaar"),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_DB_SCHEMA: process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA,
});

if (!parsed.success) {
  console.error("Invalid env:", parsed.error.flatten().fieldErrors);
  throw new Error(
    "Missing or invalid Supabase env vars. Copy .env.example to .env.local and fill in your project values."
  );
}

export const env = parsed.data;
