import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Public routes that do not require authentication
const PUBLIC_PATHS = ["/login", "/register", "/join/"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));
}

/**
 * Root proxy (Next.js 16+):
 * 1. Refreshes the Supabase session cookie on every request.
 * 2. Redirects unauthenticated users to /login (except public paths).
 * 3. Redirects authenticated users away from /login and /register to /.
 */
export async function proxy(request: NextRequest) {
  // First, let updateSession refresh the session and sync cookies.
  const response = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Read the refreshed session from the response cookies via a lightweight client.
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Read from the original request — updateSession already set them on response.
          return request.cookies.getAll();
        },
        setAll() {
          // No-op: cookies were already set by updateSession above.
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = isPublicPath(pathname);

  if (!user && !isPublic) {
    // Unauthenticated user trying to access a protected route
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    // Authenticated user on an auth page → send home
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico
     * - common image extensions
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
