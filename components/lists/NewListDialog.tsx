"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusIcon } from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createList } from "@/app/(app)/stores/[id]/actions";
import { listCreateSchema, type ListCreateInput } from "@/lib/schemas/list";

// Generates the default title "Einkauf TT.MM.JJJJ" for today.
function todayTitle(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `Einkauf ${day}.${month}.${year}`;
}

interface NewListDialogProps {
  storeId: string;
}

export function NewListDialog({ storeId }: NewListDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ListCreateInput>({
    resolver: zodResolver(listCreateSchema),
    defaultValues: {
      store_id: storeId,
      title: todayTitle(),
    },
  });

  function onOpen() {
    reset({ store_id: storeId, title: todayTitle() });
    setOpen(true);
  }

  function onSubmit(data: ListCreateInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", data.title);

      const result = await createList(storeId, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Liste erstellt");
      setOpen(false);
    });
  }

  return (
    <>
      {/* FAB trigger */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="Neue Liste erstellen"
        className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] right-4 z-30 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <PlusIcon className="h-7 w-7" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-env(keyboard-inset-height,0px))] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Liste</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Hidden store_id field — not rendered since storeId comes from prop */}
            <input type="hidden" {...register("store_id")} />

            <div className="space-y-2">
              <Label htmlFor="list-title">Titel</Label>
              <Input
                id="list-title"
                {...register("title")}
                placeholder="z. B. Einkauf 17.04.2026"
                autoFocus
                className="min-h-[44px]"
              />
              {errors.title && (
                <p className="text-xs text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" type="button" disabled={isPending} />
                }
              >
                Abbrechen
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Wird erstellt…" : "Erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
