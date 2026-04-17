"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
  /** Optional element rendered next to the title (e.g. a toggle link) */
  headerExtra?: React.ReactNode;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  count,
  children,
  headerExtra,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section>
      {/* Section header — acts as disclosure button */}
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 flex-1 min-h-[44px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          aria-expanded={isOpen}
        >
          <ChevronDownIcon
            className="h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform duration-200"
            style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
            aria-hidden="true"
          />
          <span className="font-semibold text-sm text-foreground">{title}</span>
          {count !== undefined && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-medium px-1.5 py-0.5 min-w-[20px]">
              {count}
            </span>
          )}
        </button>

        {/* Extra content (e.g. history toggle) */}
        {headerExtra && (
          <div className="flex-shrink-0">{headerExtra}</div>
        )}
      </div>

      {/* Collapsible content */}
      {isOpen && (
        <div className="space-y-1 px-2">
          {children}
        </div>
      )}
    </section>
  );
}
