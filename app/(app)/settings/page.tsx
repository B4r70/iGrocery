import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { InviteSection } from "./InviteSection";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, households(name)")
    .eq("user_id", user.id)
    .single();

  const householdId = membership?.household_id;

  // households is returned as a nested object (one-to-one join), not array
  const householdsRow = membership?.households as { name: string } | null | undefined;
  const householdName = householdsRow?.name ?? "—";

  // Load members, then load profiles separately to avoid FK-inference issues
  const { data: rawMembers } = householdId
    ? await supabase
        .from("household_members")
        .select("user_id, role")
        .eq("household_id", householdId)
    : { data: [] };

  // Collect user IDs and fetch their display names from profiles
  const memberUserIds = rawMembers?.map((m) => m.user_id) ?? [];
  const { data: memberProfiles } = memberUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", memberUserIds)
    : { data: [] };

  // Build lookup map
  const profileMap = new Map(memberProfiles?.map((p) => [p.id, p.display_name]) ?? []);

  const { data: invites } = householdId
    ? await supabase
        .from("household_invites")
        .select("token, created_at, expires_at")
        .eq("household_id", householdId)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
    : { data: [] };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="mx-auto max-w-2xl p-4 space-y-8">
      <h1 className="text-2xl font-bold">Einstellungen</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Mein Profil</h2>
        <div className="text-sm text-muted-foreground">
          <div>Name: {profile?.display_name}</div>
          <div>E-Mail: {user.email}</div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Haushalt</h2>
        <div className="text-sm">{householdName}</div>
        <ul className="text-sm text-muted-foreground">
          {rawMembers?.map((m) => (
            <li key={m.user_id}>
              {profileMap.get(m.user_id) ?? "—"}{" "}
              {m.role === "owner" && "(Besitzer)"}
            </li>
          ))}
        </ul>
      </section>

      <InviteSection invites={invites ?? []} appUrl={appUrl} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Abmelden</h2>
        <form action={signOut}>
          <Button type="submit" variant="destructive" className="min-h-[44px]">
            Abmelden
          </Button>
        </form>
      </section>
    </div>
  );
}
