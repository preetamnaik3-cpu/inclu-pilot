import { LoginPageClient } from "@/components/login-page";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginPageClient supabaseEnabled={isSupabaseConfigured()} />;
}
