"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { inviteTokenSchema } from "@/lib/schemas/invite";

export async function createInvite(): Promise<{ token: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht authentifiziert" };

  // Find user's household
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (!membership) return { error: "Kein Haushalt" };

  const token = randomUUID().replace(/-/g, "");
  const { error } = await supabase.from("household_invites").insert({
    token,
    household_id: membership.household_id,
    created_by: user.id,
  });
  if (error) return { error: "Einladung konnte nicht erstellt werden" };

  revalidatePath("/settings");
  return { token };
}

export async function revokeInvite(token: string): Promise<{ success: true } | { error: string }> {
  const parsed = inviteTokenSchema.safeParse(token);
  if (!parsed.success) return { error: "Ungültiges Token" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("household_invites")
    .delete()
    .eq("token", parsed.data);
  if (error) return { error: "Einladung konnte nicht widerrufen werden" };

  revalidatePath("/settings");
  return { success: true };
}
