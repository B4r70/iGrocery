"use client";

// StoreCard is a Client Component because it controls the EditStoreDialog open state.
import { useState } from "react";
import Link from "next/link";
import { PencilIcon } from "@heroicons/react/24/outline";
import { getStoreIcon } from "@/lib/icons/storeIcons";
import { EditStoreDialog } from "./EditStoreDialog";
import type { Tables } from "@/types/database";

interface StoreCardProps {
  store: Tables<"stores">;
  activeListsCount: number;
}

export function StoreCard({ store, activeListsCount }: StoreCardProps) {
  const [editOpen, setEditOpen] = useState(false);

  const iconEntry = getStoreIcon(store.icon_key ?? "shopping-cart");
  const Icon = iconEntry?.solid ?? null;

  const subtitle =
    activeListsCount === 0
      ? "Keine aktiven Listen"
      : activeListsCount === 1
        ? "1 aktive Liste"
        : `${activeListsCount} aktive Listen`;

  return (
    <>
      <div className="relative flex flex-col rounded-xl border bg-card min-h-[72px] overflow-hidden">
        {/* Main tap area → store detail */}
        <Link
          href={`/stores/${store.id}`}
          className="flex items-center gap-3 p-4 flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
        >
          {/* Colored icon badge */}
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0 dark:opacity-80"
            style={{ backgroundColor: store.color, width: 48, height: 48 }}
          >
            {Icon && (
              <Icon className="h-6 w-6 text-white" aria-hidden="true" />
            )}
          </div>

          {/* Text */}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm leading-snug truncate">
              {store.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </Link>

        {/* Edit button */}
        <button
          type="button"
          onClick={() => setEditOpen(true)}
          aria-label={`${store.name} bearbeiten`}
          className="absolute top-2 right-2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <PencilIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <EditStoreDialog
        store={store}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
