"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { inviteTokenSchema } from "@/lib/schemas/invite";

export async function acceptInvite(formData: FormData) {
  const parsed = inviteTokenSchema.safeParse(formData.get("token"));
  if (!parsed.success) {
    redirect("/?invite_error=invalid");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invite", { p_token: parsed.data });
  if (error) {
    // RPC raises on expired/consumed tokens — redirect home with error signal
    redirect("/?invite_error=1");
  }

  redirect("/");
}
