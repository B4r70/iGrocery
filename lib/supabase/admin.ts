import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Creates a Supabase client with the service role key.
 * Server-only — must NEVER be used in Client Components or exposed to the browser.
 *
 * Use exclusively for admin operations that bypass RLS, e.g. deleting orphaned
 * auth users after a failed registration.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "createAdminClient() darf nur auf dem Server aufgerufen werden.",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      // Disable auto session management — this client is stateless and server-only.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
