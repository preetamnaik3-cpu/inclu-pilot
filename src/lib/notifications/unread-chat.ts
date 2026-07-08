import type { SupabaseClient } from "@supabase/supabase-js";

export async function countUnreadMessages(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
): Promise<number> {
  const { data: read } = await supabase
    .from("conversation_reads")
    .select("last_read_at")
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  let query = supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);

  if (read?.last_read_at) {
    query = query.gt("created_at", read.last_read_at);
  }

  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export async function countManagerUnreadMessages(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("manager_id", userId);

  const projectIds = (projects ?? []).map((p) => p.id);
  if (!projectIds.length) return 0;

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .in("project_id", projectIds)
    .eq("type", "client_manager");

  const conversationIds = (conversations ?? []).map((c) => c.id);
  if (!conversationIds.length) return 0;

  const counts = await Promise.all(
    conversationIds.map((id) => countUnreadMessages(supabase, id, userId)),
  );

  return counts.reduce((sum, n) => sum + n, 0);
}

export async function getClientChatConversationId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("client_id", userId)
    .maybeSingle();

  if (!project) return null;

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id")
    .eq("project_id", project.id)
    .eq("type", "client_manager")
    .maybeSingle();

  return conversation?.id ?? null;
}

export async function getManagerChatConversationIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("manager_id", userId);

  const projectIds = (projects ?? []).map((p) => p.id);
  if (!projectIds.length) return [];

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id")
    .in("project_id", projectIds)
    .eq("type", "client_manager");

  return (conversations ?? []).map((c) => c.id);
}
