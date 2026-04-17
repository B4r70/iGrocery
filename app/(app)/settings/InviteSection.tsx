"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createInvite, revokeInvite } from "./actions";

interface Invite {
  token: string;
  created_at: string;
  expires_at: string;
}

interface InviteSectionProps {
  invites: Invite[];
  appUrl: string;
}

/** Formats a date string as "TT.MM.JJJJ HH:MM" */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function InviteSection({ invites, appUrl }: InviteSectionProps) {
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      const result = await createInvite();
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      const link = `${appUrl}/join/${result.token}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Einladungslink in die Zwischenablage kopiert!", {
          description: link,
          duration: 8000,
        });
      } catch {
        // Clipboard not available (e.g. non-HTTPS) — show link in toast
        toast.success("Einladung erstellt", {
          description: link,
          duration: 15000,
        });
      }
    });
  }

  function handleRevoke(token: string) {
    startTransition(async () => {
      const result = await revokeInvite(token);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Einladung widerrufen");
    });
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Partner einladen</h2>

      <Button
        onClick={handleCreate}
        disabled={isPending}
        className="min-h-[44px]"
      >
        {isPending ? "Wird erstellt…" : "Einladung erstellen"}
      </Button>

      {invites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Aktive Einladungen</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 pr-4 font-medium">Token</th>
                <th className="pb-2 pr-4 font-medium">Läuft ab</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.token} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">
                    {invite.token.slice(0, 8)}…
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {formatDate(invite.expires_at)}
                  </td>
                  <td className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] text-destructive hover:text-destructive"
                      onClick={() => handleRevoke(invite.token)}
                      disabled={isPending}
                    >
                      Widerrufen
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
