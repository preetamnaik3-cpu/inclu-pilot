import { createClient } from "@/lib/supabase/server";
import type { DbRole } from "@/lib/auth/roles";
import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

type GuardSuccess = {
  ok: true;
  supabase: SupabaseClient;
  user: User;
  role: DbRole;
};

type GuardFailure = {
  ok: false;
  error: string;
};

export type GuardResult = GuardSuccess | GuardFailure;

export async function requireUser(): Promise<GuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile?.role) {
    return { ok: false, error: "Profile not found" };
  }

  return {
    ok: true,
    supabase,
    user,
    role: profile.role as DbRole,
  };
}

export async function requireRole(allowed: DbRole[]): Promise<GuardResult> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (!allowed.includes(result.role)) {
    return { ok: false, error: "Forbidden" };
  }
  return result;
}
