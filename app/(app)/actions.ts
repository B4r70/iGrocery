"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  storeCreateSchema,
  storeUpdateSchema,
} from "@/lib/schemas/store";

// Resolves the household_id of the currently authenticated user.
// Returns null if the user is not a member of any household.
async function getHouseholdId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  return data?.household_id ?? null;
}

export async function createStore(formData: FormData) {
  const raw = {
    name: formData.get("name"),
    icon_key: formData.get("icon_key"),
    color: formData.get("color"),
  };

  const parsed = storeCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const householdId = await getHouseholdId();
  if (!householdId) {
    return { error: "Kein Haushalt gefunden." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("stores").insert({
    name: parsed.data.name,
    icon_key: parsed.data.icon_key,
    color: parsed.data.color,
    household_id: householdId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { error: null };
}

export async function updateStore(id: string, formData: FormData) {
  const raw = {
    name: formData.get("name"),
    icon_key: formData.get("icon_key"),
    color: formData.get("color"),
  };

  const parsed = storeUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();
  // RLS ensures users can only update stores in their own household.
  const { error } = await supabase
    .from("stores")
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath(`/stores/${id}`);
  return { error: null };
}

export async function deleteStore(id: string) {
  const supabase = await createClient();
  // RLS ensures users can only delete stores in their own household.
  const { error } = await supabase.from("stores").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  return { error: null };
}
