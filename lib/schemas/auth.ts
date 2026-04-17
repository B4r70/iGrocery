import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Ungültige E-Mail"),
  password: z.string().min(8, "Mindestens 8 Zeichen"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.email("Ungültige E-Mail"),
  password: z.string().min(8, "Mindestens 8 Zeichen"),
  displayName: z.string().min(1, "Name erforderlich").max(50),
  invite: z.string().length(32).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;
