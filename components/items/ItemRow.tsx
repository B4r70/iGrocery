"use client";

import { useState } from "react";
import { TagIcon, DocumentTextIcon } from "@heroicons/react/24/solid";
import { ItemCheckbox } from "./ItemCheckbox";
import { EditItemDialog } from "./EditItemDialog";
import { formatCurrency } from "@/lib/format";
import type { Tables } from "@/types/database";

type ListItem = Tables<"list_items">;
type Category = Tables<"categories">;

interface ItemRowProps {
  item: ListItem;
  listId: string;
  category?: Category;
  categories: Category[];
}

export function ItemRow({ item, listId, categories, category }: ItemRowProps) {
  const [editOpen, setEditOpen] = useState(false);

  // Subtitle: quantity and/or price
  const subtitle = [
    item.quantity ?? "",
    item.price != null ? formatCurrency(item.price) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="flex items-center bg-card rounded-xl border min-h-[56px] overflow-hidden">
        {/* Checkbox */}
        <ItemCheckbox
          itemId={item.id}
          listId={listId}
          checked={item.is_checked}
        />

        {/* Content tap area → edit dialog */}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          className="flex-1 min-h-[56px] px-3 py-3 text-left flex flex-col justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`${item.title} bearbeiten`}
        >
          {/* Title row */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={[
                "text-sm font-medium truncate",
                item.is_checked ? "line-through opacity-60" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {item.title}
            </span>

            {/* Offer indicator */}
            {item.is_offer && (
              <TagIcon
                className="h-3.5 w-3.5 text-orange-500 flex-shrink-0"
                aria-label="Angebot"
              />
            )}

            {/* Note indicator */}
            {item.note && (
              <DocumentTextIcon
                className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0"
                aria-label={`Notiz: ${item.note}`}
                title={item.note}
              />
            )}
          </div>

          {/* Subtitle: quantity · price */}
          {subtitle && (
            <span
              className={[
                "text-xs text-muted-foreground mt-0.5",
                item.is_checked ? "opacity-60" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {subtitle}
            </span>
          )}

          {/* Category badge (optional, shown for unchecked items) */}
          {category && !item.is_checked && (
            <span className="text-xs text-muted-foreground/70 mt-0.5">
              {category.name}
            </span>
          )}
        </button>
      </div>

      <EditItemDialog
        item={item}
        listId={listId}
        categories={categories}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
