"use client";

import { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { NewStoreDialog } from "./NewStoreDialog";

export function StoreGridFab() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        aria-label="Neues Geschäft hinzufügen"
        className="fixed z-40 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
        style={{
          width: 56,
          height: 56,
          bottom: "calc(4rem + env(safe-area-inset-bottom))",
          right: "1rem",
        }}
      >
        <PlusIcon className="h-7 w-7" aria-hidden="true" />
      </button>

      <NewStoreDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
