"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { removeRealtimeChannel } from "@/lib/realtime/channel";
import { ChatView } from "@/components/chat-view";
import type { ChatAttachmentKind, ChatMessage, ChatSendPayload } from "@/lib/types";
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

          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;

            return [
              ...prev,
              {
                id: row.id,
                senderId: row.sender_id,
                senderName: "User",
                body: row.body,
                time: new Date(row.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                isOwn: row.sender_id === currentUserId,
                attachment: signedAttachment,
              },
            ];
          });

          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", row.sender_id)
            .single();

          if (profile?.full_name) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === row.id ? { ...m, senderName: profile.full_name } : m,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  async function handleSend({ body, file }: ChatSendPayload) {
    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      senderName: "You",
      body: body.trim(),
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
    await sendMessage(conversationId, body, file);
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
