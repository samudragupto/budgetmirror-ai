/** Public Supabase settings shared by the browser, server and session middleware. */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function usableUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.href !== "https://example.supabase.co/" &&
      (parsed.protocol === "https:" ||
        (parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)))
    );
  } catch {
    return false;
  }
}

export const isSupabaseConfigured =
  usableUrl(supabaseUrl) && supabaseAnonKey.length > 0 && !supabaseAnonKey.startsWith("dummy");
