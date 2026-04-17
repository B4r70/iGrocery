// ItemsGroup — Server Component.
// Renders a collapsible group of items (by category or "done").

import { CollapsibleSection } from "@/components/lists/CollapsibleSection";
import { ItemRow } from "./ItemRow";
import type { Tables } from "@/types/database";

type ListItem = Tables<"list_items">;
type Category = Tables<"categories">;

interface ItemsGroupProps {
  title: string;
  items: ListItem[];
  listId: string;
  categories: Category[];
  /** Map of category_id → Category for quick lookup */
  categoryMap: Map<string, Category>;
  defaultOpen?: boolean;
}

export function ItemsGroup({
  title,
  items,
  listId,
  categories,
  categoryMap,
  defaultOpen = true,
}: ItemsGroupProps) {
  if (items.length === 0) return null;

  return (
    <CollapsibleSection title={title} defaultOpen={defaultOpen} count={items.length}>
      <div className="space-y-1 pb-1">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            listId={listId}
            categories={categories}
            category={item.category_id ? categoryMap.get(item.category_id) : undefined}
          />
        ))}
      </div>
    </CollapsibleSection>
  );
}
