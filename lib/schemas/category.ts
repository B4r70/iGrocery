import { z } from "zod";

export const categoryCreateSchema = z.object({
  household_id: z.string().uuid("Ungültige Haushalt-ID"),
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(50, "Name darf maximal 50 Zeichen lang sein")
    .trim(),
});

export const categoryUpdateSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(50, "Name darf maximal 50 Zeichen lang sein")
    .trim()
    .optional(),
});

// Used when reordering categories (swap sort_order values for two items).
export const categoryReorderSchema = z.object({
  id_a: z.string().uuid("Ungültige Kategorie-ID"),
  id_b: z.string().uuid("Ungültige Kategorie-ID"),
});

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type CategoryReorderInput = z.infer<typeof categoryReorderSchema>;
