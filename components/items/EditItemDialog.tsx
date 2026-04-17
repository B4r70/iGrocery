"use client";

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateItem, deleteItem } from "@/app/(app)/lists/[id]/actions";
import { itemUpdateSchema, type ItemUpdateInput } from "@/lib/schemas/item";
import type { Tables } from "@/types/database";

type ListItem = Tables<"list_items">;
type Category = Tables<"categories">;

interface EditItemDialogProps {
  item: ListItem;
  listId: string;
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NO_CATEGORY = "__none__";

export function EditItemDialog({
  item,
  listId,
  categories,
  open,
  onOpenChange,
}: EditItemDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ItemUpdateInput>({
    resolver: zodResolver(itemUpdateSchema),
    defaultValues: {
      title: item.title,
      quantity: item.quantity ?? undefined,
      price: item.price ?? undefined,
      note: item.note ?? undefined,
      category_id: item.category_id ?? undefined,
      is_offer: item.is_offer,
    },
  });

  function onSubmit(data: ItemUpdateInput) {
    startTransition(async () => {
      const result = await updateItem(item.id, listId, {
        ...data,
        category_id:
          data.category_id === NO_CATEGORY ? undefined : data.category_id,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Position aktualisiert");
      onOpenChange(false);
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteItem(item.id, listId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Position gelöscht");
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-env(keyboard-inset-height,0px))] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Position bearbeiten</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Titel</Label>
            <Input
              id="edit-title"
              autoComplete="off"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Kategorie</Label>
            <Controller
              name="category_id"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? NO_CATEGORY}
                  onValueChange={(v) =>
                    field.onChange(v === NO_CATEGORY ? undefined : v)
                  }
                >
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue placeholder="Keine Kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CATEGORY}>Keine Kategorie</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Quantity + Price in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-quantity">Menge</Label>
              <Input
                id="edit-quantity"
                placeholder="z. B. 500g"
                autoComplete="off"
                {...register("quantity")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-price">Preis (€)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register("price", {
                  setValueAs: (v) =>
                    v === "" || v === null || v === undefined
                      ? undefined
                      : Number.parseFloat(v),
                })}
              />
              {errors.price && (
                <p className="text-sm text-destructive">{errors.price.message}</p>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-note">Notiz</Label>
            <Textarea
              id="edit-note"
              rows={2}
              placeholder="Optionale Notiz…"
              {...register("note")}
            />
          </div>

          {/* Offer switch */}
          <div className="flex items-center justify-between min-h-[44px]">
            <Label htmlFor="edit-offer">Angebot</Label>
            <Controller
              name="is_offer"
              control={control}
              render={({ field }) => (
                <Switch
                  id="edit-offer"
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

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
                <Button variant="outline" type="button" disabled={isPending} />
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
