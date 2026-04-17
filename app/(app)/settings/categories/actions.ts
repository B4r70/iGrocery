"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { categoryCreateSchema, categoryUpdateSchema } from "@/lib/schemas/category";

// Resolves the household_id of the currently authenticated user.
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

export async function createCategory(formData: FormData) {
  const householdId = await getHouseholdId();
  if (!householdId) {
    return { error: "Kein Haushalt gefunden." };
  }

  const raw = {
    household_id: householdId,
    name: formData.get("name"),
  };

  const parsed = categoryCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();

  // Determine the next sort_order value.
  const { data: maxRow } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("household_id", householdId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const nextOrder = (maxRow?.sort_order ?? 0) + 1;

  const { error } = await supabase.from("categories").insert({
    household_id: householdId,
    name: parsed.data.name,
    sort_order: nextOrder,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/categories");
  return { error: null };
}

export async function renameCategory(id: string, newName: string) {
  const parsed = categoryUpdateSchema.safeParse({ name: newName });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" };
  }

  const supabase = await createClient();
  // RLS ensures users can only update categories in their own household.
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/categories");
  return { error: null };
}

export async function deleteCategory(id: string) {
  const supabase = await createClient();
  // FK ON DELETE SET NULL: list_items.category_id and favorites.category_id are nulled automatically.
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/categories");
  return { error: null };
}

export async function moveCategoryUp(id: string) {
  const supabase = await createClient();

  // Load the current category.
  const { data: current, error: fetchError } = await supabase
    .from("categories")
    .select("id, sort_order, household_id")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return { error: "Kategorie nicht gefunden." };
  }

  // Find the neighbour with the next-lower sort_order.
  const { data: neighbour, error: neighbourError } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("household_id", current.household_id)
    .lt("sort_order", current.sort_order)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  if (neighbourError || !neighbour) {
    return { error: null }; // Already at the top — silently ignore.
  }

  // Swap sort_order values using two sequential updates.
  // Using a temporary negative value to avoid unique-constraint conflicts.
  const tempOrder = -(current.sort_order + 1);

  const { error: e1 } = await supabase
    .from("categories")
    .update({ sort_order: tempOrder })
    .eq("id", current.id);
  if (e1) return { error: e1.message };

  const { error: e2 } = await supabase
    .from("categories")
    .update({ sort_order: current.sort_order })
    .eq("id", neighbour.id);
  if (e2) return { error: e2.message };

  const { error: e3 } = await supabase
    .from("categories")
    .update({ sort_order: neighbour.sort_order })
    .eq("id", current.id);
  if (e3) return { error: e3.message };

  revalidatePath("/settings/categories");
  return { error: null };
}

export async function moveCategoryDown(id: string) {
  const supabase = await createClient();

  // Load the current category.
  const { data: current, error: fetchError } = await supabase
    .from("categories")
    .select("id, sort_order, household_id")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return { error: "Kategorie nicht gefunden." };
  }

  // Find the neighbour with the next-higher sort_order.
  const { data: neighbour, error: neighbourError } = await supabase
    .from("categories")
    .select("id, sort_order")
    .eq("household_id", current.household_id)
    .gt("sort_order", current.sort_order)
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  if (neighbourError || !neighbour) {
    return { error: null }; // Already at the bottom — silently ignore.
  }

  // Swap sort_order values using a temporary negative value.
  const tempOrder = -(current.sort_order + 1);

  const { error: e1 } = await supabase
    .from("categories")
    .update({ sort_order: tempOrder })
    .eq("id", current.id);
  if (e1) return { error: e1.message };

  const { error: e2 } = await supabase
    .from("categories")
    .update({ sort_order: current.sort_order })
    .eq("id", neighbour.id);
  if (e2) return { error: e2.message };

  const { error: e3 } = await supabase
    .from("categories")
    .update({ sort_order: neighbour.sort_order })
    .eq("id", current.id);
  if (e3) return { error: e3.message };

  revalidatePath("/settings/categories");
  return { error: null };
}
