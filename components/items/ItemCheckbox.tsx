"use client";

import { useTransition } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";
import { toggleItem } from "@/app/(app)/lists/[id]/actions";

interface ItemCheckboxProps {
  itemId: string;
  listId: string;
  checked: boolean;
}

export function ItemCheckbox({ itemId, listId, checked }: ItemCheckboxProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleItem(itemId, listId);
    });
  }

  return (
    // 44×44 touch target via padding
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={handleClick}
      disabled={isPending}
      className="p-[10px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      aria-label={checked ? "Als offen markieren" : "Als erledigt markieren"}
    >
      <span
        className={[
          "h-6 w-6 rounded-full flex items-center justify-center transition-colors",
          checked
            ? "bg-primary"
            : "border-2 border-muted-foreground/40 bg-transparent",
          isPending ? "opacity-50" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {checked && (
          <CheckIcon
            className="h-4 w-4 text-primary-foreground stroke-[3]"
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  );
}
