"use server";

import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(notificationKey: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("notification_reads").upsert({
    user_id: user.id,
    notification_key: notificationKey,
    read_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  return { success: true };
}

export async function markConversationRead(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("conversation_reads").upsert({
    conversation_id: conversationId,
    user_id: user.id,
    last_read_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };

  return { success: true };
}
