"use client";

// Thin client wrapper that connects the sidebar sheet state
// between ListHeader (trigger) and ListSidebar (Sheet consumer).

import { useState } from "react";
import { ListHeader } from "./ListHeader";
import { ListSidebar } from "@/components/lists/ListSidebar";
import type { Tables } from "@/types/database";

type ShoppingList = Tables<"shopping_lists">;

interface ListPageClientProps {
  list: ShoppingList;
  storeId: string;
  openCount: number;
  doneCount: number;
  total: number;
  otherLists: ShoppingList[];
  allDoneHint?: boolean;
  children: React.ReactNode;
}

export function ListPageClient({
  list,
  storeId,
  openCount,
  doneCount,
  total,
  otherLists,
  allDoneHint,
  children,
}: ListPageClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <ListHeader
        list={list}
        storeId={storeId}
        openCount={openCount}
        doneCount={doneCount}
        total={total}
        onSidebarOpen={() => setSidebarOpen(true)}
        allDoneHint={allDoneHint}
      />

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <ListSidebar
          currentListId={list.id}
          otherLists={otherLists}
          mobileOpen={sidebarOpen}
          onMobileOpenChange={setSidebarOpen}
        />

        {/* Main content */}
        <main className="flex-1 min-w-0 px-2 py-4 space-y-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
          {children}
        </main>
      </div>
    </>
  );
}
