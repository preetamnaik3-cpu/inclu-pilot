import { createClient } from "@/lib/supabase/server";
import type { UpdateType, UpdateVisibility, UserRole } from "@/lib/types";

export async function insertHubUpdate(input: {
  projectId: string;
  activityId?: string;
  authorId: string;
  authorRole: UserRole;
  type: UpdateType;
  body: string;
  visibility: UpdateVisibility;
  feedTitle?: string;
  feedSubtitle?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
  publishNow?: boolean;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("hub_updates").insert({
    project_id: input.projectId,
    activity_id: input.activityId ?? null,
    author_id: input.authorId,
    author_role: input.authorRole,
    type: input.type,
    body: input.body,
    visibility: input.visibility,
    published_at: input.publishNow ? new Date().toISOString() : null,
    feed_title: input.feedTitle ?? null,
    feed_subtitle: input.feedSubtitle ?? null,
    icon: input.icon ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function publishHubUpdate(updateId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("hub_updates")
    .update({
      visibility: "client",
      published_at: new Date().toISOString(),
    })
    .eq("id", updateId);

  if (error) return { error: error.message };
  return { success: true };
}
