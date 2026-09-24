import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from "@/lib/supabase/config";
import { verifyOfficial } from "@/lib/supabase/official";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const publicAdminPages = new Set([
  "/admin/login", "/admin/login/", "/admin/access-denied", "/admin/access-denied/",
]);

function isProtectedAdminPage(path: string) {
  return (path === "/admin" || path.startsWith("/admin/")) && !publicAdminPages.has(path);
}

function redirectWithCookies(path: string, request: NextRequest, refreshed: NextResponse) {
  const response = NextResponse.redirect(new URL(path, request.url));
  refreshed.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

/** Refresh SSR cookies, and stop unauthorized page requests before RSC renders children. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const protectedPage = isProtectedAdminPage(request.nextUrl.pathname);

  if (!isSupabaseConfigured) {
    if (protectedPage && process.env.NODE_ENV !== "development") {
      return redirectWithCookies("/admin/login", request, supabaseResponse);
    }
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          // SSR refresh must reach both the downstream request and the browser.
          cookiesToSet.forEach((c: CookieToSet) => request.cookies.set(c.name, c.value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach((c: CookieToSet) =>
            supabaseResponse.cookies.set(c.name, c.value, c.options),
          );
        },
      },
    });

    if (protectedPage) {
      const access = await verifyOfficial(supabase);
      if (access.status === "unauthenticated") {
        return redirectWithCookies("/admin/login", request, supabaseResponse);
      }
      if (access.status === "forbidden") {
        return redirectWithCookies("/admin/access-denied", request, supabaseResponse);
      }
    } else {
      // Refresh public/login sessions without protecting public or callback routes.
      await supabase.auth.getUser();
    }
  } catch {
    // Auth outages must not block public pages or grant access to admin pages.
    if (protectedPage) return redirectWithCookies("/admin/login", request, supabaseResponse);
  }
  return supabaseResponse;
}
