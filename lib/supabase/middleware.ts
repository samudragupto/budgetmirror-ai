import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const configured =
    url.length > 0 && !url.includes("example") && anon.length > 0 && !anon.startsWith("dummy");
  if (!configured) return supabaseResponse;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach((c: CookieToSet) => request.cookies.set(c.name, c.value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach((c: CookieToSet) =>
          supabaseResponse.cookies.set(c.name, c.value, c.options),
        );
      },
    },
  });
  await supabase.auth.getUser();
  return supabaseResponse;
}
