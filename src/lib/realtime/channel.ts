import type { SupabaseClient } from "@supabase/supabase-js";

/** Drop a reused realtime channel so new listeners can be registered. */
export function removeRealtimeChannel(
  supabase: SupabaseClient,
  channelName: string,
): void {
  const topic = `realtime:${channelName}`;
  for (const existing of supabase.getChannels()) {
    if (existing.topic === topic) {
      void supabase.removeChannel(existing);
    }
  }
}
