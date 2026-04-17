import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /lists/[id]/favorites?q=<search>
// Returns up to 8 favorites for the store, filtered by title ILIKE %q%.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listId } = await params;
  const q = request.nextUrl.searchParams.get("q") ?? "";

  if (q.length < 2) {
    return NextResponse.json({ favorites: [] });
  }

  const supabase = await createClient();

  // Load list to get store_id — RLS protects access.
  const { data: list } = await supabase
    .from("shopping_lists")
    .select("store_id")
    .eq("id", listId)
    .single();

  if (!list) {
    return NextResponse.json({ favorites: [] });
  }

  const { data: favorites } = await supabase
    .from("favorites")
    .select("*")
    .eq("store_id", list.store_id)
    .ilike("title", `%${q}%`)
    .order("usage_count", { ascending: false })
    .limit(8);

  return NextResponse.json({ favorites: favorites ?? [] });
}
