"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseUrl, supabaseAnonKey } from "@/lib/supabase/config";

export function createClient() {
  // Dummy-but-valid URL shape keeps the client constructible in demo/CI builds.
  return createBrowserClient(
    supabaseUrl || "https://example.supabase.co",
    supabaseAnonKey || "dummy-anon-key-for-ci",
  );
}
