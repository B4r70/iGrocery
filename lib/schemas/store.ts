import { z } from "zod";

export const storeCreateSchema = z.object({
  name: z
    .string()
    .min(1, "Name ist erforderlich")
    .max(50, "Name darf maximal 50 Zeichen lang sein")
    .trim(),
  icon_key: z.string().min(1, "Icon ist erforderlich"),
  color: z.string().min(1, "Farbe ist erforderlich"),
  sort_order: z.number().int().nonnegative().optional(),
});

export const storeUpdateSchema = storeCreateSchema.partial();

export type StoreCreateInput = z.infer<typeof storeCreateSchema>;
export type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;
