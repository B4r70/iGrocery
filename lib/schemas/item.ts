import { z } from "zod";

export const itemCreateSchema = z.object({
  list_id: z.string().uuid("Ungültige Listen-ID"),
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(100, "Titel darf maximal 100 Zeichen lang sein")
    .trim(),
  quantity: z.string().trim().optional(),
  price: z.number().nonnegative("Preis darf nicht negativ sein").optional(),
  note: z.string().trim().optional(),
  category_id: z.string().uuid("Ungültige Kategorie-ID").optional(),
  is_offer: z.boolean().optional(),
});

export const itemUpdateSchema = itemCreateSchema
  .omit({ list_id: true })
  .partial();

export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
