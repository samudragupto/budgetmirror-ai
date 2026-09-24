"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  url.length > 0 && !url.includes("example") && anon.length > 0 && !anon.startsWith("dummy");

export function createClient() {
  // Dummy-but-valid URL shape keeps the client constructible in demo/CI builds.
  return createBrowserClient(
    url || "https://example.supabase.co",
    anon || "dummy-anon-key-for-ci",
  );
}
