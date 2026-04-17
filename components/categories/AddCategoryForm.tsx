"use client";

import { useTransition, useRef } from "react";
import { toast } from "sonner";
import { createCategory } from "@/app/(app)/settings/categories/actions";
import { Button } from "@/components/ui/button";

export function AddCategoryForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createCategory(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        name="name"
        required
        maxLength={50}
        placeholder="Neue Kategorie"
        disabled={isPending}
        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] disabled:opacity-50"
      />
      <Button type="submit" disabled={isPending} className="min-h-[44px] shrink-0">
        Hinzufügen
      </Button>
    </form>
  );
}
