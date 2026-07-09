"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { markNotificationRead } from "@/lib/actions/notifications";
import {
  notificationKeyForHubUpdate,
  notificationKeyForMessage,
} from "@/lib/notifications/derive";
import { getClientChatConversationId } from "@/lib/notifications/unread-chat";
import { removeRealtimeChannel } from "@/lib/realtime/channel";
import { NotificationBell } from "@/components/notification-bell";
import type { ClientNotification } from "@/lib/types";

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

export function LiveNotificationBell({
  initialNotifications,
  projectId,
}: {
  initialNotifications: ClientNotification[];
  projectId: string;
}) {
  const [notifications, setNotifications] =
    useState<ClientNotification[]>(initialNotifications);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;
    let cancelled = false;

    async function subscribe() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const conversationId = await getClientChatConversationId(supabase, user.id);
      if (cancelled) return;

      const channelName = `notifications:client:${user.id}`;
      removeRealtimeChannel(supabase, channelName);

      let nextChannel = supabase.channel(channelName);

      if (conversationId) {
        nextChannel = nextChannel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            const row = payload.new as {
              id: string;
              sender_id: string;
              body: string;
              created_at: string;
            };
            if (row.sender_id === user.id) return;

            const { data: sender } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", row.sender_id)
              .maybeSingle();

            const key = notificationKeyForMessage(row.id);
            const item: ClientNotification = {
              id: key,
              title: `Message from ${sender?.full_name ?? "Manager"}`,
              body: row.body || "Sent an attachment",
              time: formatRelative(row.created_at),
              read: false,
            };

            setNotifications((prev) => {
              if (prev.some((n) => n.id === key)) return prev;
              return [item, ...prev].slice(0, 10);
            });
          },
        );
      }

      channel = nextChannel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "hub_updates",
            filter: `project_id=eq.${projectId}`,
          },
          async (payload) => {
            const row = payload.new as {
              id: string;
              type: string;
              visibility: string;
              body: string;
              feed_title: string | null;
              feed_subtitle: string | null;
              activity_id: string | null;
              published_at: string | null;
              created_at: string;
              metadata?: { fileName?: string };
            };

            if (row.visibility !== "client") return;
            if (
              ![
                "manager_update",
                "feed_highlight",
                "status_change",
                "file_upload",
                "manager_reply",
              ].includes(row.type)
            ) {
              return;
            }

            const key = notificationKeyForHubUpdate(row.id);
            let title = row.feed_title ?? "Project update";
            let body = row.feed_subtitle ?? row.body;

            if (row.type === "manager_reply") {
              title = "Manager replied";
              body = row.body;
            } else if (row.type === "file_upload") {
              title = "New file shared";
              body = row.metadata?.fileName ?? row.body;
            } else if (row.type === "status_change") {
              title = "Activity status updated";
            }

            const item: ClientNotification = {
              id: key,
              title,
              body,
              time: row.published_at ?? row.created_at,
              workItemId: row.activity_id ?? undefined,
              read: false,
            };

            setNotifications((prev) => {
              if (prev.some((n) => n.id === key)) return prev;
              return [item, ...prev].slice(0, 10);
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
  }, [projectId]);

  return (
    <NotificationBell
      notifications={notifications}
      live
      onMarkRead={(notificationKey) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationKey ? { ...n, read: true } : n,
          ),
        );
        startTransition(() => {
          void markNotificationRead(notificationKey);
        });
      }}
    />
  );
}
