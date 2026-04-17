"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { completeList } from "@/app/(app)/lists/[id]/actions";

interface CompleteWatcherProps {
  listId: string;
  openCount: number;
  doneCount: number;
}

export function CompleteWatcher({
  listId,
  openCount,
  doneCount,
}: CompleteWatcherProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastIdRef = useRef<string | number | null>(null);
  // Track previous open count to detect "last check" moment
  const prevOpenRef = useRef<number>(openCount);

  useEffect(() => {
    const prev = prevOpenRef.current;
    prevOpenRef.current = openCount;

    // Only trigger when transitioning from >0 open to 0 open (last item checked)
    if (openCount === 0 && doneCount > 0 && prev > 0) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (toastIdRef.current != null) {
        toast.dismiss(toastIdRef.current);
      }

      // Show toast with undo option
      const id = toast("Alle Positionen erledigt", {
        description: "Liste wird in 30 Sekunden abgeschlossen",
        duration: 30000,
        action: {
          label: "Rückgängig",
          onClick: () => {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            toast.dismiss(id);
          },
        },
      });
      toastIdRef.current = id;

      timerRef.current = setTimeout(async () => {
        timerRef.current = null;
        await completeList(listId);
        toast.dismiss(id);
      }, 30000);
    }

    // If items are unchecked again (openCount > 0), cancel the timer
    if (openCount > 0 && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      if (toastIdRef.current != null) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    }
  }, [openCount, doneCount, listId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return null;
}
