import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { routeForRole } from "@/lib/auth/roles";

type UserRole = Database["public"]["Enums"]["user_role"];

export type SessionRouteContext = {
  role: UserRole | null;
  destination: string;
  hasAssignment: boolean;
};

/** Lightweight portal routing for middleware — no promote RPC, one assignment check max. */
export async function getSessionRouteContext(
  supabase: SupabaseClient,
  userId: string,
  role: UserRole | null | undefined,
): Promise<SessionRouteContext> {
  const resolvedRole = role ?? "unassigned";

  if (resolvedRole === "manager" || resolvedRole === "admin") {
    return {
      role: resolvedRole,
      destination: routeForRole(resolvedRole),
      hasAssignment: true,
    };
  }

  if (resolvedRole === "client") {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("client_id", userId)
      .maybeSingle();

    const hasAssignment = Boolean(project);
    return {
      role: resolvedRole,
      destination: hasAssignment ? "/client" : "/waiting",
      hasAssignment,
    };
  }

  if (resolvedRole === "team") {
    const { data: membership } = await supabase
      .from("project_team_members")
      .select("project_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    const hasAssignment = Boolean(membership);
    return {
      role: resolvedRole,
      destination: hasAssignment ? "/team/work" : "/waiting",
      hasAssignment,
    };
  }

  return {
    role: resolvedRole,
    destination: "/waiting",
    hasAssignment: false,
  };
}
