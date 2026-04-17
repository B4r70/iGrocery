"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Force each route to start at the top, regardless of how the user arrived
// (forward nav, back-button, or browser history). Prevents leftover scroll
// from the previous view hiding content below the fold.
export function ScrollReset() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
