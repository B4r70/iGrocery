import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/categories/CategoryManager";
import { AddCategoryForm } from "@/components/categories/AddCategoryForm";

export default async function CategoriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  const householdId = membership?.household_id;

  const { data: categories } = householdId
    ? await supabase
        .from("categories")
        .select("id, name, sort_order")
        .eq("household_id", householdId)
        .order("sort_order", { ascending: true })
    : { data: [] };

  return (
    <div
      className="mx-auto max-w-2xl space-y-6 p-4"
      style={{
        paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex h-[44px] w-[44px] items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Zurück zu Einstellungen"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Kategorien</h1>
      </div>

      {/* Add new category form */}
      <AddCategoryForm />

      {/* Category list */}
      <CategoryManager categories={categories ?? []} />
    </div>
  );
}
