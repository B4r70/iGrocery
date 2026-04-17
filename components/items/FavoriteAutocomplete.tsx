"use client";

import { useEffect, useRef, useState } from "react";
import type { Tables } from "@/types/database";

type Favorite = Tables<"favorites">;

interface FavoriteAutocompleteProps {
  listId: string;
  value: string;
  onSelect: (favorite: Favorite) => void;
}

export function FavoriteAutocomplete({
  listId,
  value,
  onSelect,
}: FavoriteAutocompleteProps) {
  const [results, setResults] = useState<Favorite[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced fetch when value changes
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Schedule the fetch — also handles clearing results when value < 2 chars
    timerRef.current = setTimeout(async () => {
      if (value.length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      try {
        const res = await fetch(
          `/lists/${listId}/favorites?q=${encodeURIComponent(value)}`
        );
        const json = (await res.json()) as { favorites: Favorite[] };
        setResults(json.favorites);
        setOpen(json.favorites.length > 0);
        setActiveIndex(-1);
      } catch {
        // Ignore fetch errors — autocomplete is non-critical
        setResults([]);
        setOpen(false);
      }
    }, value.length < 2 ? 0 : 200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, listId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const fav = results[activeIndex];
      if (fav) {
        onSelect(fav);
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  if (!open || results.length === 0) return null;

  return (
    <ul
      role="listbox"
      onKeyDown={handleKeyDown}
      className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-md overflow-hidden max-h-64 overflow-y-auto"
    >
      {results.map((fav, idx) => (
        <li
          key={fav.id}
          role="option"
          aria-selected={idx === activeIndex}
          onClick={() => {
            onSelect(fav);
            setOpen(false);
          }}
          className={[
            "px-4 py-3 cursor-pointer text-sm flex flex-col gap-0.5 min-h-[44px] justify-center",
            idx === activeIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-muted",
          ].join(" ")}
        >
          <span className="font-medium truncate">{fav.title}</span>
          {(fav.default_quantity ?? fav.default_price) && (
            <span className="text-xs text-muted-foreground">
              {[
                fav.default_quantity,
                fav.default_price != null
                  ? new Intl.NumberFormat("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    }).format(fav.default_price)
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
