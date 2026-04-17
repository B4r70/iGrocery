"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatDate } from "@/lib/format";
import type { Tables } from "@/types/database";

type ShoppingList = Tables<"shopping_lists">;

interface ListSidebarProps {
  currentListId: string;
  otherLists: ShoppingList[];
  /** Controlled from ListHeader's mobile trigger */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

function ListLink({ list, active }: { list: ShoppingList; active: boolean }) {
  return (
    <Link
      href={`/lists/${list.id}`}
      className={[
        "block px-3 py-2.5 rounded-lg text-sm transition-colors min-h-[44px] flex flex-col justify-center",
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-foreground hover:bg-muted",
      ].join(" ")}
    >
      <span className="truncate">{list.title}</span>
      <span className="text-xs text-muted-foreground">{formatDate(list.created_at)}</span>
    </Link>
  );
}

export function ListSidebar({
  currentListId,
  otherLists,
  mobileOpen = false,
  onMobileOpenChange,
}: ListSidebarProps) {
  // Desktop sidebar content
  const sidebarContent = (
    <nav className="space-y-1 p-2">
      {otherLists.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">
          Keine weiteren aktiven Listen
        </p>
      ) : (
        otherLists.map((list) => (
          <ListLink
            key={list.id}
            list={list}
            active={list.id === currentListId}
          />
        ))
      )}
    </nav>
  );

  return (
    <>
      {/* Desktop: fixed aside (240px) — hidden on mobile */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r min-h-0">
        <div className="p-3 border-b">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Andere Listen
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">{sidebarContent}</div>
      </aside>

      {/* Mobile: Sheet */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide text-left">
              Andere Listen
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto flex-1">{sidebarContent}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
