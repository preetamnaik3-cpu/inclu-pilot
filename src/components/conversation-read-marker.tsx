"use client";

import { useEffect } from "react";
import { markConversationRead } from "@/lib/actions/notifications";

export function ConversationReadMarker({
  conversationId,
}: {
  conversationId: string;
}) {
  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  return null;
}
