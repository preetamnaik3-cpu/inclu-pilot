"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function assignClientByUserId(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  const projectName = String(formData.get("projectName") ?? "").trim();

  if (!clientId) return { error: "Select a client" };
  if (!projectName) return { error: "Project name is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("manager_assign_client", {
    p_user_id: clientId,
    p_project_name: projectName,
  });

  if (error) return { error: error.message };

  revalidatePath("/manager");
  revalidatePath("/waiting");
  revalidatePath("/client");
  revalidatePath("/team/work");

  return {
    success: true,
    message: "Client linked to new project. They can sign in now.",
  };
}

export async function deleteManagerProject(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return { error: "Project is required" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.rpc("manager_delete_project", {
    p_project_id: projectId,
  });

  if (error) return { error: error.message };

  revalidatePath("/manager");
  revalidatePath("/waiting");
  revalidatePath("/client");
  revalidatePath("/team/work");

  return { success: true, message: "Project deleted. Client and team released." };
}
