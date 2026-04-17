import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { ScrollReset } from "@/components/layout/ScrollReset";

// Auth guard: unauthenticated users are sent to /login.
// The middleware already handles session refresh; this guard is the final check.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <ScrollReset />
      {children}
      <BottomNav />
    </div>
  );
}
