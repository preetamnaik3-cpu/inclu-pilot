import type { SupabaseClient } from "@supabase/supabase-js";
import { routeForRole } from "@/lib/auth/roles";

export async function ensureManagerAccess(
  supabase: SupabaseClient,
): Promise<void> {
  await supabase.rpc("promote_to_platform_manager");
}

export async function clientHasProject(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", userId)
    .maybeSingle();

  return Boolean(data);
}

export async function teamHasProject(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("project_team_members")
    .select("project_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

export async function resolvePostAuthRedirect(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  await ensureManagerAccess(supabase);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = profile?.role ?? "unassigned";

  if (role === "manager" || role === "admin") {
    return routeForRole(role);
  }

  if (role === "client") {
    const hasProject = await clientHasProject(supabase, userId);
    return hasProject ? "/client" : "/waiting";
  }

  if (role === "team") {
    const hasProject = await teamHasProject(supabase, userId);
    return hasProject ? "/team/work" : "/waiting";
  }

  return "/waiting";
}
