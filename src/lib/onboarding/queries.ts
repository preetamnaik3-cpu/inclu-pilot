import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type PendingClientAssignment = {
  projectName: string;
  managerName: string;
  managerEmail: string;
};

export const getPendingAssignmentForClient = cache(
  async (): Promise<PendingClientAssignment | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_my_pending_assignment");

    if (error || !data?.length) return null;

    const row = data[0] as {
      project_name: string;
      manager_name: string;
      manager_email: string;
    };

    return {
      projectName: row.project_name,
      managerName: row.manager_name,
      managerEmail: row.manager_email,
    };
  },
);

export const getClientProjectId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", user.id)
    .maybeSingle();

  return data?.id ?? null;
});
