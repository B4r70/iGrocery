"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StoreFormFields } from "./StoreFormFields";
import { updateStore, deleteStore } from "@/app/(app)/actions";
import { storeCreateSchema, type StoreCreateInput } from "@/lib/schemas/store";
import type { Tables } from "@/types/database";

interface EditStoreDialogProps {
  store: Tables<"stores">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStoreDialog({
  store,
  open,
  onOpenChange,
}: EditStoreDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StoreCreateInput>({
    resolver: zodResolver(storeCreateSchema),
    defaultValues: {
      name: store.name,
      icon_key: store.icon_key ?? "shopping-cart",
      color: store.color,
    },
  });

  function onSubmit(data: StoreCreateInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("icon_key", data.icon_key);
      formData.set("color", data.color);

      const result = await updateStore(store.id, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Geschäft aktualisiert");
      onOpenChange(false);
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteStore(store.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Geschäft gelöscht");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-env(keyboard-inset-height,0px))] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Geschäft bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <StoreFormFields control={control} errors={errors} />
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="sm:mr-auto min-h-[44px]"
            >
              {confirmDelete ? "Wirklich löschen?" : "Löschen"}
            </Button>
            <DialogClose
              render={
                <Button
                  variant="outline"
                  type="button"
                  disabled={isPending}
                />
              }
            >
              Abbrechen
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Wird gespeichert…" : "Speichern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
