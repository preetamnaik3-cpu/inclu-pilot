import { redirect } from "next/navigation";
import { WaitingPageClient } from "@/components/waiting-page";
import { isSupabaseConfigured } from "@/lib/config";
import { getCurrentProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { resolvePostAuthRedirect } from "@/lib/auth/onboarding";

export default async function WaitingPage() {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const destination = await resolvePostAuthRedirect(supabase, user.id);
  if (destination !== "/waiting") {
    redirect(destination);
  }

  const profile = await getCurrentProfile();

  return <WaitingPageClient email={profile?.email ?? null} />;
}
