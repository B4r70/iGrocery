import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StoreCard } from "@/components/stores/StoreCard";
import { StoreGridFab } from "@/components/stores/StoreGridFab";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Resolve household
  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return (
      <main className="p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <p className="text-muted-foreground">Kein Haushalt gefunden.</p>
      </main>
    );
  }

  // Load stores ordered by sort_order, then created_at
  const { data: stores, error: storesError } = await supabase
    .from("stores")
    .select("*")
    .eq("household_id", membership.household_id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (storesError) {
    return (
      <main className="p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <p className="text-destructive">
          Fehler beim Laden der Geschäfte: {storesError.message}
        </p>
      </main>
    );
  }

  // Load active list counts per store in a single query.
  // active = status='active', not deleted.
  const { data: activeLists } = await supabase
    .from("shopping_lists")
    .select("store_id")
    .in("store_id", stores?.map((s) => s.id) ?? [])
    .eq("status", "active")
    .is("deleted_at", null);

  // Count per store
  const countByStore = new Map<string, number>();
  for (const row of activeLists ?? []) {
    countByStore.set(row.store_id, (countByStore.get(row.store_id) ?? 0) + 1);
  }

  return (
    <main className="p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {!stores || stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50dvh] text-center gap-2">
          <p className="text-muted-foreground text-base">
            Noch keine Geschäfte
          </p>
          <p className="text-muted-foreground text-sm">
            Tippe +, um zu starten
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              activeListsCount={countByStore.get(store.id) ?? 0}
            />
          ))}
        </div>
      )}

      <StoreGridFab />
    </main>
  );
}
