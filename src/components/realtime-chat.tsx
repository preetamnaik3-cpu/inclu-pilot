"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { removeRealtimeChannel } from "@/lib/realtime/channel";
import { ChatView } from "@/components/chat-view";
import type {
  ChatAttachmentKind,
  ChatMessage,
  ChatSendPayload,
  ChatSendResult,
} from "@/lib/types";
import { sendMessage } from "@/lib/actions/data";

function mapAttachment(row: {
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_kind?: string | null;
  attachment_mime_type?: string | null;
}) {
  if (!row.attachment_url || !row.attachment_name || !row.attachment_kind) {
    return undefined;
  }

  return {
    url: row.attachment_url,
    name: row.attachment_name,
    kind: row.attachment_kind as ChatAttachmentKind,
    mimeType: row.attachment_mime_type ?? undefined,
  };
}

function matchesOptimisticMessage(
  optimistic: ChatMessage,
  row: { sender_id: string; body: string; attachment_name?: string | null },
): boolean {
  if (!optimistic.id.startsWith("temp-")) return false;
  if (optimistic.senderId !== row.sender_id) return false;
  if (optimistic.body !== row.body) return false;

  if (!row.attachment_name && !optimistic.attachment) return true;
  return optimistic.attachment?.name === row.attachment_name;
}

function stripMatchingOptimistic(
  messages: ChatMessage[],
  row: { sender_id: string; body: string; attachment_name?: string | null },
): ChatMessage[] {
  let removed = false;
  return messages.filter((message) => {
    if (removed || !matchesOptimisticMessage(message, row)) {
      return true;
    }
    removed = true;
    return false;
  });
}

export function RealtimeChat({
  conversationId,
  currentUserId,
  title,
  subtitle,
  initialMessages,
  allowAttachments = false,
}: {
  conversationId: string;
  currentUserId: string;
  title: string;
  subtitle: string;
  initialMessages: ChatMessage[];
  allowAttachments?: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const senderNamesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const names: Record<string, string> = {};
    for (const message of initialMessages) {
      if (message.senderName && message.senderName !== "User") {
        names[message.senderId] = message.senderName;
      }
    }
    senderNamesRef.current = names;
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `messages:${conversationId}`;
    removeRealtimeChannel(supabase, channelName);

    const channel = supabase
      .channel(channelName)
      .on(
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
            attachment_url?: string | null;
            attachment_name?: string | null;
            attachment_kind?: string | null;
            attachment_mime_type?: string | null;
          };

          const attachment = mapAttachment(row);
          let signedAttachment = attachment;
          if (attachment?.url && !attachment.url.startsWith("http")) {
            const { data: signed } = await supabase.storage
              .from("chat-attachments")
              .createSignedUrl(attachment.url, 60 * 60);
            if (signed?.signedUrl) {
              signedAttachment = { ...attachment, url: signed.signedUrl };
            }
          }

          const isOwn = row.sender_id === currentUserId;
          const knownName = senderNamesRef.current[row.sender_id];

          setMessages((prev) => {
            if (prev.some((message) => message.id === row.id)) {
              return prev;
            }

            const next = stripMatchingOptimistic(prev, row);
            return [
              ...next,
              {
                id: row.id,
                senderId: row.sender_id,
                senderName: isOwn ? "You" : knownName ?? "User",
                body: row.body,
                time: new Date(row.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                isOwn,
                attachment: signedAttachment,
              },
            ];
          });

          if (!isOwn && !knownName) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", row.sender_id)
              .single();

            if (profile?.full_name) {
              senderNamesRef.current[row.sender_id] = profile.full_name;
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === row.id
                    ? { ...message, senderName: profile.full_name }
                    : message,
                ),
              );
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  async function handleSend({
    body,
    file,
  }: ChatSendPayload): Promise<ChatSendResult> {
    const trimmed = body.trim();
    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      senderName: "You",
      body: trimmed,
      time: "Just now",
      isOwn: true,
      attachment: file
        ? {
            url: URL.createObjectURL(file),
            name: file.name,
            kind: file.type.startsWith("image/")
              ? "image"
              : file.type.startsWith("video/")
                ? "video"
                : "file",
            mimeType: file.type,
            sizeBytes: file.size,
          }
        : undefined,
    };

    setMessages((prev) => [...prev, optimistic]);

    const result = await sendMessage(conversationId, body, file);
    if (result.error) {
      setMessages((prev) => prev.filter((message) => message.id !== tempId));
      return { error: result.error };
    }

    return {};
  }

  return (
    <ChatView
      title={title}
      subtitle={subtitle}
      messages={messages}
      onSend={handleSend}
      allowAttachments={allowAttachments}
      placeholder={
        allowAttachments ? "Message or attach a file..." : "Type a message..."
      }
    />
  );
}
