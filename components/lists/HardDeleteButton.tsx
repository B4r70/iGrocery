"use client";

import { useTransition } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";
import { toast } from "sonner";
import { hardDeleteList } from "@/app/(app)/stores/[id]/actions";
import type { Tables } from "@/types/database";

interface HardDeleteButtonProps {
  list: Tables<"shopping_lists">;
}

export function HardDeleteButton({ list }: HardDeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      `Liste „${list.title}" und alle Positionen unwiderruflich löschen?`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await hardDeleteList(list.id, list.store_id);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Liste endgültig löschen"
      className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors disabled:opacity-50"
    >
      <TrashIcon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
