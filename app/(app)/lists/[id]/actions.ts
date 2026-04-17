"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { itemCreateSchema, itemUpdateSchema } from "@/lib/schemas/item";
import { z } from "zod";

const titleSchema = z
  .string()
  .min(1, "Titel ist erforderlich")
  .max(100, "Titel darf maximal 100 Zeichen lang sein")
  .trim();

// Loads store_id from a list — needed for revalidatePath and upsert_favorite.
async function getStoreIdForList(
  listId: string
): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shopping_lists")
    .select("store_id")
    .eq("id", listId)
    .single();
  return data?.store_id ?? null;
}

export async function createItem(listId: string, data: {
  title: string;
  quantity?: string;
  price?: number;
  note?: string;
  category_id?: string;
  is_offer?: boolean;
}) {
  const parsed = itemCreateSchema.safeParse({ list_id: listId, ...data });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();

  // Determine next sort_order
  const { data: maxRow } = await supabase
    .from("list_items")
    .select("sort_order")
    .eq("list_id", listId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextSortOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("list_items").insert({
    list_id: parsed.data.list_id,
    title: parsed.data.title,
    quantity: parsed.data.quantity ?? null,
    price: parsed.data.price ?? null,
    note: parsed.data.note ?? null,
    category_id: parsed.data.category_id ?? null,
    is_offer: parsed.data.is_offer ?? false,
    sort_order: nextSortOrder,
  });

  if (error) return { error: error.message };

  // Async upsert_favorite — log but do not block item insert.
  // Parameter order from types/database.ts: p_category_id, p_price, p_quantity, p_store_id, p_title
  const storeId = await getStoreIdForList(listId);
  if (storeId) {
    // Parameter order from types/database.ts: p_category_id, p_price, p_quantity, p_store_id, p_title
    const { error: favErr } = await supabase.rpc("upsert_favorite", {
      p_category_id: parsed.data.category_id ?? null,
      p_price: parsed.data.price ?? null,
      p_quantity: parsed.data.quantity ?? null,
      p_store_id: storeId,
      p_title: parsed.data.title,
    });
    if (favErr) {
      // Non-blocking — just log
      console.error("upsert_favorite failed:", favErr.message);
    }
  }

  revalidatePath(`/lists/${listId}`);
  return { error: null };
}

export async function updateItem(
  itemId: string,
  listId: string,
  data: {
    title?: string;
    quantity?: string;
    price?: number;
    note?: string;
    category_id?: string;
    is_offer?: boolean;
  }
) {
  const parsed = itemUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("list_items")
    .update({
      ...parsed.data,
      // Ensure undefined optional fields map to null in DB
      quantity: parsed.data.quantity ?? null,
      price: parsed.data.price ?? null,
      note: parsed.data.note ?? null,
      category_id: parsed.data.category_id ?? null,
    })
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/lists/${listId}`);
  return { error: null };
}

export async function toggleItem(itemId: string, listId: string) {
  const supabase = await createClient();

  // Read current state
  const { data: item } = await supabase
    .from("list_items")
    .select("is_checked")
    .eq("id", itemId)
    .single();

  if (!item) return { error: "Position nicht gefunden" };

  const nowChecked = !item.is_checked;
  const { error } = await supabase
    .from("list_items")
    .update({
      is_checked: nowChecked,
      checked_at: nowChecked ? new Date().toISOString() : null,
    })
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/lists/${listId}`);
  return { error: null };
}

export async function deleteItem(itemId: string, listId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("list_items")
    .delete()
    .eq("id", itemId);

  if (error) return { error: error.message };

  revalidatePath(`/lists/${listId}`);
  return { error: null };
}

export async function completeList(listId: string) {
  const supabase = await createClient();
  const storeId = await getStoreIdForList(listId);

  const { error } = await supabase
    .from("shopping_lists")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", listId);

  if (error) return { error: error.message };

  revalidatePath(`/lists/${listId}`);
  if (storeId) {
    revalidatePath(`/stores/${storeId}`);
    revalidatePath("/");
  }
  return { error: null };
}

export async function reopenList(listId: string) {
  const supabase = await createClient();
  const storeId = await getStoreIdForList(listId);

  const { error } = await supabase
    .from("shopping_lists")
    .update({ status: "active", completed_at: null })
    .eq("id", listId);

  if (error) return { error: error.message };

  revalidatePath(`/lists/${listId}`);
  if (storeId) revalidatePath(`/stores/${storeId}`);
  return { error: null };
}

export async function updateListTitle(listId: string, title: string) {
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

  const storeId = await getStoreIdForList(listId);
  revalidatePath(`/lists/${listId}`);
  if (storeId) revalidatePath(`/stores/${storeId}`);
  return { error: null };
}
