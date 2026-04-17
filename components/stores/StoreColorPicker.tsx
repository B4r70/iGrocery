"use client";

import { STORE_COLORS } from "@/lib/icons/storeColors";
import { cn } from "@/lib/utils";

interface StoreColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function StoreColorPicker({ value, onChange }: StoreColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Farbe auswählen">
      {STORE_COLORS.map((color) => {
        const isSelected = value === color.hex;
        return (
          <button
            key={color.key}
            type="button"
            aria-pressed={isSelected}
            aria-label={color.label}
            onClick={() => onChange(color.hex)}
            className={cn(
              "rounded-full min-h-[44px] min-w-[44px] transition-transform",
              isSelected && "ring-2 ring-offset-2 ring-foreground scale-110"
            )}
            style={{ backgroundColor: color.hex }}
          />
        );
      })}
    </div>
  );
}
