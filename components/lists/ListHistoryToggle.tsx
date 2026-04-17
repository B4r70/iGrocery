// ListHistoryToggle — Server Component.
// Renders a link that switches the history view between "letzte 30 Tage" and "alle".

import Link from "next/link";

interface ListHistoryToggleProps {
  currentMode: "30d" | "all";
  storeId: string;
}

export function ListHistoryToggle({
  currentMode,
  storeId,
}: ListHistoryToggleProps) {
  const isAll = currentMode === "all";
  const href = isAll ? `/stores/${storeId}` : `/stores/${storeId}?history=all`;
  const label = isAll ? "Letzte 30 Tage" : "Alle anzeigen";

  return (
    <Link
      href={href}
      className="text-xs text-primary hover:underline min-h-[44px] inline-flex items-center px-1"
    >
      {label}
    </Link>
  );
}
