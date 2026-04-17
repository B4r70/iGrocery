import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { inviteTokenSchema } from "@/lib/schemas/invite";
import { acceptInvite } from "./actions";

interface JoinPageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;

  const parsed = inviteTokenSchema.safeParse(token);
  if (!parsed.success) {
    return <JoinError message="Ungültiger Einladungslink." />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in → send to register with invite token prefilled
    redirect(`/register?invite=${parsed.data}`);
  }

  // Check if user already belongs to a household
  const { data: existing } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return <JoinError message="Du bist bereits Mitglied eines Haushalts." />;
  }

  // Logged in, no household yet → offer accept
  return (
    <div className="mx-auto max-w-md p-6 space-y-4 text-center">
      <h1 className="text-2xl font-bold">Haushalt beitreten</h1>
      <p className="text-muted-foreground">Du wurdest zu einem Haushalt eingeladen.</p>
      <form action={acceptInvite}>
        <input type="hidden" name="token" value={parsed.data} />
        <Button type="submit" className="min-h-[44px]">
          Beitreten
        </Button>
      </form>
    </div>
  );
}

function JoinError({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-md p-6 space-y-4 text-center">
      <h1 className="text-2xl font-bold">Fehler</h1>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
