// StoreHeader — Server Component.
// Sticky header for the store detail page: back button, icon, name, edit button.

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { getStoreIcon } from "@/lib/icons/storeIcons";
import { EditStoreDialogTrigger } from "@/components/stores/EditStoreDialogTrigger";
import type { Tables } from "@/types/database";

interface StoreHeaderProps {
  store: Tables<"stores">;
}

export function StoreHeader({ store }: StoreHeaderProps) {
  const iconEntry = getStoreIcon(store.icon_key ?? "shopping-cart");
  const Icon = iconEntry?.solid ?? null;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur-md border-b">
      {/* Back button → home */}
      <Link
        href="/"
        aria-label="Zurück"
        className="p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
      </Link>

      {/* Store icon */}
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0 dark:opacity-80"
        style={{ backgroundColor: store.color, width: 40, height: 40 }}
        aria-hidden="true"
      >
        {Icon && <Icon className="h-5 w-5 text-white" aria-hidden="true" />}
      </div>

      {/* Store name */}
      <h1 className="text-xl font-semibold flex-1 truncate">{store.name}</h1>

      {/* Edit button — Client Component wrapper because it controls dialog state */}
      <EditStoreDialogTrigger store={store} />
    </header>
  );
}
