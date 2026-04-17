// Pure aggregate helpers for shopping list items.
// No Supabase dependency — usable in both Server and Client contexts.

/** Number of unchecked items in a list. */
export function countOpen(items: { is_checked: boolean }[]): number {
  return items.filter((i) => !i.is_checked).length;
}

/** Number of checked items in a list. */
export function countDone(items: { is_checked: boolean }[]): number {
  return items.filter((i) => i.is_checked).length;
}

/**
 * Sum of all item prices (null price counts as 0).
 * Includes all items regardless of checked state.
 */
export function sumTotal(items: { price: number | null; is_checked?: boolean }[]): number {
  return items.reduce((acc, item) => acc + (item.price ?? 0), 0);
}
