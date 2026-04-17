"use client";

import { useTransition } from "react";
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
import { createStore } from "@/app/(app)/actions";
import { storeCreateSchema, type StoreCreateInput } from "@/lib/schemas/store";
import { STORE_COLORS } from "@/lib/icons/storeColors";

const DEFAULT_ICON = "shopping-cart";
const DEFAULT_COLOR = STORE_COLORS[0]!.hex;

interface NewStoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewStoreDialog({ open, onOpenChange }: NewStoreDialogProps) {
  const [isPending, startTransition] = useTransition();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreCreateInput>({
    resolver: zodResolver(storeCreateSchema),
    defaultValues: {
      name: "",
      icon_key: DEFAULT_ICON,
      color: DEFAULT_COLOR,
    },
  });

  function onSubmit(data: StoreCreateInput) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("icon_key", data.icon_key);
      formData.set("color", data.color);

      const result = await createStore(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Geschäft erstellt");
      reset();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-env(keyboard-inset-height,0px))] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Geschäft</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <StoreFormFields control={control} errors={errors} />
          <DialogFooter>
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
