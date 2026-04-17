"use client";

// EditStoreDialogTrigger — small Client Component that wraps the edit button
// and controls the EditStoreDialog open state.
// Extracted so that StoreHeader can remain a Server Component.

import { useState } from "react";
import { PencilIcon } from "@heroicons/react/24/outline";
import { EditStoreDialog } from "./EditStoreDialog";
import type { Tables } from "@/types/database";

interface EditStoreDialogTriggerProps {
  store: Tables<"stores">;
}

export function EditStoreDialogTrigger({ store }: EditStoreDialogTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${store.name} bearbeiten`}
        className="p-2 -mr-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <PencilIcon className="h-5 w-5" aria-hidden="true" />
      </button>

      <EditStoreDialog store={store} open={open} onOpenChange={setOpen} />
    </>
  );
}
