import { z } from "zod";

// 32 hex chars (from randomUUID().replace(/-/g, ""))
export const inviteTokenSchema = z.string().regex(/^[0-9a-f]{32}$/, "Ungültiges Token");
