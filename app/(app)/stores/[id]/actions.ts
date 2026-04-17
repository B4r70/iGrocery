"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listCreateSchema } from "@/lib/schemas/list";
import { z } from "zod";

const titleSchema = z
  .string()
  .min(1, "Titel ist erforderlich")
  .max(100, "Titel darf maximal 100 Zeichen lang sein")
  .trim();

// Generates the default list title "Einkauf TT.MM.JJJJ" for today.
function defaultListTitle(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `Einkauf ${day}.${month}.${year}`;
}

// Reads store_id from a list — needed for revalidatePath.
async function getStoreIdForList(listId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shopping_lists")
    .select("store_id")
    .eq("id", listId)
    .single();
  return data?.store_id ?? null;
}

export async function createList(storeId: string, formData: FormData) {
  const rawTitle = formData.get("title");
  const title =
    typeof rawTitle === "string" && rawTitle.trim().length > 0
      ? rawTitle.trim()
      : defaultListTitle();

  const parsed = listCreateSchema.safeParse({ store_id: storeId, title });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  // RLS scopes access via store_id → stores → household_members → auth.uid()
  const { error } = await supabase.from("shopping_lists").insert({
    store_id: parsed.data.store_id,
    title: parsed.data.title,
    created_by: user.id,
    status: "active",
  });

  if (error) return { error: error.message };

  revalidatePath(`/stores/${storeId}`);
  revalidatePath("/");
  return { error: null };
}

export async function softDeleteList(listId: string, storeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", listId);

  if (error) return { error: error.message };

  revalidatePath(`/stores/${storeId}`);
  revalidatePath("/");
  return { error: null };
}

export async function restoreList(listId: string, storeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ deleted_at: null })
    .eq("id", listId);

  if (error) return { error: error.message };

  revalidatePath(`/stores/${storeId}`);
  return { error: null };
}

export async function hardDeleteList(listId: string, storeId: string) {
  const supabase = await createClient();
  // Cascade deletes list_items via FK constraint.
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", listId);

  if (error) return { error: error.message };

  revalidatePath(`/stores/${storeId}`);
  revalidatePath("/");
  return { error: null };
}

export async function completeList(listId: string, storeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", listId);

  if (error) return { error: error.message };

  revalidatePath(`/stores/${storeId}`);
  revalidatePath("/");
  return { error: null };
}

export async function reopenList(listId: string, storeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ status: "active", completed_at: null })
    .eq("id", listId);

  if (error) return { error: error.message };

  revalidatePath(`/stores/${storeId}`);
  return { error: null };
}

export async function updateListTitle(
  listId: string,
  title: string,
  storeId?: string
) {
  const parsed = titleSchema.safeParse(title);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültiger Titel" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ title: parsed.data })
    .eq("id", listId);

  if (error) return { error: error.message };

  const sid = storeId ?? (await getStoreIdForList(listId));
  if (sid) revalidatePath(`/stores/${sid}`);
  return { error: null };
}
