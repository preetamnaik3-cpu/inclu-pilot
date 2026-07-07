"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { insertHubUpdate, publishHubUpdate } from "@/lib/updates/actions";
import type { WorkStatus } from "@/lib/types";

export async function addWorkComment(workItemId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: workItem } = await supabase
    .from("work_items")
    .select("project_id")
    .eq("id", workItemId)
    .single();

  if (!workItem?.project_id) return { error: "Activity not found" };

  const result = await insertHubUpdate({
    projectId: workItem.project_id,
    activityId: workItemId,
    authorId: user.id,
    authorRole: "client",
    type: "client_note",
    body,
    visibility: "manager",
  });

  if (result.error) return result;

  revalidatePath("/client/activities");
  revalidatePath(`/client/activities/${workItemId}`);
  revalidatePath("/client/work");
  revalidatePath(`/client/work/${workItemId}`);
  revalidatePath("/manager/activities");
  revalidatePath(`/manager/activities/${workItemId}`);
  return { success: true };
}

export async function addManagerCommentReply(
  workItemId: string,
  body: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: workItem } = await supabase
    .from("work_items")
    .select("project_id")
    .eq("id", workItemId)
    .single();

  if (!workItem?.project_id) return { error: "Activity not found" };

  const result = await insertHubUpdate({
    projectId: workItem.project_id,
    activityId: workItemId,
    authorId: user.id,
    authorRole: "manager",
    type: "manager_reply",
    body,
    visibility: "client",
    publishNow: true,
  });

  if (result.error) return result;

  revalidatePath("/manager/activities");
  revalidatePath("/manager/project");
  revalidatePath(`/manager/activities/${workItemId}`);
  revalidatePath("/client/activities");
  revalidatePath(`/client/work/${workItemId}`);
  return { success: true };
}

