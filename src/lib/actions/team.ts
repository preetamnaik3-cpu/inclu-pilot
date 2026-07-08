"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function assignTeamMemberToProject(formData: FormData) {
  const teamMemberId = String(formData.get("teamMemberId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!teamMemberId) return { error: "Select a team member" };
  if (!projectId) return { error: "Select a project" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("manager_assign_team_member", {
    p_user_id: teamMemberId,
    p_project_id: projectId,
  });

  if (error) return { error: error.message };

  revalidatePath("/manager");
  revalidatePath("/waiting");
  revalidatePath("/team/work");

  return {
    success: true,
    message: "Team member added to project.",
  };
}

export async function removeTeamMemberFromProject(formData: FormData) {
  const teamMemberId = String(formData.get("teamMemberId") ?? "").trim();
  const projectId = String(formData.get("projectId") ?? "").trim();

  if (!teamMemberId || !projectId) {
    return { error: "Missing team member or project" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("manager_remove_team_member", {
    p_user_id: teamMemberId,
    p_project_id: projectId,
  });

  if (error) return { error: error.message };

  revalidatePath("/manager");
  revalidatePath("/waiting");
  revalidatePath("/team/work");
  revalidatePath("/client");

  return { success: true, message: "Team member removed from project." };
}

export async function transferTeamMember(formData: FormData) {
  const teamMemberId = String(formData.get("teamMemberId") ?? "").trim();
  const fromProjectId = String(formData.get("fromProjectId") ?? "").trim();
  const toProjectId = String(formData.get("toProjectId") ?? "").trim();

  if (!teamMemberId || !fromProjectId || !toProjectId) {
    return { error: "Missing transfer details" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("manager_transfer_team_member", {
    p_user_id: teamMemberId,
    p_from_project_id: fromProjectId,
    p_to_project_id: toProjectId,
  });

  if (error) return { error: error.message };

  revalidatePath("/manager");
  revalidatePath("/waiting");
  revalidatePath("/team/work");

  return { success: true, message: "Team member moved to new project." };
}
