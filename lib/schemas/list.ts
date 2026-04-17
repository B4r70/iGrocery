import { z } from "zod";

export const listCreateSchema = z.object({
  store_id: z.string().uuid("Ungültige Store-ID"),
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(100, "Titel darf maximal 100 Zeichen lang sein")
    .trim(),
});

export const listUpdateSchema = z.object({
  title: z
    .string()
    .min(1, "Titel ist erforderlich")
    .max(100, "Titel darf maximal 100 Zeichen lang sein")
    .trim()
    .optional(),
});

export type ListCreateInput = z.infer<typeof listCreateSchema>;
export type ListUpdateInput = z.infer<typeof listUpdateSchema>;
