"use client";

import {
  type Control,
  Controller,
  type FieldErrors,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StoreIconPicker } from "./StoreIconPicker";
import { StoreColorPicker } from "./StoreColorPicker";
import type { StoreCreateInput } from "@/lib/schemas/store";

interface StoreFormFieldsProps {
  control: Control<StoreCreateInput>;
  errors: FieldErrors<StoreCreateInput>;
}

export function StoreFormFields({ control, errors }: StoreFormFieldsProps) {
  return (
    <div className="space-y-5">
      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="store-name">Name</Label>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              id="store-name"
              placeholder="z. B. REWE, Aldi, Lidl…"
              autoComplete="off"
              {...field}
            />
          )}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Icon */}
      <div className="space-y-1.5">
        <Label>Icon</Label>
        <Controller
          name="icon_key"
          control={control}
          render={({ field }) => (
            <StoreIconPicker
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
        {errors.icon_key && (
          <p className="text-sm text-destructive">{errors.icon_key.message}</p>
        )}
      </div>

      {/* Color */}
      <div className="space-y-1.5">
        <Label>Farbe</Label>
        <Controller
          name="color"
          control={control}
          render={({ field }) => (
            <StoreColorPicker value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.color && (
          <p className="text-sm text-destructive">{errors.color.message}</p>
        )}
      </div>
    </div>
  );
}
