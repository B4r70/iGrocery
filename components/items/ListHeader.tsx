"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  Bars3Icon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  completeList,
  reopenList,
  updateListTitle,
} from "@/app/(app)/lists/[id]/actions";
import { formatCurrency } from "@/lib/format";
import type { Tables } from "@/types/database";

type ShoppingList = Tables<"shopping_lists">;

interface ListHeaderProps {
  list: ShoppingList;
  storeId: string;
  openCount: number;
  doneCount: number;
  total: number;
  /** Callback to open the sidebar sheet on mobile */
  onSidebarOpen?: () => void;
  /** Whether to show the "all done" hint block */
  allDoneHint?: boolean;
}

export function ListHeader({
  list,
  storeId,
  openCount,
  doneCount,
  total,
  onSidebarOpen,
  allDoneHint,
}: ListHeaderProps) {
  const [isPending, startTransition] = useTransition();
  const [titleValue, setTitleValue] = useState(list.title);
  const originalTitle = useRef(list.title);

  function handleTitleBlur() {
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === originalTitle.current) {
      setTitleValue(originalTitle.current);
      return;
    }
    startTransition(async () => {
      const result = await updateListTitle(list.id, trimmed);
      if (result.error) {
        toast.error(result.error);
        setTitleValue(originalTitle.current);
      } else {
        originalTitle.current = trimmed;
      }
    });
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      setTitleValue(originalTitle.current);
      e.currentTarget.blur();
    }
  }

  function handleComplete() {
    startTransition(async () => {
      const result = await completeList(list.id);
      if (result.error) toast.error(result.error);
      else toast.success("Liste abgeschlossen");
    });
  }

  function handleReopen() {
    startTransition(async () => {
      const result = await reopenList(list.id);
      if (result.error) toast.error(result.error);
      else toast.success("Liste wieder geöffnet");
    });
  }

  const counterText = [
    openCount > 0 ? `${openCount} offen` : null,
    doneCount > 0 ? `${doneCount} erledigt` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const isActive = list.status === "active";
  const allDone = isActive && openCount === 0 && doneCount > 0;

  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
      {/* Top bar: back + sidebar trigger + complete button */}
      <div className="flex items-center gap-2 px-3 py-2 min-h-[52px]">
        {/* Back to store */}
        <Link
          href={`/stores/${storeId}`}
          aria-label="Zurück"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
        </Link>

        {/* Sidebar trigger (mobile) */}
        <button
          type="button"
          onClick={onSidebarOpen}
          aria-label="Andere Listen"
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center lg:hidden"
        >
          <Bars3Icon className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Inline-edit title */}
        <input
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          onFocus={(e) =>
            e.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest" })
          }
          className="flex-1 min-w-[120px] max-w-full text-base font-semibold bg-transparent border-none outline-none focus:ring-0 focus:underline truncate"
          aria-label="Listen-Titel"
        />

        {/* Complete / Reopen button */}
        {isActive ? (
          <Button
            type="button"
            size="sm"
            variant={allDone ? "default" : "outline"}
            onClick={handleComplete}
            disabled={isPending}
            className="flex-shrink-0 min-h-[44px] gap-1.5"
          >
            <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Abschließen</span>
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleReopen}
            disabled={isPending}
            className="flex-shrink-0 min-h-[44px]"
          >
            Wieder öffnen
          </Button>
        )}
      </div>

      {/* Counter + total */}
      {(counterText || total > 0) && (
        <div className="flex items-center justify-between px-4 pb-2 text-xs text-muted-foreground">
          <span>{counterText}</span>
          {total > 0 && <span>{formatCurrency(total)}</span>}
        </div>
      )}

      {/* "All done" hint */}
      {allDoneHint && allDone && (
        <div className="mx-3 mb-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground text-center">
          Alle Positionen erledigt · Liste abschließen
        </div>
      )}
    </header>
  );
}
