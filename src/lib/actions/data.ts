"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireRole, requireUser, requireAuthenticatedUser } from "@/lib/auth/guards";
import {
  getAttachmentKindFromFile,
  validateChatFile,
} from "@/lib/chat-attachments";
import { insertHubUpdate, publishHubUpdate } from "@/lib/updates/actions";
import type { WorkStatus } from "@/lib/types";

function hubAuthorRole(role: string): "client" | "manager" | "team" {
  if (role === "client") return "client";
  if (role === "team") return "team";
  return "manager";
}

export async function addWorkComment(workItemId: string, body: string) {
  const auth = await requireRole(["client"]);
  if (!auth.ok) return { error: auth.error };

  const { data: workItem } = await auth.supabase
    .from("work_items")
    .select("project_id")
    .eq("id", workItemId)
    .single();

  if (!workItem?.project_id) return { error: "Activity not found" };

  const result = await insertHubUpdate({
    projectId: workItem.project_id,
    activityId: workItemId,
    authorId: auth.user.id,
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
  const auth = await requireRole(["manager", "admin"]);
  if (!auth.ok) return { error: auth.error };

  const { data: workItem } = await auth.supabase
    .from("work_items")
    .select("project_id")
    .eq("id", workItemId)
    .single();

  if (!workItem?.project_id) return { error: "Activity not found" };

  const result = await insertHubUpdate({
    projectId: workItem.project_id,
    activityId: workItemId,
    authorId: auth.user.id,
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
  const auth = await requireAuthenticatedUser();
  if (!auth.ok) return { error: auth.error };

  const trimmed = body.trim();
  if (!trimmed && !file) return { error: "Message cannot be empty" };

  let attachmentUrl: string | null = null;
  let attachmentName: string | null = null;
  let attachmentKind: string | null = null;
  let attachmentMimeType: string | null = null;

  if (file && file.size > 0) {
    const validationError = validateChatFile(file);
    if (validationError) return { error: validationError };

    const safeName = file.name.replace(/[^\w.\-() ]/g, "_");
    const path = `${conversationId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await auth.supabase.storage
      .from("chat-attachments")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { error: uploadError.message };

    attachmentUrl = path;
    attachmentName = file.name;
    attachmentMimeType = file.type || null;
    attachmentKind = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
        ? "video"
        : "file";
  }

  const { data: inserted, error } = await auth.supabase
    .from("messages")
    .insert({
    conversation_id: conversationId,
    sender_id: auth.user.id,
    body: trimmed,
    attachment_url: attachmentUrl,
    attachment_name: attachmentName,
    attachment_kind: attachmentKind,
    attachment_mime_type: attachmentMimeType,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (inserted?.id) {
    const { supabase, user } = auth;
    const messageId = inserted.id;
    const messageBody = trimmed;
    const senderId = user.id;
    after(() => {
      void supabase.functions
        .invoke("send-push", {
          body: {
            conversationId,
            message: { id: messageId, senderId, body: messageBody },
          },
        })
        .catch(() => undefined);
    });
  }

  return { success: true };
}

export async function updateWorkItemStatus(
  workItemId: string,
  status: WorkStatus,
) {
  const auth = await requireRole(["manager", "admin", "team"]);
  if (!auth.ok) return { error: auth.error };

  const { error } = await auth.supabase
    .from("work_items")
    .update({ status })
    .eq("id", workItemId);

  if (error) return { error: error.message };
  revalidatePath("/manager/activities");
  revalidatePath("/manager/project");
  revalidatePath(`/manager/activities/${workItemId}`);
  revalidatePath("/client/activities");
  revalidatePath("/team/work");
  return { success: true };
}

export async function publishActivityUpdate(
  projectId: string,
  title: string,
  subtitle: string,
  visibleToClient: boolean,
  workItemId?: string,
) {
  const auth = await requireRole(["manager", "admin"]);
  if (!auth.ok) return { error: auth.error };

  const result = await insertHubUpdate({
    projectId,
    activityId: workItemId,
    authorId: auth.user.id,
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

  const auth = await requireRole(["manager", "admin"]);
  if (!auth.ok) return { error: auth.error };

  const { data: workItem } = await auth.supabase
    .from("work_items")
    .select("title")
    .eq("id", workItemId)
    .single();

  const title = workItem?.title ?? "Activity update";

  const result = await insertHubUpdate({
    projectId,
    activityId: workItemId,
    authorId: auth.user.id,
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

export async function publishTeamQuickUpdate(
  updateId: string,
  activityId: string,
) {
  const auth = await requireRole(["manager", "admin"]);
  if (!auth.ok) return { error: auth.error };

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

  const auth = await requireRole(["team"]);
  if (!auth.ok) return { error: auth.error };

  const { data: workItem } = await auth.supabase
    .from("work_items")
    .select("project_id")
    .eq("id", activityId)
    .single();

  if (!workItem?.project_id) return { error: "Activity not found" };

  const result = await insertHubUpdate({
    projectId: workItem.project_id,
    activityId,
    authorId: auth.user.id,
    authorRole: hubAuthorRole(auth.role),
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
  _managerId: string,
  outcome?: string,
) {
  const auth = await requireRole(["manager", "admin"]);
  if (!auth.ok) return { error: auth.error };

  const trimmedTitle = title.trim();
  const trimmedOutcome = outcome?.trim();
  if (!trimmedTitle) return { error: "Title is required" };

  const { error } = await auth.supabase.from("work_items").insert({
    project_id: projectId,
    title: trimmedTitle,
    outcome_description: trimmedOutcome || null,
    created_by: auth.user.id,
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
  const auth = await requireRole(["manager", "admin"]);
  if (!auth.ok) return { error: auth.error };
  if (!file || file.size === 0) return { error: "No file selected" };

  const validationError = validateChatFile(file);
  if (validationError) return { error: validationError };

  const kind = getAttachmentKindFromFile(file);
  const safeName = file.name.replace(/[^\w.\-() ]/g, "_");
  const path = `${auth.user.id}/${activityId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await auth.supabase.storage
    .from("activity-files")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const result = await insertHubUpdate({
    projectId,
    activityId,
    authorId: auth.user.id,
    authorRole: "manager",
    type: "file_upload",
    body: file.name,
    visibility: publishToClient ? "client" : "manager",
    feedTitle: "New file shared",
    feedSubtitle: file.name,
    icon: "📎",
    metadata: {
      fileUrl: path,
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
  const auth = await requireRole(["manager", "admin"]);
  if (!auth.ok) return { error: auth.error };

  const result = await publishHubUpdate(updateId);
  if (result.error) return result;

  revalidatePath("/manager/activities");
  revalidatePath(`/manager/activities/${activityId}`);
  revalidatePath("/client/activities");
  revalidatePath(`/client/activities/${activityId}`);
  revalidatePath("/client");
  return { success: true };
}
