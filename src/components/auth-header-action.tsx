import { isSupabaseConfigured } from "@/lib/config";
import { SignOutButton } from "@/components/sign-out-button";
import { SwitchRoleLink } from "@/components/client-page-header";

interface AuthHeaderActionProps {
  /** Show role switcher in demo/mock pages even when Supabase env is set */
  demo?: boolean;
}

export function AuthHeaderAction({ demo = false }: AuthHeaderActionProps) {
  if (demo || !isSupabaseConfigured()) {
    return <SwitchRoleLink />;
  }
  return <SignOutButton />;
}
