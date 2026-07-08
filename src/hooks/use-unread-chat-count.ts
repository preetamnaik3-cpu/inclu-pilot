"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  countManagerUnreadMessages,
  countUnreadMessages,
  getClientChatConversationId,
  getManagerChatConversationIds,
} from "@/lib/notifications/unread-chat";

function useChatRouteActive(chatHref: string): boolean {
  const pathname = usePathname();
  return pathname === chatHref || pathname.startsWith(`${chatHref}/`);
}

export function useClientUnreadChatCount(chatHref = "/client/chat"): number {
  const [count, setCount] = useState(0);
  const onChatPage = useChatRouteActive(chatHref);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCount(0);
      return;
    }

    const conversationId = await getClientChatConversationId(supabase, user.id);
    if (!conversationId) {
      setCount(0);
      return;
    }

    if (onChatPage) {
      setCount(0);
      return;
    }

    const unread = await countUnreadMessages(supabase, conversationId, user.id);
    setCount(unread);
  }, [onChatPage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;
    let conversationId: string | null = null;

    async function subscribe() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      conversationId = await getClientChatConversationId(supabase, user.id);
      if (!conversationId) return;

      channel = supabase
        .channel(`unread:client:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const row = payload.new as { sender_id: string };
            if (row.sender_id !== user.id) {
              void refresh();
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversation_reads",
            filter: `conversation_id=eq.${conversationId}`,
          },
          () => {
            void refresh();
          },
        )
        .subscribe();
    }

    void subscribe();

    return () => {
      if (channel) {
        const supabase = createClient();
        void supabase.removeChannel(channel);
      }
    };
  }, [refresh]);

  return count;
}

export function useManagerUnreadChatCount(chatHref = "/manager/chat"): number {
  const [count, setCount] = useState(0);
  const onChatPage = useChatRouteActive(chatHref);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setCount(0);
      return;
    }

    if (onChatPage) {
      setCount(0);
      return;
    }

    const unread = await countManagerUnreadMessages(supabase, user.id);
    setCount(unread);
  }, [onChatPage]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;

    async function subscribe() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const conversationIds = await getManagerChatConversationIds(
        supabase,
        user.id,
      );
      if (!conversationIds.length) return;

      const tracked = new Set(conversationIds);

      channel = supabase
        .channel(`unread:manager:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
          },
          (payload) => {
            const row = payload.new as {
              sender_id: string;
              conversation_id: string;
            };
            if (
              tracked.has(row.conversation_id) &&
              row.sender_id !== user.id
            ) {
              void refresh();
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "conversation_reads",
          },
          (payload) => {
            const row = (payload.new ?? payload.old) as {
              conversation_id?: string;
            } | null;
            if (row?.conversation_id && tracked.has(row.conversation_id)) {
              void refresh();
            }
          },
        )
        .subscribe();
    }

    void subscribe();

    return () => {
      if (channel) {
        const supabase = createClient();
        void supabase.removeChannel(channel);
      }
    };
  }, [refresh]);

  return count;
}
