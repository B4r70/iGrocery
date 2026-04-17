"use client";

import { useEffect, useState, useTransition } from "react";
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
import { PlusIcon } from "@heroicons/react/24/outline";
import { createItem } from "@/app/(app)/lists/[id]/actions";
import { FavoriteAutocomplete } from "./FavoriteAutocomplete";
import { QuantityStepper } from "./QuantityStepper";
import { itemCreateSchema, type ItemCreateInput } from "@/lib/schemas/item";
import type { Tables } from "@/types/database";

type Category = Tables<"categories">;
type Favorite = Tables<"favorites">;

interface NewItemDialogProps {
  listId: string;
  categories: Category[];
}

const NO_CATEGORY = "__none__";
const TITLE_INPUT_ID = "new-item-title";

export function NewItemDialog({
  listId,
  categories,
}: NewItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Local state for autocomplete — avoids react-hook-form's watch() which
  // triggers the react-hooks/incompatible-library lint rule.
  const [titleDisplay, setTitleDisplay] = useState("");

  // Trigger to focus the title input after "Speichern & weiter"
  const [focusTrigger, setFocusTrigger] = useState(0);

  // Focus title input whenever focusTrigger increments
  useEffect(() => {
    if (focusTrigger === 0) return;
    const el = document.getElementById(TITLE_INPUT_ID);
    if (el instanceof HTMLInputElement) el.focus();
  }, [focusTrigger]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ItemCreateInput>({
    resolver: zodResolver(itemCreateSchema),
    defaultValues: {
      list_id: listId,
      title: "",
      quantity: undefined,
      price: undefined,
      note: undefined,
      category_id: undefined,
      is_offer: false,
    },
  });

  function applyFavorite(fav: Favorite) {
    setValue("title", fav.title);
    setTitleDisplay(fav.title);
    if (fav.default_quantity) setValue("quantity", fav.default_quantity);
    if (fav.default_price != null) setValue("price", fav.default_price);
    if (fav.category_id) setValue("category_id", fav.category_id);
  }

  function doSubmit(data: ItemCreateInput, keepOpen: boolean) {
    startTransition(async () => {
      const result = await createItem(listId, {
        title: data.title,
        quantity: data.quantity,
        price: data.price,
        note: data.note,
        category_id:
          data.category_id === NO_CATEGORY ? undefined : data.category_id,
        is_offer: data.is_offer,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (keepOpen) {
        // "Speichern & weiter": keep category + quantity, clear title only
        const prevQuantity = data.quantity;
        const prevCategory = data.category_id;
        reset({
          list_id: listId,
          title: "",
          quantity: prevQuantity,
          price: undefined,
          note: undefined,
          category_id: prevCategory,
          is_offer: false,
        });
        setTitleDisplay("");
        setFocusTrigger((n) => n + 1);
      } else {
        reset({
          list_id: listId,
          title: "",
          quantity: undefined,
          price: undefined,
          note: undefined,
          category_id: undefined,
          is_offer: false,
        });
        setTitleDisplay("");
        setOpen(false);
      }
    });
  }

  const {
    ref: titleRhfRef,
    onChange: titleRhfOnChange,
    ...titleRest
  } = register("title");

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    void titleRhfOnChange(e);
    setTitleDisplay(e.target.value);
  }

  function handleSave(data: ItemCreateInput) {
    doSubmit(data, false);
  }

  function handleSaveAndContinue(data: ItemCreateInput) {
    doSubmit(data, true);
  }

  return (
    <>
      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Neue Position hinzufügen"
        className="fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <PlusIcon className="h-7 w-7" aria-hidden="true" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-env(keyboard-inset-height,0px))] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Position</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handleSave)}
            className="space-y-4"
          >
            {/* Title + Autocomplete */}
            <div className="space-y-1.5 relative">
              <Label htmlFor={TITLE_INPUT_ID}>Titel</Label>
              <Input
                id={TITLE_INPUT_ID}
                placeholder="Position suchen oder hinzufügen…"
                autoComplete="off"
                ref={titleRhfRef}
                onChange={handleTitleChange}
                {...titleRest}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
              <FavoriteAutocomplete
                listId={listId}
                value={titleDisplay}
                onSelect={applyFavorite}
              />
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
                    <SelectTrigger className="min-h-[44px] w-full">
                      <SelectValue placeholder="Keine Kategorie">
                        {(v: string) =>
                          v === NO_CATEGORY || !v
                            ? "Keine Kategorie"
                            : categories.find((c) => c.id === v)?.name ??
                              "Keine Kategorie"
                        }
                      </SelectValue>
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

            {/* Quantity + Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-quantity">Anzahl</Label>
                <Controller
                  name="quantity"
                  control={control}
                  render={({ field }) => (
                    <QuantityStepper
                      id="new-quantity"
                      value={field.value ?? undefined}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-price">Preis (€)</Label>
                <Input
                  id="new-price"
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
              <Label htmlFor="new-note">Notiz</Label>
              <Textarea
                id="new-note"
                rows={2}
                placeholder="Optionale Notiz…"
                {...register("note")}
              />
            </div>

            {/* Offer */}
            <div className="flex items-center justify-between min-h-[44px]">
              <Label htmlFor="new-offer">Angebot</Label>
              <Controller
                name="is_offer"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="new-offer"
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <DialogFooter className="gap-2 flex-col sm:flex-row">
              <DialogClose
                render={
                  <Button variant="outline" type="button" disabled={isPending} />
                }
              >
                Abbrechen
              </DialogClose>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleSubmit(handleSaveAndContinue)}
                className="min-h-[44px]"
              >
                Speichern & weiter
              </Button>
              <Button type="submit" disabled={isPending} className="min-h-[44px]">
                {isPending ? "Wird gespeichert…" : "Speichern"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
