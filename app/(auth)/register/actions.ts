"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { registerSchema } from "@/lib/schemas/auth";

export async function signUp(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    // Convert empty string (no invite) to undefined so zod .optional() works
    invite: formData.get("invite") || undefined,
  });

  if (!parsed.success) {
    return { error: "Ungültige Eingabe" };
  }

  const { email, password, displayName, invite } = parsed.data;
  const supabase = await createClient();

  // Step 1: Auth signup — the DB trigger auto-creates a profiles row with display_name = ''
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: "Registrierung fehlgeschlagen" };
  }

  // Step 2: Write the chosen display_name onto the auto-created profile
  await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", authData.user.id);

  // Step 3: Household path — invite or fresh household
  if (invite) {
    // Join an existing household by consuming the invite token
    const { error: inviteError } = await supabase.rpc("accept_invite", {
      p_token: invite,
    });

    if (inviteError) {
      await supabase.auth.signOut();
      // Remove the orphaned auth user so the email address is not blocked permanently.
      try {
        await createAdminClient().auth.admin.deleteUser(authData.user.id);
      } catch (rollbackErr) {
        console.error("signUp rollback: deleteUser fehlgeschlagen", rollbackErr);
      }
      return { error: "Einladung ungültig oder abgelaufen" };
    }
  } else {
    // Create a new household with this user as owner + seed 9 default categories
    const { error: hhError } = await supabase.rpc("create_household_for_user", {
      p_name: `${displayName}s Haushalt`,
    });

    if (hhError) {
      await supabase.auth.signOut();
      // Remove the orphaned auth user so the email address is not blocked permanently.
      try {
        await createAdminClient().auth.admin.deleteUser(authData.user.id);
      } catch (rollbackErr) {
        console.error("signUp rollback: deleteUser fehlgeschlagen", rollbackErr);
      }
      return { error: "Haushalt konnte nicht erstellt werden" };
    }
  }

  redirect("/");
}
