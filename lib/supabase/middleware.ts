import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/**
 * Refreshes the Supabase session and syncs auth cookies between
 * the incoming request and the outgoing response.
 * Must be called in root middleware.ts for every request.
 *
 * Returns both the response (with updated cookies) and the Supabase client
 * so callers can reuse the same client for subsequent auth checks —
 * avoiding a second client that reads stale request cookies after token refresh.
 */
export async function updateSession(
  request: NextRequest,
): Promise<{
  response: NextResponse;
  supabase: ReturnType<typeof createServerClient<Database>>;
}> {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session — do not remove this line.
  // It ensures the session token is kept alive and written back to cookies.
  await supabase.auth.getUser();

  return { response: supabaseResponse, supabase };
}
