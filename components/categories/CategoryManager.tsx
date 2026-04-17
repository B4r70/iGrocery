"use client";

import { useTransition, useState } from "react";
import { ChevronUpIcon, ChevronDownIcon, TrashIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  renameCategory,
  deleteCategory,
  moveCategoryUp,
  moveCategoryDown,
} from "@/app/(app)/settings/categories/actions";

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

interface CategoryManagerProps {
  categories: Category[];
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  return (
    <ul className="divide-y divide-border rounded-lg border bg-card">
      {categories.map((cat, index) => (
        <CategoryRow
          key={cat.id}
          category={cat}
          isFirst={index === 0}
          isLast={index === categories.length - 1}
        />
      ))}
      {categories.length === 0 && (
        <li className="px-4 py-6 text-center text-sm text-muted-foreground">
          Noch keine Kategorien vorhanden.
        </li>
      )}
    </ul>
  );
}

interface CategoryRowProps {
  category: Category;
  isFirst: boolean;
  isLast: boolean;
}

function CategoryRow({ category, isFirst, isLast }: CategoryRowProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(category.name);

  function handleStartEdit() {
    setEditValue(category.name);
    setIsEditing(true);
  }

  function handleSave() {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === category.name) {
      setIsEditing(false);
      setEditValue(category.name);
      return;
    }
    startTransition(async () => {
      const result = await renameCategory(category.id, trimmed);
      if (result.error) {
        toast.error(result.error);
        setEditValue(category.name);
      }
      setIsEditing(false);
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(category.name);
    }
  }

  function handleDelete() {
    if (!window.confirm(`Kategorie \u201e${category.name}\u201c l\u00f6schen?`)) return;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  function handleMoveUp() {
    startTransition(async () => {
      const result = await moveCategoryUp(category.id);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  function handleMoveDown() {
    startTransition(async () => {
      const result = await moveCategoryDown(category.id);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <li
      className="flex items-center gap-2 px-3"
      style={{ minHeight: "56px" }}
    >
      {/* Reorder buttons */}
      <div className="flex flex-col shrink-0">
        <button
          type="button"
          onClick={handleMoveUp}
          disabled={isFirst || isPending}
          aria-label="Nach oben"
          className="flex h-[36px] w-[36px] items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronUpIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleMoveDown}
          disabled={isLast || isPending}
          aria-label="Nach unten"
          className="flex h-[36px] w-[36px] items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronDownIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Name / Inline-Edit */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            maxLength={50}
            className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            className="w-full text-left text-sm font-medium leading-snug hover:underline focus:outline-none focus-visible:underline truncate"
            disabled={isPending}
          >
            {category.name}
          </button>
        )}
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Kategorie \u201e${category.name}\u201c l\u00f6schen`}
        className="ml-1 flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </li>
  );
}
