"use client";

import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";

interface QuantityStepperProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  min?: number;
  max?: number;
  id?: string;
}

// Stepper for integer count. Stores as string to stay compatible with the
// free-form `quantity` field (e.g. keeps room for "500g" entered elsewhere).
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  id,
}: QuantityStepperProps) {
  const current = parseCount(value, min);

  function setCount(next: number) {
    const clamped = Math.max(min, Math.min(max, next));
    onChange(String(clamped));
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.trim();
    if (raw === "") {
      onChange(undefined);
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    onChange(String(Math.max(min, Math.min(max, parsed))));
  }

  return (
    <div className="flex items-stretch rounded-md border border-input overflow-hidden h-11">
      <button
        type="button"
        aria-label="Menge verringern"
        onClick={() => setCount(current - 1)}
        disabled={current <= min}
        className="px-3 flex items-center justify-center text-foreground hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MinusIcon className="h-4 w-4" aria-hidden="true" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value ?? ""}
        onChange={handleInput}
        placeholder="1"
        className="flex-1 min-w-0 bg-transparent text-center text-base md:text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Menge erhöhen"
        onClick={() => setCount(current + 1)}
        disabled={current >= max}
        className="px-3 flex items-center justify-center text-foreground hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <PlusIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function parseCount(value: string | undefined, min: number): number {
  if (!value) return min;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? min : parsed;
}
