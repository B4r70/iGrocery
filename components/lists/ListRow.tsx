// ListRow — Server Component.
// Renders a single shopping list entry with context-appropriate action buttons.

import Link from "next/link";
import {
  ChevronRightIcon,
  CheckIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import { formatDate } from "@/lib/format";
import {
  softDeleteList,
  restoreList,
  completeList,
  reopenList,
} from "@/app/(app)/stores/[id]/actions";
import { HardDeleteButton } from "./HardDeleteButton";
import type { Tables } from "@/types/database";

type ShoppingList = Tables<"shopping_lists">;

interface ListRowProps {
  list: ShoppingList;
  /** Section context determines which actions are rendered */
  section: "active" | "history" | "deleted";
  /** Number of open items — shown as "N Positionen" for active lists */
  openItemsCount?: number;
}

function formatMeta(
  list: ShoppingList,
  section: ListRowProps["section"],
  openItemsCount?: number
): string {
  const dateStr = formatDate(list.created_at);

  if (section === "history" && list.completed_at) {
    return `Abgeschlossen ${formatDate(list.completed_at)}`;
  }

  if (section === "deleted" && list.deleted_at) {
    return `Gelöscht ${formatDate(list.deleted_at)}`;
  }

  // Active section: show open item count if provided
  if (openItemsCount !== undefined) {
    const label =
      openItemsCount === 1 ? "1 Position" : `${openItemsCount} Positionen`;
    return `${dateStr} · ${label}`;
  }

  return dateStr;
}

export function ListRow({ list, section, openItemsCount }: ListRowProps) {
  const meta = formatMeta(list, section, openItemsCount);

  return (
    <div className="flex items-center bg-card rounded-xl border min-h-[56px] overflow-hidden">
      {/* Main tap area → list detail */}
      <Link
        href={`/lists/${list.id}`}
        className="flex items-center gap-3 px-4 py-3 flex-1 min-h-[56px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-l-xl"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug truncate">
            {list.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {meta}
          </p>
        </div>
        <ChevronRightIcon
          className="h-4 w-4 text-muted-foreground flex-shrink-0"
          aria-hidden="true"
        />
      </Link>

      {/* Context-specific action buttons */}
      <div className="flex items-center pr-1 flex-shrink-0">
        {section === "active" && (
          <>
            {/* Quick-Complete */}
            <form
              action={async () => {
                "use server";
                await completeList(list.id, list.store_id);
              }}
            >
              <button
                type="submit"
                aria-label="Liste abschließen"
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-green-600 hover:bg-muted transition-colors"
              >
                <CheckIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>

            {/* Soft Delete */}
            <form
              action={async () => {
                "use server";
                await softDeleteList(list.id, list.store_id);
              }}
            >
              <button
                type="submit"
                aria-label="Liste in Papierkorb"
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
              >
                <TrashIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>
          </>
        )}

        {section === "history" && (
          <form
            action={async () => {
              "use server";
              await reopenList(list.id, list.store_id);
            }}
          >
            <button
              type="submit"
              aria-label="Liste wieder öffnen"
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowUturnLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        )}

        {section === "deleted" && (
          <>
            {/* Restore */}
            <form
              action={async () => {
                "use server";
                await restoreList(list.id, list.store_id);
              }}
            >
              <button
                type="submit"
                aria-label="Liste wiederherstellen"
                className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ArrowUturnLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>

            {/* Hard Delete with native confirm (Client Component) */}
            <HardDeleteButton list={list} />
          </>
        )}
      </div>
    </div>
  );
}
