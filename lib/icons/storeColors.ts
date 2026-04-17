// 8 curated store colors — used by StoreColorPicker and rendered via inline styles.
// Do NOT use dynamic Tailwind classes for these — use style={{ backgroundColor: hex }}.

export interface StoreColorEntry {
  key: string;
  label: string;
  hex: string;
}

export const STORE_COLORS: readonly StoreColorEntry[] = [
  { key: "red",    label: "Rot",     hex: "#ef4444" },
  { key: "orange", label: "Orange",  hex: "#f97316" },
  { key: "yellow", label: "Gelb",    hex: "#eab308" },
  { key: "green",  label: "Grün",    hex: "#22c55e" },
  { key: "teal",   label: "Türkis",  hex: "#14b8a6" },
  { key: "blue",   label: "Blau",    hex: "#3b82f6" },
  { key: "purple", label: "Lila",    hex: "#a855f7" },
  { key: "pink",   label: "Pink",    hex: "#ec4899" },
] as const;

// Returns the hex value for a given color key, or the default red if not found.
export function getStoreColorHex(key: string): string {
  return STORE_COLORS.find((c) => c.key === key)?.hex ?? "#ef4444";
}
