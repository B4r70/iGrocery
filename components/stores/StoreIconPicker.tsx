"use client";

import { STORE_ICONS } from "@/lib/icons/storeIcons";
import { cn } from "@/lib/utils";

interface StoreIconPickerProps {
  value: string | null;
  onChange: (key: string) => void;
}

export function StoreIconPicker({ value, onChange }: StoreIconPickerProps) {
  return (
    <div
      className="grid grid-cols-5 gap-2"
      role="radiogroup"
      aria-label="Icon auswählen"
    >
      {STORE_ICONS.map((entry) => {
        const isSelected = value === entry.key;
        const Icon = isSelected ? entry.solid : entry.outline;
        return (
          <button
            key={entry.key}
            type="button"
            aria-pressed={isSelected}
            aria-label={entry.label}
            onClick={() => onChange(entry.key)}
            className={cn(
              "flex items-center justify-center rounded-lg p-3 min-h-[44px] min-w-[44px] transition-colors",
              isSelected
                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            <Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
