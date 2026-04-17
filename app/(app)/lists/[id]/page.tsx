import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { countOpen, countDone, sumTotal } from "@/lib/lists/aggregate";
import { ItemsGroup } from "@/components/items/ItemsGroup";
import { NewItemDialog } from "@/components/items/NewItemDialog";
import { CompleteWatcher } from "@/components/items/CompleteWatcher";
import { ListPageClient } from "@/components/items/ListPageClient";
import type { Tables } from "@/types/database";

type ListItem = Tables<"list_items">;
type Category = Tables<"categories">;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load list — RLS restricts access to household members.
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("id", id)
    .single();

  if (!list) notFound();

  // Load store
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("id", list.store_id)
    .single();

  if (!store) notFound();

  // Load all items with sort_order ASC
  const { data: rawItems } = await supabase
    .from("list_items")
    .select("*")
    .eq("list_id", id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  const items: ListItem[] = rawItems ?? [];

  // Load household categories
  const { data: rawCategories } = await supabase
    .from("categories")
    .select("*")
    .eq("household_id", store.household_id)
    .order("sort_order", { ascending: true });

  const categories: Category[] = rawCategories ?? [];

  // Load other active lists in same store (for sidebar)
  const { data: rawOtherLists } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("store_id", list.store_id)
    .eq("status", "active")
    .is("deleted_at", null)
    .neq("id", id)
    .order("created_at", { ascending: false });

  const otherLists = rawOtherLists ?? [];

  // Aggregate counts
  const openCount = countOpen(items);
  const doneCount = countDone(items);
  const total = sumTotal(items);

  // Build category lookup map
  const categoryMap = new Map<string, Category>(
    categories.map((c) => [c.id, c])
  );

  // Separate open and done items
  const openItems = items.filter((i) => !i.is_checked);
  const doneItems = items
    .filter((i) => i.is_checked)
    .sort((a, b) => {
      // Done items sorted by checked_at DESC
      const aTime = a.checked_at ?? a.created_at;
      const bTime = b.checked_at ?? b.created_at;
      return bTime.localeCompare(aTime);
    });

  // Group open items by category
  // Order: items with a category (grouped by category), then items without category
  const byCategory = new Map<string | null, ListItem[]>();

  for (const item of openItems) {
    const key = item.category_id ?? null;
    if (!byCategory.has(key)) byCategory.set(key, []);
    byCategory.get(key)!.push(item);
  }

  // Build sorted groups: named categories first (sorted by category sort_order), then null
  const namedGroupKeys = [...byCategory.keys()]
    .filter((k): k is string => k !== null)
    .sort((a, b) => {
      const catA = categoryMap.get(a);
      const catB = categoryMap.get(b);
      return (catA?.sort_order ?? 0) - (catB?.sort_order ?? 0);
    });

  const allDoneHint = openCount === 0 && doneCount > 0;

  return (
    <div className="flex flex-col">
      <ListPageClient
        list={list}
        storeId={list.store_id}
        openCount={openCount}
        doneCount={doneCount}
        total={total}
        otherLists={otherLists}
        allDoneHint={allDoneHint}
      >
        {/* Named category groups */}
        {namedGroupKeys.map((catId) => {
          const cat = categoryMap.get(catId);
          const groupItems = byCategory.get(catId) ?? [];
          return (
            <ItemsGroup
              key={catId}
              title={cat?.name ?? "Kategorie"}
              items={groupItems}
              listId={id}
              categories={categories}
              categoryMap={categoryMap}
              defaultOpen
            />
          );
        })}

        {/* Items without category */}
        {(byCategory.get(null)?.length ?? 0) > 0 && (
          <ItemsGroup
            title="Ohne Kategorie"
            items={byCategory.get(null) ?? []}
            listId={id}
            categories={categories}
            categoryMap={categoryMap}
            defaultOpen
          />
        )}

        {/* Empty state for active list with no items */}
        {items.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            Noch keine Positionen · Tippe +, um zu starten
          </p>
        )}

        {/* Done items group */}
        {doneItems.length > 0 && (
          <ItemsGroup
            title="Erledigt"
            items={doneItems}
            listId={id}
            categories={categories}
            categoryMap={categoryMap}
            defaultOpen
          />
        )}
      </ListPageClient>

      {/* Auto-complete watcher (30s timer) */}
      {list.status === "active" && (
        <CompleteWatcher
          listId={id}
          openCount={openCount}
          doneCount={doneCount}
        />
      )}

      {/* FAB — new item */}
      {list.status === "active" && (
        <NewItemDialog
          listId={id}
          categories={categories}
        />
      )}
    </div>
  );
}
