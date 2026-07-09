"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { removeRealtimeChannel } from "@/lib/realtime/channel";
import { useToasts } from "@/components/toast-provider";
import {
  getClientChatConversationId,
  getManagerChatConversationIds,
} from "@/lib/notifications/unread-chat";

async function getTeamConversationId(supabase: ReturnType<typeof createClient>, userId: string) {
  const { data: membership } = await supabase
    .from("project_team_members")
    .select("project_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership?.project_id) return null;

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("project_id", membership.project_id)
    .eq("type", "internal_team")
    .maybeSingle();

  return conv?.id ?? null;
}

function isOnChat(pathname: string, portal: "client" | "manager" | "team") {
  const base =
    portal === "client"
      ? "/client/chat"
      : portal === "manager"
        ? "/manager/chat"
        : "/team/chat";
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function useMessageToasts(portal: "client" | "manager" | "team") {
  const pathname = usePathname();
  const toasts = useToasts();
  const toastRef = useRef(toasts);
  toastRef.current = toasts;

  useEffect(() => {
    if (!toastRef.current) return;

    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;
    let cancelled = false;

    async function subscribe() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      if (isOnChat(pathname, portal)) return;

      if (portal === "client") {
        const conversationId = await getClientChatConversationId(supabase, user.id);
        if (!conversationId || cancelled) return;
        const channelName = `toasts:client:${conversationId}`;
        removeRealtimeChannel(supabase, channelName);
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              const row = payload.new as { sender_id: string; body: string };
              if (row.sender_id === user.id) return;
              toastRef.current?.pushToast({
                title: "New message",
                body: row.body || "Sent an attachment",
                href: "/client/chat",
              });
            },
          )
          .subscribe();
        return;
      }

      if (portal === "team") {
        const conversationId = await getTeamConversationId(supabase, user.id);
        if (!conversationId || cancelled) return;
        const channelName = `toasts:team:${conversationId}`;
        removeRealtimeChannel(supabase, channelName);
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `conversation_id=eq.${conversationId}`,
            },
            (payload) => {
              const row = payload.new as { sender_id: string; body: string };
              if (row.sender_id === user.id) return;
              toastRef.current?.pushToast({
                title: "New message",
                body: row.body || "Sent an attachment",
                href: "/team/chat",
              });
            },
          )
          .subscribe();
        return;
      }

      const conversationIds = await getManagerChatConversationIds(supabase, user.id);
      if (!conversationIds.length || cancelled) return;
      const tracked = new Set(conversationIds);
      const channelName = `toasts:manager:${user.id}`;
      removeRealtimeChannel(supabase, channelName);
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const row = payload.new as {
              sender_id: string;
              conversation_id: string;
              body: string;
            };
            if (row.sender_id === user.id) return;
            if (!tracked.has(row.conversation_id)) return;
            toastRef.current?.pushToast({
              title: "New message",
              body: row.body || "Sent an attachment",
              href: "/manager/chat",
            });
          },
        )
        .subscribe();
    }

    void subscribe();

    return () => {
      cancelled = true;
      if (channel) {
        const supabase = createClient();
        void supabase.removeChannel(channel);
      }
    };
  }, [pathname, portal]);
}