export async function sendMessage(
  conversationId: string,
  body: string,
  file?: File,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const trimmed = body.trim();
  if (!trimmed && !file) return { error: "Message cannot be empty" };

  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  let attachmentKind: string | null = null;
  let attachmentMimeType: string | null = null;

  if (file && file.size > 0) {
    const safeName = file.name.replace(/[^\w.\-() ]/g, "_");
    const path = `${conversationId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from("chat-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { error: uploadError.message };

    const { data: publicData } = supabase.storage
      .from("chat-attachments")
      .getPublicUrl(path);

    attachmentUrl = publicData.publicUrl;
    attachmentName = file.name;
    attachmentMimeType = file.type || null;
    attachmentKind = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : "file";
  }

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: trimmed,
    attachment_url: attachmentUrl,
    attachment_name: attachmentName,
    attachment_kind: attachmentKind,
    attachment_mime_type: attachmentMimeType,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function updateWorkItemStatus(
  workItemId: string,
  status: WorkStatus,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("work_items")
    .update({ status })
    .eq("id", workItemId);

  if (error) return { error: error.message };
  revalidatePath("/manager/activities");
  revalidatePath("/manager/project");
  revalidatePath(`/manager/activities/${workItemId}`);
  revalidatePath("/client/activities");
  return { success: true };
}

export async function publishActivityUpdate(
  projectId: string,
  title: string,
  subtitle: string,
  visibleToClient: boolean,
  workItemId?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const result = await insertHubUpdate({
    projectId,
    activityId: workItemId,
    authorId: user.id,
    authorRole: "manager",
    type: visibleToClient ? "feed_highlight" : "manager_update",
    body: subtitle || title,
    visibility: visibleToClient ? "client" : "manager",
    feedTitle: title,
    feedSubtitle: subtitle,
    icon: "📌",
    publishNow: visibleToClient,
  });

  if (result.error) return result;

  revalidatePath("/client");
  revalidatePath("/manager/activities");
  revalidatePath("/manager/project");
  if (workItemId) {
    revalidatePath(`/client/activities/${workItemId}`);
    revalidatePath(`/manager/activities/${workItemId}`);
  }
  return { success: true };
}

export async function postActivityUpdateForWorkItem(
  projectId: string,
  workItemId: string,
  body: string,
) {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Update cannot be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: workItem } = await supabase
    .from("work_items")
    .select("title")
    .eq("id", workItemId)
    .single();

  const title = workItem?.title ?? "Activity update";

  const result = await insertHubUpdate({
    projectId,
    activityId: workItemId,
    authorId: user.id,
    authorRole: "manager",
    type: "manager_update",
    body: trimmed,
    visibility: "client",
    feedTitle: title,
    feedSubtitle: trimmed,
    publishNow: true,
  });

  if (result.error) return result;

  revalidatePath("/client");
  revalidatePath("/manager/activities");
  revalidatePath(`/manager/activities/${workItemId}`);
  revalidatePath(`/client/activities/${workItemId}`);
  return { success: true };
}

export async function publishTeamQuickUpdate(updateId: string, activityId: string) {
  const result = await publishHubUpdate(updateId);
  if (result.error) return result;

  revalidatePath("/manager/activities");
  revalidatePath(`/manager/activities/${activityId}`);
  revalidatePath("/client/activities");
  revalidatePath(`/client/activities/${activityId}`);
  revalidatePath("/client");
  return { success: true };
}

export async function postTeamQuickUpdate(activityId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) return { error: "Update cannot be empty" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: workItem } = await supabase
    .from("work_items")
    .select("project_id")
    .eq("id", activityId)
    .single();

  if (!workItem?.project_id) return { error: "Activity not found" };

  const result = await insertHubUpdate({
    projectId: workItem.project_id,
    activityId,
    authorId: user.id,
    authorRole: "team",
    type: "team_quick_update",
    body: trimmed,
    visibility: "manager",
  });

  if (result.error) return result;

  revalidatePath("/manager/activities");
  revalidatePath(`/manager/activities/${activityId}`);
  revalidatePath("/team/work");
  return { success: true };
}

export async function createWorkItem(
  projectId: string,
  title: string,
  managerId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("work_items").insert({
    project_id: projectId,
    title,
    created_by: managerId,
    status: "planned",
  });

  if (error) return { error: error.message };
  revalidatePath("/manager/activities");
  revalidatePath("/manager/project");
  revalidatePath("/client/activities");
  revalidatePath("/client/work");
  return { success: true };
}

export async function uploadActivityFile(
  projectId: string,
  activityId: string,
  file: File,
  publishToClient = false,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!file || file.size === 0) return { error: "No file selected" };

  const { getAttachmentKindFromFile } = await import("@/lib/chat-attachments");
  const kind = getAttachmentKindFromFile(file);
  const safeName = file.name.replace(/[^\w.\-() ]/g, "_");
  const path = `${user.id}/${activityId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("activity-files")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { data: publicData } = supabase.storage
    .from("activity-files")
    .getPublicUrl(path);

  const result = await insertHubUpdate({
    projectId,
    activityId,
    authorId: user.id,
    authorRole: "manager",
    type: "file_upload",
    body: file.name,
    visibility: publishToClient ? "client" : "manager",
    feedTitle: "New file shared",
    feedSubtitle: file.name,
    icon: "📎",
    metadata: {
      fileUrl: publicData.publicUrl,
      fileName: file.name,
      fileKind: kind,
      mimeType: file.type || undefined,
      sizeBytes: file.size,
    },
    publishNow: publishToClient,
  });

  if (result.error) return result;

  revalidatePath("/manager/activities");
  revalidatePath(`/manager/activities/${activityId}`);
  revalidatePath("/client/activities");
  revalidatePath(`/client/activities/${activityId}`);
  revalidatePath("/client");
  return { success: true };
}

export async function publishActivityFile(updateId: string, activityId: string) {
  const result = await publishHubUpdate(updateId);
  if (result.error) return result;

  revalidatePath("/manager/activities");
  revalidatePath(`/manager/activities/${activityId}`);
  revalidatePath("/client/activities");
  revalidatePath(`/client/activities/${activityId}`);
  revalidatePath("/client");
  return { success: true };
}
