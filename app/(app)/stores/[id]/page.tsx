import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Returns the ISO timestamp for 30 days ago.
// Defined outside the component to satisfy the react-hooks/purity lint rule.
function thirtyDaysAgo(): string {
  const ms = 30 * 24 * 60 * 60 * 1000;
  return new Date(new Date().getTime() - ms).toISOString();
}
import { StoreHeader } from "@/components/lists/StoreHeader";
import { CollapsibleSection } from "@/components/lists/CollapsibleSection";
import { ListRow } from "@/components/lists/ListRow";
import { NewListDialog } from "@/components/lists/NewListDialog";
import { ListHistoryToggle } from "@/components/lists/ListHistoryToggle";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ history?: string }>;
}

export default async function StoreDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { history } = await searchParams;
  const historyMode = history === "all" ? "all" : "30d";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load store — RLS will return empty if user is not in the household.
  const { data: store } = await supabase
    .from("stores")
    .select("*")
    .eq("id", id)
    .single();

  if (!store) notFound();

  // --- Active lists ---
  const { data: activeLists } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("store_id", id)
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // --- History lists ---
  let historyQuery = supabase
    .from("shopping_lists")
    .select("*")
    .eq("store_id", id)
    .eq("status", "completed")
    .is("deleted_at", null);

  if (historyMode === "30d") {
    historyQuery = historyQuery.gte("completed_at", thirtyDaysAgo());
  }

  const { data: historyLists } = await historyQuery.order("completed_at", {
    ascending: false,
  });

  // --- Deleted lists ---
  const { data: deletedLists } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("store_id", id)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  // --- Open item counts for active lists ---
  // Single query: fetch unchecked items for all active list IDs and count in JS.
  const activeIds = (activeLists ?? []).map((l) => l.id);
  const openCountMap = new Map<string, number>();

  if (activeIds.length > 0) {
    const { data: openItems } = await supabase
      .from("list_items")
      .select("list_id")
      .in("list_id", activeIds)
      .eq("is_checked", false);

    for (const item of openItems ?? []) {
      openCountMap.set(
        item.list_id,
        (openCountMap.get(item.list_id) ?? 0) + 1
      );
    }
  }

  const active = activeLists ?? [];
  const completed = historyLists ?? [];
  const deleted = deletedLists ?? [];

  return (
    <div className="flex flex-col min-h-dvh">
      <StoreHeader store={store} />

      <main className="flex-1 px-2 py-4 space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {/* Active section — open by default */}
        <CollapsibleSection
          title="Aktiv"
          defaultOpen
          count={active.length}
        >
          {active.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Keine aktiven Listen
            </p>
          ) : (
            <div className="space-y-1">
              {active.map((list) => (
                <ListRow
                  key={list.id}
                  list={list}
                  section="active"
                  openItemsCount={openCountMap.get(list.id) ?? 0}
                />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* History section — closed by default */}
        <CollapsibleSection
          title="Verlauf"
          defaultOpen={false}
          count={completed.length}
          headerExtra={
            <ListHistoryToggle
              currentMode={historyMode}
              storeId={id}
            />
          }
        >
          {completed.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Kein Verlauf
            </p>
          ) : (
            <div className="space-y-1">
              {completed.map((list) => (
                <ListRow key={list.id} list={list} section="history" />
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Deleted section — closed by default */}
        <CollapsibleSection
          title="Gelöscht"
          defaultOpen={false}
          count={deleted.length}
        >
          {deleted.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">
              Keine gelöschten Listen
            </p>
          ) : (
            <div className="space-y-1">
              {deleted.map((list) => (
                <ListRow key={list.id} list={list} section="deleted" />
              ))}
            </div>
          )}
        </CollapsibleSection>
      </main>

      {/* FAB — neue Liste */}
      <NewListDialog storeId={id} />
    </div>
  );
}
